import type { ArrService, QueueItem, QueueStatus } from "@/arr-client";

/** The three Notification kinds allowed by ADR-0013 / CONTEXT.md. */
export type QueueNotificationKind = "started" | "dispo" | "failed";

export type QueueSnapshotItem = {
  readonly key: string;
  readonly title: string;
  readonly status: QueueStatus;
  readonly service: ArrService;
};

export type QueueNotificationEvent = {
  readonly kind: QueueNotificationKind;
  readonly key: string;
  readonly title: string;
  readonly service: ArrService;
};

/**
 * Stable identity for dedupe: prefer downloadId, else service + queue id,
 * else service + title (last resort).
 */
export const queueItemKey = (item: {
  readonly id: number;
  readonly service: ArrService;
  readonly title: string;
  readonly downloadId: string | undefined;
}): string => {
  if (item.downloadId !== undefined && item.downloadId.length > 0) {
    return `${item.service}:dl:${item.downloadId}`;
  }
  if (Number.isFinite(item.id) && item.id > 0) {
    return `${item.service}:id:${item.id}`;
  }
  return `${item.service}:title:${item.title}`;
};

export const toQueueSnapshot = (
  items: readonly QueueItem[],
): readonly QueueSnapshotItem[] =>
  items.map((item) => ({
    key: queueItemKey(item),
    title: item.title,
    status: item.status,
    service: item.service,
  }));

const indexByKey = (
  snapshot: readonly QueueSnapshotItem[],
): ReadonlyMap<string, QueueSnapshotItem> => {
  const map = new Map<string, QueueSnapshotItem>();
  for (const item of snapshot) {
    map.set(item.key, item);
  }
  return map;
};

const isActiveDownload = (status: QueueStatus): boolean =>
  status === "downloading" ||
  status === "queued" ||
  status === "paused" ||
  status === "stalled" ||
  status === "unknown";

/**
 * Pure decision: compare two Téléchargement queue snapshots and emit at most
 * one event per key for started / Dispo / failed. Callers should skip the
 * first observation (no previous) themselves so an already-busy queue does
 * not spam “started”. Never emits “sortie bientôt”.
 */
export const diffQueueNotificationEvents = (
  previous: readonly QueueSnapshotItem[],
  next: readonly QueueSnapshotItem[],
): readonly QueueNotificationEvent[] => {
  const prevByKey = indexByKey(previous);
  const nextByKey = indexByKey(next);
  const events: QueueNotificationEvent[] = [];
  const emitted = new Set<string>();

  const pushEvent = (event: QueueNotificationEvent): void => {
    const dedupeKey = `${event.kind}:${event.key}`;
    if (emitted.has(dedupeKey)) return;
    emitted.add(dedupeKey);
    events.push(event);
  };

  for (const [key, nextItem] of nextByKey) {
    const prevItem = prevByKey.get(key);
    if (prevItem === undefined) {
      if (
        isActiveDownload(nextItem.status) ||
        nextItem.status === "completed"
      ) {
        pushEvent({
          kind: "started",
          key,
          title: nextItem.title,
          service: nextItem.service,
        });
      }
      if (nextItem.status === "failed") {
        pushEvent({
          kind: "failed",
          key,
          title: nextItem.title,
          service: nextItem.service,
        });
      }
      continue;
    }

    if (prevItem.status !== "failed" && nextItem.status === "failed") {
      pushEvent({
        kind: "failed",
        key,
        title: nextItem.title,
        service: nextItem.service,
      });
    }
  }

  for (const [key, prevItem] of prevByKey) {
    if (nextByKey.has(key)) continue;
    if (prevItem.status === "failed") continue;
    pushEvent({
      kind: "dispo",
      key,
      title: prevItem.title,
      service: prevItem.service,
    });
  }

  return events;
};
