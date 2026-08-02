import type { TmdbMediaHit } from "../types";
import { mergeMediaHits } from "../merge-media-hits";

const hit = (tmdbId: number, title: string): TmdbMediaHit => ({
  tmdbId,
  title,
  year: 2020,
  posterUrl: undefined,
  overview: "",
});

describe("mergeMediaHits", () => {
  it("keeps first-seen order across groups and respects cap", () => {
    const groupA: readonly TmdbMediaHit[] = [hit(1, "A1")];
    const groupB: readonly TmdbMediaHit[] = [hit(1, "B1"), hit(2, "B2")];
    const groupC: readonly TmdbMediaHit[] = [hit(3, "C3"), hit(2, "C2")];

    const actual = mergeMediaHits([groupA, groupB, groupC], 2);

    expect(actual).toHaveLength(2);
    expect(actual[0]).toEqual(hit(1, "A1"));
    expect(actual[1]).toEqual(hit(2, "B2"));
  });
});
