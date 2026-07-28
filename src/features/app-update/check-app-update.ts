import { compareSemver } from "./compare-semver";
import { fetchLatestRelease } from "./fetch-latest-release";
import { getLocalAppVersion } from "./get-local-app-version";
import type { CheckAppUpdateResult } from "./types";

export const checkAppUpdate = async (deps?: {
  readonly fetchFn?: typeof fetch;
  readonly getLocalVersion?: () => string | null;
}): Promise<CheckAppUpdateResult> => {
  const getLocalVersion = deps?.getLocalVersion ?? getLocalAppVersion;
  const currentVersion = getLocalVersion();
  if (!currentVersion) {
    return { status: "error", kind: "generic" };
  }
  const fetched = await fetchLatestRelease({ fetchFn: deps?.fetchFn });
  if (!fetched.ok) {
    return { status: "error", kind: "generic" };
  }
  const comparison = compareSemver(currentVersion, fetched.release.version);
  if (comparison === null) {
    return { status: "error", kind: "generic" };
  }
  if (comparison >= 0) {
    return { status: "upToDate", currentVersion };
  }
  return {
    status: "available",
    currentVersion,
    release: fetched.release,
  };
};
