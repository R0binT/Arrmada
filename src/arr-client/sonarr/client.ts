import { createArrHttp, DELETE_WITH_FILES_TIMEOUT_MS } from "../http";
import { mapCalendarEpisode } from "../mappers/calendar";
import { mapTvMazeCast, mapTvMazeMediaCredits } from "../mappers/cast";
import { mapHealth } from "../mappers/health";
import {
  mapQualityProfileOption,
  mapRootFolderOption,
} from "../mappers/movie";
import { mapQueueItem } from "../mappers/queue";
import { mapReleaseOffer } from "../mappers/release";
import {
  groupEpisodesIntoSeasons,
  indexEpisodeFileLanguages,
  mapSeriesCandidate,
  mapSonarrEpisode,
  mapSonarrSeries,
} from "../mappers/series";
import type {
  ArrAddDefaults,
  CalendarEpisode,
  CastMember,
  Episode,
  MediaCredits,
  QueueItem,
  QueuePriority,
  ReleaseOffer,
  Season,
  Series,
  SeriesCandidate,
  ServiceHealth,
} from "../types";

const extractQueueRecords = (
  raw: { records?: unknown[] } | unknown[],
): unknown[] => (Array.isArray(raw) ? raw : (raw.records ?? []));

const asRecord = (raw: unknown): Record<string, unknown> | null => {
  if (typeof raw !== "object" || raw === null) return null;
  return raw as Record<string, unknown>;
};

const findSeriesLookupPayload = (
  raw: unknown[],
  tvdbId: number,
): Record<string, unknown> | null => {
  const match = raw.find((item) => {
    const obj = asRecord(item);
    return obj !== null && Number(obj.tvdbId) === tvdbId;
  });
  return asRecord(match ?? raw[0] ?? null);
};

export const createSonarrClient = (baseUrl: string, apiKey: string) => {
  const http = createArrHttp(baseUrl, apiKey);

  return {
    getHealth: async (): Promise<ServiceHealth> => {
      const raw = await http.getJson<unknown>("/api/v3/system/status");
      return mapHealth("sonarr", raw);
    },
    getSeries: async (): Promise<Series[]> => {
      const raw = await http.getJson<unknown[]>("/api/v3/series");
      return raw.map((item) => mapSonarrSeries(item, baseUrl));
    },
    getSeriesById: async (id: number): Promise<Series> => {
      const raw = await http.getJson<unknown>(`/api/v3/series/${id}`);
      return mapSonarrSeries(raw, baseUrl);
    },
    getSeriesCredits: async (seriesId: number): Promise<MediaCredits> => {
      const seriesRaw = await http.getJson<unknown>(
        `/api/v3/series/${seriesId}`,
      );
      const series = mapSonarrSeries(seriesRaw, baseUrl);
      if (series.tvMazeId === undefined) return { cast: [], crew: [] };
      const showId = encodeURIComponent(String(series.tvMazeId));
      const [castResponse, crewResponse] = await Promise.all([
        fetch(`https://api.tvmaze.com/shows/${showId}/cast`),
        fetch(`https://api.tvmaze.com/shows/${showId}/crew`),
      ]);
      if (!castResponse.ok) {
        throw new Error(`TVMaze cast request failed (${castResponse.status}).`);
      }
      const castRaw: unknown = await castResponse.json();
      const crewRaw: unknown = crewResponse.ok
        ? await crewResponse.json()
        : [];
      return mapTvMazeMediaCredits(castRaw, crewRaw);
    },
    getEpisodeGuestStars: async (
      seriesId: number,
      seasonNumber: number,
      episodeNumber: number,
    ): Promise<readonly CastMember[]> => {
      const seriesRaw = await http.getJson<unknown>(
        `/api/v3/series/${seriesId}`,
      );
      const series = mapSonarrSeries(seriesRaw, baseUrl);
      if (series.tvMazeId === undefined) return [];
      const showId = encodeURIComponent(String(series.tvMazeId));
      const season = encodeURIComponent(String(seasonNumber));
      const number = encodeURIComponent(String(episodeNumber));
      const response = await fetch(
        `https://api.tvmaze.com/shows/${showId}/episodebynumber?season=${season}&number=${number}&embed=guestcast`,
      );
      if (response.status === 404) return [];
      if (!response.ok) {
        throw new Error(
          `TVMaze episode guest cast request failed (${response.status}).`,
        );
      }
      const raw: unknown = await response.json();
      const obj = asRecord(raw);
      const embedded = asRecord(obj?._embedded);
      return mapTvMazeCast(embedded?.guestcast ?? []);
    },
    getSeasons: async (seriesId: number): Promise<Season[]> => {
      const [rawEpisodes, rawFiles] = await Promise.all([
        http.getJson<unknown[]>(
          `/api/v3/episode?seriesId=${encodeURIComponent(String(seriesId))}`,
        ),
        http.getJson<unknown[]>(
          `/api/v3/episodefile?seriesId=${encodeURIComponent(String(seriesId))}`,
        ),
      ]);
      const languageIndex = indexEpisodeFileLanguages(rawFiles);
      const episodes = rawEpisodes.map((item) => {
        const obj = asRecord(item);
        const episodeFileId = obj ? Number(obj.episodeFileId) : NaN;
        const langs = Number.isFinite(episodeFileId)
          ? languageIndex.get(episodeFileId)
          : undefined;
        return mapSonarrEpisode(item, new Date(), langs);
      });
      return groupEpisodesIntoSeasons(episodes);
    },
    lookup: async (term: string): Promise<Series[]> => {
      const raw = await http.getJson<unknown[]>(
        `/api/v3/series/lookup?term=${encodeURIComponent(term)}`,
      );
      return raw.map((item) => mapSonarrSeries(item, baseUrl));
    },
    lookupCandidates: async (term: string): Promise<SeriesCandidate[]> => {
      const raw = await http.getJson<unknown[]>(
        `/api/v3/series/lookup?term=${encodeURIComponent(term)}`,
      );
      return raw
        .map((item) => mapSeriesCandidate(item, baseUrl))
        .filter((item): item is SeriesCandidate => item !== null);
    },
    lookupCandidateByTvdbId: async (
      tvdbId: number,
    ): Promise<SeriesCandidate | null> => {
      const raw = await http.getJson<unknown[]>(
        `/api/v3/series/lookup?term=${encodeURIComponent(`tvdb:${tvdbId}`)}`,
      );
      const match = raw.find((item) => {
        const obj = asRecord(item);
        return obj !== null && Number(obj.tvdbId) === tvdbId;
      });
      return match ? mapSeriesCandidate(match, baseUrl) : null;
    },
    getAddDefaults: async (): Promise<ArrAddDefaults> => {
      const [profilesRaw, foldersRaw] = await Promise.all([
        http.getJson<unknown[]>("/api/v3/qualityprofile"),
        http.getJson<unknown[]>("/api/v3/rootfolder"),
      ]);
      const qualityProfiles = profilesRaw
        .map(mapQualityProfileOption)
        .filter((item): item is NonNullable<typeof item> => item !== null);
      const rootFolders = foldersRaw
        .map(mapRootFolderOption)
        .filter((item): item is NonNullable<typeof item> => item !== null);
      return {
        qualityProfiles,
        rootFolders,
        defaultQualityProfileId: qualityProfiles[0]?.id,
        defaultRootFolderPath: rootFolders[0]?.path,
      };
    },
    addSeries: async (input: {
      tvdbId: number;
      qualityProfileId: number;
      rootFolderPath: string;
    }): Promise<unknown> => {
      const raw = await http.getJson<unknown[]>(
        `/api/v3/series/lookup?term=${encodeURIComponent(`tvdb:${input.tvdbId}`)}`,
      );
      const payload = findSeriesLookupPayload(raw, input.tvdbId);
      if (!payload) {
        throw new Error("Series not found in Sonarr lookup.");
      }
      return http.postJson<unknown>("/api/v3/series", {
        ...payload,
        qualityProfileId: input.qualityProfileId,
        rootFolderPath: input.rootFolderPath,
        monitored: true,
        seasonFolder: true,
        addOptions: {
          searchForMissingEpisodes: true,
          monitor: "all",
        },
      });
    },
    getSeriesReleases: async (
      seriesId: number,
      options?: { readonly seasonNumber?: number },
    ): Promise<ReleaseOffer[]> => {
      const params = new URLSearchParams({
        seriesId: String(seriesId),
      });
      if (options?.seasonNumber !== undefined) {
        params.set("seasonNumber", String(options.seasonNumber));
      }
      const raw = await http.getJson<unknown[]>(
        `/api/v3/release?${params.toString()}`,
      );
      return raw
        .map(mapReleaseOffer)
        .filter((item): item is ReleaseOffer => item !== null);
    },
    getEpisodeReleases: async (episodeId: number): Promise<ReleaseOffer[]> => {
      const raw = await http.getJson<unknown[]>(
        `/api/v3/release?episodeId=${encodeURIComponent(String(episodeId))}`,
      );
      return raw
        .map(mapReleaseOffer)
        .filter((item): item is ReleaseOffer => item !== null);
    },
    grabRelease: (input: { guid: string; indexerId: number }) =>
      http.postJson<unknown>("/api/v3/release", {
        guid: input.guid,
        indexerId: input.indexerId,
      }),
    updateSeries: async (
      id: number,
      changes: { readonly monitored: boolean },
    ): Promise<Series> => {
      const raw = await http.getJson<unknown>(`/api/v3/series/${id}`);
      const payload = asRecord(raw);
      if (!payload) {
        throw new Error("Series not found.");
      }
      const updated = await http.putJson<unknown>(`/api/v3/series/${id}`, {
        ...payload,
        monitored: changes.monitored,
      });
      return mapSonarrSeries(updated, baseUrl);
    },
    updateEpisode: async (
      id: number,
      changes: { readonly monitored: boolean },
    ): Promise<Episode> => {
      const raw = await http.getJson<unknown>(`/api/v3/episode/${id}`);
      const payload = asRecord(raw);
      if (!payload) {
        throw new Error("Episode not found.");
      }
      const updated = await http.putJson<unknown>(`/api/v3/episode/${id}`, {
        ...payload,
        monitored: changes.monitored,
      });
      return mapSonarrEpisode(updated);
    },
    deleteEpisodeFile: (episodeFileId: number): Promise<void> =>
      http.deleteJson<void>(
        `/api/v3/episodefile/${episodeFileId}`,
        undefined,
        { timeoutMs: DELETE_WITH_FILES_TIMEOUT_MS },
      ),
    deleteSeries: (
      id: number,
      options: { readonly deleteFiles: boolean },
    ): Promise<void> =>
      http.deleteJson<void>(
        `/api/v3/series/${id}`,
        {
          deleteFiles: String(options.deleteFiles),
          addImportExclusion: "false",
        },
        options.deleteFiles
          ? { timeoutMs: DELETE_WITH_FILES_TIMEOUT_MS }
          : undefined,
      ),
    getCalendar: async (range: {
      readonly start: string;
      readonly end: string;
    }): Promise<CalendarEpisode[]> => {
      const raw = await http.getJson<unknown[]>(
        `/api/v3/calendar?start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}&unmonitored=false&includeSeries=true`,
      );
      return raw
        .map((item) => mapCalendarEpisode(item, baseUrl))
        .filter((item): item is CalendarEpisode => item !== null);
    },
    getQueue: async (): Promise<QueueItem[]> => {
      const raw = await http.getJson<{ records?: unknown[] } | unknown[]>(
        "/api/v3/queue?includeSeries=true&includeEpisode=true",
      );
      return extractQueueRecords(raw).map((item) =>
        mapQueueItem(item, "sonarr", baseUrl),
      );
    },
    removeQueueItem: (
      id: number,
      options: { removeFromClient: boolean; blocklist: boolean },
    ) =>
      http.deleteJson<void>(`/api/v3/queue/${id}`, {
        removeFromClient: String(options.removeFromClient),
        blocklist: String(options.blocklist),
      }),
    grabQueueItem: (id: number) =>
      http.postJson<unknown>(`/api/v3/queue/grab/${id}`),
    setQueuePriority: (id: number, priority: QueuePriority) =>
      http.putJson<unknown>("/api/v3/queue/bulk", {
        ids: [id],
        priority,
      }),
    command: (name: string, body: Record<string, unknown> = {}) =>
      http.postJson<unknown>("/api/v3/command", { name, ...body }),
  };
};

export type SonarrClient = ReturnType<typeof createSonarrClient>;
