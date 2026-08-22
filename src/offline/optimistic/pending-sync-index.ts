/**
 * Side map of optimisticKey → pending/failed sync badge state.
 * UI reads this; list rows themselves stay typed as Movie/Series.
 */

export type PendingSyncState = "pending" | "failed";

type Listener = () => void;

const pendingByKey = new Map<string, PendingSyncState>();
const listeners = new Set<Listener>();
let version = 0;

const notifyListeners = (): void => {
  version += 1;
  for (const listener of listeners) {
    listener();
  }
};

export const getPendingSyncVersion = (): number => version;

export const subscribePendingSync = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const setPendingSyncState = (
  optimisticKey: string,
  state: PendingSyncState,
): void => {
  pendingByKey.set(optimisticKey, state);
  notifyListeners();
};

export const getPendingSyncState = (
  optimisticKey: string,
): PendingSyncState | undefined => pendingByKey.get(optimisticKey);

export const clearPendingSyncState = (optimisticKey: string): void => {
  pendingByKey.delete(optimisticKey);
  notifyListeners();
};

/** Test helper — clears all pending-sync entries. */
export const resetPendingSyncIndex = (): void => {
  pendingByKey.clear();
  version = 0;
  listeners.clear();
};
