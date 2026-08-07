export const OUTBOX_MAX_ATTEMPTS = 5;
export const OUTBOX_STORAGE_KEY = "arr.outbox.v1";
export const QUERY_CACHE_STORAGE_KEY = "arr.query-cache.v1";
export const HEALTH_FAILURES_BEFORE_UNREACHABLE = 2;
export const LIBRARY_GC_TIME_MS = 1000 * 60 * 60 * 24 * 7;

export const outboxBackoffMs = (attempts: number): number =>
  Math.min(60_000, 1000 * 2 ** Math.max(0, attempts));
