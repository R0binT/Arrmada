import type { Availability } from "./availability";

export type ArrService = "radarr" | "sonarr";

export type CastMember = {
  readonly name: string;
  readonly photoUrl: string | undefined;
};

export type QueueStatus =
  | "downloading"
  | "queued"
  | "paused"
  | "completed"
  | "failed"
  | "stalled"
  | "unknown";

export type Movie = {
  readonly id: number;
  readonly title: string;
  readonly year: number;
  readonly posterUrl: string | undefined;
  readonly monitored: boolean;
  readonly hasFile: boolean;
  readonly statusSummary: string;
  readonly added: string | undefined;
  readonly overview: string;
  readonly qualityProfileId: number | undefined;
  readonly fileQuality: string | undefined;
  readonly sizeOnDisk: number | undefined;
  readonly genres: readonly string[];
  readonly runtimeMinutes: number | undefined;
  readonly studio: string | undefined;
};

export type Series = {
  readonly id: number;
  readonly title: string;
  readonly year: number;
  readonly posterUrl: string | undefined;
  readonly monitored: boolean;
  readonly episodeFileCount: number;
  readonly episodeCount: number;
  readonly statusSummary: string;
  readonly added: string | undefined;
  readonly overview: string;
  readonly qualityProfileId: number | undefined;
  readonly genres: readonly string[];
  readonly runtimeMinutes: number | undefined;
  readonly network: string | undefined;
  /** TVMaze id used to load cast when Sonarr has no credit API. */
  readonly tvMazeId: number | undefined;
};

/** One Épisode of a Série, with domain availability already classified. */
export type Episode = {
  readonly id: number;
  readonly seasonNumber: number;
  readonly episodeNumber: number;
  readonly title: string;
  readonly airDateUtc: string | undefined;
  readonly hasFile: boolean;
  readonly monitored: boolean;
  readonly availability: Availability;
};

/** A numbered Saison grouping Épisodes on the Série screen. */
export type Season = {
  readonly seasonNumber: number;
  readonly episodes: readonly Episode[];
};

export type MovieCandidate = {
  readonly tmdbId: number;
  readonly title: string;
  readonly year: number;
  readonly posterUrl: string | undefined;
  readonly inLibrary: boolean;
  readonly hasFile: boolean;
  readonly overview: string;
  readonly genres: readonly string[];
  readonly runtimeMinutes: number | undefined;
  readonly libraryId: number | undefined;
};

export type SeriesCandidate = {
  readonly tvdbId: number;
  readonly title: string;
  readonly year: number;
  readonly posterUrl: string | undefined;
  readonly inLibrary: boolean;
  readonly episodeFileCount: number;
  readonly episodeCount: number;
  readonly overview: string;
  readonly genres: readonly string[];
  readonly runtimeMinutes: number | undefined;
  readonly libraryId: number | undefined;
};

export type QualityProfileOption = {
  readonly id: number;
  readonly name: string;
};

export type RootFolderOption = {
  readonly id: number;
  readonly path: string;
};

export type ArrAddDefaults = {
  readonly qualityProfiles: readonly QualityProfileOption[];
  readonly rootFolders: readonly RootFolderOption[];
  readonly defaultQualityProfileId: number | undefined;
  readonly defaultRootFolderPath: string | undefined;
};

export type ReleaseOffer = {
  readonly guid: string;
  readonly indexerId: number;
  readonly title: string;
  readonly indexer: string;
  readonly size: number;
  readonly seeders: number | undefined;
  readonly ageHours: number | undefined;
  readonly rejected: boolean;
  readonly rejectionReasons: readonly string[];
  readonly qualityName: string;
  readonly qualityWeight: number;
  readonly languageNames: readonly string[];
  readonly episodeId: number | undefined;
  readonly seasonNumber: number | undefined;
};

export type QueueItem = {
  readonly id: number;
  readonly service: ArrService;
  readonly title: string;
  readonly posterUrl: string | undefined;
  readonly status: QueueStatus;
  readonly progress: number;
  readonly size: number;
  readonly sizeLeft: number;
  readonly etaSeconds: number | undefined;
  readonly canPause: boolean;
  readonly canGrab: boolean;
  readonly downloadId: string | undefined;
  readonly movieId: number | undefined;
  readonly seriesId: number | undefined;
};

export type ServiceHealth = {
  readonly service: ArrService;
  readonly online: boolean;
  readonly version: string | undefined;
  readonly message: string | undefined;
};

export type QueuePriority = "veryLow" | "low" | "normal" | "high" | "veryHigh";

/** Calendar row before À venir filtering. */
export type CalendarMovie = {
  readonly id: number;
  readonly title: string;
  readonly year: number;
  readonly posterUrl: string | undefined;
  readonly hasFile: boolean;
  readonly statusSummary: string;
  readonly releaseDate: string;
};

export type CalendarEpisode = {
  readonly id: number;
  readonly seriesId: number;
  readonly seriesTitle: string;
  readonly episodeTitle: string;
  readonly seasonNumber: number;
  readonly episodeNumber: number;
  readonly posterUrl: string | undefined;
  readonly hasFile: boolean;
  readonly airDateUtc: string | undefined;
};

export type UpcomingItem =
  | {
      readonly kind: "movie";
      readonly id: number;
      readonly title: string;
      readonly subtitle: string | undefined;
      readonly date: string;
      readonly posterUrl: string | undefined;
    }
  | {
      readonly kind: "episode";
      readonly id: number;
      readonly seriesId: number;
      readonly seriesTitle: string;
      readonly episodeTitle: string;
      readonly seasonNumber: number;
      readonly episodeNumber: number;
      readonly title: string;
      readonly subtitle: string | undefined;
      readonly date: string;
      readonly posterUrl: string | undefined;
    };

/** Calendar chip row (all availabilities), for the month grid. */
export type CalendarEvent = UpcomingItem & {
  readonly availability: Availability;
};
