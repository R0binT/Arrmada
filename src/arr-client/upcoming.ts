import type { Availability } from "./availability";
import { classifyEpisode, classifyMovie } from "./availability";
import type {
    CalendarEpisode,
    CalendarEvent,
    CalendarMovie,
    UpcomingItem,
} from "./types";

export type BuildUpcomingItemsInput = {
  readonly movies: readonly CalendarMovie[];
  readonly episodes: readonly CalendarEpisode[];
  readonly now?: Date;
};

const episodeSubtitle = (episode: CalendarEpisode): string => {
  const code = `S${String(episode.seasonNumber).padStart(2, "0")}E${String(episode.episodeNumber).padStart(2, "0")}`;
  const title = episode.episodeTitle.trim();
  return title.length > 0 ? `${code} · ${title}` : code;
};

const movieSubtitle = (movie: CalendarMovie): string | undefined =>
  movie.year > 0 ? String(movie.year) : undefined;

const toSortableTime = (iso: string): number => {
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? Number.POSITIVE_INFINITY : ms;
};

const toLocalDayIso = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Keep only domain À venir rows and sort soonest-first.
 */
export const buildUpcomingItems = (
  input: BuildUpcomingItemsInput,
): UpcomingItem[] => {
  const now = input.now ?? new Date();
  const movies: UpcomingItem[] = input.movies
    .filter((movie) => classifyMovie(movie) === "aVenir")
    .map((movie) => ({
      kind: "movie" as const,
      id: movie.id,
      title: movie.title.trim(),
      subtitle: movieSubtitle(movie),
      date: movie.releaseDate,
      posterUrl: movie.posterUrl,
    }))
    .filter((item) => item.title.length > 0);
  const episodes: UpcomingItem[] = input.episodes
    .filter((episode) => classifyEpisode(episode, now) === "aVenir")
    .map((episode) => {
      const seriesTitle = episode.seriesTitle.trim();
      const episodeLabel = episodeSubtitle(episode);
      return {
        kind: "episode" as const,
        id: episode.id,
        seriesId: episode.seriesId,
        seriesTitle,
        episodeTitle: episode.episodeTitle.trim(),
        seasonNumber: episode.seasonNumber,
        episodeNumber: episode.episodeNumber,
        title: episodeLabel,
        subtitle: seriesTitle.length > 0 ? seriesTitle : undefined,
        date: episode.airDateUtc ?? "",
        posterUrl: episode.posterUrl,
      };
    })
    .filter(
      (item) =>
        item.date.length > 0 &&
        item.title.length > 0 &&
        // Drop incomplete Sonarr rows (no series payload → blank poster/name).
        (item.subtitle !== undefined || item.posterUrl !== undefined),
    );

  return [...movies, ...episodes].sort((left, right) => {
    const byDate = toSortableTime(left.date) - toSortableTime(right.date);
    if (byDate !== 0) return byDate;
    return left.title.localeCompare(right.title, "fr");
  });
};

/**
 * All calendar rows with availability (Dispo / À télécharger / À venir).
 */
export const buildCalendarEvents = (
  input: BuildUpcomingItemsInput,
): CalendarEvent[] => {
  const now = input.now ?? new Date();
  const movies: CalendarEvent[] = input.movies.map((movie) => ({
    kind: "movie" as const,
    id: movie.id,
    title: movie.title,
    subtitle: movieSubtitle(movie),
    date: movie.releaseDate,
    posterUrl: movie.posterUrl,
    availability: classifyMovie(movie),
  }));
  const episodes: CalendarEvent[] = input.episodes
    .map((episode) => {
      const date = episode.airDateUtc ?? "";
      const availability: Availability = classifyEpisode(episode, now);
      const seriesTitle = episode.seriesTitle.trim();
      return {
        kind: "episode" as const,
        id: episode.id,
        seriesId: episode.seriesId,
        seriesTitle,
        episodeTitle: episode.episodeTitle.trim(),
        seasonNumber: episode.seasonNumber,
        episodeNumber: episode.episodeNumber,
        title: episodeSubtitle(episode),
        subtitle: seriesTitle.length > 0 ? seriesTitle : undefined,
        date,
        posterUrl: episode.posterUrl,
        availability,
      };
    })
    .filter((item) => item.date.length > 0);

  return [...movies, ...episodes].sort((left, right) => {
    const byDate = toSortableTime(left.date) - toSortableTime(right.date);
    if (byDate !== 0) return byDate;
    return left.title.localeCompare(right.title, "fr");
  });
};

/** Horizon for Liste / Accueil: far enough to act as “all upcoming”. */
const LIST_UPCOMING_HORIZON_DAYS = 3650;

/**
 * API window for the À venir list (today → ~10 years).
 * Calendar mode uses {@link calendarRangeForMonth} instead.
 */
export const defaultCalendarRange = (
  now: Date = new Date(),
): { readonly start: string; readonly end: string } => {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + LIST_UPCOMING_HORIZON_DAYS);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
};

/** Visible month (local) ± 7 days for leading/trailing grid cells. */
export const calendarRangeForMonth = (
  month: Date,
): { readonly start: string; readonly end: string } => {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  start.setDate(start.getDate() - 7);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  end.setDate(end.getDate() + 7);
  return {
    start: toLocalDayIso(start),
    end: toLocalDayIso(end),
  };
};

export const mergeCalendarRanges = (
  left: { readonly start: string; readonly end: string },
  right: { readonly start: string; readonly end: string },
): { readonly start: string; readonly end: string } => ({
  start: left.start < right.start ? left.start : right.start,
  end: left.end > right.end ? left.end : right.end,
});

export const formatUpcomingDate = (
  iso: string,
  localeTag: string = "en-US",
): string => {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return iso;
  return new Date(ms).toLocaleDateString(localeTag, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const upcomingDayKey = (iso: string): string => {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "";
  const date = new Date(ms);
  return toLocalDayIso(date);
};
