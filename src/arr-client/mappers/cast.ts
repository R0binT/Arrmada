import type { CastMember } from "../types";

export const MAX_CAST_MEMBERS = 6;

type ImageLike = {
  readonly coverType?: string;
  readonly remoteUrl?: string;
  readonly url?: string;
};

const asRecord = (raw: unknown): Record<string, unknown> | null => {
  if (typeof raw !== "object" || raw === null) return null;
  return raw as Record<string, unknown>;
};

const resolveImageUrl = (
  images: unknown,
  baseUrl: string | undefined,
  preferredCoverType: string,
): string | undefined => {
  if (!Array.isArray(images)) return undefined;

  const preferred = images.find(
    (img): img is ImageLike =>
      typeof img === "object" &&
      img !== null &&
      (img as ImageLike).coverType === preferredCoverType,
  );
  const fallback = images.find(
    (img): img is ImageLike => typeof img === "object" && img !== null,
  );
  const image = preferred ?? fallback;
  if (!image) return undefined;

  if (typeof image.remoteUrl === "string" && image.remoteUrl.length > 0) {
    return image.remoteUrl;
  }
  if (typeof image.url === "string" && image.url.length > 0) {
    if (image.url.startsWith("http") || !baseUrl) return image.url;
    const base = baseUrl.replace(/\/$/, "");
    const path = image.url.startsWith("/") ? image.url : `/${image.url}`;
    return `${base}${path}`;
  }
  return undefined;
};

const pushUniqueMember = (
  members: CastMember[],
  seen: Set<string>,
  name: string,
  photoUrl: string | undefined,
): void => {
  const trimmed = name.trim();
  if (trimmed.length === 0) return;
  const key = trimmed.toLocaleLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  members.push({ name: trimmed, photoUrl });
};

/**
 * Maps Radarr `/api/v3/credit` payloads to at most six cast members.
 */
export const mapRadarrCredits = (
  raw: unknown,
  baseUrl: string,
): readonly CastMember[] => {
  if (!Array.isArray(raw)) return [];

  const castRows = raw
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => item !== null)
    .filter((item) => item.type === "cast")
    .sort((left, right) => Number(left.order ?? 0) - Number(right.order ?? 0));

  const members: CastMember[] = [];
  const seen = new Set<string>();
  for (const row of castRows) {
    if (members.length >= MAX_CAST_MEMBERS) break;
    const name = typeof row.personName === "string" ? row.personName : "";
    pushUniqueMember(
      members,
      seen,
      name,
      resolveImageUrl(row.images, baseUrl, "headshot"),
    );
  }
  return members;
};

/**
 * Maps TVMaze `/shows/{id}/cast` payloads to at most six cast members.
 */
export const mapTvMazeCast = (raw: unknown): readonly CastMember[] => {
  if (!Array.isArray(raw)) return [];

  const members: CastMember[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (members.length >= MAX_CAST_MEMBERS) break;
    const row = asRecord(item);
    const person = asRecord(row?.person);
    if (!person) continue;
    const name = typeof person.name === "string" ? person.name : "";
    const image = asRecord(person.image);
    const photoUrl =
      (typeof image?.medium === "string" && image.medium.length > 0
        ? image.medium
        : undefined) ??
      (typeof image?.original === "string" && image.original.length > 0
        ? image.original
        : undefined);
    pushUniqueMember(members, seen, name, photoUrl);
  }
  return members;
};
