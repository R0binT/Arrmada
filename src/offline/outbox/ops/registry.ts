import type { RadarrClient, SonarrClient } from "@/arr-client";

import type { OpExecutor } from "../dispatcher";
import type { ArrOutboxOpType } from "../types";
import { createAddMovieExecutor } from "./add-movie";
import { createAddSeriesExecutor } from "./add-series";
import { createDeleteEpisodeFileExecutor } from "./delete-episode-file";
import { createDeleteMovieExecutor } from "./delete-movie";
import { createDeleteSeriesExecutor } from "./delete-series";
import { createEpisodeSearchExecutor } from "./episode-search";
import { createGrabMovieReleaseExecutor } from "./grab-movie-release";
import { createGrabSeriesReleaseExecutor } from "./grab-series-release";
import { createMovieSearchExecutor } from "./movie-search";
import { createQueuePauseOrResumeExecutor } from "./queue-pause-or-resume";
import { createQueueRemoveExecutor } from "./queue-remove";
import { createSeasonSearchExecutor } from "./season-search";
import { createSeriesSearchExecutor } from "./series-search";
import { createUpdateEpisodeMonitoredExecutor } from "./update-episode-monitored";
import { createUpdateMovieMonitoredExecutor } from "./update-movie-monitored";
import { createUpdateSeriesMonitoredExecutor } from "./update-series-monitored";

export type OpRegistryDeps = {
  readonly radarr?: RadarrClient;
  readonly sonarr?: SonarrClient;
};

let registryDeps: OpRegistryDeps = {};

/**
 * Inject Arr clients used by registered op executors.
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
  const radarr = registryDeps.radarr;
  const sonarr = registryDeps.sonarr;
  switch (type) {
    case "addMovie":
      return radarr === undefined
        ? unregisteredExecutor(type)
        : createAddMovieExecutor(radarr);
    case "updateMovieMonitored":
      return radarr === undefined
        ? unregisteredExecutor(type)
        : createUpdateMovieMonitoredExecutor(radarr);
    case "deleteMovie":
      return radarr === undefined
        ? unregisteredExecutor(type)
        : createDeleteMovieExecutor(radarr);
    case "grabMovieRelease":
      return radarr === undefined
        ? unregisteredExecutor(type)
        : createGrabMovieReleaseExecutor(radarr);
    case "movieSearch":
      return radarr === undefined
        ? unregisteredExecutor(type)
        : createMovieSearchExecutor(radarr);
    case "addSeries":
      return sonarr === undefined
        ? unregisteredExecutor(type)
        : createAddSeriesExecutor(sonarr);
    case "updateSeriesMonitored":
      return sonarr === undefined
        ? unregisteredExecutor(type)
        : createUpdateSeriesMonitoredExecutor(sonarr);
    case "updateEpisodeMonitored":
      return sonarr === undefined
        ? unregisteredExecutor(type)
        : createUpdateEpisodeMonitoredExecutor(sonarr);
    case "deleteSeries":
      return sonarr === undefined
        ? unregisteredExecutor(type)
        : createDeleteSeriesExecutor(sonarr);
    case "deleteEpisodeFile":
      return sonarr === undefined
        ? unregisteredExecutor(type)
        : createDeleteEpisodeFileExecutor(sonarr);
    case "grabSeriesRelease":
      return sonarr === undefined
        ? unregisteredExecutor(type)
        : createGrabSeriesReleaseExecutor(sonarr);
    case "seriesSearch":
      return sonarr === undefined
        ? unregisteredExecutor(type)
        : createSeriesSearchExecutor(sonarr);
    case "seasonSearch":
      return sonarr === undefined
        ? unregisteredExecutor(type)
        : createSeasonSearchExecutor(sonarr);
    case "episodeSearch":
      return sonarr === undefined
        ? unregisteredExecutor(type)
        : createEpisodeSearchExecutor(sonarr);
    case "queueRemove": {
      if (
        registryDeps.radarr === undefined &&
        registryDeps.sonarr === undefined
      ) {
        return unregisteredExecutor(type);
      }
      return createQueueRemoveExecutor(registryDeps);
    }
    case "queuePauseOrResume": {
      if (
        registryDeps.radarr === undefined &&
        registryDeps.sonarr === undefined
      ) {
        return unregisteredExecutor(type);
      }
      return createQueuePauseOrResumeExecutor(registryDeps);
    }
    default: {
      const unregistered: never = type;
      return unregisteredExecutor(unregistered);
    }
  }
};
