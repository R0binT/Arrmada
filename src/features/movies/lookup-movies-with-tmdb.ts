import type { MovieCandidate } from "@/arr-client";
import {
  lookupCandidatesPage,
  type LookupCandidatesPage,
} from "@/features/lookup/lookup-candidates-page";
import {
  mergeMediaHits,
  pickBestNamedMatch,
  type TmdbMediaHit,
  type TmdbNamedMatch,
  type TmdbPagedHits,
} from "@/tmdb-client";

import { movieCandidateFromTmdbHit } from "./movie-candidate-from-tmdb-hit";

export type TmdbMovieSearchPort = {
  searchCompanies(q: string): Promise<readonly TmdbNamedMatch[]>;
  searchKeywords(q: string): Promise<readonly TmdbNamedMatch[]>;
  searchCollections(q: string): Promise<readonly TmdbNamedMatch[]>;
  searchMovies(q: string, page?: number): Promise<TmdbPagedHits>;
  discoverMoviesByCompany(
    id: number,
    page?: number,
  ): Promise<TmdbPagedHits>;
  discoverMoviesByKeyword(
    id: number,
    page?: number,
  ): Promise<TmdbPagedHits>;
  getCollectionParts(id: number): Promise<readonly TmdbMediaHit[]>;
};

export type LookupMoviesWithTmdbInput = {
  readonly term: string;
  readonly page?: number;
  readonly tmdb: TmdbMovieSearchPort;
  readonly lookupByTmdbId: (tmdbId: number) => Promise<MovieCandidate | null>;
  readonly lookupByTerm: (term: string) => Promise<MovieCandidate[]>;
};

const enrichHit = async (
  hit: TmdbMediaHit,
  lookupByTmdbId: (tmdbId: number) => Promise<MovieCandidate | null>,
): Promise<MovieCandidate> => {
  try {
    const arr = await lookupByTmdbId(hit.tmdbId);
    return arr ?? movieCandidateFromTmdbHit(hit);
  } catch {
    return movieCandidateFromTmdbHit(hit);
  }
};

const collectPage = async (
  term: string,
  page: number,
  tmdb: TmdbMovieSearchPort,
): Promise<TmdbPagedHits> => {
  const [companies, keywords, collections] = await Promise.all([
    tmdb.searchCompanies(term),
    tmdb.searchKeywords(term),
    tmdb.searchCollections(term),
  ]);
  const company = pickBestNamedMatch(term, companies);
  const keyword = pickBestNamedMatch(term, keywords);
  const collection = pickBestNamedMatch(term, collections);

  let primary: TmdbPagedHits;
  if (company !== undefined) {
    primary = await tmdb.discoverMoviesByCompany(company.id, page);
  } else if (keyword !== undefined) {
    primary = await tmdb.discoverMoviesByKeyword(keyword.id, page);
  } else {
    primary = await tmdb.searchMovies(term, page);
  }

  if (page > 1) {
    return primary;
  }

  const extras: TmdbMediaHit[][] = [];
  if (company !== undefined || keyword !== undefined) {
    const titleSearch = await tmdb.searchMovies(term, 1);
    extras.push([...titleSearch.hits]);
  }
  if (collection !== undefined) {
    extras.push([...(await tmdb.getCollectionParts(collection.id))]);
  }
  if (extras.length === 0) {
    return primary;
  }
  const merged = mergeMediaHits(
    [primary.hits, ...extras],
    Number.POSITIVE_INFINITY,
  );
  return {
    hits: merged,
    page: primary.page,
    totalPages: primary.totalPages,
  };
};

/**
 * TMDB-first movie lookup page: expand franchise signals, enrich via Arr.
 */
export const lookupMoviesWithTmdb = async (
  input: LookupMoviesWithTmdbInput,
): Promise<LookupCandidatesPage<MovieCandidate>> => {
  const { term, tmdb, lookupByTmdbId, lookupByTerm } = input;
  const page = input.page !== undefined && input.page > 0 ? input.page : 1;
  try {
    const paged = await collectPage(term, page, tmdb);
    const items = await Promise.all(
      paged.hits.map((hit) => enrichHit(hit, lookupByTmdbId)),
    );
    return lookupCandidatesPage({
      items,
      page: paged.page,
      totalPages: paged.totalPages,
    });
  } catch {
    if (page > 1) {
      return lookupCandidatesPage({
        items: [],
        page,
        totalPages: page,
      });
    }
    const items = await lookupByTerm(term);
    return lookupCandidatesPage({
      items,
      page: 1,
      totalPages: 1,
    });
  }
};
