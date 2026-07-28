import type { CastMember, CrewMember, MediaCredits } from "../types";

export const MAX_CAST_MEMBERS = 6;
export const MAX_CREW_MEMBERS = 6;

const KEY_CREW_JOBS = new Set([
  "director",
  "creator",
  "writers",
  "writer",
  "executive producer",
  "showrunner",
]);

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

const pushUniqueCast = (
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

const pushUniqueCrew = (
  members: CrewMember[],
  seen: Set<string>,
  name: string,
  job: string,
): void => {
  const trimmedName = name.trim();
  const trimmedJob = job.trim();
  if (trimmedName.length === 0 || trimmedJob.length === 0) return;
  const key = `${trimmedJob.toLocaleLowerCase()}::${trimmedName.toLocaleLowerCase()}`;
  if (seen.has(key)) return;
  seen.add(key);
  members.push({ name: trimmedName, job: trimmedJob });
};

const isKeyCrewJob = (job: string): boolean =>
  KEY_CREW_JOBS.has(job.trim().toLocaleLowerCase());

/**
 * Maps Radarr `/api/v3/credit` payloads to cast + key crew.
 */
export const mapRadarrMediaCredits = (
  raw: unknown,
  baseUrl: string,
): MediaCredits => {
  if (!Array.isArray(raw)) return { cast: [], crew: [] };

  const rows = raw
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => item !== null);

  const castRows = rows
    .filter((item) => item.type === "cast")
    .sort((left, right) => Number(left.order ?? 0) - Number(right.order ?? 0));

  const cast: CastMember[] = [];
  const castSeen = new Set<string>();
  for (const row of castRows) {
    if (cast.length >= MAX_CAST_MEMBERS) break;
    const name = typeof row.personName === "string" ? row.personName : "";
    pushUniqueCast(
      cast,
      castSeen,
      name,
      resolveImageUrl(row.images, baseUrl, "headshot"),
    );
  }

  const crew: CrewMember[] = [];
  const crewSeen = new Set<string>();
  for (const row of rows.filter((item) => item.type === "crew")) {
    if (crew.length >= MAX_CREW_MEMBERS) break;
    const job = typeof row.job === "string" ? row.job : "";
    if (!isKeyCrewJob(job)) continue;
    const name = typeof row.personName === "string" ? row.personName : "";
    pushUniqueCrew(crew, crewSeen, name, job);
  }

  return { cast, crew };
};

/** @deprecated Prefer mapRadarrMediaCredits */
export const mapRadarrCredits = (
  raw: unknown,
  baseUrl: string,
): readonly CastMember[] => mapRadarrMediaCredits(raw, baseUrl).cast;

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
    pushUniqueCast(members, seen, name, photoUrl);
  }
  return members;
};

/**
 * Maps TVMaze `/shows/{id}/crew` payloads to key crew.
 */
export const mapTvMazeCrew = (raw: unknown): readonly CrewMember[] => {
  if (!Array.isArray(raw)) return [];
  const members: CrewMember[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (members.length >= MAX_CREW_MEMBERS) break;
    const row = asRecord(item);
    const person = asRecord(row?.person);
    const job = typeof row?.type === "string" ? row.type : "";
    if (!person || !isKeyCrewJob(job)) continue;
    const name = typeof person.name === "string" ? person.name : "";
    pushUniqueCrew(members, seen, name, job);
  }
  return members;
};

export const mapTvMazeMediaCredits = (
  castRaw: unknown,
  crewRaw: unknown = [],
): MediaCredits => ({
  cast: mapTvMazeCast(castRaw),
  crew: mapTvMazeCrew(crewRaw),
});
