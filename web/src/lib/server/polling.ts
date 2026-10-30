import { wait } from "@/lib/utils";

const invalidatorResolversMap = new Map<string, Set<() => void>>();

export async function* poll<T>(fn: () => Promise<T>, delayMs: number, key: string) {
  let lastResolveFn = () => {};
  try {
    while (true) {
      yield await fn();
      const invalidator = Promise.withResolvers<void>();
      const resolversForKey = invalidatorResolversMap.get(key) ?? new Set();
      resolversForKey.add(invalidator.resolve);
      invalidatorResolversMap.set(key, resolversForKey);
      lastResolveFn = invalidator.resolve;
      await Promise.race([wait(delayMs), invalidator.promise]);
      resolversForKey.delete(invalidator.resolve);
    }
  } finally {
    invalidatorResolversMap.get(key)?.delete(lastResolveFn);
  }
}

export function invalidatePoll(prefix: string) {
  for (const [key, resolvers] of invalidatorResolversMap) {
    if (!key.startsWith(prefix)) continue;
    for (const fn of resolvers) fn();
  }
}
