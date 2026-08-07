import type { OpExecutor } from "../dispatcher";
import type { ArrOutboxOpType } from "../types";
import { createAddMovieExecutor, type AddMovieClient } from "./add-movie";
import { createAddSeriesExecutor, type AddSeriesClient } from "./add-series";

export type OpRegistryDeps = {
  readonly radarr?: AddMovieClient;
  readonly sonarr?: AddSeriesClient;
};

let registryDeps: OpRegistryDeps = {};

/**
 * Inject Arr clients used by registered op executors (wired in a later task).
 */
export const configureOpRegistry = (deps: OpRegistryDeps): void => {
  registryDeps = deps;
};

const unregisteredExecutor = (type: ArrOutboxOpType): OpExecutor => ({
  execute: async (): Promise<void> => {
    throw new Error(`unregistered op: ${type}`);
  },
});

/**
 * Resolves the executor for an outbox op type.
 */
export const getOpExecutor = (type: ArrOutboxOpType): OpExecutor => {
  if (type === "addMovie") {
    if (registryDeps.radarr === undefined) {
      return unregisteredExecutor(type);
    }
    return createAddMovieExecutor(registryDeps.radarr);
  }
  if (type === "addSeries") {
    if (registryDeps.sonarr === undefined) {
      return unregisteredExecutor(type);
    }
    return createAddSeriesExecutor(registryDeps.sonarr);
  }
  return unregisteredExecutor(type);
};
