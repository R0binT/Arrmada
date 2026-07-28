export { ArrHttpError, kindFromStatus } from "./errors";
export type { ArrErrorKind } from "./errors";
export { createArrHttp } from "./http";
export type { ArrHttp } from "./http";
export { createRadarrClient } from "./radarr/client";
export type { RadarrClient } from "./radarr/client";
export { createSonarrClient } from "./sonarr/client";
export type { SonarrClient } from "./sonarr/client";
export type {
  ArrAddDefaults,
  ArrService,
  CalendarEpisode,
  CalendarEvent,
  CalendarMovie,
  CastMember,
  Episode,
  Movie,
  MovieCandidate,
  QualityProfileOption,
  QueueItem,
  QueuePriority,
  QueueStatus,
  ReleaseOffer,
  RootFolderOption,
  Season,
  Series,
  SeriesCandidate,
  ServiceHealth,
  UpcomingItem,
} from "./types";

/** @deprecated Prefer ReleaseOffer — alias for interactive-search screens. */
export type { ReleaseOffer as Release } from "./types";

export {
  buildCalendarEvents,
  buildUpcomingItems,
  calendarRangeForMonth,
  defaultCalendarRange,
  formatUpcomingDate,
  mergeCalendarRanges,
  upcomingDayKey,
} from "./upcoming";
export type { BuildUpcomingItemsInput } from "./upcoming";

export {
  canOfferDownload,
  classifyAvailability,
  classifyEpisode,
  classifyMovie,
  classifySeries,
  isEpisodeOut,
  isMovieOut,
  isSeriesOut,
  seasonNeedsDownload,
  seriesHasExpectedFiles,
} from "./availability";
export type { Availability, AvailabilityInput } from "./availability";
