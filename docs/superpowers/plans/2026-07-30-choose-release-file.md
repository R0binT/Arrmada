# Choose Release File Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On movie, episode, and season detail actions, add a release picker sheet plus smarter Download (auto-grab when clear, otherwise open the picker), with an always-visible “Choose a file” CTA.

**Architecture:** Pure helpers for season filtering/sorting and smart-or-pick; a reusable `ReleasePickerSheet` (Modal pattern like `AudioChoiceSheet`); wire CTAs on movie/episode/season screens using existing `grabRelease` + release fetch APIs.

**Tech Stack:** Expo React Native, React Query, Jest, existing Arr clients / i18n / UI `Button`+`Text`+sheets.

**Spec:** `docs/superpowers/specs/2026-07-30-choose-release-file-design.md`

## Global Constraints

- French + English i18n for all new user-facing strings (`MessageKey` must stay in sync).
- Do not call the app an MVP.
- Out of scope: add/preview, MediaQuick, whole-series `SeriesSearch` primary button.
- Rejected releases: visible, muted, not tappable.
- Prefer TDD for pure helpers; commit after each task.
- Work on current branch or `feat/choose-release-file` if splitting PRs from the timeout/search fix.

## File map

| File | Responsibility |
| --- | --- |
| `src/features/releases/filter-season-releases.ts` | Filter + sort season offers (packs first) |
| `src/features/releases/start-smart-or-pick-download.ts` | Map `resolveReleaseDecision` → grab / needPick / empty |
| `src/components/ReleasePickerSheet.tsx` | Modal list UI |
| `src/components/index.ts` | Export sheet |
| `src/lib/query-keys.ts` | `series.episodeReleases` key |
| `src/features/series/use-series.ts` | `useEpisodeReleases` |
| `src/i18n/locales/fr.ts` / `en.ts` | Copy keys |
| `app/(tabs)/movies/[id].tsx` | CTAs + sheet |
| `app/(tabs)/series/[id]/episode/[episodeId].tsx` | CTAs + sheet |
| `app/(tabs)/series/[id].tsx` | Season CTAs + sheet (replace SeasonSearch-only path for season download) |

---

### Task 1: Season release filter + sort (TDD)

**Files:**
- Create: `src/features/releases/filter-season-releases.ts`
- Create: `src/features/releases/__tests__/filter-season-releases.test.ts`

**Interfaces:**
- Produces:
  - `isSeasonPack(offer: ReleaseOffer): boolean` — `seasonNumber` matches and `episodeId` is `undefined`
  - `filterSeasonReleases(offers, seasonNumber): ReleaseOffer[]` — keep offers whose `seasonNumber === seasonNumber` (or missing season but title/pack heuristics not required in v1: **require** `seasonNumber === N`)
  - `sortReleaseOffers(offers): ReleaseOffer[]` — packs first (for season lists), then `qualityWeight` desc, `seeders` desc, `size` desc

- [ ] **Step 1: Write failing tests**

```typescript
import type { ReleaseOffer } from "@/arr-client";
import {
  filterSeasonReleases,
  isSeasonPack,
  sortReleaseOffers,
} from "../filter-season-releases";

const base = (partial: Partial<ReleaseOffer>): ReleaseOffer => ({
  guid: "g",
  indexerId: 1,
  title: "Show.S01",
  indexer: "Idx",
  size: 1_000,
  seeders: 10,
  ageHours: 1,
  rejected: false,
  rejectionReasons: [],
  qualityName: "WEBDL-1080p",
  qualityWeight: 1080,
  languageNames: ["English"],
  episodeId: undefined,
  seasonNumber: 1,
  ...partial,
});

describe("filterSeasonReleases", () => {
  it("keeps only matching seasonNumber", () => {
    const actual = filterSeasonReleases(
      [base({ seasonNumber: 1 }), base({ guid: "2", seasonNumber: 2 })],
      1,
    );
    expect(actual.map((r) => r.guid)).toEqual(["g"]);
  });
});

describe("isSeasonPack / sortReleaseOffers", () => {
  it("sorts packs before episode releases, then quality", () => {
    const pack = base({ guid: "pack", episodeId: undefined, qualityWeight: 720 });
    const ep = base({
      guid: "ep",
      episodeId: 9,
      qualityWeight: 1080,
      title: "Show.S01E01",
    });
    expect(isSeasonPack(pack)).toBe(true);
    expect(isSeasonPack(ep)).toBe(false);
    expect(sortReleaseOffers([ep, pack]).map((r) => r.guid)).toEqual([
      "pack",
      "ep",
    ]);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npx jest src/features/releases/__tests__/filter-season-releases.test.ts --no-coverage`

- [ ] **Step 3: Implement**

```typescript
import type { ReleaseOffer } from "@/arr-client";

export const isSeasonPack = (offer: ReleaseOffer): boolean =>
  offer.episodeId === undefined;

export const filterSeasonReleases = (
  offers: readonly ReleaseOffer[],
  seasonNumber: number,
): ReleaseOffer[] =>
  offers.filter((offer) => offer.seasonNumber === seasonNumber);

export const sortReleaseOffers = (
  offers: readonly ReleaseOffer[],
): ReleaseOffer[] =>
  [...offers].sort((left, right) => {
    const packDelta =
      Number(isSeasonPack(right)) - Number(isSeasonPack(left));
    if (packDelta !== 0) return packDelta;
    const quality = right.qualityWeight - left.qualityWeight;
    if (quality !== 0) return quality;
    const seeders = (right.seeders ?? 0) - (left.seeders ?? 0);
    if (seeders !== 0) return seeders;
    return right.size - left.size;
  });
```

Note: `sortReleaseOffers` always prefers packs first. For movie/episode lists packs are rare (`episodeId` usually set); that is fine.

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/features/releases/filter-season-releases.ts src/features/releases/__tests__/filter-season-releases.test.ts
git commit -m "feat: filter and sort season release offers"
```

---

### Task 2: Smart-or-pick helper (TDD)

**Files:**
- Create: `src/features/releases/start-smart-or-pick-download.ts`
- Create: `src/features/releases/__tests__/start-smart-or-pick-download.test.ts`

**Interfaces:**
- Consumes: `resolveReleaseDecision` from `src/features/releases/resolve-release-decision.ts`
- Produces:

```typescript
export type SmartOrPickResult =
  | { readonly type: "grabbed" }
  | { readonly type: "needPick"; readonly releases: readonly ReleaseOffer[] }
  | { readonly type: "empty" };

export const startSmartOrPickDownload = async (input: {
  readonly releases: readonly ReleaseOffer[];
  readonly grab: (
    release: Pick<ReleaseOffer, "guid" | "indexerId">,
  ) => Promise<unknown>;
}): Promise<SmartOrPickResult>
```

Behaviour:
- Run `resolveReleaseDecision(releases)`
- `grab` → await `input.grab(decision.release)` → `{ type: "grabbed" }`
- `choose` → `{ type: "needPick", releases }` (full list, not only vf/vo)
- `empty` → `{ type: "empty" }`

- [ ] **Step 1: Write failing tests** with minimal `ReleaseOffer` fixtures that force grab vs choose (one MULTI vs VF+VO at same quality weight — mirror existing `resolve-release-decision` tests if present).

- [ ] **Step 2: Run — expect FAIL**

Run: `npx jest src/features/releases/__tests__/start-smart-or-pick-download.test.ts --no-coverage`

- [ ] **Step 3: Implement helper**

```typescript
import type { ReleaseOffer } from "@/arr-client";
import { resolveReleaseDecision } from "@/features/releases/resolve-release-decision";

export type SmartOrPickResult =
  | { readonly type: "grabbed" }
  | { readonly type: "needPick"; readonly releases: readonly ReleaseOffer[] }
  | { readonly type: "empty" };

export const startSmartOrPickDownload = async (input: {
  readonly releases: readonly ReleaseOffer[];
  readonly grab: (
    release: Pick<ReleaseOffer, "guid" | "indexerId">,
  ) => Promise<unknown>;
}): Promise<SmartOrPickResult> => {
  const decision = resolveReleaseDecision(input.releases);
  if (decision.type === "empty") return { type: "empty" };
  if (decision.type === "choose") {
    return { type: "needPick", releases: input.releases };
  }
  await input.grab(decision.release);
  return { type: "grabbed" };
};
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/features/releases/start-smart-or-pick-download.ts src/features/releases/__tests__/start-smart-or-pick-download.test.ts
git commit -m "feat: smart-or-pick download decision helper"
```

---

### Task 3: i18n keys

**Files:**
- Modify: `src/i18n/locales/fr.ts`
- Modify: `src/i18n/locales/en.ts`

- [ ] **Step 1: Add keys** (exact strings):

| Key | FR | EN |
| --- | --- | --- |
| `action.chooseFile` | Choisir un fichier | Choose a file |
| `action.chooseFileA11y` | Choisir un fichier à télécharger | Choose a file to download |
| `release.pickerTitle` | Choisir un fichier | Choose a file |
| `release.noOffers` | Aucun fichier trouvé | No files found |
| `release.rejected` | Rejeté | Rejected |
| `release.seeders` | {{count}} seeders | {{count}} seeders |
| `release.loading` | Recherche des fichiers… | Looking up files… |

Place near existing `action.download` / `detail.noRelease` keys. Ensure `MessageKey` type regenerates or stays inferred from locale objects (follow existing pattern).

- [ ] **Step 2: Commit**

```bash
git add src/i18n/locales/fr.ts src/i18n/locales/en.ts
git commit -m "feat(i18n): strings for release file picker"
```

---

### Task 4: `useEpisodeReleases` + query key

**Files:**
- Modify: `src/lib/query-keys.ts`
- Modify: `src/features/series/use-series.ts`

**Interfaces:**
- Produces: `useEpisodeReleases(episodeId: number, enabled: boolean)` → React Query of `ReleaseOffer[]` via `sonarr.getEpisodeReleases(episodeId)`
- Query key: `queryKeys.series.episodeReleases(episodeId)` → `["series", "episode", episodeId, "releases"]`

- [ ] **Step 1: Add query key**

```typescript
// inside series:
episodeReleases: (episodeId: number) =>
  ["series", "episode", episodeId, "releases"] as const,
```

- [ ] **Step 2: Add hook** (mirror `useMovieReleases` / `useSeriesReleases`):

```typescript
export const useEpisodeReleases = (episodeId: number, enabled: boolean) => {
  const { sonarr } = useArrClients();
  return useQuery({
    queryKey: queryKeys.series.episodeReleases(episodeId),
    queryFn: (): Promise<ReleaseOffer[]> => {
      if (!sonarr) throw new Error("Sonarr is not configured.");
      return sonarr.getEpisodeReleases(episodeId);
    },
    enabled:
      enabled &&
      Boolean(sonarr) &&
      Number.isFinite(episodeId) &&
      episodeId > 0,
  });
};
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/query-keys.ts src/features/series/use-series.ts
git commit -m "feat: useEpisodeReleases query hook"
```

---

### Task 5: `ReleasePickerSheet` component

**Files:**
- Create: `src/components/ReleasePickerSheet.tsx`
- Modify: `src/components/index.ts`

**Interfaces:**
- Consumes: `ReleaseOffer`, `formatBytes` from `@/components/format`, i18n, UiSize, motion presets like `AudioChoiceSheet`
- Produces:

```typescript
export type ReleasePickerSheetProps = {
  readonly visible: boolean;
  readonly loading: boolean;
  readonly errorMessage?: string;
  readonly releases: readonly ReleaseOffer[];
  readonly grabbingGuid?: string;
  readonly onSelect: (release: ReleaseOffer) => void;
  readonly onDismiss: () => void;
  readonly onRetry?: () => void;
};
```

- [ ] **Step 1: Implement sheet**
  - Modal + scrim + animated opacity (copy structure from `src/components/AudioChoiceSheet.tsx`)
  - Title: `t("release.pickerTitle")`
  - Loading: `ActivityIndicator` + `t("release.loading")`
  - Error: short text + optional retry `Button`
  - Empty: `t("release.noOffers")`
  - List: `FlatList` of `sortReleaseOffers(releases)` (import from filter helper — for movie/episode pack-first is harmless)
  - Row content: `title` (2 lines), `qualityName`, `formatBytes(size)`, seeders if defined, `indexer`, `languageNames.join(", ")`
  - If `rejected`: muted tone, `t("release.rejected")` + first rejection reason; **do not** call `onSelect`
  - Else: `Pressable` → `onSelect(release)`; disable while `grabbingGuid` set
  - Dismiss: scrim + optional close control matching AudioChoiceSheet

- [ ] **Step 2: Export from** `src/components/index.ts`

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`  
Expected: no errors from new sheet

- [ ] **Step 4: Commit**

```bash
git add src/components/ReleasePickerSheet.tsx src/components/index.ts
git commit -m "feat: ReleasePickerSheet for manual file choice"
```

---

### Task 6: Wire movie detail

**Files:**
- Modify: `app/(tabs)/movies/[id].tsx`

**Interfaces:**
- Consumes: `startSmartOrPickDownload`, `ReleasePickerSheet`, `useGrabMovieRelease`, `radarr.getMovieReleases` (or fetch via client already used in `handleDownload`)

- [ ] **Step 1: State**
  - `pickerVisible: boolean`
  - `pickerReleases: ReleaseOffer[]`
  - `pickerLoading: boolean`
  - `pickerError?: string`
  - Keep `pendingChoice` / `AudioChoiceSheet` **only if** still needed elsewhere on this screen; after wiring, remove VF/VO sheet if unused.

- [ ] **Step 2: Replace `handleDownload`**

```typescript
const openPicker = (releases: readonly ReleaseOffer[]) => {
  setPickerReleases([...releases]);
  setPickerError(undefined);
  setPickerVisible(true);
};

const handleDownload = async () => {
  if (!radarr) {
    setToast(t("detail.radarrMissing"));
    return;
  }
  setDownloadBusy(true);
  try {
    const releases = await radarr.getMovieReleases(movieId);
    const outcome = await startSmartOrPickDownload({
      releases,
      grab: (release) => grabMutation.mutateAsync(release),
    });
    if (outcome.type === "empty") {
      setToast(t("detail.noRelease"));
      return;
    }
    if (outcome.type === "needPick") {
      openPicker(outcome.releases);
      return;
    }
    setToast(t("detail.downloadStarted"));
  } catch (error) {
    setToast(getErrorMessage(error));
  } finally {
    setDownloadBusy(false);
  }
};

const handleChooseFile = async () => {
  if (!radarr) {
    setToast(t("detail.radarrMissing"));
    return;
  }
  setPickerVisible(true);
  setPickerLoading(true);
  setPickerError(undefined);
  try {
    const releases = await radarr.getMovieReleases(movieId);
    setPickerReleases(releases);
  } catch (error) {
    setPickerError(getErrorMessage(error));
  } finally {
    setPickerLoading(false);
  }
};

const handlePickRelease = async (release: ReleaseOffer) => {
  try {
    await grabMutation.mutateAsync(release);
    setPickerVisible(false);
    setToast(t("detail.downloadStarted"));
  } catch (error) {
    setToast(getErrorMessage(error));
  }
};
```

- [ ] **Step 3: UI under `DetailImmersiveHeader` actions** when `showDownload`:

```tsx
<View style={{ gap: scaledSpace.sm, width: "100%" }}>
  <Button ... onPress={() => void handleDownload()} ...>
    {downloadBusy ? t("action.searching") : t("action.download")}
  </Button>
  <Button
    accessibilityLabel={t("action.chooseFileA11y")}
    disabled={actionsBusy}
    onPress={() => void handleChooseFile()}
    style={styles.fullWidthButton}
    variant="secondary"
  >
    {t("action.chooseFile")}
  </Button>
</View>
```

Use whatever secondary/ghost variant the design system already exposes (`variant="secondary"` or `"ghost"` — match existing screens).

- [ ] **Step 4: Mount `ReleasePickerSheet`** at screen bottom; remove dead `AudioChoiceSheet` if no longer referenced.

- [ ] **Step 5: Manual sanity** — typecheck; optional Jest not required for screen.

- [ ] **Step 6: Commit**

```bash
git add "app/(tabs)/movies/[id].tsx"
git commit -m "feat: movie detail smart download and file picker"
```

---

### Task 7: Wire episode detail

**Files:**
- Modify: `app/(tabs)/series/[id]/episode/[episodeId].tsx`

- [ ] **Step 1:** Same pattern as Task 6 with `sonarr.getEpisodeReleases(episodeId)` / `useGrabSeriesRelease`.
- [ ] **Step 2:** Dual buttons + `ReleasePickerSheet`.
- [ ] **Step 3:** Remove unused `AudioChoiceSheet` on this screen if smart-or-pick replaces VF/VO.
- [ ] **Step 4: Commit**

```bash
git add "app/(tabs)/series/[id]/episode/[episodeId].tsx"
git commit -m "feat: episode detail smart download and file picker"
```

---

### Task 8: Wire season download on series detail

**Files:**
- Modify: `app/(tabs)/series/[id].tsx`

**Behaviour change:** `handleDownloadSeason` currently calls `SeasonSearch`. Replace with release fetch + smart-or-pick / picker (per spec). Keep `handleDownloadSeries` as `SeriesSearch` (out of scope).

- [ ] **Step 1: State for picker** (can share one sheet for season picks: store `pickerSeasonNumber` or just releases already filtered).

- [ ] **Step 2: Implement**

```typescript
const handleDownloadSeason = async (seasonNumber: number) => {
  if (!sonarr) {
    setToast(t("detail.sonarrMissing"));
    return;
  }
  const episodes = episodesNeedingDownload(
    seasonsQuery.data ?? [],
    seasonNumber,
  );
  if (episodes.length === 0) {
    setToast(t("detail.nothingToDownloadSeason"));
    return;
  }
  setDownloadBusy(true); // or season-specific busy map already used
  try {
    const raw = await sonarr.getSeriesReleases(seriesId);
    const releases = sortReleaseOffers(
      filterSeasonReleases(raw, seasonNumber),
    );
    const outcome = await startSmartOrPickDownload({
      releases,
      grab: (release) => grabMutation.mutateAsync(release),
    });
    if (outcome.type === "empty") {
      setToast(t("detail.noRelease"));
      return;
    }
    if (outcome.type === "needPick") {
      setPickerReleases([...outcome.releases]);
      setPickerVisible(true);
      return;
    }
    setToast(t("detail.downloadStarted"));
  } catch (error) {
    setToast(getErrorMessage(error));
  } finally {
    setDownloadBusy(false);
  }
};

const handleChooseSeasonFile = async (seasonNumber: number) => {
  // same fetch + filter, always open picker
};
```

- [ ] **Step 3: Season row UI** — next to compact Download, add compact **Choose file** (or icon) calling `handleChooseSeasonFile`. If space is tight, use a second compact button with `t("action.chooseFile")` truncated / `…` only when busy — prefer full label on two lines if `seasonActions` layout allows (`flexWrap`).

- [ ] **Step 4: Mount shared `ReleasePickerSheet`**.

- [ ] **Step 5: Leave per-episode row download as-is OR optionally later; do not block this task on episode-row picker (episode fiche covers Task 7).

- [ ] **Step 6: Commit**

```bash
git add "app/(tabs)/series/[id].tsx"
git commit -m "feat: season download uses release picker with packs"
```

---

### Task 9: Verification

- [ ] **Step 1: Unit tests**

Run:

```bash
npx jest src/features/releases/__tests__/filter-season-releases.test.ts src/features/releases/__tests__/start-smart-or-pick-download.test.ts --no-coverage
```

Expected: PASS

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`  
Expected: exit 0

- [ ] **Step 3: Manual on emulator**
  - Movie with download available: Download auto or picker; Choose file always lists
  - Episode fiche: same
  - Season with packs: list shows season packs near top; grab works
  - Rejected row not tappable
  - No false Wi‑Fi toast on slow search (timeout message only)

- [ ] **Step 4: Commit any fixups**; open PR when user asks (labels: enhancement, ready-for-review; mention related timeout fix if same branch).

---

## Spec coverage checklist

| Spec item | Task |
| --- | --- |
| Movie / episode / season CTAs | 6, 7, 8 |
| Download auto if clear else picker | 2, 6–8 |
| Always-visible Choose file | 6–8 |
| VF/VO ambiguity → full list | 2 |
| Season filter + packs first | 1, 8 |
| ReleasePickerSheet fields + rejected | 5 |
| Out of scope add/MediaQuick/SeriesSearch | respected |
| Errors via getArrErrorMessage | 6–8 |
| Tests helpers | 1, 2, 9 |

## Self-review notes

- No TBD placeholders.
- `sortReleaseOffers` pack-first used for all lists (harmless for movies).
- Season download no longer uses `SeasonSearch` (intentional per spec).
- `useEpisodeReleases` added for consistency; screens may call client directly like movies today — either is fine; prefer client fetch in handlers to match movie screen unless query caching is desired for picker reopen.
