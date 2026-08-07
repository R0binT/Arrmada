/**
 * Returns true when an Arr mutation failure should be retried by the outbox.
 * Retryable: network/timeouts, HTTP status >= 500, unknown Errors without status.
 * Terminal: HTTP 4xx when a status is available.
 */
export const isRetryableArrError = (error: unknown): boolean => {
  const status = readStatus(error);
  if (typeof status === "number") {
    if (status >= 500) {
      return true;
    }
    if (status >= 400 && status < 500) {
      return false;
    }
  }
  if (error instanceof TypeError) {
    return true;
  }
  const message = readMessage(error);
  if (message !== undefined && /network|timeout|failed to fetch/i.test(message)) {
    return true;
  }
  if (error instanceof Error) {
    return true;
  }
  return true;
};

const readStatus = (error: unknown): number | undefined => {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }
  if (!("status" in error)) {
    return undefined;
  }
  const status = (error as { readonly status: unknown }).status;
  return typeof status === "number" ? status : undefined;
};

const readMessage = (error: unknown): string | undefined => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error !== "object" || error === null) {
    return undefined;
  }
  if (!("message" in error)) {
    return undefined;
  }
  const message = (error as { readonly message: unknown }).message;
  return typeof message === "string" ? message : undefined;
};
