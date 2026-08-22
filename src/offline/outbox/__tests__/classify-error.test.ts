import { ArrHttpError } from "@/arr-client";

import { isRetryableArrError } from "../classify-error";

describe("isRetryableArrError", () => {
  it("treats network errors as retryable", () => {
    expect(isRetryableArrError(new TypeError("Network request failed"))).toBe(
      true,
    );
  });

  it("treats 5xx as retryable and 4xx as terminal", () => {
    expect(isRetryableArrError({ status: 503, message: "down" })).toBe(true);
    expect(isRetryableArrError({ status: 400, message: "bad" })).toBe(false);
    expect(
      isRetryableArrError(new ArrHttpError("server down", 503, "server")),
    ).toBe(true);
    expect(
      isRetryableArrError(new ArrHttpError("bad request", 400, "unknown")),
    ).toBe(false);
  });
});
