import { scoreNameMatch } from "./score-name-match";

export const pickBestNamedMatch = <T extends { readonly name: string }>(
  query: string,
  items: readonly T[],
): T | undefined => {
  let best: T | undefined;
  let bestScore = 0;
  for (const item of items) {
    const score = scoreNameMatch(query, item.name);
    if (score === 0) continue;
    if (
      score > bestScore ||
      (score === bestScore &&
        best !== undefined &&
        item.name.length < best.name.length) ||
      (score === bestScore && best === undefined)
    ) {
      best = item;
      bestScore = score;
    }
  }
  return best;
};
