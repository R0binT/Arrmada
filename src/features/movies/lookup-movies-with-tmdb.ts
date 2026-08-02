import type { MovieCandidate } from "@/arr-client";
import {
  mergeMediaHits,
  pickBestNamedMatch,
  type TmdbMediaHit,
  type TmdbNamedMatch,
} from "@/tmdb-client";

import { movieCandidateFromTmdbHit } from "./movie-candidate-from-tmdb-hit";

export const LOOKUP_ENRICH_CAP = 25;

export type TmdbMovieSearchPort = {
  searchCompanies(q: string): Promise<TmdbNamedMatch[]>;
  searchKeywords(q: string): Promise<TmdbNamedMatch[]>;
  searchCollections(q: string): Promise<TmdbNamedMatch[]>;
  searchMovies(q: string): Promise<TmdbMediaHit[]>;
  discoverMoviesByCompany(id: number): Promise<TmdbMediaHit[]>;
  discoverMoviesByKeyword(id: number): Promise<TmdbMediaHit[]>;
  getCollectionParts(id: number): Promise<TmdbMediaHit[]>;
};

export type LookupMoviesWithTmdbInput = {
  readonly term: string;
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

const collectHits = async (
  term: string,
  tmdb: TmdbMovieSearchPort,
): Promise<TmdbMediaHit[]> => {
  const [companies, keywords, collections, movieSearch] = await Promise.all([
    tmdb.searchCompanies(term),
    tmdb.searchKeywords(term),
    tmdb.searchCollections(term),
    tmdb.searchMovies(term),
  ]);
  const company = pickBestNamedMatch(term, companies);
  const keyword = pickBestNamedMatch(term, keywords);
  const collection = pickBestNamedMatch(term, collections);
  const [discoverCompany, discoverKeyword, collectionParts] = await Promise.all([
    company !== undefined
      ? tmdb.discoverMoviesByCompany(company.id)
      : Promise.resolve([] as TmdbMediaHit[]),
    keyword !== undefined
      ? tmdb.discoverMoviesByKeyword(keyword.id)
      : Promise.resolve([] as TmdbMediaHit[]),
    collection !== undefined
      ? tmdb.getCollectionParts(collection.id)
      : Promise.resolve([] as TmdbMediaHit[]),
  ]);
  return mergeMediaHits(
    [movieSearch, discoverCompany, discoverKeyword, collectionParts],
    LOOKUP_ENRICH_CAP,
  );
};

/**
 * TMDB-first movie lookup: expand franchise signals, merge hits, enrich via Arr.
 */
export const lookupMoviesWithTmdb = async (
  input: LookupMoviesWithTmdbInput,
): Promise<MovieCandidate[]> => {
  const { term, tmdb, lookupByTmdbId, lookupByTerm } = input;
  try {
    const hits = await collectHits(term, tmdb);
    return Promise.all(hits.map((hit) => enrichHit(hit, lookupByTmdbId)));
  } catch {
    return lookupByTerm(term);
  }
};
