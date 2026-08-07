import { shouldPersistQuery } from "../query-persister";

describe("shouldPersistQuery", () => {
  it("persists library and skips lookup/releases", () => {
    expect(shouldPersistQuery({ queryKey: ["movies"] })).toBe(true);
    expect(shouldPersistQuery({ queryKey: ["movies", 1] })).toBe(true);
    expect(shouldPersistQuery({ queryKey: ["movies", "lookup", "matrix"] })).toBe(
      false,
    );
    expect(shouldPersistQuery({ queryKey: ["movies", 1, "releases"] })).toBe(
      false,
    );
    expect(shouldPersistQuery({ queryKey: ["series", "defaults"] })).toBe(true);
  });
});
