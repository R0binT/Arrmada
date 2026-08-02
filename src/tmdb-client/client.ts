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
  TmdbTvExternalIds,
} from "./types";

type PaginatedResults<T> = {
  readonly results: readonly T[];
};

type CollectionResponse = {
  readonly parts: readonly TmdbCollectionPart[];
};

const SEARCH_DISCOVER_DEFAULTS: Record<string, string> = {
  page: "1",
  include_adult: "false",
  language: "fr-FR",
};

export type TmdbClient = {
  readonly searchCompanies: (query: string) => Promise<readonly TmdbNamedMatch[]>;
  readonly searchKeywords: (query: string) => Promise<readonly TmdbNamedMatch[]>;
  readonly searchCollections: (
    query: string,
  ) => Promise<readonly TmdbNamedMatch[]>;
  readonly searchMovies: (query: string) => Promise<readonly TmdbMediaHit[]>;
  readonly searchTv: (query: string) => Promise<readonly TmdbMediaHit[]>;
  readonly discoverMoviesByCompany: (
    companyId: number,
  ) => Promise<readonly TmdbMediaHit[]>;
  readonly discoverMoviesByKeyword: (
    keywordId: number,
  ) => Promise<readonly TmdbMediaHit[]>;
  readonly discoverTvByCompany: (
    companyId: number,
  ) => Promise<readonly TmdbMediaHit[]>;
  readonly discoverTvByKeyword: (
    keywordId: number,
  ) => Promise<readonly TmdbMediaHit[]>;
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
    query,
  });
  return response.results.map(mapNamedMatch);
};

const searchMediaMovies = async (
  http: TmdbHttp,
  query: string,
): Promise<readonly TmdbMediaHit[]> => {
  const response = await http.getJson<PaginatedResults<TmdbMovieResult>>(
    "/search/movie",
    {
      ...SEARCH_DISCOVER_DEFAULTS,
      query,
    },
  );
  return response.results.map(mapMovieResult);
};

const searchMediaTv = async (
  http: TmdbHttp,
  query: string,
): Promise<readonly TmdbMediaHit[]> => {
  const response = await http.getJson<PaginatedResults<TmdbTvResult>>(
    "/search/tv",
    {
      ...SEARCH_DISCOVER_DEFAULTS,
      query,
    },
  );
  return response.results.map(mapTvResult);
};

const discoverMovies = async (
  http: TmdbHttp,
  query: Record<string, string>,
): Promise<readonly TmdbMediaHit[]> => {
  const response = await http.getJson<PaginatedResults<TmdbMovieResult>>(
    "/discover/movie",
    {
      ...SEARCH_DISCOVER_DEFAULTS,
      ...query,
    },
  );
  return response.results.map(mapMovieResult);
};

const discoverTv = async (
  http: TmdbHttp,
  query: Record<string, string>,
): Promise<readonly TmdbMediaHit[]> => {
  const response = await http.getJson<PaginatedResults<TmdbTvResult>>(
    "/discover/tv",
    {
      ...SEARCH_DISCOVER_DEFAULTS,
      ...query,
    },
  );
  return response.results.map(mapTvResult);
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
    searchMovies: (query: string) => searchMediaMovies(http, query),
    searchTv: (query: string) => searchMediaTv(http, query),
    discoverMoviesByCompany: (companyId: number) =>
      discoverMovies(http, { with_companies: String(companyId) }),
    discoverMoviesByKeyword: (keywordId: number) =>
      discoverMovies(http, { with_keywords: String(keywordId) }),
    discoverTvByCompany: (companyId: number) =>
      discoverTv(http, { with_companies: String(companyId) }),
    discoverTvByKeyword: (keywordId: number) =>
      discoverTv(http, { with_keywords: String(keywordId) }),
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
