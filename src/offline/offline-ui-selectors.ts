import type { OfflineStatus } from "@/offline/connectivity/types";
import type { PendingSyncState } from "@/offline/optimistic/pending-sync-index";
import type { ArrOutboxItem } from "@/offline/outbox/types";

export type OfflineBannerLine = {
  readonly key:
    | "offline.deviceOffline"
    | "offline.arrUnreachable"
    | "offline.pendingCount";
  readonly count?: number;
};

export type OfflineBannerView =
  | { readonly visible: false }
  | { readonly visible: true; readonly lines: readonly OfflineBannerLine[] };

export type LibrarySyncBadge = {
  readonly state: PendingSyncState;
  readonly outboxId: string | undefined;
};

type MovieKeySource = {
  readonly id: number;
  readonly externalIds: { readonly tmdbId: number | undefined };
};

type SeriesKeySource = {
  readonly id: number;
  readonly externalIds: { readonly tvdbId: number | undefined };
};

/** Counts every outbox row (pending, running, and failed). */
export const countOutboxPending = (
  items: readonly ArrOutboxItem[],
): number => items.length;

export const selectOfflineBanner = (
  status: OfflineStatus,
  pendingCount: number,
): OfflineBannerView => {
  const arrUnreachable =
    status.radarr === "unreachable" || status.sonarr === "unreachable";
  if (status.device === "offline") {
    return {
      visible: true,
      lines: [{ key: "offline.deviceOffline" }],
    };
  }
  if (arrUnreachable) {
    const lines: OfflineBannerLine[] = [{ key: "offline.arrUnreachable" }];
    if (pendingCount > 0) {
      lines.push({ key: "offline.pendingCount", count: pendingCount });
    }
    return { visible: true, lines };
  }
  if (pendingCount > 0) {
    return {
      visible: true,
      lines: [{ key: "offline.pendingCount", count: pendingCount }],
    };
  }
  return { visible: false };
};

export const selectLibrarySyncBadge = (
  items: readonly ArrOutboxItem[],
  optimisticKey: string,
  indexState: PendingSyncState | undefined,
): LibrarySyncBadge | undefined => {
  const match = items.find((item) => item.optimisticKey === optimisticKey);
  if (match !== undefined) {
    return {
      state: match.status === "failed" ? "failed" : "pending",
      outboxId: match.id,
    };
  }
  if (indexState === undefined) {
    return undefined;
  }
  return { state: indexState, outboxId: undefined };
};

export const resolveMovieOptimisticKey = (
  item: MovieKeySource,
): string | undefined => {
  if (item.externalIds.tmdbId !== undefined) {
    return `movie:${item.externalIds.tmdbId}`;
  }
  if (item.id < 0) {
    return `movie:${-item.id}`;
  }
  return undefined;
};

export const resolveSeriesOptimisticKey = (
  item: SeriesKeySource,
): string | undefined => {
  if (item.externalIds.tvdbId !== undefined) {
    return `series:${item.externalIds.tvdbId}`;
  }
  if (item.id < 0) {
    return `series:${-item.id}`;
  }
  return undefined;
};
