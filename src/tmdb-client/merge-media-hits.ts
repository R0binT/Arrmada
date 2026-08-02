import type { TmdbMediaHit } from "./types";

export const mergeMediaHits = (
  groups: readonly (readonly TmdbMediaHit[])[],
  cap: number,
): TmdbMediaHit[] => {
  const seen = new Set<number>();
  const out: TmdbMediaHit[] = [];
  for (const group of groups) {
    for (const hit of group) {
      if (seen.has(hit.tmdbId)) continue;
      seen.add(hit.tmdbId);
      out.push(hit);
      if (out.length >= cap) return out;
    }
  }
  return out;
};
