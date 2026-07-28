import type { SemverCompareResult } from "./types";

const SEMVER_RE = /^v?(\d+)\.(\d+)\.(\d+)$/;

const parseParts = (
  value: string,
): readonly [number, number, number] | null => {
  const match = SEMVER_RE.exec(value.trim());
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])] as const;
};

export const compareSemver = (
  left: string,
  right: string,
): SemverCompareResult | null => {
  const leftParts = parseParts(left);
  const rightParts = parseParts(right);
  if (!leftParts || !rightParts) return null;
  for (let i = 0; i < 3; i += 1) {
    const a = leftParts[i]!;
    const b = rightParts[i]!;
    if (a < b) return -1;
    if (a > b) return 1;
  }
  return 0;
};
