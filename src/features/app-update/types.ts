export type SemverCompareResult = -1 | 0 | 1;

export type AppUpdateErrorKind = "download" | "install" | "generic";

export type LatestRelease = {
  readonly version: string;
  readonly tag: string;
  readonly apkUrl: string;
};

export type FetchLatestReleaseResult =
  | { readonly ok: true; readonly release: LatestRelease }
  | { readonly ok: false };

export type CheckAppUpdateResult =
  | { readonly status: "upToDate"; readonly currentVersion: string }
  | {
      readonly status: "available";
      readonly currentVersion: string;
      readonly release: LatestRelease;
    }
  | { readonly status: "error"; readonly kind: "generic" };
