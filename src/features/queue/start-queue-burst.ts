import type { QueryClient } from "@tanstack/react-query";

import type { QueueItem } from "@/arr-client";
import { startQueueBurstPoll } from "@/features/queue/queue-poll-policy";
import { queryKeys } from "@/lib/query-keys";

export const startQueueBurstFromCache = (queryClient: QueryClient): void => {
  const radarr =
    queryClient.getQueryData<QueueItem[]>(queryKeys.queue.radarr) ?? [];
  const sonarr =
    queryClient.getQueryData<QueueItem[]>(queryKeys.queue.sonarr) ?? [];
  startQueueBurstPoll([...radarr, ...sonarr]);
  void queryClient.invalidateQueries({ queryKey: queryKeys.queue.all });
};
