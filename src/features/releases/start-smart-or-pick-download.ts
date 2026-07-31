import type { ReleaseOffer } from "@/arr-client";
import { resolveReleaseDecision } from "@/features/releases/resolve-release-decision";

export type SmartOrPickResult =
  | { readonly type: "grabbed" }
  | { readonly type: "needPick"; readonly releases: readonly ReleaseOffer[] }
  | { readonly type: "empty" };

export const startSmartOrPickDownload = async (input: {
  readonly releases: readonly ReleaseOffer[];
  readonly grab: (
    release: Pick<ReleaseOffer, "guid" | "indexerId">,
  ) => Promise<unknown>;
}): Promise<SmartOrPickResult> => {
  const decision = resolveReleaseDecision(input.releases);
  if (decision.type === "empty") return { type: "empty" };
  if (decision.type === "choose") {
    return { type: "needPick", releases: input.releases };
  }
  await input.grab(decision.release);
  return { type: "grabbed" };
};
