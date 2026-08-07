import { OUTBOX_MAX_ATTEMPTS } from "../../constants";
import { createOutboxDispatcher } from "../dispatcher";
import type { OpExecutor } from "../dispatcher";
import type { ArrOutboxItem, ArrOutboxOpType } from "../types";

type TestExecutorMap = Partial<Record<ArrOutboxOpType, OpExecutor>>;

type CreateTestDispatcherOptions = {
  readonly isServiceOnline: (service: "radarr" | "sonarr") => boolean;
  readonly executors: TestExecutorMap;
  readonly maxAttempts?: number;
  readonly now?: () => Date;
};

const createTestDispatcher = (options: CreateTestDispatcherOptions) => {
  let items: ArrOutboxItem[] = [];
  let idCounter = 0;
  const now = options.now ?? (() => new Date("2026-08-07T00:00:00.000Z"));
  const getExecutor = (type: ArrOutboxOpType): OpExecutor => {
    const executor = options.executors[type];
    if (executor === undefined) {
      throw new Error(`unregistered op: ${type}`);
    }
    return executor;
  };
  return createOutboxDispatcher({
    now,
    createId: () => {
      idCounter += 1;
      return `op-${idCounter}`;
    },
    getExecutor,
    isServiceOnline: options.isServiceOnline,
    executeOnline: async (item) => {
      await getExecutor(item.type).execute(item, {});
    },
    loadOutbox: async () => items,
    saveOutbox: async (next) => {
      items = [...next];
    },
    maxAttempts: options.maxAttempts ?? OUTBOX_MAX_ATTEMPTS,
  });
};

describe("outbox dispatcher", () => {
  it("runs immediately when service online", async () => {
    const executed: string[] = [];
    const dispatcher = createTestDispatcher({
      isServiceOnline: () => true,
      executors: {
        addMovie: {
          execute: async (item) => {
            executed.push(String((item.payload as { tmdbId: number }).tmdbId));
          },
        },
      },
    });
    await dispatcher.enqueue({
      service: "radarr",
      type: "addMovie",
      payload: { tmdbId: 7, qualityProfileId: 1, rootFolderPath: "/" },
    });
    expect(executed).toEqual(["7"]);
    expect(await dispatcher.list()).toEqual([]);
  });

  it("enqueues when offline and flushes FIFO on online", async () => {
    let online = false;
    const order: number[] = [];
    const dispatcher = createTestDispatcher({
      isServiceOnline: () => online,
      executors: {
        addMovie: {
          execute: async (item) => {
            order.push((item.payload as { tmdbId: number }).tmdbId);
          },
        },
      },
    });
    await dispatcher.enqueue({
      service: "radarr",
      type: "addMovie",
      payload: { tmdbId: 1, qualityProfileId: 1, rootFolderPath: "/" },
    });
    await dispatcher.enqueue({
      service: "radarr",
      type: "addMovie",
      payload: { tmdbId: 2, qualityProfileId: 1, rootFolderPath: "/" },
    });
    expect(
      (await dispatcher.list()).map(
        (i) => (i.payload as { tmdbId: number }).tmdbId,
      ),
    ).toEqual([1, 2]);
    online = true;
    await dispatcher.flush("radarr");
    expect(order).toEqual([1, 2]);
    expect(await dispatcher.list()).toEqual([]);
  });

  it("marks failed after max retryable attempts", async () => {
    let online = false;
    let nowMs = Date.parse("2026-08-07T00:00:00.000Z");
    const dispatcher = createTestDispatcher({
      isServiceOnline: () => online,
      now: () => new Date(nowMs),
      executors: {
        addMovie: {
          execute: async () => {
            throw { status: 503, message: "nope" };
          },
        },
      },
      maxAttempts: 2,
    });
    await dispatcher.enqueue({
      service: "radarr",
      type: "addMovie",
      payload: { tmdbId: 1, qualityProfileId: 1, rootFolderPath: "/" },
    });
    expect((await dispatcher.list())[0]?.status).toBe("pending");
    online = true;
    await dispatcher.flush("radarr");
    expect((await dispatcher.list())[0]?.status).toBe("pending");
    expect((await dispatcher.list())[0]?.attempts).toBe(1);
    nowMs += 60_000;
    await dispatcher.flush("radarr");
    const items = await dispatcher.list();
    expect(items[0]?.status).toBe("failed");
    expect(items[0]?.attempts).toBeGreaterThanOrEqual(2);
  });

  it("rethrows online first-failure without queuing", async () => {
    const dispatcher = createTestDispatcher({
      isServiceOnline: () => true,
      executors: {
        addMovie: {
          execute: async () => {
            throw { status: 503, message: "nope" };
          },
        },
      },
    });
    await expect(
      dispatcher.enqueue({
        service: "radarr",
        type: "addMovie",
        payload: { tmdbId: 1, qualityProfileId: 1, rootFolderPath: "/" },
      }),
    ).rejects.toEqual({ status: 503, message: "nope" });
    expect(await dispatcher.list()).toEqual([]);
  });

  it("retry resets attempts so flush runs immediately", async () => {
    let online = false;
    let nowMs = Date.parse("2026-08-07T00:00:00.000Z");
    let executeCount = 0;
    const dispatcher = createTestDispatcher({
      isServiceOnline: () => online,
      now: () => new Date(nowMs),
      executors: {
        addMovie: {
          execute: async () => {
            executeCount += 1;
            if (executeCount <= 2) {
              throw { status: 503, message: "nope" };
            }
          },
        },
      },
      maxAttempts: 2,
    });
    await dispatcher.enqueue({
      service: "radarr",
      type: "addMovie",
      payload: { tmdbId: 1, qualityProfileId: 1, rootFolderPath: "/" },
    });
    online = true;
    await dispatcher.flush("radarr");
    nowMs += 60_000;
    await dispatcher.flush("radarr");
    const failed = (await dispatcher.list())[0];
    expect(failed?.status).toBe("failed");
    expect(failed?.attempts).toBeGreaterThanOrEqual(2);
    expect(failed?.lastError).toBe("nope");
    // Same clock as failure — without resetting attempts, backoff would block flush.
    await dispatcher.retry(failed!.id);
    expect(executeCount).toBe(3);
    expect(await dispatcher.list()).toEqual([]);
  });
});
