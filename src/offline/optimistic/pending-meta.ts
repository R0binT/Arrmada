import type { Movie, Series } from "@/arr-client/types";

export type { PendingSyncState } from "./pending-sync-index";
export {
  clearPendingSyncState,
  getPendingSyncState,
  resetPendingSyncIndex,
  setPendingSyncState,
  subscribePendingSync,
} from "./pending-sync-index";

/**
 * Optimistic library row ids are `-externalId`.
 * Assumption: Arr ids are always positive, so these never collide with real rows.
 */
export const optimisticMovieId = (tmdbId: number): number => -tmdbId;

/**
 * Optimistic series ids are `-tvdbId` (Arr series ids are positive).
 */
export const optimisticSeriesId = (tvdbId: number): number => -tvdbId;

export type OptimisticAddMoviePayload = {
  readonly tmdbId: number;
  readonly qualityProfileId: number;
  readonly rootFolderPath: string;
  readonly title: string;
  readonly year: number;
  readonly posterUrl: string | undefined;
  readonly overview: string;
};

export type OptimisticAddSeriesPayload = {
  readonly tvdbId: number;
  readonly qualityProfileId: number;
  readonly rootFolderPath: string;
  readonly title: string;
  readonly year: number;
  readonly posterUrl: string | undefined;
  readonly overview: string;
};

export const buildOptimisticMovie = (
  payload: OptimisticAddMoviePayload,
): Movie => ({
  id: optimisticMovieId(payload.tmdbId),
  title: payload.title,
  year: payload.year,
  posterUrl: payload.posterUrl,
  monitored: true,
  hasFile: false,
  statusSummary: "",
  added: undefined,
  overview: payload.overview,
  qualityProfileId: payload.qualityProfileId,
  fileQuality: undefined,
  audioLanguageCodes: [],
  subtitleLanguageCodes: [],
  sizeOnDisk: undefined,
  genres: [],
  runtimeMinutes: undefined,
  studio: undefined,
  ratings: [],
  certification: undefined,
  originalLanguage: undefined,
  inCinemas: undefined,
  digitalRelease: undefined,
  physicalRelease: undefined,
  collectionTitle: undefined,
  externalIds: {
    imdbId: undefined,
    tmdbId: payload.tmdbId,
    tvdbId: undefined,
    tvMazeId: undefined,
  },
});

export const buildOptimisticSeries = (
  payload: OptimisticAddSeriesPayload,
): Series => ({
  id: optimisticSeriesId(payload.tvdbId),
  title: payload.title,
  year: payload.year,
  posterUrl: payload.posterUrl,
  monitored: true,
  episodeFileCount: 0,
  episodeCount: 0,
  statusSummary: "",
  added: undefined,
  overview: payload.overview,
  qualityProfileId: payload.qualityProfileId,
  genres: [],
  runtimeMinutes: undefined,
  network: undefined,
  tvMazeId: undefined,
  ratings: [],
  certification: undefined,
  originalLanguage: undefined,
  ended: undefined,
  firstAired: undefined,
  lastAired: undefined,
  externalIds: {
    imdbId: undefined,
    tmdbId: undefined,
    tvdbId: payload.tvdbId,
    tvMazeId: undefined,
  },
});
