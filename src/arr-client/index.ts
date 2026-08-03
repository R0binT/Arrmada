export { ArrHttpError, isAbortError, kindFromStatus } from "./errors";
export type { ArrErrorKind } from "./errors";
export { createArrHttp, DELETE_WITH_FILES_TIMEOUT_MS } from "./http";
export type { ArrHttp, ArrHttpRequestOptions } from "./http";
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
  CrewMember,
  Episode,
  ExternalIds,
  MediaCredits,
  Movie,
  MovieCandidate,
  QualityProfileOption,
  QueueItem,
  QueuePriority,
  QueueStatus,
  RatingScore,
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

export { formatCrewLine } from "./mappers/crew-line";
export { formatRatingLabel, mapRatings } from "./mappers/ratings";
