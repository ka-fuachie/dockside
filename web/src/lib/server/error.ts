export function formatError(code: string, message: string, fields?: Record<string, string> | null) {
  return {
    code,
    message,
    fields: fields ?? null,
  };
}

export type ServerError = ReturnType<typeof formatError>;

export function isServerError(err: unknown): err is ServerError {
  return (
    err != null &&
    typeof err === "object" &&
    "code" in err &&
    typeof err.code === "string" &&
    "message" in err &&
    typeof err.message === "string" &&
    "fields" in err &&
    typeof err.fields === "object"
  );
}
