import * as z from "zod";
import { agent } from "./contracts/agent";
import { auth, AuthResponseSchema } from "./contracts/auth";
import { deployments } from "./contracts/deployments";
import { sites } from "./contracts/sites";
import { ContractContext, ContractEntityResponseKind, ContractEntry } from "./contracts/utils";
import { makeRequest } from "./request";
import { ApiError, ErrorResponseSchema } from "./error";

export type ApiClientState = {
  accessToken?: string | null;
  refreshToken?: string | null;
  agentToken?: string | null;
};

export type ApiClientCallbacks = {
  onError?: (error: any) => void;
  onStateChange?: (state: ApiClientState) => void;
};

type RefreshingState = {
  promise: Promise<any> | null;
};

function buildMethod<T extends ContractEntry<z.ZodType, z.ZodType>>(
  baseUrl: string,
  state: ApiClientState,
  entry: T,
  callbacks: ApiClientCallbacks | null,
) {
  return async function apiMethod(
    payload: z.infer<T["RequestSchema"]>,
    options?: { signal?: AbortSignal },
  ) {
    const errorCallback = callbacks?.onError;
    const stateChangeCallback = callbacks?.onStateChange;

    const signal = options?.signal;
    const context: ContractContext = {
      post: (url, init) => makeRequest(baseUrl, "POST", url, state, init, signal),
      get: (url, init) => makeRequest(baseUrl, "GET", url, state, init, signal),
      signal,
    };

    try {
      const res = await entry.handler(payload, context);
      const data = await (() => {
        if (res.status == 204) {
          return Promise.resolve(null);
        }

        if (entry.responseKind == ContractEntityResponseKind.BYTES) {
          return res.arrayBuffer().then((buf) => new Uint8Array(buf));
        }

        return res.json();
      })();

      if (!res.ok) {
        const errorData = ErrorResponseSchema.parse(data);
        throw new ApiError(res.status, errorData.code, errorData.message, errorData.fields);
      }

      const successData = (entry.ResponseSchema as T["ResponseSchema"]).parse(data);
      const authResult = AuthResponseSchema.safeParse(successData);
      if (authResult.success) {
        state.accessToken = authResult.data.accessToken;
        state.refreshToken = authResult.data.refreshToken;
        if (stateChangeCallback != null) {
          stateChangeCallback({ ...state });
        }
      }
      // Check for logout
      if (entry.handler === auth.logout.handler) {
        state.accessToken = null;
        state.refreshToken = null;
        if (stateChangeCallback != null) {
          stateChangeCallback({ ...state });
        }
      }
      return successData;
    } catch (err) {
      if (errorCallback != null) {
        errorCallback(err);
      }

      throw err;
    }
  };
}

async function refresh(params: {
  refreshing: RefreshingState;
  baseUrl: string;
  state: ApiClientState;
  callbacks: ApiClientCallbacks | null;
  options?: { signal?: AbortSignal };
}) {
  const { refreshing, baseUrl, state, callbacks, options } = params;
  if (refreshing.promise != null) return refreshing.promise;

  const refreshFromApi = buildMethod(baseUrl, state, auth.refresh, callbacks);
  const refreshingPromise = refreshFromApi({ refreshToken: state.refreshToken! }, options);
  try {
    refreshing.promise = refreshingPromise;
    await refreshingPromise;
  } finally {
    refreshing.promise = null;
  }
}

function withAutoRefresh<T extends ContractEntry<z.ZodType, z.ZodType>>(
  method: ReturnType<typeof buildMethod<T>>,
  baseUrl: string,
  state: ApiClientState,
  callbacks: ApiClientCallbacks | null,
  refreshing: RefreshingState,
) {
  const quiet = callbacks == null ? null : { ...callbacks, onError: undefined };
  const errorCallback = callbacks?.onError;
  return async (...args: Parameters<ReturnType<typeof buildMethod<T>>>) => {
    try {
      return await method(...args);
    } catch (err) {
      let finalErr = err;
      if (
        err instanceof ApiError &&
        err.status === 401 &&
        err.code === "UNAUTHORIZED" &&
        state.refreshToken != null
      ) {
        try {
          const options = args[1];
          await refresh({
            refreshing,
            baseUrl,
            state,
            callbacks: quiet,
            options,
          });

          return await method(...args).catch((err) => {
            finalErr = err;
            throw err;
          });
        } catch {}
      }

      if (errorCallback != null) {
        errorCallback(finalErr);
      }

      throw finalErr;
    }
  };
}

function buildMethodWithRefresh<T extends ContractEntry<z.ZodType, z.ZodType>>(
  refreshing: RefreshingState,
  ...args: Parameters<typeof buildMethod<T>>
) {
  const [baseUrl, state, entry, callbacks] = args;
  const quiet = callbacks == null ? null : { ...callbacks, onError: undefined };
  return withAutoRefresh(
    buildMethod(baseUrl, state, entry, quiet),
    baseUrl,
    state,
    callbacks,
    refreshing,
  );
}

export function createClient(
  baseUrl: string,
  defaultState?: ApiClientState,
  callbacks?: ApiClientCallbacks,
) {
  const state = { ...defaultState };
  const refreshing: RefreshingState = { promise: null };

  function buildDomain<T extends { [K: string]: ContractEntry<any, any> }>(contract: T) {
    return Object.fromEntries(
      Object.entries(contract).map(([key, entry]) => {
        if (entry == auth.refresh) {
          return [key, buildMethod(baseUrl, state, entry, callbacks ?? null)];
        }
        return [key, buildMethodWithRefresh(refreshing, baseUrl, state, entry, callbacks ?? null)];
      }),
    ) as { [K in keyof T]: ReturnType<typeof buildMethod<T[K]>> };
  }

  return {
    auth: buildDomain(auth),
    sites: buildDomain(sites),
    deployments: buildDomain(deployments),
    agent: buildDomain(agent),
  } as const;
}

export type ApiClient = ReturnType<typeof createClient>;
