import { useEffect, useRef, useState } from "react";

import { useQueue } from "@/features/queue/use-queue";
import { useAppIsActive } from "@/hooks/use-app-is-active";
import { useArrClients } from "@/hooks/use-arr-clients";
import { formatQueueNotificationCopy } from "@/notifications/copy";
import {
  ensureNotificationPermission,
  presentLocalNotification,
} from "@/notifications/present";
import {
  diffQueueNotificationEvents,
  toQueueSnapshot,
  type QueueSnapshotItem,
} from "@/notifications/queue-notification-events";

/**
 * While the app is active (and on return to foreground), poll the queue,
 * diff snapshots, and fire local Notifications. Off-LAN / unreachable
 * degrade quietly — no cloud push.
 */
export const useQueueNotifications = (): void => {
  const { config, radarr, sonarr } = useArrClients();
  const isAppActive = useAppIsActive();
  const configured = Boolean(config && (radarr || sonarr));
  const queue = useQueue({ enabled: configured, poll: configured });
  const [permissionGranted, setPermissionGranted] = useState(false);

  const previousRef = useRef<readonly QueueSnapshotItem[] | undefined>(
    undefined,
  );
  const permissionAskedRef = useRef(false);

  useEffect(() => {
    if (!configured || !isAppActive || permissionAskedRef.current) return;
    permissionAskedRef.current = true;
    void ensureNotificationPermission().then((granted) => {
      setPermissionGranted(granted);
    });
  }, [configured, isAppActive]);

  useEffect(() => {
    if (!configured || !isAppActive) return;
    if (queue.isError && queue.items.length === 0) {
      // Away from LAN / unreachable: keep previous snapshot, do not invent events.
      return;
    }
    if (queue.isLoading) return;

    const next = toQueueSnapshot(queue.items);
    const previous = previousRef.current;
    previousRef.current = next;

    if (previous === undefined || !permissionGranted) {
      return;
    }

    const events = diffQueueNotificationEvents(previous, next);
    for (const event of events) {
      const copy = formatQueueNotificationCopy(event);
      void presentLocalNotification({
        title: copy.title,
        body: copy.body,
        dedupeKey: `${event.kind}:${event.key}`,
      });
    }
  }, [
    configured,
    isAppActive,
    permissionGranted,
    queue.isError,
    queue.isLoading,
    queue.items,
  ]);
};
