import type { ReleaseOffer } from "@/arr-client";
import type { AudioPreference } from "@/features/releases/resolve-release-decision";
import {
    pickReleaseForAudioPreference,
    resolveReleaseDecision,
    type RankedRelease,
    type ReleaseDecision,
} from "@/features/releases/resolve-release-decision";

export type PendingAudioChoice = {
  readonly qualityName: string;
  readonly vf: RankedRelease;
  readonly vo: RankedRelease;
  /** Extra releases to grab after preference is chosen (batch). */
  readonly remaining: readonly ReleaseOffer[][];
};

export type SmartGrabOutcome =
  | { readonly type: "empty" }
  | { readonly type: "grabbed"; readonly count: number }
  | { readonly type: "choose"; readonly pending: PendingAudioChoice };

type GrabFn = (
  release: Pick<ReleaseOffer, "guid" | "indexerId">,
) => Promise<unknown>;

/**
 * Resolve + grab one release list (movie or single episode).
 */
export const smartGrabReleases = async (
  releases: readonly ReleaseOffer[],
  grab: GrabFn,
  preference?: AudioPreference,
): Promise<SmartGrabOutcome> => {
  if (preference) {
    const picked = pickReleaseForAudioPreference(releases, preference);
    if (!picked) return { type: "empty" };
    await grab(picked);
    return { type: "grabbed", count: 1 };
  }

  const decision = resolveReleaseDecision(releases);
  return handleDecision(decision, grab, []);
};

/**
 * Batch grab for several episode release lists. Asks once if VF/VO needed.
 */
export const smartGrabReleaseBatches = async (
  batches: readonly (readonly ReleaseOffer[])[],
  grab: GrabFn,
  preference?: AudioPreference,
): Promise<SmartGrabOutcome> => {
  let grabbed = 0;
  const remaining: ReleaseOffer[][] = [];
  let pendingChoice:
    | {
        readonly qualityName: string;
        readonly vf: RankedRelease;
        readonly vo: RankedRelease;
      }
    | undefined;

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index] ?? [];
    if (preference) {
      const picked = pickReleaseForAudioPreference(batch, preference);
      if (picked) {
        await grab(picked);
        grabbed += 1;
      }
      continue;
    }

    if (pendingChoice) {
      remaining.push([...batch]);
      continue;
    }

    const decision = resolveReleaseDecision(batch);
    if (decision.type === "empty") continue;
    if (decision.type === "grab") {
      await grab(decision.release);
      grabbed += 1;
      continue;
    }

    pendingChoice = {
      qualityName: decision.qualityName,
      vf: decision.vf,
      vo: decision.vo,
    };
    // Current batch included in choice; remaining after this index.
    for (let next = index + 1; next < batches.length; next += 1) {
      remaining.push([...(batches[next] ?? [])]);
    }
    break;
  }

  if (pendingChoice) {
    return {
      type: "choose",
      pending: { ...pendingChoice, remaining },
    };
  }
  if (grabbed === 0) return { type: "empty" };
  return { type: "grabbed", count: grabbed };
};

export const finishPendingAudioChoice = async (
  pending: PendingAudioChoice,
  preference: AudioPreference,
  grab: GrabFn,
): Promise<number> => {
  const first = preference === "vf" ? pending.vf : pending.vo;
  await grab(first);
  let count = 1;
  for (const batch of pending.remaining) {
    const picked = pickReleaseForAudioPreference(batch, preference);
    if (!picked) continue;
    await grab(picked);
    count += 1;
  }
  return count;
};

const handleDecision = async (
  decision: ReleaseDecision,
  grab: GrabFn,
  remaining: readonly ReleaseOffer[][],
): Promise<SmartGrabOutcome> => {
  if (decision.type === "empty") return { type: "empty" };
  if (decision.type === "grab") {
    await grab(decision.release);
    return { type: "grabbed", count: 1 };
  }
  return {
    type: "choose",
    pending: {
      qualityName: decision.qualityName,
      vf: decision.vf,
      vo: decision.vo,
      remaining: remaining.map((batch) => [...batch]),
    },
  };
};
