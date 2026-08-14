import { useSyncExternalStore } from "react";

import {
  countOutboxPending,
  selectLibrarySyncBadge,
  type LibrarySyncBadge,
} from "@/offline/offline-ui-selectors";
import {
  getPendingSyncState,
  getPendingSyncVersion,
  subscribePendingSync,
} from "@/offline/optimistic/pending-sync-index";
import {
  getOutboxSnapshot,
  subscribeOutbox,
} from "@/offline/outbox/storage";
import type { ArrOutboxItem } from "@/offline/outbox/types";

export const useOutboxItems = (): readonly ArrOutboxItem[] =>
  useSyncExternalStore(subscribeOutbox, getOutboxSnapshot, getOutboxSnapshot);

export const useOutboxPendingCount = (): number =>
  countOutboxPending(useOutboxItems());

export const useLibrarySyncBadge = (
  optimisticKey: string | undefined,
): LibrarySyncBadge | undefined => {
  const items = useOutboxItems();
  useSyncExternalStore(
    subscribePendingSync,
    getPendingSyncVersion,
    getPendingSyncVersion,
  );
  if (optimisticKey === undefined) {
    return undefined;
  }
  return selectLibrarySyncBadge(
    items,
    optimisticKey,
    getPendingSyncState(optimisticKey),
  );
};
