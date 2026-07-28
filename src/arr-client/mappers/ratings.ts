import type { RatingScore } from "../types";

const asRecord = (raw: unknown): Record<string, unknown> | null => {
  if (typeof raw !== "object" || raw === null) return null;
  return raw as Record<string, unknown>;
};

const PROVIDER_KEYS: readonly {
  readonly key: string;
  readonly source: RatingScore["source"];
}[] = [
  { key: "tmdb", source: "tmdb" },
  { key: "imdb", source: "imdb" },
  { key: "rottenTomatoes", source: "rottenTomatoes" },
  { key: "trakt", source: "trakt" },
];

const mapChild = (
  raw: unknown,
  source: RatingScore["source"],
): RatingScore | undefined => {
  const child = asRecord(raw);
  if (!child) return undefined;
  const value = child.value;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }
  const votes =
    typeof child.votes === "number" && child.votes > 0 ? child.votes : undefined;
  return { source, value, votes };
};

/**
 * Maps Arr `ratings` objects (provider children or flat value/votes).
 */
export const mapRatings = (raw: unknown): readonly RatingScore[] => {
  const obj = asRecord(raw);
  if (!obj) return [];

  const scores: RatingScore[] = [];
  for (const provider of PROVIDER_KEYS) {
    const score = mapChild(obj[provider.key], provider.source);
    if (score) scores.push(score);
  }

  if (scores.length === 0) {
    const flat = mapChild(obj, "value");
    if (flat) scores.push(flat);
  }

  return scores;
};

export const formatRatingLabel = (score: RatingScore): string => {
  const rounded =
    score.source === "rottenTomatoes"
      ? String(Math.round(score.value))
      : score.value >= 10
        ? String(Math.round(score.value))
        : score.value.toFixed(1).replace(/\.0$/, "");
  switch (score.source) {
    case "tmdb":
      return `TMDB ${rounded}`;
    case "imdb":
      return `IMDb ${rounded}`;
    case "rottenTomatoes":
      return `RT ${rounded}%`;
    case "trakt":
      return `Trakt ${rounded}`;
    case "value":
      return rounded;
    default: {
      const _exhaustive: never = score.source;
      return _exhaustive;
    }
  }
};
