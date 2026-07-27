import type {
  Movie,
  MovieCandidate,
  QualityProfileOption,
  RootFolderOption,
} from "../types";

type ImageLike = {
  readonly coverType?: string;
  readonly remoteUrl?: string;
  readonly url?: string;
};

const asRecord = (raw: unknown): Record<string, unknown> | null => {
  if (typeof raw !== "object" || raw === null) return null;
  return raw as Record<string, unknown>;
};

export const getPosterUrl = (
  images: unknown,
  baseUrl: string,
): string | undefined => {
  if (!Array.isArray(images)) return undefined;

  const poster = images.find(
    (img): img is ImageLike =>
      typeof img === "object" &&
      img !== null &&
      (img as ImageLike).coverType === "poster",
  );
  if (!poster) return undefined;

  if (typeof poster.remoteUrl === "string") return poster.remoteUrl;

  if (typeof poster.url === "string") {
    if (poster.url.startsWith("http")) return poster.url;
    const base = baseUrl.replace(/\/$/, "");
    const path = poster.url.startsWith("/") ? poster.url : `/${poster.url}`;
    return `${base}${path}`;
  }

  return undefined;
};

const mapQualityProfileId = (raw: unknown): number | undefined =>
  typeof raw === "number" ? raw : undefined;

const mapStringArray = (raw: unknown): readonly string[] =>
  Array.isArray(raw)
    ? raw.filter((item): item is string => typeof item === "string")
    : [];

const mapFileQuality = (movieFile: unknown): string | undefined => {
  const file = asRecord(movieFile);
  const quality = asRecord(file?.quality);
  const qualityInner = asRecord(quality?.quality);
  return typeof qualityInner?.name === "string" ? qualityInner.name : undefined;
};

const mapOptionalNumber = (raw: unknown): number | undefined =>
  typeof raw === "number" ? raw : undefined;

const mapOptionalString = (raw: unknown): string | undefined =>
  typeof raw === "string" ? raw : undefined;

export const mapRadarrMovie = (raw: unknown, baseUrl: string): Movie => {
  const obj = asRecord(raw);
  if (!obj) {
    throw new Error("Invalid movie payload");
  }

  const added =
    typeof obj.added === "string"
      ? obj.added
      : typeof obj.dateAdded === "string"
        ? obj.dateAdded
        : undefined;

  return {
    id: Number(obj.id),
    title: String(obj.title ?? ""),
    year: Number(obj.year ?? 0),
    posterUrl: getPosterUrl(obj.images, baseUrl),
    monitored: Boolean(obj.monitored),
    hasFile: Boolean(obj.hasFile),
    statusSummary: String(obj.status ?? ""),
    added,
    overview: String(obj.overview ?? ""),
    qualityProfileId: mapQualityProfileId(obj.qualityProfileId),
    fileQuality: mapFileQuality(obj.movieFile),
    sizeOnDisk: mapOptionalNumber(obj.sizeOnDisk),
    genres: mapStringArray(obj.genres),
    runtimeMinutes: mapOptionalNumber(obj.runtime),
    studio: mapOptionalString(obj.studio),
  };
};

export const mapMovieCandidate = (
  raw: unknown,
  baseUrl: string,
): MovieCandidate | null => {
  const obj = asRecord(raw);
  if (!obj || typeof obj.tmdbId !== "number") return null;

  const id = typeof obj.id === "number" ? obj.id : 0;
  return {
    tmdbId: obj.tmdbId,
    title: String(obj.title ?? ""),
    year: Number(obj.year ?? 0),
    posterUrl: getPosterUrl(obj.images, baseUrl),
    inLibrary: id > 0,
    hasFile: Boolean(obj.hasFile),
  };
};

export const mapQualityProfileOption = (
  raw: unknown,
): QualityProfileOption | null => {
  const obj = asRecord(raw);
  if (!obj || obj.id === undefined) return null;
  return {
    id: Number(obj.id),
    name: String(obj.name ?? "Profile"),
  };
};

export const mapRootFolderOption = (raw: unknown): RootFolderOption | null => {
  const obj = asRecord(raw);
  if (!obj || obj.path === undefined) return null;
  return {
    id: Number(obj.id ?? 0),
    path: String(obj.path),
  };
};
