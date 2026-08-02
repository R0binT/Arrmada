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
