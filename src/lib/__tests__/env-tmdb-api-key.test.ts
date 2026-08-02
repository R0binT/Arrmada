import { resolveTmdbApiKey } from "@/lib/env-tmdb-api-key";

describe("resolveTmdbApiKey", () => {
  it("returns undefined when raw is undefined", () => {
    expect(resolveTmdbApiKey(undefined)).toBeUndefined();
  });

  it("returns undefined when raw is empty", () => {
    expect(resolveTmdbApiKey("")).toBeUndefined();
  });

  it("returns undefined when raw is whitespace only", () => {
    expect(resolveTmdbApiKey("   ")).toBeUndefined();
  });

  it("trims and returns a non-empty key", () => {
    expect(resolveTmdbApiKey("  abc123  ")).toBe("abc123");
  });
});
