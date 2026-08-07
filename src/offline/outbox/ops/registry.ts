import type { OpExecutor } from "../dispatcher";
import type { ArrOutboxOpType } from "../types";

/**
 * Stub op registry. Returns an executor that throws until real ops are registered.
 */
export const getOpExecutor = (type: ArrOutboxOpType): OpExecutor => ({
  execute: async (): Promise<void> => {
    throw new Error(`unregistered op: ${type}`);
  },
});
