import type { ReleaseOffer } from "@/arr-client";
import {
  filterSeasonReleases,
  isSeasonPack,
  sortReleaseOffers,
} from "../filter-season-releases";

const base = (partial: Partial<ReleaseOffer>): ReleaseOffer => ({
  guid: "g",
  indexerId: 1,
  title: "Show.S01",
  indexer: "Idx",
  size: 1_000,
  seeders: 10,
  ageHours: 1,
  rejected: false,
  rejectionReasons: [],
  qualityName: "WEBDL-1080p",
  qualityWeight: 1080,
  languageNames: ["English"],
  episodeId: undefined,
  seasonNumber: 1,
  ...partial,
});

describe("filterSeasonReleases", () => {
  it("keeps only matching seasonNumber", () => {
    const actual = filterSeasonReleases(
      [base({ seasonNumber: 1 }), base({ guid: "2", seasonNumber: 2 })],
      1,
    );
    expect(actual.map((r) => r.guid)).toEqual(["g"]);
  });
});

describe("isSeasonPack / sortReleaseOffers", () => {
  it("sorts packs before episode releases, then quality", () => {
    const pack = base({ guid: "pack", episodeId: undefined, qualityWeight: 720 });
    const ep = base({
      guid: "ep",
      episodeId: 9,
      qualityWeight: 1080,
      title: "Show.S01E01",
    });
    expect(isSeasonPack(pack)).toBe(true);
    expect(isSeasonPack(ep)).toBe(false);
    expect(sortReleaseOffers([ep, pack]).map((r) => r.guid)).toEqual([
      "pack",
      "ep",
    ]);
  });
});
