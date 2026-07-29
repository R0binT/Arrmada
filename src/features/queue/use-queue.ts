import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useSyncExternalStore } from "react";

import {
  ArrHttpError,
  type QueueItem,
  type RadarrClient,
  type SonarrClient,
} from "@/arr-client";
import {
  getQueuePollPolicyVersion,
  noteQueueSnapshotForBurst,
  resolveQueuePollInterval,
  subscribeQueuePollPolicy,
} from "@/features/queue/queue-poll-policy";
import { useAppIsActive } from "@/hooks/use-app-is-active";
import { useArrClients } from "@/hooks/use-arr-clients";
import { t } from "@/i18n";
import { queryKeys } from "@/lib/query-keys";

type ArrQueueClient = RadarrClient | SonarrClient;

type UseQueueOptions = {
  readonly enabled: boolean;
  readonly poll: boolean;
};

export const getQueueErrorMessage = (error: unknown): string => {
  if (error instanceof ArrHttpError) {
    if (error.kind === "network") {
      return t("connection.lanGeneric");
    }
    if (error.kind === "unauthorized") {
      return t("connection.unauthorized");
    }
    return error.message || t("error.generic");
  }
  if (error instanceof Error) {
    if (error.message === "Radarr is not configured.") {
      return t("detail.radarrMissing");
    }
    if (error.message === "Sonarr is not configured.") {
      return t("detail.sonarrMissing");
    }
    if (error.message === "Download id is missing.") {
      return t("queue.missingId");
    }
    return error.message;
  }
  return t("error.generic");
};

const getClientForItem = (
  item: QueueItem,
  radarr: RadarrClient | undefined,
  sonarr: SonarrClient | undefined,
): ArrQueueClient => {
  if (item.service === "radarr") {
    if (!radarr) throw new Error("Radarr is not configured.");
    return radarr;
  }
  if (!sonarr) throw new Error("Sonarr is not configured.");
  return sonarr;
};

const invalidateQueue = async (
  queryClient: ReturnType<typeof useQueryClient>,
): Promise<void> => {
  await queryClient.invalidateQueries({ queryKey: queryKeys.queue.all });
};

export const useQueue = ({ enabled, poll }: UseQueueOptions) => {
  const { radarr, sonarr } = useArrClients();
  const isAppActive = useAppIsActive();
  useSyncExternalStore(
    subscribeQueuePollPolicy,
    getQueuePollPolicyVersion,
    getQueuePollPolicyVersion,
  );
  const refetchInterval = resolveQueuePollInterval(poll, isAppActive);

  const radarrQuery = useQuery({
    queryKey: queryKeys.queue.radarr,
    queryFn: () => {
      if (!radarr) throw new Error("Radarr is not configured.");
      return radarr.getQueue();
    },
    enabled: enabled && Boolean(radarr),
    refetchInterval,
    refetchIntervalInBackground: false,
  });

  const sonarrQuery = useQuery({
    queryKey: queryKeys.queue.sonarr,
    queryFn: () => {
      if (!sonarr) throw new Error("Sonarr is not configured.");
      return sonarr.getQueue();
    },
    enabled: enabled && Boolean(sonarr),
    refetchInterval,
    refetchIntervalInBackground: false,
  });

  const items = useMemo(
    () => [...(radarrQuery.data ?? []), ...(sonarrQuery.data ?? [])],
    [radarrQuery.data, sonarrQuery.data],
  );

  useEffect(() => {
    noteQueueSnapshotForBurst(items);
  }, [items]);

  const radarrError = radarrQuery.isError ? radarrQuery.error : undefined;
  const sonarrError = sonarrQuery.isError ? sonarrQuery.error : undefined;
  const hasPartialError =
    Boolean(radarrError || sonarrError) && items.length > 0;

  const configuredServicesFailed =
    (Boolean(radarr) ? radarrQuery.isError : true) &&
    (Boolean(sonarr) ? sonarrQuery.isError : true) &&
    (Boolean(radarr) || Boolean(sonarr));

  const isLoading =
    items.length === 0 &&
    !configuredServicesFailed &&
    ((Boolean(radarr) && radarrQuery.isLoading) ||
      (Boolean(sonarr) && sonarrQuery.isLoading));

  const isError = configuredServicesFailed && items.length === 0;
  const error = radarrError ?? sonarrError;

  return {
    items,
    isLoading,
    isError,
    error,
    radarrError,
    sonarrError,
    hasPartialError,
    refetch: () => {
      if (radarr) void radarrQuery.refetch();
      if (sonarr) void sonarrQuery.refetch();
    },
    refetchRadarr: () => {
      if (radarr) void radarrQuery.refetch();
    },
    refetchSonarr: () => {
      if (sonarr) void sonarrQuery.refetch();
    },
  };
};

export const useQueueMutations = () => {
  const { radarr, sonarr } = useArrClients();
  const queryClient = useQueryClient();

  const onSettled = async (): Promise<void> => {
    await invalidateQueue(queryClient);
  };

  const removeMutation = useMutation({
    mutationFn: async (item: QueueItem) => {
      const client = getClientForItem(item, radarr, sonarr);
      await client.removeQueueItem(item.id, {
        removeFromClient: true,
        blocklist: false,
      });
    },
    onSettled,
  });

  const pauseMutation = useMutation({
    mutationFn: async (item: QueueItem) => {
      if (!item.downloadId) {
        throw new Error("Download id is missing.");
      }
      const client = getClientForItem(item, radarr, sonarr);
      const commandName =
        item.status === "paused"
          ? "DownloadClientResume"
          : "DownloadClientPause";
      await client.command(commandName, { downloadId: item.downloadId });
    },
    onSettled,
  });

  return {
    remove: removeMutation,
    pause: pauseMutation,
  };
};
