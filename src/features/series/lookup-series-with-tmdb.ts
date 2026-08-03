import type { SeriesCandidate } from "@/arr-client";
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
  type TmdbTvExternalIds,
} from "@/tmdb-client";

import { seriesCandidateFromTmdb } from "./series-candidate-from-tmdb";

export type TmdbSeriesSearchPort = {
  searchCompanies(q: string): Promise<readonly TmdbNamedMatch[]>;
  searchKeywords(q: string): Promise<readonly TmdbNamedMatch[]>;
  searchTv(q: string, page?: number): Promise<TmdbPagedHits>;
  discoverTvByCompany(id: number, page?: number): Promise<TmdbPagedHits>;
  discoverTvByKeyword(id: number, page?: number): Promise<TmdbPagedHits>;
  getTvExternalIds(tmdbId: number): Promise<TmdbTvExternalIds>;
};

export type LookupSeriesWithTmdbInput = {
  readonly term: string;
  readonly page?: number;
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

const collectPage = async (
  term: string,
  page: number,
  tmdb: TmdbSeriesSearchPort,
): Promise<TmdbPagedHits> => {
  const [companies, keywords] = await Promise.all([
    tmdb.searchCompanies(term),
    tmdb.searchKeywords(term),
  ]);
  const company = pickBestNamedMatch(term, companies);
  const keyword = pickBestNamedMatch(term, keywords);

  let primary: TmdbPagedHits;
  if (company !== undefined) {
    primary = await tmdb.discoverTvByCompany(company.id, page);
  } else if (keyword !== undefined) {
    primary = await tmdb.discoverTvByKeyword(keyword.id, page);
  } else {
    primary = await tmdb.searchTv(term, page);
  }

  if (page > 1) {
    return primary;
  }

  if (company === undefined && keyword === undefined) {
    return primary;
  }

  const titleSearch = await tmdb.searchTv(term, 1);
  const merged = mergeMediaHits(
    [primary.hits, titleSearch.hits],
    Number.POSITIVE_INFINITY,
  );
  return {
    hits: merged,
    page: primary.page,
    totalPages: primary.totalPages,
  };
};

/**
 * TMDB-first series lookup page: resolve TVDB, enrich via Arr.
 */
export const lookupSeriesWithTmdb = async (
  input: LookupSeriesWithTmdbInput,
): Promise<LookupCandidatesPage<SeriesCandidate>> => {
  const { term, tmdb, lookupByTvdbId, lookupByTerm } = input;
  const page = input.page !== undefined && input.page > 0 ? input.page : 1;
  try {
    const paged = await collectPage(term, page, tmdb);
    const enriched = await Promise.all(
      paged.hits.map((hit) => enrichHit(hit, tmdb, lookupByTvdbId)),
    );
    const items = enriched.filter(
      (candidate): candidate is SeriesCandidate => candidate !== null,
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
