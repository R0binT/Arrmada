import type { ReleaseOffer } from "../types";

const asRecord = (raw: unknown): Record<string, unknown> | null => {
  if (typeof raw !== "object" || raw === null) return null;
  return raw as Record<string, unknown>;
};

const mapRejectionReasons = (raw: unknown): readonly string[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") return item;
      const obj = asRecord(item);
      if (!obj) return undefined;
      if (typeof obj.reason === "string") return obj.reason;
      if (typeof obj.message === "string") return obj.message;
      return undefined;
    })
    .filter((item): item is string => Boolean(item));
};

const mapLanguageNames = (raw: unknown): readonly string[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") return item;
      const obj = asRecord(item);
      if (!obj) return undefined;
      if (typeof obj.name === "string") return obj.name;
      return undefined;
    })
    .filter((item): item is string => Boolean(item));
};

const mapQuality = (
  raw: unknown,
): { readonly name: string; readonly weight: number } => {
  const wrapper = asRecord(raw);
  const quality = asRecord(wrapper?.quality) ?? wrapper;
  const name = String(quality?.name ?? "Unknown");
  const resolution = Number(quality?.resolution ?? 0);
  const id = Number(quality?.id ?? 0);
  // Prefer resolution so 1080p variants share a tier; fall back to quality id.
  const weight =
    Number.isFinite(resolution) && resolution > 0
      ? resolution
      : Number.isFinite(id)
        ? id
        : 0;
  return { name, weight };
};

export const mapReleaseOffer = (raw: unknown): ReleaseOffer | null => {
  const obj = asRecord(raw);
  if (!obj || typeof obj.guid !== "string" || obj.indexerId === undefined) {
    return null;
  }

  const rejectionReasons = mapRejectionReasons(obj.rejections);
  const rejected =
    Boolean(obj.rejected) ||
    Boolean(obj.temporarilyRejected) ||
    rejectionReasons.length > 0;
  const quality = mapQuality(obj.quality);
  const episodeId =
    typeof obj.episodeId === "number"
      ? obj.episodeId
      : Array.isArray(obj.episodeIds) && typeof obj.episodeIds[0] === "number"
        ? obj.episodeIds[0]
        : undefined;
  const seasonNumber =
    typeof obj.seasonNumber === "number" ? obj.seasonNumber : undefined;
  const seriesId =
    typeof obj.seriesId === "number" && Number.isFinite(obj.seriesId)
      ? obj.seriesId
      : undefined;

  return {
    guid: obj.guid,
    indexerId: Number(obj.indexerId),
    title: String(obj.title ?? ""),
    indexer: String(obj.indexer ?? ""),
    size: Number(obj.size ?? 0),
    seeders: typeof obj.seeders === "number" ? obj.seeders : undefined,
    ageHours:
      typeof obj.ageHours === "number"
        ? obj.ageHours
        : typeof obj.age === "number"
          ? obj.age
          : undefined,
    rejected,
    rejectionReasons,
    qualityName: quality.name,
    qualityWeight: quality.weight,
    languageNames: mapLanguageNames(obj.languages),
    seriesId,
    episodeId,
    seasonNumber,
    isFullSeason: Boolean(obj.fullSeason),
  };
};
