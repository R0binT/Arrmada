import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import {
  defaultShouldDehydrateQuery,
  type Query,
} from "@tanstack/react-query";
import type {
  Persister,
  PersistQueryClientOptions,
} from "@tanstack/react-query-persist-client";

import {
  LIBRARY_GC_TIME_MS,
  QUERY_CACHE_STORAGE_KEY,
} from "@/offline/constants";

const PERSISTABLE_ROOT_KEYS = new Set<string>([
  "movies",
  "series",
  "queue",
  "upcoming",
  "health",
]);

const SKIP_SEGMENTS = new Set<string>([
  "lookup",
  "releases",
  "preview",
  "guests",
]);

/**
 * Returns whether a query should be written to the offline cache.
 * Persists library roots (movies/series/queue/upcoming/health) except
 * lookup/releases/preview/guests segments.
 */
export const shouldPersistQuery = (query: {
  readonly queryKey: readonly unknown[];
}): boolean => {
  const root = query.queryKey[0];
  if (typeof root !== "string" || !PERSISTABLE_ROOT_KEYS.has(root)) {
    return false;
  }
  return !query.queryKey.some(
    (segment) => typeof segment === "string" && SKIP_SEGMENTS.has(segment),
  );
};

/**
 * Creates an AsyncStorage persister for the ARR React Query cache.
 */
export const createArrQueryPersister = (): Persister =>
  createAsyncStoragePersister({
    storage: AsyncStorage,
    key: QUERY_CACHE_STORAGE_KEY,
  });

const shouldDehydrateQuery = (query: Query): boolean =>
  defaultShouldDehydrateQuery(query) && shouldPersistQuery(query);

export const arrPersistOptions: Omit<PersistQueryClientOptions, "queryClient"> =
  {
    persister: createArrQueryPersister(),
    maxAge: LIBRARY_GC_TIME_MS,
    dehydrateOptions: {
      shouldDehydrateQuery,
    },
  };
