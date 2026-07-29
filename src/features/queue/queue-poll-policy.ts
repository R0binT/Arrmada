import type { QueueItem } from "@/arr-client";

/** Steady-state queue / library refresh interval (battery-friendly). */
export const QUEUE_POLL_MS = 120_000;

/** Fast poll after triggering a grab/search until a new queue item appears. */
export const QUEUE_BURST_POLL_MS = 30_000;

/** Max duration for burst polling. */
export const QUEUE_BURST_MAX_MS = 180_000;

export const LIBRARY_STALE_TIME_MS = 120_000;

type BurstState = {
  readonly until: number;
  readonly baselineIds: ReadonlySet<string>;
};

let burst: BurstState | undefined;
let burstExpiryTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

const queueItemKey = (item: QueueItem): string =>
  `${item.service}:${item.id}`;

const notify = (): void => {
  listeners.forEach((listener) => listener());
};

const clearBurst = (): void => {
  if (burstExpiryTimer !== undefined) {
    clearTimeout(burstExpiryTimer);
    burstExpiryTimer = undefined;
  }
  if (!burst) return;
  burst = undefined;
  notify();
};

export const subscribeQueuePollPolicy = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getQueuePollPolicyVersion = (): number => {
  if (!burst) return 0;
  return burst.until;
};

export const isQueueBurstActive = (now = Date.now()): boolean => {
  if (!burst) return false;
  return now < burst.until;
};

/**
 * Start 30s polling until a *new* queue row appears (vs baseline), or timeout.
 */
export const startQueueBurstPoll = (
  currentItems: readonly QueueItem[],
  now = Date.now(),
): void => {
  if (burstExpiryTimer !== undefined) {
    clearTimeout(burstExpiryTimer);
  }
  burst = {
    until: now + QUEUE_BURST_MAX_MS,
    baselineIds: new Set(currentItems.map(queueItemKey)),
  };
  burstExpiryTimer = setTimeout(() => {
    clearBurst();
  }, QUEUE_BURST_MAX_MS);
  notify();
};

/**
 * Call when a fresh queue snapshot arrives. Ends burst when a new item shows up.
 */
export const noteQueueSnapshotForBurst = (
  items: readonly QueueItem[],
  now = Date.now(),
): void => {
  if (!burst) return;
  if (now >= burst.until) {
    clearBurst();
    return;
  }
  const foundNew = items.some(
    (item) => !burst!.baselineIds.has(queueItemKey(item)),
  );
  if (!foundNew) return;
  clearBurst();
};

export const resolveQueuePollInterval = (
  poll: boolean,
  isAppActive: boolean,
  now = Date.now(),
): number | false => {
  if (!poll || !isAppActive) return false;
  if (isQueueBurstActive(now)) return QUEUE_BURST_POLL_MS;
  return QUEUE_POLL_MS;
};

/** Test helper */
export const resetQueuePollPolicyForTests = (): void => {
  clearBurst();
};
