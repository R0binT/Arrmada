import { fetchLatestRelease } from "../fetch-latest-release";

describe("fetchLatestRelease", () => {
  it("returns version and apk url on happy path", async () => {
    const mockFetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        tag_name: "v1.2.0",
        assets: [
          {
            name: "Arrmada-1.2.0.apk",
            browser_download_url:
              "https://github.com/R0binT/Arrmada/releases/download/v1.2.0/Arrmada-1.2.0.apk",
          },
        ],
      }),
    }));

    const actual = await fetchLatestRelease({
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    expect(actual).toEqual({
      ok: true,
      release: {
        version: "1.2.0",
        tag: "v1.2.0",
        apkUrl:
          "https://github.com/R0binT/Arrmada/releases/download/v1.2.0/Arrmada-1.2.0.apk",
      },
    });
  });

  it("returns ok false when HTTP fails", async () => {
    const mockFetch = jest.fn(async () => ({
      ok: false,
      json: async () => ({}),
    }));
    const actual = await fetchLatestRelease({
      fetchFn: mockFetch as unknown as typeof fetch,
    });
    expect(actual).toEqual({ ok: false });
  });

  it("returns ok false when apk asset missing", async () => {
    const mockFetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        tag_name: "v1.2.0",
        assets: [{ name: "notes.txt", browser_download_url: "https://x" }],
      }),
    }));
    const actual = await fetchLatestRelease({
      fetchFn: mockFetch as unknown as typeof fetch,
    });
    expect(actual).toEqual({ ok: false });
  });

  it("returns ok false when tag is not semver", async () => {
    const mockFetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        tag_name: "latest",
        assets: [
          {
            name: "Arrmada-1.0.0.apk",
            browser_download_url: "https://x/Arrmada-1.0.0.apk",
          },
        ],
      }),
    }));
    const actual = await fetchLatestRelease({
      fetchFn: mockFetch as unknown as typeof fetch,
    });
    expect(actual).toEqual({ ok: false });
  });
});
