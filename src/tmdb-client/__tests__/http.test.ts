import { createTmdbHttp } from "../http";
import { TmdbHttpError } from "../errors";

describe("createTmdbHttp", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("appends api_key query param and returns JSON", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ results: [] }),
    }) as unknown as typeof fetch;

    const http = createTmdbHttp("secret");
    const actual = await http.getJson<{ results: unknown[] }>("/search/company", {
      query: "marvel",
    });

    expect(actual.results).toEqual([]);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = String(
      (globalThis.fetch as jest.Mock).mock.calls[0]?.[0],
    );
    const parsed = new URL(calledUrl);
    expect(parsed.origin + parsed.pathname).toBe(
      "https://api.themoviedb.org/3/search/company",
    );
    expect(parsed.searchParams.get("api_key")).toBe("secret");
    expect(parsed.searchParams.get("query")).toBe("marvel");
  });

  it("maps 401 to unauthorized TmdbHttpError", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    }) as unknown as typeof fetch;

    const http = createTmdbHttp("bad");
    await expect(http.getJson("/search/movie")).rejects.toMatchObject({
      kind: "unauthorized",
      status: 401,
    });
    await expect(http.getJson("/search/movie")).rejects.toBeInstanceOf(
      TmdbHttpError,
    );
  });

  it("maps other HTTP failures to http TmdbHttpError", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    }) as unknown as typeof fetch;

    const http = createTmdbHttp("secret");
    await expect(http.getJson("/search/movie")).rejects.toMatchObject({
      kind: "http",
      status: 500,
    });
  });

  it("maps network failure to network TmdbHttpError", async () => {
    globalThis.fetch = jest
      .fn()
      .mockRejectedValue(new TypeError("Network request failed"));

    const http = createTmdbHttp("secret");
    await expect(http.getJson("/search/movie")).rejects.toMatchObject({
      kind: "network",
    });
  });

  it("maps AbortError to timeout TmdbHttpError", async () => {
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";
    globalThis.fetch = jest.fn().mockRejectedValue(abortError);

    const http = createTmdbHttp("secret");
    await expect(http.getJson("/search/movie")).rejects.toMatchObject({
      kind: "timeout",
      status: 0,
    });
    await expect(http.getJson("/search/movie")).rejects.toBeInstanceOf(
      TmdbHttpError,
    );
  });
});
