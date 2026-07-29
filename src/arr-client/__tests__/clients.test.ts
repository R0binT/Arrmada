import { createRadarrClient } from "../radarr/client";
import { createSonarrClient } from "../sonarr/client";

describe("createRadarrClient", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("lists movies through mapper", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
        {
          id: 2,
          title: "Harbor",
          year: 2023,
          monitored: true,
          hasFile: true,
          status: "released",
          images: [],
        },
      ],
    }) as unknown as typeof fetch;

    const client = createRadarrClient("http://192.168.1.10:7878", "k");
    const movies = await client.getMovies();
    expect(movies[0]?.title).toBe("Harbor");
    expect(movies[0]?.hasFile).toBe(true);
  });

  it("maps movie credits from credit endpoint", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
        {
          type: "cast",
          personName: "Ada",
          order: 0,
          images: [{ coverType: "headshot", remoteUrl: "https://cdn/ada.jpg" }],
        },
        {
          type: "crew",
          personName: "Director",
          order: 0,
          images: [],
        },
      ],
    }) as unknown as typeof fetch;

    const client = createRadarrClient("http://192.168.1.10:7878", "k");
    const cast = await client.getMovieCredits(2);
    expect(cast).toEqual({
      cast: [{ name: "Ada", photoUrl: "https://cdn/ada.jpg" }],
      crew: [],
    });
    const [url] = (globalThis.fetch as jest.Mock).mock.calls[0] as [string];
    expect(url).toContain("/api/v3/credit?movieId=2");
  });

  it("maps queue items from paged response", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        records: [
          {
            id: 9,
            title: "Harbor.2024.1080p.WEB",
            status: "downloading",
            size: 1000,
            sizeleft: 250,
            timeleft: "00:10:00",
            trackedDownloadState: "downloading",
            movie: { title: "Harbor", images: [] },
          },
        ],
      }),
    }) as unknown as typeof fetch;

    const client = createRadarrClient("http://192.168.1.10:7878", "k");
    const queue = await client.getQueue();
    expect(queue[0]?.title).toBe("Harbor");
    expect(queue[0]?.service).toBe("radarr");
    expect(queue[0]?.progress).toBe(0.75);
  });

  it("updates movie monitored via GET then PUT", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 2,
          title: "Harbor",
          year: 2023,
          monitored: true,
          hasFile: true,
          status: "released",
          images: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 2,
          title: "Harbor",
          year: 2023,
          monitored: false,
          hasFile: true,
          status: "released",
          images: [],
        }),
      });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const client = createRadarrClient("http://192.168.1.10:7878", "k");
    const movie = await client.updateMovie(2, { monitored: false });

    expect(movie.monitored).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const putCall = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(putCall[0]).toBe("http://192.168.1.10:7878/api/v3/movie/2");
    expect(putCall[1]?.method).toBe("PUT");
    expect(JSON.parse(String(putCall[1]?.body))).toMatchObject({
      id: 2,
      monitored: false,
    });
  });

  it("deletes movie with deleteFiles query flag", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const client = createRadarrClient("http://192.168.1.10:7878", "k");
    await client.deleteMovie(2, { deleteFiles: true });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/v3/movie/2?");
    expect(url).toContain("deleteFiles=true");
    expect(url).toContain("addImportExclusion=false");
    expect(init.method).toBe("DELETE");
  });
});

describe("createSonarrClient", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("lists series through mapper", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
        {
          id: 5,
          title: "Harbor Show",
          year: 2022,
          monitored: true,
          status: "continuing",
          images: [],
          statistics: { episodeFileCount: 3, episodeCount: 10 },
        },
      ],
    }) as unknown as typeof fetch;

    const client = createSonarrClient("http://192.168.1.10:8989", "k");
    const series = await client.getSeries();
    expect(series[0]?.title).toBe("Harbor Show");
    expect(series[0]?.episodeFileCount).toBe(3);
    expect(series[0]?.episodeCount).toBe(10);
  });

  it("fetches seasons grouped from episode payloads", async () => {
    globalThis.fetch = jest.fn().mockImplementation(async (url: string) => {
      if (String(url).includes("/episodefile?")) {
        return {
          ok: true,
          status: 200,
          json: async () => [
            {
              id: 9001,
              seriesId: 5,
              size: 1_500_000_000,
              quality: { quality: { name: "WEBDL-1080p" } },
              mediaInfo: {
                audioLanguages: "English",
                subtitles: "French",
              },
            },
          ],
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => [
          {
            id: 21,
            seasonNumber: 1,
            episodeNumber: 1,
            title: "Pilot",
            airDateUtc: "2020-01-01T00:00:00Z",
            hasFile: true,
            episodeFileId: 9001,
            monitored: true,
          },
          {
            id: 22,
            seasonNumber: 1,
            episodeNumber: 2,
            title: "Next",
            airDateUtc: "2099-01-01T00:00:00Z",
            hasFile: false,
            monitored: true,
          },
        ],
      };
    }) as unknown as typeof fetch;

    const client = createSonarrClient("http://192.168.1.10:8989", "k");
    const seasons = await client.getSeasons(5);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://192.168.1.10:8989/api/v3/episode?seriesId=5",
      expect.objectContaining({
        headers: expect.objectContaining({ "X-Api-Key": "k" }),
      }),
    );
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://192.168.1.10:8989/api/v3/episodefile?seriesId=5",
      expect.objectContaining({
        headers: expect.objectContaining({ "X-Api-Key": "k" }),
      }),
    );
    expect(seasons).toHaveLength(1);
    expect(seasons[0]?.seasonNumber).toBe(1);
    expect(seasons[0]?.episodes).toHaveLength(2);
    expect(seasons[0]?.episodes[0]?.availability).toBe("dispo");
    expect(seasons[0]?.episodes[0]?.audioLanguageCodes).toEqual(["EN"]);
    expect(seasons[0]?.episodes[0]?.subtitleLanguageCodes).toEqual(["FR"]);
    expect(seasons[0]?.episodes[0]?.fileQuality).toBe("WEBDL-1080p");
    expect(seasons[0]?.episodes[0]?.sizeOnDisk).toBe(1_500_000_000);
    expect(seasons[0]?.episodes[1]?.availability).toBe("aVenir");
    expect(seasons[0]?.episodes[1]?.audioLanguageCodes).toEqual([]);
  });

  it("maps calendar episodes", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
        {
          id: 44,
          seriesId: 5,
          title: "Pilot",
          seasonNumber: 1,
          episodeNumber: 1,
          hasFile: false,
          airDateUtc: "2026-08-01T20:00:00Z",
          series: { id: 5, title: "Harbor Show", images: [] },
        },
      ],
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const client = createSonarrClient("http://192.168.1.10:8989", "k");
    const episodes = await client.getCalendar({
      start: "2026-07-01",
      end: "2026-09-01",
    });

    expect(episodes[0]?.seriesTitle).toBe("Harbor Show");
    expect(episodes[0]?.airDateUtc).toBe("2026-08-01T20:00:00Z");
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("/api/v3/calendar?");
    expect(url).toContain("start=2026-07-01");
    expect(url).toContain("includeSeries=true");
  });

  it("updates series monitored via GET then PUT", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 5,
          title: "Harbor Show",
          year: 2022,
          monitored: true,
          status: "continuing",
          images: [],
          statistics: { episodeFileCount: 3, episodeCount: 10 },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 5,
          title: "Harbor Show",
          year: 2022,
          monitored: false,
          status: "continuing",
          images: [],
          statistics: { episodeFileCount: 3, episodeCount: 10 },
        }),
      });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const client = createSonarrClient("http://192.168.1.10:8989", "k");
    const series = await client.updateSeries(5, { monitored: false });

    expect(series.monitored).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const putCall = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(putCall[0]).toBe("http://192.168.1.10:8989/api/v3/series/5");
    expect(putCall[1]?.method).toBe("PUT");
    expect(JSON.parse(String(putCall[1]?.body))).toMatchObject({
      id: 5,
      monitored: false,
    });
  });

  it("loads series credits from TVMaze when tvMazeId is present", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 5,
          title: "Harbor Show",
          year: 2022,
          monitored: true,
          status: "continuing",
          tvMazeId: 169,
          images: [],
          statistics: { episodeFileCount: 0, episodeCount: 0 },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          {
            person: {
              name: "Ada",
              image: { medium: "https://tvmaze/ada.jpg" },
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          {
            type: "Creator",
            person: { name: "Bea" },
          },
        ],
      });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const client = createSonarrClient("http://192.168.1.10:8989", "k");
    const credits = await client.getSeriesCredits(5);
    expect(credits).toEqual({
      cast: [{ name: "Ada", photoUrl: "https://tvmaze/ada.jpg" }],
      crew: [{ name: "Bea", job: "Creator" }],
    });
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "https://api.tvmaze.com/shows/169/cast",
    );
    expect(fetchMock.mock.calls[2]?.[0]).toBe(
      "https://api.tvmaze.com/shows/169/crew",
    );
  });

  it("returns empty series credits when tvMazeId is missing", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 5,
        title: "Harbor Show",
        year: 2022,
        monitored: true,
        status: "continuing",
        images: [],
        statistics: { episodeFileCount: 0, episodeCount: 0 },
      }),
    }) as unknown as typeof fetch;

    const client = createSonarrClient("http://192.168.1.10:8989", "k");
    const credits = await client.getSeriesCredits(5);
    expect(credits).toEqual({ cast: [], crew: [] });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("deletes series with deleteFiles query flag", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const client = createSonarrClient("http://192.168.1.10:8989", "k");
    await client.deleteSeries(5, { deleteFiles: true });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/v3/series/5?");
    expect(url).toContain("deleteFiles=true");
    expect(url).toContain("addImportExclusion=false");
    expect(init.method).toBe("DELETE");
  });
});

describe("createRadarrClient calendar", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("maps calendar movies", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
        {
          id: 2,
          title: "Harbor",
          year: 2026,
          hasFile: false,
          status: "announced",
          digitalRelease: "2026-08-10T00:00:00Z",
          images: [],
        },
      ],
    }) as unknown as typeof fetch;

    const client = createRadarrClient("http://192.168.1.10:7878", "k");
    const movies = await client.getCalendar({
      start: "2026-07-01",
      end: "2026-09-01",
    });
    expect(movies[0]?.title).toBe("Harbor");
    expect(movies[0]?.releaseDate).toBe("2026-08-10T00:00:00Z");
  });
});
