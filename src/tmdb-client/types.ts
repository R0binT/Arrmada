export type TmdbMediaHit = {
  readonly tmdbId: number;
  readonly title: string;
  readonly year: number;
  readonly posterUrl: string | undefined;
  readonly overview: string;
};

export type TmdbNamedMatch = {
  readonly id: number;
  readonly name: string;
};

export type TmdbTvExternalIds = {
  readonly tvdbId: number | undefined;
};

/** One page of TMDB search/discover media results. */
export type TmdbPagedHits = {
  readonly hits: readonly TmdbMediaHit[];
  readonly page: number;
  readonly totalPages: number;
};
