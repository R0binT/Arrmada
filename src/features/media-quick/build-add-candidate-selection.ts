import type { MovieCandidate, SeriesCandidate } from "@/arr-client";
import {
  getMovieLookupLibraryStatus,
  getSeriesLookupLibraryStatus,
  type LookupLibraryBadge,
} from "@/features/library/lookup-library-status";
import { t } from "@/i18n";

import type { MediaQuickSelection, MediaQuickStatusTone } from "./types";

type GlanceStatus = {
  readonly glanceStatusLine?: string;
  readonly glanceStatusTone?: MediaQuickStatusTone;
};

const glanceStatusFromBadge = (badge: LookupLibraryBadge): GlanceStatus => {
  if (badge === "none") {
    return {};
  }
  if (badge === "alreadyDownloaded") {
    return {
      glanceStatusLine: t("add.alreadyDownloaded"),
      glanceStatusTone: "success",
    };
  }
  return {
    glanceStatusLine: t("add.inLibrary"),
    glanceStatusTone: "muted",
  };
};

export const buildMovieAddSelection = (
  candidate: MovieCandidate,
): MediaQuickSelection => {
  const { badge } = getMovieLookupLibraryStatus({
    inLibrary: candidate.inLibrary,
    hasFile: candidate.hasFile,
  });
  return {
    kind: "movie",
    key: `movie-add:${candidate.tmdbId}`,
    title: candidate.title,
    year: candidate.year,
    posterUrl: candidate.posterUrl,
    ...(candidate.libraryId !== undefined
      ? { movieId: candidate.libraryId }
      : {}),
    genres: candidate.genres,
    runtimeMinutes: candidate.runtimeMinutes,
    ...glanceStatusFromBadge(badge),
  };
};

export const buildSeriesAddSelection = (
  candidate: SeriesCandidate,
): MediaQuickSelection => {
  const { badge } = getSeriesLookupLibraryStatus({
    inLibrary: candidate.inLibrary,
    episodeFileCount: candidate.episodeFileCount,
    episodeCount: candidate.episodeCount,
  });
  return {
    kind: "series",
    key: `series-add:${candidate.tvdbId}`,
    title: candidate.title,
    year: candidate.year,
    posterUrl: candidate.posterUrl,
    ...(candidate.libraryId !== undefined
      ? { seriesId: candidate.libraryId }
      : {}),
    genres: candidate.genres,
    runtimeMinutes: candidate.runtimeMinutes,
    ...glanceStatusFromBadge(badge),
  };
};
