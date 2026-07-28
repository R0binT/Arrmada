import { compareSemver } from "../compare-semver";

describe("compareSemver", () => {
  it("returns 0 when equal (with or without v)", () => {
    expect(compareSemver("1.1.2", "1.1.2")).toBe(0);
    expect(compareSemver("v1.1.2", "1.1.2")).toBe(0);
  });

  it("returns -1 when left is older", () => {
    expect(compareSemver("1.1.2", "1.2.0")).toBe(-1);
    expect(compareSemver("1.1.2", "2.0.0")).toBe(-1);
    expect(compareSemver("1.1.2", "1.1.3")).toBe(-1);
  });

  it("returns 1 when left is newer", () => {
    expect(compareSemver("1.2.0", "1.1.9")).toBe(1);
  });

  it("returns null for invalid input", () => {
    expect(compareSemver("1.1", "1.1.0")).toBeNull();
    expect(compareSemver("abc", "1.0.0")).toBeNull();
  });
});
