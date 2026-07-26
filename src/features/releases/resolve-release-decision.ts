import type { ReleaseOffer } from "@/arr-client";
import {
    classifyReleaseAudio,
    type ReleaseAudioKind,
} from "@/features/releases/classify-release-audio";
import { t } from "@/i18n";

export type AudioPreference = "vf" | "vo";

export type RankedRelease = ReleaseOffer & {
  readonly audioKind: ReleaseAudioKind;
};

export type ReleaseDecision =
  | { readonly type: "empty" }
  | { readonly type: "grab"; readonly release: RankedRelease }
  | {
      readonly type: "choose";
      readonly qualityName: string;
      readonly vf: RankedRelease;
      readonly vo: RankedRelease;
    };

const rankRelease = (release: ReleaseOffer): RankedRelease => ({
  ...release,
  audioKind: classifyReleaseAudio({
    title: release.title,
    languageNames: release.languageNames,
  }),
});

const byPreference = (left: RankedRelease, right: RankedRelease): number => {
  const seeders = (right.seeders ?? 0) - (left.seeders ?? 0);
  if (seeders !== 0) return seeders;
  return right.size - left.size;
};

const bestOf = (items: readonly RankedRelease[]): RankedRelease | undefined =>
  [...items].sort(byPreference)[0];

const highestQualityWeight = (items: readonly RankedRelease[]): number =>
  items.reduce((max, item) => Math.max(max, item.qualityWeight), 0);

/**
 * Pick best quality, prefer MULTI, else ask VF vs VO when both exist.
 */
export const resolveReleaseDecision = (
  releases: readonly ReleaseOffer[],
): ReleaseDecision => {
  const eligible = releases.filter((item) => !item.rejected).map(rankRelease);
  if (eligible.length === 0) return { type: "empty" };

  const topWeight = highestQualityWeight(eligible);
  const top = eligible.filter((item) => item.qualityWeight === topWeight);
  const multi = bestOf(top.filter((item) => item.audioKind === "multi"));
  if (multi) return { type: "grab", release: multi };

  const vf = bestOf(top.filter((item) => item.audioKind === "vf"));
  const vo = bestOf(top.filter((item) => item.audioKind === "vo"));
  if (vf && vo) {
    return {
      type: "choose",
      qualityName: top[0]?.qualityName ?? t("audio.bestQuality"),
      vf,
      vo,
    };
  }

  const fallback =
    vf ??
    vo ??
    bestOf(top.filter((item) => item.audioKind === "unknown")) ??
    bestOf(top);
  if (!fallback) return { type: "empty" };
  return { type: "grab", release: fallback };
};

/**
 * Apply a remembered VF/VO preference (MULTI still wins).
 */
export const pickReleaseForAudioPreference = (
  releases: readonly ReleaseOffer[],
  preference: AudioPreference,
): RankedRelease | undefined => {
  const eligible = releases.filter((item) => !item.rejected).map(rankRelease);
  if (eligible.length === 0) return undefined;

  const topWeight = highestQualityWeight(eligible);
  const top = eligible.filter((item) => item.qualityWeight === topWeight);
  const multi = bestOf(top.filter((item) => item.audioKind === "multi"));
  if (multi) return multi;

  const preferred = bestOf(top.filter((item) => item.audioKind === preference));
  if (preferred) return preferred;

  const other: AudioPreference = preference === "vf" ? "vo" : "vf";
  return (
    bestOf(top.filter((item) => item.audioKind === other)) ??
    bestOf(top.filter((item) => item.audioKind === "unknown")) ??
    bestOf(top)
  );
};
