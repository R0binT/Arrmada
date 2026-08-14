import {
  OUTBOX_MAX_ATTEMPTS,
  outboxBackoffMs,
} from "../constants";
import { loadOutbox as defaultLoadOutbox, saveOutbox as defaultSaveOutbox } from "./storage";
import { isRetryableArrError } from "./classify-error";
import type { ArrOutboxItem, ArrOutboxOpType } from "./types";

export type OpExecutorContext = {
  readonly queryClient?: unknown;
};

export type OpExecutor = {
  execute(item: ArrOutboxItem, ctx: OpExecutorContext): Promise<void>;
  applyOptimistic?(item: ArrOutboxItem, qc: unknown): void;
  rollbackOptimistic?(item: ArrOutboxItem, qc: unknown): void;
};

export type EnqueueOutboxInput = {
  readonly service: "radarr" | "sonarr";
  readonly type: ArrOutboxOpType;
  readonly payload: unknown;
  readonly optimisticKey?: string;
};

export type OutboxDispatcherDeps = {
  readonly now: () => Date;
  readonly createId: () => string;
  readonly getExecutor: (type: ArrOutboxOpType) => OpExecutor;
  readonly isServiceOnline: (service: "radarr" | "sonarr") => boolean;
  readonly executeOnline: (item: ArrOutboxItem) => Promise<void>;
  readonly getQueryClient?: () => unknown;
  readonly onOptimisticApply?: (item: ArrOutboxItem) => void;
  readonly onOptimisticRollback?: (item: ArrOutboxItem) => void;
  readonly loadOutbox?: () => Promise<readonly ArrOutboxItem[]>;
  readonly saveOutbox?: (items: readonly ArrOutboxItem[]) => Promise<void>;
  readonly maxAttempts?: number;
};

export type OutboxDispatcher = {
  enqueue(input: EnqueueOutboxInput): Promise<ArrOutboxItem>;
  flush(service: "radarr" | "sonarr"): Promise<void>;
  cancel(id: string): Promise<void>;
  retry(id: string): Promise<void>;
  list(): Promise<readonly ArrOutboxItem[]>;
};

/**
 * Creates the Arr mutation outbox dispatcher (enqueue / flush / retry / cancel).
 */
export const createOutboxDispatcher = (
  deps: OutboxDispatcherDeps,
): OutboxDispatcher => {
  const load = deps.loadOutbox ?? defaultLoadOutbox;
  const save = deps.saveOutbox ?? defaultSaveOutbox;
  const maxAttempts = deps.maxAttempts ?? OUTBOX_MAX_ATTEMPTS;
  const resolveQueryClient = (): unknown => deps.getQueryClient?.();

  const list = async (): Promise<readonly ArrOutboxItem[]> => load();

  const enqueue = async (input: EnqueueOutboxInput): Promise<ArrOutboxItem> => {
    const timestamp = deps.now().toISOString();
    const item: ArrOutboxItem = {
      id: deps.createId(),
      service: input.service,
      type: input.type,
      payload: input.payload,
      status: "pending",
      attempts: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      ...(input.optimisticKey !== undefined
        ? { optimisticKey: input.optimisticKey }
        : {}),
    };
    if (deps.isServiceOnline(input.service)) {
      await deps.executeOnline(item);
      return item;
    }
    const items = await load();
    await save([...items, item]);
    deps.onOptimisticApply?.(item);
    const executor = deps.getExecutor(item.type);
    executor.applyOptimistic?.(item, resolveQueryClient());
    return item;
  };

  const flush = async (service: "radarr" | "sonarr"): Promise<void> => {
    if (!deps.isServiceOnline(service)) {
      return;
    }
    for (;;) {
      const items = [...(await load())];
      const index = findNextDueIndex(items, service, deps.now());
      if (index < 0) {
        return;
      }
      const current = items[index];
      if (current === undefined) {
        return;
      }
      const running: ArrOutboxItem = {
        ...current,
        status: "running",
        updatedAt: deps.now().toISOString(),
      };
      items[index] = running;
      await save(items);
      try {
        await deps.getExecutor(running.type).execute(running, {
          queryClient: resolveQueryClient(),
        });
        const afterSuccess = (await load()).filter((item) => item.id !== running.id);
        await save(afterSuccess);
      } catch (error: unknown) {
        const afterFailure = [...(await load())];
        const failureIndex = afterFailure.findIndex((item) => item.id === running.id);
        if (failureIndex < 0) {
          return;
        }
        const attempts = running.attempts + 1;
        const lastError = formatError(error);
        const updatedAt = deps.now().toISOString();
        const shouldFail =
          !isRetryableArrError(error) || attempts >= maxAttempts;
        afterFailure[failureIndex] = {
          ...running,
          attempts,
          lastError,
          updatedAt,
          status: shouldFail ? "failed" : "pending",
        };
        await save(afterFailure);
        if (shouldFail && !isRetryableArrError(error)) {
          // Terminal failure: stop FIFO for this service.
          return;
        }
        if (!shouldFail) {
          // Retryable with remaining attempts: keep FIFO head, stop until backoff.
          return;
        }
        // Cap reached (failed): continue to next pending item.
      }
    }
  };

  const cancel = async (id: string): Promise<void> => {
    const items = await load();
    const target = items.find((item) => item.id === id);
    if (target === undefined) {
      return;
    }
    deps.onOptimisticRollback?.(target);
    const executor = deps.getExecutor(target.type);
    executor.rollbackOptimistic?.(target, resolveQueryClient());
    await save(items.filter((item) => item.id !== id));
  };

  const retry = async (id: string): Promise<void> => {
    const items = [...(await load())];
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) {
      return;
    }
    const target = items[index];
    if (target === undefined || target.status !== "failed") {
      return;
    }
    const { lastError: _clearedError, ...withoutError } = target;
    void _clearedError;
    items[index] = {
      ...withoutError,
      status: "pending",
      attempts: 0,
      updatedAt: deps.now().toISOString(),
    };
    await save(items);
    await flush(target.service);
  };

  return { enqueue, flush, cancel, retry, list };
};

const findNextDueIndex = (
  items: readonly ArrOutboxItem[],
  service: "radarr" | "sonarr",
  now: Date,
): number => {
  let bestIndex = -1;
  let bestCreatedAt = "";
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (item === undefined) {
      continue;
    }
    if (item.service !== service || item.status !== "pending") {
      continue;
    }
    if (!isDue(item, now)) {
      continue;
    }
    if (bestIndex < 0 || item.createdAt < bestCreatedAt) {
      bestIndex = index;
      bestCreatedAt = item.createdAt;
    }
  }
  return bestIndex;
};

const isDue = (item: ArrOutboxItem, now: Date): boolean => {
  if (item.attempts === 0) {
    return true;
  }
  const updatedAtMs = Date.parse(item.updatedAt);
  if (Number.isNaN(updatedAtMs)) {
    return true;
  }
  return now.getTime() - updatedAtMs >= outboxBackoffMs(item.attempts);
};

const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { readonly message: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }
  return String(error);
};
