import type { QueryClient } from "@tanstack/react-query";

/**
 * Narrows an unknown QueryClient-like value from executor context.
 */
export const asQueryClient = (qc: unknown): QueryClient | undefined => {
  if (
    typeof qc === "object" &&
    qc !== null &&
    "setQueryData" in qc &&
    "getQueryData" in qc &&
    "invalidateQueries" in qc
  ) {
    return qc as QueryClient;
  }
  return undefined;
};
