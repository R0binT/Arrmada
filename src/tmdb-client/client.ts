import { createTmdbHttp, type TmdbHttp } from "./http";
import {
  mapCollectionPart,
  mapMovieResult,
  mapNamedMatch,
  mapTvExternalIds,
  mapTvResult,
  type TmdbCollectionPart,
  type TmdbExternalIdsResult,
  type TmdbMovieResult,
  type TmdbNamedResult,
  type TmdbTvResult,
} from "./mappers";
import type {
  TmdbMediaHit,
  TmdbNamedMatch,
  TmdbPagedHits,
  TmdbTvExternalIds,
} from "./types";

type PaginatedResults<T> = {
  readonly results: readonly T[];
  readonly page?: number;
  readonly total_pages?: number;
};

type CollectionResponse = {
  readonly parts: readonly TmdbCollectionPart[];
};

const SEARCH_DISCOVER_DEFAULTS: Record<string, string> = {
  include_adult: "false",
  language: "fr-FR",
};

const toPagedHits = <T>(
  response: PaginatedResults<T>,
  mapHit: (raw: T) => TmdbMediaHit,
): TmdbPagedHits => {
  const page =
    typeof response.page === "number" && response.page > 0 ? response.page : 1;
  const totalPages =
    typeof response.total_pages === "number" && response.total_pages > 0
      ? response.total_pages
      : 1;
  return {
    hits: response.results.map(mapHit),
    page,
    totalPages,
  };
};

export type TmdbClient = {
  readonly searchCompanies: (query: string) => Promise<readonly TmdbNamedMatch[]>;
  readonly searchKeywords: (query: string) => Promise<readonly TmdbNamedMatch[]>;
  readonly searchCollections: (
    query: string,
  ) => Promise<readonly TmdbNamedMatch[]>;
  readonly searchMovies: (
    query: string,
    page?: number,
  ) => Promise<TmdbPagedHits>;
  readonly searchTv: (query: string, page?: number) => Promise<TmdbPagedHits>;
  readonly discoverMoviesByCompany: (
    companyId: number,
    page?: number,
  ) => Promise<TmdbPagedHits>;
  readonly discoverMoviesByKeyword: (
    keywordId: number,
    page?: number,
  ) => Promise<TmdbPagedHits>;
  readonly discoverTvByCompany: (
    companyId: number,
    page?: number,
  ) => Promise<TmdbPagedHits>;
  readonly discoverTvByKeyword: (
    keywordId: number,
    page?: number,
  ) => Promise<TmdbPagedHits>;
  readonly getCollectionParts: (
    collectionId: number,
  ) => Promise<readonly TmdbMediaHit[]>;
  readonly getTvExternalIds: (tmdbId: number) => Promise<TmdbTvExternalIds>;
};

const searchNamed = async (
  http: TmdbHttp,
  path: string,
  query: string,
): Promise<readonly TmdbNamedMatch[]> => {
  const response = await http.getJson<PaginatedResults<TmdbNamedResult>>(path, {
    ...SEARCH_DISCOVER_DEFAULTS,
    page: "1",
    query,
  });
  return response.results.map(mapNamedMatch);
};

const searchMediaMovies = async (
  http: TmdbHttp,
  query: string,
  page: number,
): Promise<TmdbPagedHits> => {
  const response = await http.getJson<PaginatedResults<TmdbMovieResult>>(
    "/search/movie",
    {
      ...SEARCH_DISCOVER_DEFAULTS,
      page: String(page),
      query,
    },
  );
  return toPagedHits(response, mapMovieResult);
};

const searchMediaTv = async (
  http: TmdbHttp,
  query: string,
  page: number,
): Promise<TmdbPagedHits> => {
  const response = await http.getJson<PaginatedResults<TmdbTvResult>>(
    "/search/tv",
    {
      ...SEARCH_DISCOVER_DEFAULTS,
      page: String(page),
      query,
    },
  );
  return toPagedHits(response, mapTvResult);
};

const discoverMovies = async (
  http: TmdbHttp,
  page: number,
  query: Record<string, string>,
): Promise<TmdbPagedHits> => {
  const response = await http.getJson<PaginatedResults<TmdbMovieResult>>(
    "/discover/movie",
    {
      ...SEARCH_DISCOVER_DEFAULTS,
      page: String(page),
      ...query,
    },
  );
  return toPagedHits(response, mapMovieResult);
};

const discoverTv = async (
  http: TmdbHttp,
  page: number,
  query: Record<string, string>,
): Promise<TmdbPagedHits> => {
  const response = await http.getJson<PaginatedResults<TmdbTvResult>>(
    "/discover/tv",
    {
      ...SEARCH_DISCOVER_DEFAULTS,
      page: String(page),
      ...query,
    },
  );
  return toPagedHits(response, mapTvResult);
};

export const createTmdbClient = (apiKey: string): TmdbClient => {
  const http = createTmdbHttp(apiKey);

  return {
    searchCompanies: (query: string) =>
      searchNamed(http, "/search/company", query),
    searchKeywords: (query: string) =>
      searchNamed(http, "/search/keyword", query),
    searchCollections: (query: string) =>
      searchNamed(http, "/search/collection", query),
    searchMovies: (query: string, page = 1) =>
      searchMediaMovies(http, query, page),
    searchTv: (query: string, page = 1) => searchMediaTv(http, query, page),
    discoverMoviesByCompany: (companyId: number, page = 1) =>
      discoverMovies(http, page, { with_companies: String(companyId) }),
    discoverMoviesByKeyword: (keywordId: number, page = 1) =>
      discoverMovies(http, page, { with_keywords: String(keywordId) }),
    discoverTvByCompany: (companyId: number, page = 1) =>
      discoverTv(http, page, { with_companies: String(companyId) }),
    discoverTvByKeyword: (keywordId: number, page = 1) =>
      discoverTv(http, page, { with_keywords: String(keywordId) }),
    getCollectionParts: async (collectionId: number) => {
      const response = await http.getJson<CollectionResponse>(
        `/collection/${collectionId}`,
        { language: "fr-FR" },
      );
      return response.parts.map(mapCollectionPart);
    },
    getTvExternalIds: async (tmdbId: number) => {
      const response = await http.getJson<TmdbExternalIdsResult>(
        `/tv/${tmdbId}/external_ids`,
      );
      return mapTvExternalIds(response);
    },
  };
};
