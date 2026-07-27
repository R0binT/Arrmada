import { createArrHttp } from "../http";
import { mapCalendarMovie } from "../mappers/calendar";
import { mapHealth } from "../mappers/health";
import {
    mapMovieCandidate,
    mapQualityProfileOption,
    mapRadarrMovie,
    mapRootFolderOption,
} from "../mappers/movie";
import { mapQueueItem } from "../mappers/queue";
import { mapReleaseOffer } from "../mappers/release";
import type {
    ArrAddDefaults,
    CalendarMovie,
    Movie,
    MovieCandidate,
    QueueItem,
    QueuePriority,
    ReleaseOffer,
    ServiceHealth,
} from "../types";

const extractQueueRecords = (
  raw: { records?: unknown[] } | unknown[],
): unknown[] => (Array.isArray(raw) ? raw : (raw.records ?? []));

const asRecord = (raw: unknown): Record<string, unknown> | null => {
  if (typeof raw !== "object" || raw === null) return null;
  return raw as Record<string, unknown>;
};

export const createRadarrClient = (baseUrl: string, apiKey: string) => {
  const http = createArrHttp(baseUrl, apiKey);

  return {
    getHealth: async (): Promise<ServiceHealth> => {
      const raw = await http.getJson<unknown>("/api/v3/system/status");
      return mapHealth("radarr", raw);
    },
    getMovies: async (): Promise<Movie[]> => {
      const raw = await http.getJson<unknown[]>("/api/v3/movie");
      return raw.map((item) => mapRadarrMovie(item, baseUrl));
    },
    getMovie: async (id: number): Promise<Movie> => {
      const raw = await http.getJson<unknown>(`/api/v3/movie/${id}`);
      return mapRadarrMovie(raw, baseUrl);
    },
    lookup: async (term: string): Promise<Movie[]> => {
      const raw = await http.getJson<unknown[]>(
        `/api/v3/movie/lookup?term=${encodeURIComponent(term)}`,
      );
      return raw.map((item) => mapRadarrMovie(item, baseUrl));
    },
    lookupCandidates: async (term: string): Promise<MovieCandidate[]> => {
      const raw = await http.getJson<unknown[]>(
        `/api/v3/movie/lookup?term=${encodeURIComponent(term)}`,
      );
      return raw
        .map((item) => mapMovieCandidate(item, baseUrl))
        .filter((item): item is MovieCandidate => item !== null);
    },
    lookupCandidateByTmdbId: async (
      tmdbId: number,
    ): Promise<MovieCandidate | null> => {
      const raw = await http.getJson<unknown>(
        `/api/v3/movie/lookup/tmdb?tmdbId=${encodeURIComponent(String(tmdbId))}`,
      );
      const payload = Array.isArray(raw) ? raw[0] : raw;
      return mapMovieCandidate(payload, baseUrl);
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
    addMovie: async (input: {
      tmdbId: number;
      qualityProfileId: number;
      rootFolderPath: string;
    }): Promise<unknown> => {
      const lookup = await http.getJson<unknown>(
        `/api/v3/movie/lookup/tmdb?tmdbId=${encodeURIComponent(String(input.tmdbId))}`,
      );
      const payload = Array.isArray(lookup)
        ? asRecord(lookup[0])
        : asRecord(lookup);
      if (!payload) {
        throw new Error("Movie not found in Radarr lookup.");
      }
      return http.postJson<unknown>("/api/v3/movie", {
        ...payload,
        qualityProfileId: input.qualityProfileId,
        rootFolderPath: input.rootFolderPath,
        monitored: true,
        addOptions: { searchForMovie: false },
      });
    },
    getMovieReleases: async (movieId: number): Promise<ReleaseOffer[]> => {
      const raw = await http.getJson<unknown[]>(
        `/api/v3/release?movieId=${encodeURIComponent(String(movieId))}`,
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
    updateMovie: async (
      id: number,
      changes: { readonly monitored: boolean },
    ): Promise<Movie> => {
      const raw = await http.getJson<unknown>(`/api/v3/movie/${id}`);
      const payload = asRecord(raw);
      if (!payload) {
        throw new Error("Movie not found.");
      }
      const updated = await http.putJson<unknown>(`/api/v3/movie/${id}`, {
        ...payload,
        monitored: changes.monitored,
      });
      return mapRadarrMovie(updated, baseUrl);
    },
    deleteMovie: (
      id: number,
      options: { readonly deleteFiles: boolean },
    ): Promise<void> =>
      http.deleteJson<void>(`/api/v3/movie/${id}`, {
        deleteFiles: String(options.deleteFiles),
        addImportExclusion: "false",
      }),
    getCalendar: async (range: {
      readonly start: string;
      readonly end: string;
    }): Promise<CalendarMovie[]> => {
      const raw = await http.getJson<unknown[]>(
        `/api/v3/calendar?start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}&unmonitored=false`,
      );
      return raw
        .map((item) => mapCalendarMovie(item, baseUrl))
        .filter((item): item is CalendarMovie => item !== null);
    },
    getQueue: async (): Promise<QueueItem[]> => {
      const raw = await http.getJson<{ records?: unknown[] } | unknown[]>(
        "/api/v3/queue?includeMovie=true",
      );
      return extractQueueRecords(raw).map((item) =>
        mapQueueItem(item, "radarr", baseUrl),
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

export type RadarrClient = ReturnType<typeof createRadarrClient>;
