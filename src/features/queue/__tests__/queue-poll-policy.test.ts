import type { QueueItem } from "@/arr-client";
import {
  QUEUE_BURST_MAX_MS,
  QUEUE_BURST_POLL_MS,
  QUEUE_POLL_MS,
  isQueueBurstActive,
  noteQueueSnapshotForBurst,
  resetQueuePollPolicyForTests,
  resolveQueuePollInterval,
  startQueueBurstPoll,
  subscribeQueuePollPolicy,
} from "@/features/queue/queue-poll-policy";

const item = (id: number, service: "radarr" | "sonarr" = "radarr"): QueueItem => ({
  id,
  service,
  title: `Item ${id}`,
  posterUrl: undefined,
  status: "downloading",
  progress: 0,
  size: 0,
  sizeLeft: 0,
  etaSeconds: undefined,
  canPause: false,
  canGrab: false,
  downloadId: undefined,
  movieId: undefined,
  seriesId: undefined,
});

describe("queue-poll-policy", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetQueuePollPolicyForTests();
  });

  afterEach(() => {
    resetQueuePollPolicyForTests();
    jest.useRealTimers();
  });

  it("uses steady 2min interval when polling without burst", () => {
    expect(resolveQueuePollInterval(true, true)).toBe(QUEUE_POLL_MS);
    expect(resolveQueuePollInterval(false, true)).toBe(false);
    expect(resolveQueuePollInterval(true, false)).toBe(false);
  });

  it("switches to 30s during burst until a new queue item appears", () => {
    const listener = jest.fn();
    const unsubscribe = subscribeQueuePollPolicy(listener);

    startQueueBurstPoll([item(1)]);
    expect(listener).toHaveBeenCalled();
    expect(isQueueBurstActive()).toBe(true);
    expect(resolveQueuePollInterval(true, true)).toBe(QUEUE_BURST_POLL_MS);

    noteQueueSnapshotForBurst([item(1)]);
    expect(isQueueBurstActive()).toBe(true);

    noteQueueSnapshotForBurst([item(1), item(2)]);
    expect(isQueueBurstActive()).toBe(false);
    expect(resolveQueuePollInterval(true, true)).toBe(QUEUE_POLL_MS);

    unsubscribe();
  });

  it("ends burst after max duration and notifies subscribers", () => {
    const listener = jest.fn();
    subscribeQueuePollPolicy(listener);
    listener.mockClear();

    startQueueBurstPoll([]);
    expect(isQueueBurstActive()).toBe(true);

    jest.advanceTimersByTime(QUEUE_BURST_MAX_MS);
    expect(isQueueBurstActive()).toBe(false);
    expect(listener).toHaveBeenCalled();
    expect(resolveQueuePollInterval(true, true)).toBe(QUEUE_POLL_MS);
  });
});
