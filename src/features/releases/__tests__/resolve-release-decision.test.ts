import type { ReleaseOffer } from "@/arr-client";
import { classifyReleaseAudio } from "../classify-release-audio";
import {
    pickReleaseForAudioPreference,
    resolveReleaseDecision,
} from "../resolve-release-decision";

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

describe("classifyReleaseAudio", () => {
  it("detects multi from title", () => {
    expect(
      classifyReleaseAudio({
        title: "Film.2024.MULTi.1080p",
        languageNames: [],
      }),
    ).toBe("multi");
  });

  it("detects vf from french language", () => {
    expect(
      classifyReleaseAudio({
        title: "Film.2024.1080p",
        languageNames: ["French"],
      }),
    ).toBe("vf");
  });

  it("detects vo from english / vostfr", () => {
    expect(
      classifyReleaseAudio({
        title: "Film.2024.VOSTFR.1080p",
        languageNames: ["English"],
      }),
    ).toBe("vo");
  });
});

describe("resolveReleaseDecision", () => {
  it("returns empty when no eligible releases", () => {
    expect(
      resolveReleaseDecision([
        offer({ guid: "a", title: "x", qualityWeight: 1080, rejected: true }),
      ]),
    ).toEqual({ type: "empty" });
  });

  it("auto-grabs multi at top quality", () => {
    const decision = resolveReleaseDecision([
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
    ]);
    expect(decision).toMatchObject({
      type: "grab",
      release: { guid: "multi" },
    });
  });

  it("asks vf vs vo when both exist without multi", () => {
    const decision = resolveReleaseDecision([
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
    ]);
    expect(decision.type).toBe("choose");
    if (decision.type !== "choose") return;
    expect(decision.vf.guid).toBe("vf");
    expect(decision.vo.guid).toBe("vo");
  });
});

describe("pickReleaseForAudioPreference", () => {
  it("still prefers multi over vf preference", () => {
    const picked = pickReleaseForAudioPreference(
      [
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
      ],
      "vf",
    );
    expect(picked?.guid).toBe("multi");
  });

  it("picks vf when preferred and no multi", () => {
    const picked = pickReleaseForAudioPreference(
      [
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
      ],
      "vf",
    );
    expect(picked?.guid).toBe("vf");
  });
});
