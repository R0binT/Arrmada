# In-app Update (About + APK) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Preferences → About card that shows app metadata and can check `R0binT/Arrmada` GitHub Releases, then download/install a newer APK after confirmation.

**Architecture:** Pure functions under `src/features/app-update/` fetch the latest release, compare semver to the local version, and download+install the APK via `expo-file-system/legacy` + `expo-intent-launcher`. A hook drives Alerts; `AboutCard` renders the UI and wires the action.

**Tech Stack:** Expo 57, React Native, TypeScript, Jest (`jest-expo`), `expo-constants`, `expo-file-system`, `expo-intent-launcher`, GitHub Releases REST API (public, unauthenticated).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-28-in-app-update-design.md`
- Android only (product is Android APK; no iOS/web update branches)
- Release source: public repo `R0binT/Arrmada`
- APK asset name: `Arrmada-{VERSION}.apk`
- Confirm before download
- User-facing errors: only **download**, **install/permission**, or **one generic** message
- Do not call the product “MVP”
- i18n: add keys to `fr.ts` (source of truth) and `en.ts`
- Tests live under `__tests__/**/*.test.ts` (matches `jest.config.js`)
- Prefer one export per new module file (project convention)

## File map

| File | Responsibility |
|------|----------------|
| `src/features/app-update/types.ts` | Shared result / error types |
| `src/features/app-update/constants.ts` | Repo owner/name, API URL, asset prefix |
| `src/features/app-update/compare-semver.ts` | Pure semver compare |
| `src/features/app-update/fetch-latest-release.ts` | GitHub latest release → version + apk URL |
| `src/features/app-update/get-local-app-version.ts` | Read installed app version |
| `src/features/app-update/check-app-update.ts` | Orchestrate fetch + compare |
| `src/features/app-update/download-and-install-apk.ts` | Download APK + open installer |
| `src/features/app-update/use-app-update.ts` | Hook: check → alerts → download/install |
| `src/features/app-update/__tests__/compare-semver.test.ts` | Semver unit tests |
| `src/features/app-update/__tests__/fetch-latest-release.test.ts` | Fetch unit tests (mocked) |
| `src/features/app-update/__tests__/check-app-update.test.ts` | Orchestration unit tests |
| `src/features/settings/AboutCard.tsx` | About UI + check button |
| `app/(tabs)/settings/preferences.tsx` | Mount `AboutCard` |
| `src/i18n/locales/fr.ts` / `en.ts` | About + update strings |
| `app.json` | `REQUEST_INSTALL_PACKAGES` |
| `package.json` | `expo-file-system`, `expo-intent-launcher` |

---

### Task 1: Semver compare (pure)

**Files:**
- Create: `src/features/app-update/compare-semver.ts`
- Create: `src/features/app-update/types.ts`
- Test: `src/features/app-update/__tests__/compare-semver.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `export type SemverCompareResult = -1 | 0 | 1;`
  - `export const compareSemver = (left: string, right: string): SemverCompareResult | null;`
  - Returns `null` if either side is not `MAJOR.MINOR.PATCH` (optional leading `v` stripped)

- [ ] **Step 1: Write the failing test**

```typescript
import { compareSemver } from "../compare-semver";

describe("compareSemver", () => {
  it("returns 0 when equal (with or without v)", () => {
    expect(compareSemver("1.1.2", "1.1.2")).toBe(0);
    expect(compareSemver("v1.1.2", "1.1.2")).toBe(0);
  });

  it("returns -1 when left is older", () => {
    expect(compareSemver("1.1.2", "1.2.0")).toBe(-1);
    expect(compareSemver("1.1.2", "2.0.0")).toBe(-1);
    expect(compareSemver("1.1.2", "1.1.3")).toBe(-1);
  });

  it("returns 1 when left is newer", () => {
    expect(compareSemver("1.2.0", "1.1.9")).toBe(1);
  });

  it("returns null for invalid input", () => {
    expect(compareSemver("1.1", "1.1.0")).toBeNull();
    expect(compareSemver("abc", "1.0.0")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=compare-semver --no-coverage`

Expected: FAIL (module / export missing)

- [ ] **Step 3: Write minimal types + implementation**

`types.ts` (start; more types added in later tasks):

```typescript
export type SemverCompareResult = -1 | 0 | 1;

export type AppUpdateErrorKind = "download" | "install" | "generic";
```

`compare-semver.ts`:

```typescript
import type { SemverCompareResult } from "./types";

const SEMVER_RE = /^v?(\d+)\.(\d+)\.(\d+)$/;

const parseParts = (
  value: string,
): readonly [number, number, number] | null => {
  const match = SEMVER_RE.exec(value.trim());
  if (!match) return null;
  return [
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
  ] as const;
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern=compare-semver --no-coverage`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/app-update/types.ts src/features/app-update/compare-semver.ts src/features/app-update/__tests__/compare-semver.test.ts
git commit -m "feat(app-update): add semver compare helper"
```

---

### Task 2: Fetch latest GitHub release

**Files:**
- Create: `src/features/app-update/constants.ts`
- Create: `src/features/app-update/fetch-latest-release.ts`
- Modify: `src/features/app-update/types.ts`
- Test: `src/features/app-update/__tests__/fetch-latest-release.test.ts`

**Interfaces:**
- Consumes: nothing from Task 1 beyond shared types file
- Produces:
  - `export type LatestRelease = { readonly version: string; readonly tag: string; readonly apkUrl: string };`
  - `export type FetchLatestReleaseResult = { readonly ok: true; readonly release: LatestRelease } | { readonly ok: false };`
  - `export const fetchLatestRelease = (deps?: { fetchFn?: typeof fetch }): Promise<FetchLatestReleaseResult>;`
  - On any failure (HTTP, JSON, missing asset, bad tag): `{ ok: false }` (no detailed kind — UI maps to generic)

- [ ] **Step 1: Write the failing test**

```typescript
import { fetchLatestRelease } from "../fetch-latest-release";

describe("fetchLatestRelease", () => {
  it("returns version and apk url on happy path", async () => {
    const mockFetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        tag_name: "v1.2.0",
        assets: [
          {
            name: "Arrmada-1.2.0.apk",
            browser_download_url:
              "https://github.com/R0binT/Arrmada/releases/download/v1.2.0/Arrmada-1.2.0.apk",
          },
        ],
      }),
    }));

    const actual = await fetchLatestRelease({
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    expect(actual).toEqual({
      ok: true,
      release: {
        version: "1.2.0",
        tag: "v1.2.0",
        apkUrl:
          "https://github.com/R0binT/Arrmada/releases/download/v1.2.0/Arrmada-1.2.0.apk",
      },
    });
  });

  it("returns ok false when HTTP fails", async () => {
    const mockFetch = jest.fn(async () => ({
      ok: false,
      json: async () => ({}),
    }));
    const actual = await fetchLatestRelease({
      fetchFn: mockFetch as unknown as typeof fetch,
    });
    expect(actual).toEqual({ ok: false });
  });

  it("returns ok false when apk asset missing", async () => {
    const mockFetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        tag_name: "v1.2.0",
        assets: [{ name: "notes.txt", browser_download_url: "https://x" }],
      }),
    }));
    const actual = await fetchLatestRelease({
      fetchFn: mockFetch as unknown as typeof fetch,
    });
    expect(actual).toEqual({ ok: false });
  });

  it("returns ok false when tag is not semver", async () => {
    const mockFetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        tag_name: "latest",
        assets: [
          {
            name: "Arrmada-1.0.0.apk",
            browser_download_url: "https://x/Arrmada-1.0.0.apk",
          },
        ],
      }),
    }));
    const actual = await fetchLatestRelease({
      fetchFn: mockFetch as unknown as typeof fetch,
    });
    expect(actual).toEqual({ ok: false });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=fetch-latest-release --no-coverage`

Expected: FAIL

- [ ] **Step 3: Write constants + implementation**

`constants.ts`:

```typescript
export const GITHUB_OWNER = "R0binT";
export const GITHUB_REPO = "Arrmada";
export const GITHUB_RELEASES_LATEST_URL =
  `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
export const APK_NAME_PREFIX = "Arrmada-";
export const APK_NAME_SUFFIX = ".apk";
export const GITHUB_REPO_URL =
  `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`;
export const GITHUB_AUTHOR_URL = `https://github.com/${GITHUB_OWNER}`;
export const LICENSE_URL =
  "https://polyformproject.org/licenses/noncommercial/1.0.0";
```

Extend `types.ts` with `LatestRelease` and `FetchLatestReleaseResult`.

`fetch-latest-release.ts`: parse `tag_name`, strip `v` for `version`, require asset named `Arrmada-{version}.apk`, return `{ ok: false }` on throw/HTTP/parse/asset miss. Use `Accept: application/vnd.github+json` header. Inject `fetchFn` defaulting to global `fetch`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern=fetch-latest-release --no-coverage`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/app-update/constants.ts src/features/app-update/types.ts src/features/app-update/fetch-latest-release.ts src/features/app-update/__tests__/fetch-latest-release.test.ts
git commit -m "feat(app-update): fetch latest GitHub release APK"
```

---

### Task 3: Check orchestration (local vs latest)

**Files:**
- Create: `src/features/app-update/get-local-app-version.ts`
- Create: `src/features/app-update/check-app-update.ts`
- Modify: `src/features/app-update/types.ts`
- Test: `src/features/app-update/__tests__/check-app-update.test.ts`

**Interfaces:**
- Consumes: `compareSemver`, `fetchLatestRelease`, `LatestRelease`
- Produces:
  - `export const getLocalAppVersion = (): string | null;` — `Constants.nativeApplicationVersion` then fallback `Constants.expoConfig?.version`, else `null`
  - `export type CheckAppUpdateResult =`
    - `| { readonly status: "upToDate"; readonly currentVersion: string }`
    - `| { readonly status: "available"; readonly currentVersion: string; readonly release: LatestRelease }`
    - `| { readonly status: "error"; readonly kind: "generic" }`
  - `export const checkAppUpdate = (deps?: { fetchFn?: typeof fetch; getLocalVersion?: () => string | null }): Promise<CheckAppUpdateResult>;`

- [ ] **Step 1: Write the failing test**

```typescript
import { checkAppUpdate } from "../check-app-update";

describe("checkAppUpdate", () => {
  it("returns upToDate when local equals latest", async () => {
    const mockFetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        tag_name: "v1.1.2",
        assets: [
          {
            name: "Arrmada-1.1.2.apk",
            browser_download_url: "https://x/Arrmada-1.1.2.apk",
          },
        ],
      }),
    }));
    const actual = await checkAppUpdate({
      fetchFn: mockFetch as unknown as typeof fetch,
      getLocalVersion: () => "1.1.2",
    });
    expect(actual).toEqual({
      status: "upToDate",
      currentVersion: "1.1.2",
    });
  });

  it("returns available when latest is newer", async () => {
    const mockFetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        tag_name: "v1.2.0",
        assets: [
          {
            name: "Arrmada-1.2.0.apk",
            browser_download_url: "https://x/Arrmada-1.2.0.apk",
          },
        ],
      }),
    }));
    const actual = await checkAppUpdate({
      fetchFn: mockFetch as unknown as typeof fetch,
      getLocalVersion: () => "1.1.2",
    });
    expect(actual.status).toBe("available");
    if (actual.status === "available") {
      expect(actual.release.version).toBe("1.2.0");
      expect(actual.currentVersion).toBe("1.1.2");
    }
  });

  it("returns generic error when local version missing", async () => {
    const actual = await checkAppUpdate({
      getLocalVersion: () => null,
      fetchFn: jest.fn() as unknown as typeof fetch,
    });
    expect(actual).toEqual({ status: "error", kind: "generic" });
  });

  it("returns generic error when fetch fails", async () => {
    const mockFetch = jest.fn(async () => ({
      ok: false,
      json: async () => ({}),
    }));
    const actual = await checkAppUpdate({
      fetchFn: mockFetch as unknown as typeof fetch,
      getLocalVersion: () => "1.1.2",
    });
    expect(actual).toEqual({ status: "error", kind: "generic" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=check-app-update --no-coverage`

Expected: FAIL

- [ ] **Step 3: Implement**

`get-local-app-version.ts`:

```typescript
import Constants from "expo-constants";

export const getLocalAppVersion = (): string | null => {
  const native = Constants.nativeApplicationVersion?.trim();
  if (native) return native;
  const expo = Constants.expoConfig?.version?.trim();
  if (expo) return expo;
  return null;
};
```

`check-app-update.ts`: if local null → generic error; fetch; if not ok → generic; `compareSemver(local, release.version)`; if null → generic; if `>= 0` → upToDate; else available.

- [ ] **Step 4: Run tests**

Run: `npm test -- --testPathPattern=check-app-update --no-coverage`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/app-update/get-local-app-version.ts src/features/app-update/check-app-update.ts src/features/app-update/types.ts src/features/app-update/__tests__/check-app-update.test.ts
git commit -m "feat(app-update): orchestrate local vs GitHub version check"
```

---

### Task 4: Dependencies + download/install APK

**Files:**
- Modify: `package.json` / lockfile via `npx expo install`
- Modify: `app.json` (`expo.android.permissions`)
- Create: `src/features/app-update/download-and-install-apk.ts`
- Modify: `src/features/app-update/types.ts` (install result type)

**Interfaces:**
- Consumes: `LatestRelease.apkUrl` / version for filename
- Produces:
  - `export type DownloadAndInstallResult = { readonly ok: true } | { readonly ok: false; readonly kind: "download" | "install" };`
  - `export const downloadAndInstallApk = (input: { readonly apkUrl: string; readonly version: string }): Promise<DownloadAndInstallResult>;`

- [ ] **Step 1: Install packages**

Run:

```bash
npx expo install expo-file-system expo-intent-launcher
```

Expected: packages added compatible with Expo 57.

- [ ] **Step 2: Add Android permission in `app.json`**

Under `expo.android`, add (merge with existing keys):

```json
"permissions": [
  "REQUEST_INSTALL_PACKAGES"
]
```

- [ ] **Step 3: Implement download + install**

Use legacy FileSystem APIs (stable for content URIs):

```typescript
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";

import type { DownloadAndInstallResult } from "./types";

export const downloadAndInstallApk = async (input: {
  readonly apkUrl: string;
  readonly version: string;
}): Promise<DownloadAndInstallResult> => {
  const fileUri = `${FileSystem.cacheDirectory}Arrmada-${input.version}.apk`;
  try {
    const download = await FileSystem.downloadAsync(input.apkUrl, fileUri);
    if (download.status !== 200) {
      return { ok: false, kind: "download" };
    }
  } catch {
    return { ok: false, kind: "download" };
  }
  try {
    const contentUri = await FileSystem.getContentUriAsync(fileUri);
    await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
      data: contentUri,
      flags: 1,
      type: "application/vnd.android.package-archive",
    });
    return { ok: true };
  } catch {
    return { ok: false, kind: "install" };
  }
};
```

Notes for implementer:
- `flags: 1` is `FLAG_GRANT_READ_URI_PERMISSION`.
- No unit test required for this native bridge (hard to mock meaningfully); covered by manual checklist in Task 7.
- If `expo-file-system/legacy` import path differs on installed version, adjust to the installed package’s documented legacy entry — keep `downloadAsync` + `getContentUriAsync` behavior.

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`

Expected: PASS (or fix types only for this module)

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json app.json src/features/app-update/download-and-install-apk.ts src/features/app-update/types.ts
git commit -m "feat(app-update): download APK and open Android installer"
```

---

### Task 5: i18n strings

**Files:**
- Modify: `src/i18n/locales/fr.ts` (after `settings.uiSizeA11y` block)
- Modify: `src/i18n/locales/en.ts` (same keys)

**Interfaces:**
- Consumes: nothing
- Produces: MessageKeys listed below (fr is source of truth for `MessageKey`)

- [ ] **Step 1: Add French keys**

```typescript
  "settings.about": "À propos",
  "settings.aboutAppName": "Arrmada",
  "settings.aboutVersion": "Version {{version}}",
  "settings.aboutAuthor": "Auteur",
  "settings.aboutAuthorValue": "R0binT",
  "settings.aboutAuthorA11y": "Ouvrir le profil GitHub de R0binT",
  "settings.aboutLicense": "Licence",
  "settings.aboutLicenseValue": "PolyForm Noncommercial 1.0.0",
  "settings.aboutLicenseA11y": "Ouvrir la licence PolyForm Noncommercial",
  "settings.aboutRepo": "Code source",
  "settings.aboutRepoLink": "Voir sur GitHub",
  "settings.aboutRepoA11y": "Ouvrir le dépôt Arrmada sur GitHub",
  "settings.aboutCheckUpdate": "Vérifier les mises à jour",
  "settings.aboutCheckUpdateA11y": "Vérifier les mises à jour de l’application",
  "settings.aboutChecking": "Vérification…",
  "settings.aboutDownloading": "Téléchargement…",
  "settings.updateTitle": "Mise à jour",
  "settings.updateUpToDate": "Vous êtes déjà à jour ({{version}}).",
  "settings.updateAvailable":
    "Version {{latest}} disponible (actuelle : {{current}}). Télécharger et installer ?",
  "settings.updateInstall": "Installer",
  "settings.updateCancel": "Annuler",
  "settings.updateErrorGeneric":
    "Impossible de vérifier ou d’appliquer la mise à jour.",
  "settings.updateErrorDownload": "Échec du téléchargement.",
  "settings.updateErrorInstall":
    "Impossible d’ouvrir l’installeur. Active l’installation d’apps inconnues pour Arrmada.",
```

- [ ] **Step 2: Add English equivalents**

Mirror the same keys in `en.ts` (English copy; keep meaning aligned with the spec).

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`

Expected: PASS (`MessageKey` inferred from fr; en must include every key)

- [ ] **Step 4: Commit**

```bash
git add src/i18n/locales/fr.ts src/i18n/locales/en.ts
git commit -m "feat(i18n): add About and app update strings"
```

---

### Task 6: Hook `useAppUpdate`

**Files:**
- Create: `src/features/app-update/use-app-update.ts`

**Interfaces:**
- Consumes: `checkAppUpdate`, `downloadAndInstallApk`, `useI18n` / `t`, `Alert`
- Produces:
  - `export type UseAppUpdateResult = { readonly isBusy: boolean; readonly checkForUpdate: () => void };`
  - `export const useAppUpdate = (): UseAppUpdateResult;`

- [ ] **Step 1: Implement hook**

Behavior:
1. `isBusy` true while checking or downloading.
2. `checkForUpdate`:
   - call `checkAppUpdate()`
   - `upToDate` → `Alert.alert(t("settings.updateTitle"), t("settings.updateUpToDate", { version }))`
   - `error` → Alert with `settings.updateErrorGeneric`
   - `available` → Alert with Cancel / Install; on Install call `downloadAndInstallApk`; map `kind: "download" | "install"` to the specific error strings; success needs no extra alert (system installer takes over)
3. Guard re-entry if already busy.
4. Use `Alert.alert` pattern like `src/features/library/retirer-action.ts`.

Skeleton:

```typescript
import { useCallback, useState } from "react";
import { Alert } from "react-native";

import { checkAppUpdate } from "./check-app-update";
import { downloadAndInstallApk } from "./download-and-install-apk";
import { useI18n } from "@/i18n";

export const useAppUpdate = () => {
  const { t } = useI18n();
  const [isBusy, setIsBusy] = useState(false);

  const checkForUpdate = useCallback(() => {
    if (isBusy) return;
    void (async () => {
      setIsBusy(true);
      try {
        const result = await checkAppUpdate();
        if (result.status === "upToDate") {
          Alert.alert(
            t("settings.updateTitle"),
            t("settings.updateUpToDate", { version: result.currentVersion }),
          );
          return;
        }
        if (result.status === "error") {
          Alert.alert(
            t("settings.updateTitle"),
            t("settings.updateErrorGeneric"),
          );
          return;
        }
        Alert.alert(
          t("settings.updateTitle"),
          t("settings.updateAvailable", {
            latest: result.release.version,
            current: result.currentVersion,
          }),
          [
            { text: t("settings.updateCancel"), style: "cancel" },
            {
              text: t("settings.updateInstall"),
              onPress: () => {
                void (async () => {
                  setIsBusy(true);
                  try {
                    const install = await downloadAndInstallApk({
                      apkUrl: result.release.apkUrl,
                      version: result.release.version,
                    });
                    if (install.ok) return;
                    Alert.alert(
                      t("settings.updateTitle"),
                      install.kind === "download"
                        ? t("settings.updateErrorDownload")
                        : t("settings.updateErrorInstall"),
                    );
                  } finally {
                    setIsBusy(false);
                  }
                })();
              },
            },
          ],
        );
      } finally {
        setIsBusy(false);
      }
    })();
  }, [isBusy, t]);

  return { isBusy, checkForUpdate };
};
```

Fix busy-state carefully so the confirm dialog does not leave `isBusy` stuck true while waiting for user choice: set busy false after check completes / before showing the available dialog; set busy true again only when Install is pressed. Adjust the skeleton accordingly during implementation.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/features/app-update/use-app-update.ts
git commit -m "feat(app-update): add check-and-install hook with alerts"
```

---

### Task 7: AboutCard + Preferences wiring

**Files:**
- Create: `src/features/settings/AboutCard.tsx`
- Modify: `app/(tabs)/settings/preferences.tsx`

**Interfaces:**
- Consumes: `useAppUpdate`, `getLocalAppVersion`, constants URLs, `Button`, `Surface`, `Text`, `useI18n`, link opening like `ExternalLinksRow` (`Linking` / `expo-web-browser`)
- Produces: `export const AboutCard = (): JSX` mounted in Preferences

- [ ] **Step 1: Implement `AboutCard`**

Layout (match other preference cards — `Surface` raised, `gap` from `useUiSize`):
- Headline: `settings.about`
- App name: `settings.aboutAppName`
- Version line: `settings.aboutVersion` with `getLocalAppVersion() ?? "—"`
- Author row: label + tappable `settings.aboutAuthorValue` → `GITHUB_AUTHOR_URL`
- License row: label + tappable license value → `LICENSE_URL`
- Repo row: tappable `settings.aboutRepoLink` → `GITHUB_REPO_URL`
- Primary `Button` with `loading={isBusy}`, label `settings.aboutCheckUpdate` or `settings.aboutChecking` / `settings.aboutDownloading` when busy; `onPress={checkForUpdate}`

Reuse the open-URL approach from `src/components/ExternalLinksRow.tsx` (Linking then WebBrowser fallback + Alert on total failure). Prefer extracting a tiny local `openUrl` helper inside `AboutCard` rather than a new shared module unless one already exists.

- [ ] **Step 2: Mount in Preferences**

In `app/(tabs)/settings/preferences.tsx`, after the Appearance `Surface`, render `<AboutCard />`.

Optional: update `settings.preferencesHint` FR/EN to mention About (e.g. « Langue, taille, Verrou, À propos ») — do it if copy still fits; otherwise leave hub hint unchanged.

- [ ] **Step 3: Lint + unit tests + typecheck**

Run:

```bash
npm run typecheck
npm run lint
npm test -- --testPathPattern=app-update --no-coverage
```

Expected: all PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/settings/AboutCard.tsx app/(tabs)/settings/preferences.tsx src/i18n/locales/fr.ts src/i18n/locales/en.ts
git commit -m "feat(settings): add About card with in-app update check"
```

- [ ] **Step 5: Manual verification checklist (Android device/emulator with release or debug build that includes native install permission)**

- [ ] Open Settings → Preferences → About shows name, version, author, license, repo links
- [ ] Links open correctly
- [ ] Check while already on latest release → « déjà à jour »
- [ ] With a mocked newer release (or after publishing a higher tag) → confirm dialog → download → system installer
- [ ] Airplane mode → generic error
- [ ] Deny unknown-apps install → install error message

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| About in Preferences with metadata + button | 5, 7 |
| Confirm before download | 6 |
| GitHub `R0binT/Arrmada` + `Arrmada-{VERSION}.apk` | 2, 4 |
| Android only / no iOS-web branch | Global + 4/7 (no Platform guards required) |
| Error: download / install / generic only | 2–4, 6 + i18n Task 5 |
| Semver compare + unit tests | 1, 3 |
| Fetch mocked tests | 2 |
| Dependencies + REQUEST_INSTALL_PACKAGES | 4 |
| Out of scope (OTA, auto-check, notes) | Not implemented |

**Placeholder scan:** none intentional.  
**Type consistency:** `LatestRelease`, `CheckAppUpdateResult`, `DownloadAndInstallResult`, `AppUpdateErrorKind` aligned across tasks.
