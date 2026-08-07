/**
 * Side map of optimisticKey → pending/failed sync badge state.
 * UI reads this; list rows themselves stay typed as Movie/Series.
 */

export type PendingSyncState = "pending" | "failed";

const pendingByKey = new Map<string, PendingSyncState>();

export const setPendingSyncState = (
  optimisticKey: string,
  state: PendingSyncState,
): void => {
  pendingByKey.set(optimisticKey, state);
};

export const getPendingSyncState = (
  optimisticKey: string,
): PendingSyncState | undefined => pendingByKey.get(optimisticKey);

export const clearPendingSyncState = (optimisticKey: string): void => {
  pendingByKey.delete(optimisticKey);
};

/** Test helper — clears all pending-sync entries. */
export const resetPendingSyncIndex = (): void => {
  pendingByKey.clear();
};
