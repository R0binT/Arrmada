import type { SeriesCandidate } from "@/arr-client";
import {
  mergeMediaHits,
  pickBestNamedMatch,
  type TmdbMediaHit,
  type TmdbNamedMatch,
  type TmdbTvExternalIds,
} from "@/tmdb-client";

import { LOOKUP_ENRICH_CAP } from "../movies/lookup-movies-with-tmdb";
import { seriesCandidateFromTmdb } from "./series-candidate-from-tmdb";

export type TmdbSeriesSearchPort = {
  searchCompanies(q: string): Promise<readonly TmdbNamedMatch[]>;
  searchKeywords(q: string): Promise<readonly TmdbNamedMatch[]>;
  searchTv(q: string): Promise<readonly TmdbMediaHit[]>;
  discoverTvByCompany(id: number): Promise<readonly TmdbMediaHit[]>;
  discoverTvByKeyword(id: number): Promise<readonly TmdbMediaHit[]>;
  getTvExternalIds(tmdbId: number): Promise<TmdbTvExternalIds>;
};

export type LookupSeriesWithTmdbInput = {
  readonly term: string;
  readonly tmdb: TmdbSeriesSearchPort;
  readonly lookupByTvdbId: (tvdbId: number) => Promise<SeriesCandidate | null>;
  readonly lookupByTerm: (term: string) => Promise<SeriesCandidate[]>;
};

const enrichHit = async (
  hit: TmdbMediaHit,
  tmdb: TmdbSeriesSearchPort,
  lookupByTvdbId: (tvdbId: number) => Promise<SeriesCandidate | null>,
): Promise<SeriesCandidate | null> => {
  let external: TmdbTvExternalIds;
  try {
    external = await tmdb.getTvExternalIds(hit.tmdbId);
  } catch {
    return null;
  }
  if (external.tvdbId === undefined) {
    return null;
  }
  const tvdbId = external.tvdbId;
  try {
    const arr = await lookupByTvdbId(tvdbId);
    return arr ?? seriesCandidateFromTmdb({ tvdbId, hit });
  } catch {
    return seriesCandidateFromTmdb({ tvdbId, hit });
  }
};

const collectHits = async (
  term: string,
  tmdb: TmdbSeriesSearchPort,
): Promise<readonly TmdbMediaHit[]> => {
  const [companies, keywords, tvSearch] = await Promise.all([
    tmdb.searchCompanies(term),
    tmdb.searchKeywords(term),
    tmdb.searchTv(term),
  ]);
  const company = pickBestNamedMatch(term, companies);
  const keyword = pickBestNamedMatch(term, keywords);
  const emptyHits: readonly TmdbMediaHit[] = [];
  const [discoverCompany, discoverKeyword] = await Promise.all([
    company !== undefined
      ? tmdb.discoverTvByCompany(company.id)
      : Promise.resolve(emptyHits),
    keyword !== undefined
      ? tmdb.discoverTvByKeyword(keyword.id)
      : Promise.resolve(emptyHits),
  ]);
  return mergeMediaHits(
    [tvSearch, discoverCompany, discoverKeyword],
    LOOKUP_ENRICH_CAP,
  );
};

/**
 * TMDB-first series lookup: expand franchise signals, resolve TVDB, enrich via Arr.
 */
export const lookupSeriesWithTmdb = async (
  input: LookupSeriesWithTmdbInput,
): Promise<SeriesCandidate[]> => {
  const { term, tmdb, lookupByTvdbId, lookupByTerm } = input;
  try {
    const hits = await collectHits(term, tmdb);
    const enriched = await Promise.all(
      hits.map((hit) => enrichHit(hit, tmdb, lookupByTvdbId)),
    );
    return enriched.filter(
      (candidate): candidate is SeriesCandidate => candidate !== null,
    );
  } catch {
    return lookupByTerm(term);
  }
};
