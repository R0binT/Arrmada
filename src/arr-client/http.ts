import { ArrHttpError, kindFromStatus } from "./errors";

const TIMEOUT_MS = 10_000;

export type ArrHttp = {
  readonly getJson: <T>(path: string) => Promise<T>;
  readonly postJson: <T>(path: string, body?: unknown) => Promise<T>;
  readonly deleteJson: <T>(
    path: string,
    query?: Record<string, string>,
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
  ): Promise<T> => {
    const url = new URL(joinUrl(baseUrl, path));
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
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
    deleteJson: <T>(path: string, query?: Record<string, string>) =>
      request<T>("DELETE", path, undefined, query),
  };
};
