export type ArrOutboxStatus = "pending" | "running" | "failed";

export type ArrOutboxOpType =
  | "addMovie"
  | "addSeries"
  | "updateMovieMonitored"
  | "updateSeriesMonitored"
  | "updateEpisodeMonitored"
  | "deleteMovie"
  | "deleteSeries"
  | "deleteEpisodeFile"
  | "grabMovieRelease"
  | "grabSeriesRelease"
  | "movieSearch"
  | "seriesSearch"
  | "seasonSearch"
  | "episodeSearch"
  | "queueRemove"
  | "queuePauseOrResume";

export type ArrOutboxItem = {
  readonly id: string;
  readonly service: "radarr" | "sonarr";
  readonly type: ArrOutboxOpType;
  readonly payload: unknown;
  readonly status: ArrOutboxStatus;
  readonly attempts: number;
  readonly lastError?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly optimisticKey?: string;
};
