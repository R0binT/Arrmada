import { scoreNameMatch } from "../score-name-match";
import { pickBestNamedMatch } from "../pick-best-named-match";

describe("scoreNameMatch", () => {
  it("scores exact, prefix, contains, and none", () => {
    expect(scoreNameMatch("marvel", "Marvel")).toBe(3);
    expect(scoreNameMatch("marvel", "Marvel Studios")).toBe(2);
    expect(scoreNameMatch("marvel", "Studio Marvel France")).toBe(1);
    expect(scoreNameMatch("marvel", "DC Comics")).toBe(0);
  });
});

describe("pickBestNamedMatch", () => {
  it("prefers exact over prefix and shorter ties", () => {
    const actual = pickBestNamedMatch("marvel", [
      { id: 1, name: "Marvel Studios" },
      { id: 2, name: "Marvel" },
      { id: 3, name: "Marvel Entertainment" },
    ]);
    expect(actual?.id).toBe(2);
  });

  it("returns undefined when nothing matches", () => {
    expect(
      pickBestNamedMatch("marvel", [{ id: 1, name: "DC Comics" }]),
    ).toBeUndefined();
  });
});
