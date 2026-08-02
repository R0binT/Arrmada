import { isAbortError, kindFromStatus, TmdbHttpError } from "./errors";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TIMEOUT_MS = 20_000;

export type TmdbHttp = {
  readonly getJson: <T>(
    path: string,
    query?: Record<string, string>,
  ) => Promise<T>;
};

const joinUrl = (baseUrl: string, path: string): string => {
  const base = baseUrl.replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
};

export const createTmdbHttp = (apiKey: string): TmdbHttp => {
  const getJson = async <T>(
    path: string,
    query?: Record<string, string>,
  ): Promise<T> => {
    const url = new URL(joinUrl(TMDB_BASE_URL, path));
    url.searchParams.set("api_key", apiKey);
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new TmdbHttpError(
          `HTTP ${response.status} · GET ${path}`,
          response.status,
          kindFromStatus(response.status),
        );
      }
      return (await response.json()) as T;
    } catch (err) {
      if (err instanceof TmdbHttpError) throw err;
      if (isAbortError(err)) {
        throw new TmdbHttpError(
          `Timed out after ${TIMEOUT_MS}ms · GET ${path}`,
          0,
          "timeout",
        );
      }
      throw new TmdbHttpError(
        err instanceof Error ? err.message : "Network error",
        0,
        "network",
      );
    } finally {
      clearTimeout(timer);
    }
  };

  return { getJson };
};
