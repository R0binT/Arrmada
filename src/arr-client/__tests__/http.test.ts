import { createArrHttp } from "../http";
import { ArrHttpError } from "../errors";

describe("createArrHttp", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.useRealTimers();
  });

  it("sends X-Api-Key and returns JSON", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ version: "5.0.0" }),
    }) as unknown as typeof fetch;

    const http = createArrHttp("http://192.168.1.10:7878", "secret");
    const actual = await http.getJson<{ version: string }>("/api/v3/system/status");

    expect(actual.version).toBe("5.0.0");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://192.168.1.10:7878/api/v3/system/status",
      expect.objectContaining({
        headers: expect.objectContaining({ "X-Api-Key": "secret" }),
      }),
    );
  });

  it("maps 401 to unauthorized ArrHttpError", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    }) as unknown as typeof fetch;

    const http = createArrHttp("http://192.168.1.10:7878", "bad");
    await expect(http.getJson("/api/v3/movie")).rejects.toMatchObject({
      kind: "unauthorized",
      status: 401,
    });
    await expect(http.getJson("/api/v3/movie")).rejects.toBeInstanceOf(ArrHttpError);
  });

  it("maps network failure to network ArrHttpError", async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new TypeError("Network request failed"));

    const http = createArrHttp("http://192.168.1.10:7878", "secret");
    await expect(http.getJson("/api/v3/movie")).rejects.toMatchObject({
      kind: "network",
    });
  });

  it("maps AbortError to timeout ArrHttpError", async () => {
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";
    globalThis.fetch = jest.fn().mockRejectedValue(abortError);

    const http = createArrHttp("http://192.168.1.10:7878", "secret");
    await expect(http.getJson("/api/v3/movie")).rejects.toMatchObject({
      kind: "timeout",
      status: 0,
    });
    await expect(http.getJson("/api/v3/movie")).rejects.toBeInstanceOf(ArrHttpError);
  });

  it("maps aborted fetch Network request failed to timeout", async () => {
    jest.useFakeTimers();
    globalThis.fetch = jest.fn().mockImplementation((_url, init) => {
      const signal = (init as RequestInit | undefined)?.signal;
      return new Promise((_resolve, reject) => {
        signal?.addEventListener("abort", () => {
          reject(new TypeError("Network request failed"));
        });
      });
    }) as unknown as typeof fetch;

    const http = createArrHttp("http://192.168.1.10:7878", "secret");
    const pending = http.deleteJson("/api/v3/movie/1", undefined, {
      timeoutMs: 20,
    });
    const expectation = expect(pending).rejects.toMatchObject({
      kind: "timeout",
      status: 0,
    });
    await jest.advanceTimersByTimeAsync(20);
    await expectation;
    jest.useRealTimers();
  });

  it("passes custom timeoutMs to abort timer for deleteJson", async () => {
    jest.useFakeTimers();
    globalThis.fetch = jest.fn().mockImplementation((_url, init) => {
      const signal = (init as RequestInit | undefined)?.signal;
      return new Promise((_resolve, reject) => {
        signal?.addEventListener("abort", () => {
          const err = new Error("Aborted");
          err.name = "AbortError";
          reject(err);
        });
      });
    }) as unknown as typeof fetch;

    const http = createArrHttp("http://192.168.1.10:7878", "secret");
    const pending = http.deleteJson(
      "/api/v3/movie/1",
      { deleteFiles: "true" },
      { timeoutMs: 5_000 },
    );
    const expectation = expect(pending).rejects.toMatchObject({
      kind: "timeout",
    });
    await jest.advanceTimersByTimeAsync(4_999);
    await jest.advanceTimersByTimeAsync(1);
    await expectation;
    jest.useRealTimers();
  });
});
