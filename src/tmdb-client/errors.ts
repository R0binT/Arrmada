export type TmdbErrorKind =
  | "unauthorized"
  | "network"
  | "timeout"
  | "http";

export class TmdbHttpError extends Error {
  readonly status: number;
  readonly kind: TmdbErrorKind;

  constructor(message: string, status: number, kind: TmdbErrorKind) {
    super(message);
    this.name = "TmdbHttpError";
    this.status = status;
    this.kind = kind;
  }
}

export const kindFromStatus = (status: number): TmdbErrorKind => {
  if (status === 401 || status === 403) return "unauthorized";
  return "http";
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
