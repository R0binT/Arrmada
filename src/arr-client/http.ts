import { ArrHttpError, isAbortError, kindFromStatus } from "./errors";

/** Sonarr/Radarr add + indexer search often need more than a few seconds. */
const TIMEOUT_MS = 60_000;

/**
 * Deleting a movie/series with `deleteFiles=true` can take minutes on slow
 * disks/NAS. Aborting early leaves Radarr mid-delete (library gone, files left).
 */
export const DELETE_WITH_FILES_TIMEOUT_MS = 300_000;

export type ArrHttpRequestOptions = {
  readonly timeoutMs?: number;
};

export type ArrHttp = {
  readonly getJson: <T>(path: string) => Promise<T>;
  readonly postJson: <T>(path: string, body?: unknown) => Promise<T>;
  readonly deleteJson: <T>(
    path: string,
    query?: Record<string, string>,
    options?: ArrHttpRequestOptions,
  ) => Promise<T>;
  readonly putJson: <T>(path: string, body?: unknown) => Promise<T>;
};

const joinUrl = (baseUrl: string, path: string): string => {
  const base = baseUrl.replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
};

export const createArrHttp = (baseUrl: string, apiKey: string): ArrHttp => {
  const request = async <T>(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, string>,
    options?: ArrHttpRequestOptions,
  ): Promise<T> => {
    const timeoutMs = options?.timeoutMs ?? TIMEOUT_MS;
    const url = new URL(joinUrl(baseUrl, path));
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url.toString(), {
        method,
        headers: {
          "X-Api-Key": apiKey,
          Accept: "application/json",
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new ArrHttpError(
          `HTTP ${response.status} · ${method} ${path}`,
          response.status,
          kindFromStatus(response.status),
        );
      }
      if (response.status === 204) {
        return undefined as T;
      }
      return (await response.json()) as T;
    } catch (err) {
      if (err instanceof ArrHttpError) throw err;
      // React Native often surfaces AbortController abort as TypeError
      // "Network request failed" instead of AbortError.
      if (controller.signal.aborted || isAbortError(err)) {
        throw new ArrHttpError(
          `Timed out after ${timeoutMs}ms · ${method} ${path}`,
          0,
          "timeout",
        );
      }
      throw new ArrHttpError(
        err instanceof Error ? err.message : "Network error",
        0,
        "network",
      );
    } finally {
      clearTimeout(timer);
    }
  };

  return {
    getJson: <T>(path: string) => request<T>("GET", path),
    postJson: <T>(path: string, body?: unknown) =>
      request<T>("POST", path, body),
    putJson: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
    deleteJson: <T>(
      path: string,
      query?: Record<string, string>,
      options?: ArrHttpRequestOptions,
    ) => request<T>("DELETE", path, undefined, query, options),
  };
};
