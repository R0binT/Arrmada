import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useSyncExternalStore } from "react";

import {
  ArrHttpError,
  type ArrService,
  type Movie,
  type QueueItem,
  type Series,
  type ServiceHealth,
} from "@/arr-client";
import {
  getQueuePollPolicyVersion,
  isQueueBurstActive,
  noteQueueSnapshotForBurst,
  resolveQueuePollInterval,
  subscribeQueuePollPolicy,
} from "@/features/queue/queue-poll-policy";
import { getConnectionErrorMessage } from "@/features/settings/connection-messages";
import { useAppIsActive } from "@/hooks/use-app-is-active";
import { useArrClients } from "@/hooks/use-arr-clients";
import { queryKeys } from "@/lib/query-keys";

const RECENT_LIMIT = 12;

const ACTIVE_STATUSES = new Set<QueueItem["status"]>(["downloading", "queued"]);

type RecentItem = {
  readonly id: number;
  readonly added: string | undefined;
};

export type HomeHero =
  | { readonly kind: "download"; readonly item: QueueItem }
  | { readonly kind: "movie"; readonly item: Movie }
  | { readonly kind: "series"; readonly item: Series };

export type ServiceNetworkError = {
  readonly service: ArrService;
  readonly message: string;
};

type UseHomeDataOptions = {
  readonly isFocused: boolean;
};

const isNetworkError = (error: unknown): boolean =>
  error instanceof ArrHttpError && error.kind === "network";

const sortByRecent = <T extends RecentItem>(items: readonly T[]): T[] =>
  [...items].sort((left, right) => {
    if (left.added && right.added) {
      return right.added.localeCompare(left.added);
    }
    if (left.added) return -1;
    if (right.added) return 1;
    return right.id - left.id;
  });

const pickHero = (
  downloadingItems: readonly QueueItem[],
  recentMovies: readonly Movie[],
  recentSeries: readonly Series[],
): HomeHero | undefined => {
  const activeDownload = downloadingItems.find((item) =>
    ACTIVE_STATUSES.has(item.status),
  );
  if (activeDownload) {
    return { kind: "download", item: activeDownload };
  }

  const latestMovie = recentMovies[0];
  const latestSeries = recentSeries[0];

  if (!latestMovie && !latestSeries) return undefined;
  if (!latestMovie) return { kind: "series", item: latestSeries };
  if (!latestSeries) return { kind: "movie", item: latestMovie };

  const movieStamp = latestMovie.added ?? "";
  const seriesStamp = latestSeries.added ?? "";

  if (movieStamp && seriesStamp) {
    return movieStamp >= seriesStamp
      ? { kind: "movie", item: latestMovie }
      : { kind: "series", item: latestSeries };
  }
  if (movieStamp) return { kind: "movie", item: latestMovie };
  if (seriesStamp) return { kind: "series", item: latestSeries };

  return latestMovie.id >= latestSeries.id
    ? { kind: "movie", item: latestMovie }
    : { kind: "series", item: latestSeries };
};

const collectNetworkError = (
  service: ArrService,
  errors: readonly unknown[],
): ServiceNetworkError | undefined => {
  const networkError = errors.find(isNetworkError);
  if (!networkError) return undefined;
  return {
    service,
    message: getConnectionErrorMessage(service, networkError),
  };
};

const hasActiveDownloads = (
  radarrItems: readonly QueueItem[],
  sonarrItems: readonly QueueItem[],
): boolean =>
  [...radarrItems, ...sonarrItems].some((item) =>
    ACTIVE_STATUSES.has(item.status),
  );

export const useHomeData = ({ isFocused }: UseHomeDataOptions) => {
  const queryClient = useQueryClient();
  const { radarr, sonarr } = useArrClients();
  const isAppActive = useAppIsActive();
  useSyncExternalStore(
    subscribeQueuePollPolicy,
    getQueuePollPolicyVersion,
    getQueuePollPolicyVersion,
  );

  const queuePollInterval = (): number | false => {
    if (!isFocused || !isAppActive) return false;
    const radarrItems =
      queryClient.getQueryData<QueueItem[]>(queryKeys.queue.radarr) ?? [];
    const sonarrItems =
      queryClient.getQueryData<QueueItem[]>(queryKeys.queue.sonarr) ?? [];
    const shouldPoll =
      isQueueBurstActive() || hasActiveDownloads(radarrItems, sonarrItems);
    return resolveQueuePollInterval(shouldPoll, isAppActive);
  };

  const moviesQuery = useQuery({
    queryKey: queryKeys.movies.all,
    queryFn: () => {
      if (!radarr) throw new Error("Radarr is not configured.");
      return radarr.getMovies();
    },
    enabled: Boolean(radarr),
  });

  const seriesQuery = useQuery({
    queryKey: queryKeys.series.all,
    queryFn: () => {
      if (!sonarr) throw new Error("Sonarr is not configured.");
      return sonarr.getSeries();
    },
    enabled: Boolean(sonarr),
  });

  const radarrQueueQuery = useQuery({
    queryKey: queryKeys.queue.radarr,
    queryFn: () => {
      if (!radarr) throw new Error("Radarr is not configured.");
      return radarr.getQueue();
    },
    enabled: Boolean(radarr),
    refetchInterval: queuePollInterval,
    refetchIntervalInBackground: false,
  });

  const sonarrQueueQuery = useQuery({
    queryKey: queryKeys.queue.sonarr,
    queryFn: () => {
      if (!sonarr) throw new Error("Sonarr is not configured.");
      return sonarr.getQueue();
    },
    enabled: Boolean(sonarr),
    refetchInterval: queuePollInterval,
    refetchIntervalInBackground: false,
  });

  const radarrHealthQuery = useQuery({
    queryKey: queryKeys.health.radarr,
    queryFn: () => {
      if (!radarr) throw new Error("Radarr is not configured.");
      return radarr.getHealth();
    },
    enabled: Boolean(radarr),
  });

  const sonarrHealthQuery = useQuery({
    queryKey: queryKeys.health.sonarr,
    queryFn: () => {
      if (!sonarr) throw new Error("Sonarr is not configured.");
      return sonarr.getHealth();
    },
    enabled: Boolean(sonarr),
  });

  const queueItems = useMemo(
    () => [...(radarrQueueQuery.data ?? []), ...(sonarrQueueQuery.data ?? [])],
    [radarrQueueQuery.data, sonarrQueueQuery.data],
  );

  useEffect(() => {
    noteQueueSnapshotForBurst(queueItems);
  }, [queueItems]);

  const downloadingItems = useMemo(
    () => queueItems.filter((item) => ACTIVE_STATUSES.has(item.status)),
    [queueItems],
  );

  const recentMovies = useMemo(() => {
    if (!moviesQuery.data) return [];
    return sortByRecent(moviesQuery.data).slice(0, RECENT_LIMIT);
  }, [moviesQuery.data]);

  const recentSeries = useMemo(() => {
    if (!seriesQuery.data) return [];
    return sortByRecent(seriesQuery.data).slice(0, RECENT_LIMIT);
  }, [seriesQuery.data]);

  const hero = useMemo(
    () => pickHero(downloadingItems, recentMovies, recentSeries),
    [downloadingItems, recentMovies, recentSeries],
  );

  const health = useMemo(
    (): { radarr?: ServiceHealth; sonarr?: ServiceHealth } => ({
      radarr:
        radarrHealthQuery.data ??
        (radarr && radarrHealthQuery.isError
          ? {
              service: "radarr" as const,
              online: false,
              version: undefined,
              message: getConnectionErrorMessage(
                "radarr",
                radarrHealthQuery.error,
              ),
            }
          : undefined),
      sonarr:
        sonarrHealthQuery.data ??
        (sonarr && sonarrHealthQuery.isError
          ? {
              service: "sonarr" as const,
              online: false,
              version: undefined,
              message: getConnectionErrorMessage(
                "sonarr",
                sonarrHealthQuery.error,
              ),
            }
          : undefined),
    }),
    [
      radarr,
      radarrHealthQuery.data,
      radarrHealthQuery.error,
      radarrHealthQuery.isError,
      sonarr,
      sonarrHealthQuery.data,
      sonarrHealthQuery.error,
      sonarrHealthQuery.isError,
    ],
  );

  const networkErrors = useMemo((): readonly ServiceNetworkError[] => {
    const errors: ServiceNetworkError[] = [];

    if (radarr) {
      const radarrError = collectNetworkError("radarr", [
        moviesQuery.error,
        radarrQueueQuery.error,
        radarrHealthQuery.error,
      ]);
      if (radarrError) errors.push(radarrError);
    }

    if (sonarr) {
      const sonarrError = collectNetworkError("sonarr", [
        seriesQuery.error,
        sonarrQueueQuery.error,
        sonarrHealthQuery.error,
      ]);
      if (sonarrError) errors.push(sonarrError);
    }

    return errors;
  }, [
    moviesQuery.error,
    radarr,
    radarrHealthQuery.error,
    radarrQueueQuery.error,
    seriesQuery.error,
    sonarr,
    sonarrHealthQuery.error,
    sonarrQueueQuery.error,
  ]);

  const isLoading =
    !(
      downloadingItems.length > 0 ||
      recentMovies.length > 0 ||
      recentSeries.length > 0 ||
      Boolean(hero)
    ) &&
    ((Boolean(radarr) &&
      (moviesQuery.isLoading ||
        radarrQueueQuery.isLoading ||
        radarrHealthQuery.isLoading)) ||
      (Boolean(sonarr) &&
        (seriesQuery.isLoading ||
          sonarrQueueQuery.isLoading ||
          sonarrHealthQuery.isLoading)));

  return {
    hero,
    downloadingItems,
    recentMovies,
    recentSeries,
    movies: moviesQuery.data ?? [],
    series: seriesQuery.data ?? [],
    health,
    networkErrors,
    isLoading,
    refetchService: (service: ArrService) => {
      if (service === "radarr") {
        void moviesQuery.refetch();
        void radarrQueueQuery.refetch();
        void radarrHealthQuery.refetch();
        return;
      }
      void seriesQuery.refetch();
      void sonarrQueueQuery.refetch();
      void sonarrHealthQuery.refetch();
    },
  };
};
