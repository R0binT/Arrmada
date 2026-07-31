export type ArrErrorKind =
  | "network"
  | "timeout"
  | "unauthorized"
  | "not_found"
  | "server"
  | "unknown";

export class ArrHttpError extends Error {
  readonly status: number;
  readonly kind: ArrErrorKind;

  constructor(message: string, status: number, kind: ArrErrorKind) {
    super(message);
    this.name = "ArrHttpError";
    this.status = status;
    this.kind = kind;
  }
}

export const kindFromStatus = (status: number): ArrErrorKind => {
  if (status === 401 || status === 403) return "unauthorized";
  if (status === 404) return "not_found";
  if (status >= 500) return "server";
  return "unknown";
};

/** True when fetch was aborted by our request timeout. */
export const isAbortError = (error: unknown): boolean => {
  if (error instanceof Error && error.name === "AbortError") return true;
  if (
    typeof DOMException !== "undefined" &&
    error instanceof DOMException &&
    error.name === "AbortError"
  ) {
    return true;
  }
  return false;
};
