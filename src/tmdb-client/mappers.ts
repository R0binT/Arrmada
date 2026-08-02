import type {
  TmdbMediaHit,
  TmdbNamedMatch,
  TmdbTvExternalIds,
} from "./types";

const POSTER_BASE = "https://image.tmdb.org/t/p/w185";

export type TmdbMovieResult = {
  readonly id: number;
  readonly title: string;
  readonly release_date?: string | null;
  readonly poster_path?: string | null;
  readonly overview?: string | null;
};

export type TmdbTvResult = {
  readonly id: number;
  readonly name: string;
  readonly first_air_date?: string | null;
  readonly poster_path?: string | null;
  readonly overview?: string | null;
};

export type TmdbNamedResult = {
  readonly id: number;
  readonly name: string;
};

export type TmdbCollectionPart = {
  readonly id: number;
  readonly title: string;
  readonly release_date?: string | null;
  readonly poster_path?: string | null;
  readonly overview?: string | null;
};

export type TmdbExternalIdsResult = {
  readonly tvdb_id?: number | null;
};

const yearFromDate = (value: string | null | undefined): number => {
  if (value === undefined || value === null || value.length < 4) return 0;
  const year = Number.parseInt(value.slice(0, 4), 10);
  return Number.isFinite(year) ? year : 0;
};

const posterUrlFromPath = (
  path: string | null | undefined,
): string | undefined => {
  if (path === undefined || path === null || path.length === 0) {
    return undefined;
  }
  return `${POSTER_BASE}${path}`;
};

const overviewOrEmpty = (overview: string | null | undefined): string => {
  if (overview === undefined || overview === null) return "";
  return overview;
};

export const mapMovieResult = (result: TmdbMovieResult): TmdbMediaHit => ({
  tmdbId: result.id,
  title: result.title,
  year: yearFromDate(result.release_date),
  posterUrl: posterUrlFromPath(result.poster_path),
  overview: overviewOrEmpty(result.overview),
});

export const mapTvResult = (result: TmdbTvResult): TmdbMediaHit => ({
  tmdbId: result.id,
  title: result.name,
  year: yearFromDate(result.first_air_date),
  posterUrl: posterUrlFromPath(result.poster_path),
  overview: overviewOrEmpty(result.overview),
});

export const mapNamedMatch = (result: TmdbNamedResult): TmdbNamedMatch => ({
  id: result.id,
  name: result.name,
});

export const mapCollectionPart = (
  part: TmdbCollectionPart,
): TmdbMediaHit => ({
  tmdbId: part.id,
  title: part.title,
  year: yearFromDate(part.release_date),
  posterUrl: posterUrlFromPath(part.poster_path),
  overview: overviewOrEmpty(part.overview),
});

export const mapTvExternalIds = (
  result: TmdbExternalIdsResult,
): TmdbTvExternalIds => ({
  tvdbId:
    result.tvdb_id === undefined || result.tvdb_id === null
      ? undefined
      : result.tvdb_id,
});
