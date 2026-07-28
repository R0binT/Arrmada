import { checkAppUpdate } from "../check-app-update";

describe("checkAppUpdate", () => {
  it("returns upToDate when local equals latest", async () => {
    const mockFetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        tag_name: "v1.1.2",
        assets: [
          {
            name: "Arrmada-1.1.2.apk",
            browser_download_url: "https://x/Arrmada-1.1.2.apk",
          },
        ],
      }),
    }));
    const actual = await checkAppUpdate({
      fetchFn: mockFetch as unknown as typeof fetch,
      getLocalVersion: () => "1.1.2",
    });
    expect(actual).toEqual({
      status: "upToDate",
      currentVersion: "1.1.2",
    });
  });

  it("returns available when latest is newer", async () => {
    const mockFetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        tag_name: "v1.2.0",
        assets: [
          {
            name: "Arrmada-1.2.0.apk",
            browser_download_url: "https://x/Arrmada-1.2.0.apk",
          },
        ],
      }),
    }));
    const actual = await checkAppUpdate({
      fetchFn: mockFetch as unknown as typeof fetch,
      getLocalVersion: () => "1.1.2",
    });
    expect(actual.status).toBe("available");
    if (actual.status === "available") {
      expect(actual.release.version).toBe("1.2.0");
      expect(actual.currentVersion).toBe("1.1.2");
    }
  });

  it("returns generic error when local version missing", async () => {
    const actual = await checkAppUpdate({
      getLocalVersion: () => null,
      fetchFn: jest.fn() as unknown as typeof fetch,
    });
    expect(actual).toEqual({ status: "error", kind: "generic" });
  });

  it("returns generic error when fetch fails", async () => {
    const mockFetch = jest.fn(async () => ({
      ok: false,
      json: async () => ({}),
    }));
    const actual = await checkAppUpdate({
      fetchFn: mockFetch as unknown as typeof fetch,
      getLocalVersion: () => "1.1.2",
    });
    expect(actual).toEqual({ status: "error", kind: "generic" });
  });
});
