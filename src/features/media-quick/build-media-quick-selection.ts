import {
    classifyMovie,
    classifySeries,
    seasonNeedsDownload,
    type Availability,
    type Episode,
    type Movie,
    type QueueItem,
    type Season,
    type Series,
    type UpcomingItem,
} from "@/arr-client";
import { t } from "@/i18n";

import type { MediaQuickSelection } from "./types";

export type UpcomingLibraryContext = {
  readonly movies?: readonly Movie[];
  readonly series?: readonly Series[];
};

export const seasonAvailability = (
  season: Season,
): Availability | undefined => {
  if (season.episodes.length === 0) return undefined;
  if (season.episodes.every((episode) => episode.availability === "dispo")) {
    return "dispo";
  }
  if (seasonNeedsDownload(season)) return "aTelecharger";
  // Entirely upcoming → À venir. Mixed downloaded + upcoming has no single
  // status; episode progress chips carry the signal instead.
  if (season.episodes.every((episode) => episode.availability === "aVenir")) {
    return "aVenir";
  }
  return undefined;
};

const seasonHeading = (seasonNumber: number): string =>
  seasonNumber === 0
    ? t("detail.specialEpisodes")
    : t("detail.seasonN", { n: seasonNumber });

export const selectionFromMovie = (movie: Movie): MediaQuickSelection => ({
  kind: "movie",
  key: `movie-${movie.id}`,
  title: movie.title,
  year: movie.year > 0 ? movie.year : undefined,
  posterUrl: movie.posterUrl,
  movieId: movie.id,
  availability: classifyMovie(movie),
  fileQuality: movie.hasFile ? movie.fileQuality : undefined,
  audioLanguageCodes: movie.hasFile ? movie.audioLanguageCodes : undefined,
  subtitleLanguageCodes: movie.hasFile
    ? movie.subtitleLanguageCodes
    : undefined,
  genres: movie.genres,
  runtimeMinutes: movie.runtimeMinutes,
  networkOrStudio: movie.studio,
  added: movie.added,
  sizeOnDisk: movie.sizeOnDisk,
  ratings: movie.ratings,
  certification: movie.certification,
  collectionTitle: movie.collectionTitle,
  airDate: movie.digitalRelease ?? movie.physicalRelease ?? movie.inCinemas,
});

export const selectionFromSeries = (series: Series): MediaQuickSelection => ({
  kind: "series",
  key: `series-${series.id}`,
  title: series.title,
  year: series.year > 0 ? series.year : undefined,
  posterUrl: series.posterUrl,
  seriesId: series.id,
  availability: classifySeries(series),
  genres: series.genres,
  runtimeMinutes: series.runtimeMinutes,
  networkOrStudio: series.network,
  added: series.added,
  episodeCount: series.episodeCount,
  episodeFileCount: series.episodeFileCount,
  ratings: series.ratings,
  certification: series.certification,
  airDate: series.firstAired,
});

export const selectionFromSeason = (
  series: Series,
  season: Season,
): MediaQuickSelection => ({
  kind: "season",
  key: `season-${series.id}-${season.seasonNumber}`,
  title: seasonHeading(season.seasonNumber),
  year: series.year > 0 ? series.year : undefined,
  posterUrl: series.posterUrl,
  seriesId: series.id,
  subtitle: series.title,
  seasonNumber: season.seasonNumber,
  episodeCount: season.episodes.length,
  episodeFileCount: season.episodes.filter((episode) => episode.hasFile).length,
  availability: seasonAvailability(season),
  genres: series.genres,
  runtimeMinutes: series.runtimeMinutes,
  networkOrStudio: series.network,
  added: series.added,
});

export const selectionFromEpisode = (
  series: Series,
  episode: Episode,
): MediaQuickSelection => {
  const trimmedTitle = episode.title.trim();
  return {
    kind: "episode",
    key: `episode-${episode.id}`,
    title:
      trimmedTitle.length > 0
        ? trimmedTitle
        : `E${String(episode.episodeNumber).padStart(2, "0")}`,
    year: series.year > 0 ? series.year : undefined,
    posterUrl: series.posterUrl,
    seriesId: series.id,
    subtitle: series.title,
    seasonNumber: episode.seasonNumber,
    episodeNumber: episode.episodeNumber,
    airDate: episode.airDateUtc,
    availability: episode.availability,
    audioLanguageCodes: episode.hasFile
      ? episode.audioLanguageCodes
      : undefined,
    subtitleLanguageCodes: episode.hasFile
      ? episode.subtitleLanguageCodes
      : undefined,
    genres: series.genres,
    runtimeMinutes: series.runtimeMinutes,
    networkOrStudio: series.network,
    added: series.added,
  };
};

export const selectionFromDownload = (
  item: QueueItem,
): MediaQuickSelection => ({
  kind: "download",
  key: `download-${item.service}-${item.id}`,
  title: item.title,
  year: undefined,
  posterUrl: item.posterUrl,
  movieId: item.movieId,
  seriesId: item.seriesId,
  progress: item.progress,
  queueStatus: item.status,
  service: item.service,
  size: item.size,
  sizeLeft: item.sizeLeft,
  etaSeconds: item.etaSeconds,
});

export const selectionFromUpcoming = (
  item: UpcomingItem,
  library: UpcomingLibraryContext = {},
): MediaQuickSelection => {
  if (item.kind === "movie") {
    const movie = library.movies?.find((entry) => entry.id === item.id);
    if (movie) {
      return {
        ...selectionFromMovie(movie),
        key: `upcoming-movie-${item.id}`,
        availability: "aVenir",
        airDate: item.date,
        subtitle: item.subtitle,
      };
    }
    return {
      kind: "movie",
      key: `upcoming-movie-${item.id}`,
      title: item.title,
      year: undefined,
      posterUrl: item.posterUrl,
      movieId: item.id,
      availability: "aVenir",
      airDate: item.date,
      subtitle: item.subtitle,
    };
  }

  const series = library.series?.find((entry) => entry.id === item.seriesId);
  const episodeTitle =
    item.episodeTitle.length > 0 ? item.episodeTitle : item.title;
  if (series) {
    return {
      kind: "episode",
      key: `upcoming-episode-${item.id}`,
      title: episodeTitle,
      year: series.year > 0 ? series.year : undefined,
      posterUrl: item.posterUrl ?? series.posterUrl,
      seriesId: item.seriesId,
      availability: "aVenir",
      subtitle: series.title,
      seasonNumber: item.seasonNumber,
      episodeNumber: item.episodeNumber,
      airDate: item.date,
      genres: series.genres,
      runtimeMinutes: series.runtimeMinutes,
      networkOrStudio: series.network,
      added: series.added,
    };
  }

  return {
    kind: "episode",
    key: `upcoming-episode-${item.id}`,
    title: episodeTitle,
    year: undefined,
    posterUrl: item.posterUrl,
    seriesId: item.seriesId,
    availability: "aVenir",
    subtitle: item.seriesTitle.length > 0 ? item.seriesTitle : item.subtitle,
    seasonNumber: item.seasonNumber,
    episodeNumber: item.episodeNumber,
    airDate: item.date,
  };
};
