import {
  APK_NAME_PREFIX,
  APK_NAME_SUFFIX,
  GITHUB_RELEASES_LATEST_URL,
} from "./constants";
import type { FetchLatestReleaseResult, LatestRelease } from "./types";

type GitHubAsset = {
  readonly name?: unknown;
  readonly browser_download_url?: unknown;
};

type GitHubReleasePayload = {
  readonly tag_name?: unknown;
  readonly assets?: unknown;
};

const SEMVER_TAG_RE = /^(?:[A-Za-z0-9._-]+-)?v?(\d+\.\d+\.\d+)$/;

const parseVersionFromTag = (tag: string): string | null => {
  const match = SEMVER_TAG_RE.exec(tag.trim());
  if (!match) return null;
  return match[1] ?? null;
};

const findApkAssetUrl = (
  assets: readonly GitHubAsset[],
  version: string,
): string | null => {
  const expectedName = `${APK_NAME_PREFIX}${version}${APK_NAME_SUFFIX}`;
  for (const asset of assets) {
    if (asset.name === expectedName && typeof asset.browser_download_url === "string") {
      return asset.browser_download_url;
    }
  }
  return null;
};

const parseRelease = (payload: GitHubReleasePayload): LatestRelease | null => {
  if (typeof payload.tag_name !== "string") return null;
  const tag = payload.tag_name;
  const version = parseVersionFromTag(tag);
  if (!version) return null;
  if (!Array.isArray(payload.assets)) return null;
  const apkUrl = findApkAssetUrl(payload.assets as readonly GitHubAsset[], version);
  if (!apkUrl) return null;
  return { version, tag, apkUrl };
};

export const fetchLatestRelease = async (deps?: {
  readonly fetchFn?: typeof fetch;
}): Promise<FetchLatestReleaseResult> => {
  const fetchFn = deps?.fetchFn ?? fetch;
  try {
    const response = await fetchFn(GITHUB_RELEASES_LATEST_URL, {
      headers: {
        Accept: "application/vnd.github+json",
      },
    });
    if (!response.ok) return { ok: false };
    const payload = (await response.json()) as GitHubReleasePayload;
    const release = parseRelease(payload);
    if (!release) return { ok: false };
    return { ok: true, release };
  } catch {
    return { ok: false };
  }
};
