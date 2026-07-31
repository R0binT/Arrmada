import type { ReleaseOffer } from "@/arr-client";
import { startSmartOrPickDownload } from "../start-smart-or-pick-download";

const offer = (
  partial: Partial<ReleaseOffer> &
    Pick<ReleaseOffer, "guid" | "title" | "qualityWeight">,
): ReleaseOffer => ({
  indexerId: 1,
  indexer: "test",
  size: 1_000_000_000,
  seeders: 10,
  ageHours: 1,
  rejected: false,
  rejectionReasons: [],
  qualityName: "Bluray-1080p",
  languageNames: [],
  seriesId: undefined,
  episodeId: undefined,
  seasonNumber: undefined,
  isFullSeason: false,
  ...partial,
});

describe("startSmartOrPickDownload", () => {
  it("returns empty when no eligible releases", async () => {
    const grab = jest.fn();
    const actual = await startSmartOrPickDownload({
      releases: [
        offer({
          guid: "a",
          title: "x",
          qualityWeight: 1080,
          rejected: true,
        }),
      ],
      grab,
    });

    expect(actual).toEqual({ type: "empty" });
    expect(grab).not.toHaveBeenCalled();
  });

  it("grabs MULTI at top quality", async () => {
    const grab = jest.fn().mockResolvedValue({});
    const releases = [
      offer({
        guid: "multi",
        title: "Film.MULTi.1080p",
        qualityWeight: 1080,
        languageNames: ["French", "English"],
      }),
      offer({
        guid: "vf",
        title: "Film.VFF.1080p",
        qualityWeight: 1080,
        languageNames: ["French"],
      }),
      offer({
        guid: "low",
        title: "Film.VFF.720p",
        qualityWeight: 720,
        languageNames: ["French"],
      }),
    ];

    const actual = await startSmartOrPickDownload({ releases, grab });

    expect(actual).toEqual({ type: "grabbed" });
    expect(grab).toHaveBeenCalledWith(
      expect.objectContaining({ guid: "multi", indexerId: 1 }),
    );
  });

  it("returns needPick with full list when VF and VO tie at top quality", async () => {
    const grab = jest.fn();
    const releases = [
      offer({
        guid: "vf",
        title: "Film.VFF.1080p",
        qualityWeight: 1080,
        languageNames: ["French"],
      }),
      offer({
        guid: "vo",
        title: "Film.VO.1080p",
        qualityWeight: 1080,
        languageNames: ["English"],
      }),
      offer({
        guid: "low",
        title: "Film.VFF.720p",
        qualityWeight: 720,
        languageNames: ["French"],
      }),
    ];

    const actual = await startSmartOrPickDownload({ releases, grab });

    expect(actual).toEqual({ type: "needPick", releases });
    expect(grab).not.toHaveBeenCalled();
  });
});
