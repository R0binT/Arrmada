# Library status on add search — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On movie and series add-search results, show in-library / already-downloaded status from the Arr lookup payload, and disable Add when the title is already tracked.

**Architecture:** Enrich `MovieCandidate` / `SeriesCandidate` in existing Radarr/Sonarr lookup mappers (`id > 0` ⇒ in library; `hasFile` / episode statistics for files). Derive badge + progress via a small pure helper. Wire badges and disabled Add on both add screens. No second library fetch.

**Tech Stack:** TypeScript, Expo Router / React Native, Jest, existing `@/arr-client` mappers, `@/i18n`.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-27-library-status-on-add-search-design.md`
- Data only from lookup payload (approach 1) — do not fetch full library to cross-match.
- Selecting an in-library title remains allowed; Add must be disabled with hint; no `addMovie` / `addSeries` call.
- Movie badge priority: `hasFile` ⇒ already downloaded; else if `inLibrary` ⇒ in library.
- Series: in-library badge, or already-downloaded when `episodeCount > 0` and `episodeFileCount >= episodeCount`; show `have/total` when not both zero.
- FR + EN strings for new keys; `MessageKey` is derived from `fr.ts`.
- Do not navigate to detail from add search; no filter to hide in-library results; no re-grab for in-library titles.
- Avoid “MVP” wording in commits/UI.

## File map

| File | Role |
| --- | --- |
| `src/arr-client/types.ts` | Extend candidate types |
| `src/arr-client/mappers/movie.ts` | Map `inLibrary` / `hasFile` on movie candidates |
| `src/arr-client/mappers/series.ts` | Map `inLibrary` / episode counts on series candidates |
| `src/arr-client/__tests__/mappers.test.ts` | Mapper expectations |
| `src/features/library/lookup-library-status.ts` | Pure badge/progress derivation |
| `src/features/library/__tests__/lookup-library-status.test.ts` | Helper unit tests |
| `src/i18n/locales/fr.ts` / `en.ts` | New add.* strings |
| `app/(tabs)/movies/add.tsx` | Movie row badges + disabled Add |
| `app/(tabs)/series/add.tsx` | Series row badges + progress + disabled Add |

---

### Task 1: Enrich movie candidate mapping

**Files:**
- Modify: `src/arr-client/types.ts` (`MovieCandidate`)
- Modify: `src/arr-client/mappers/movie.ts` (`mapMovieCandidate`)
- Modify: `src/arr-client/__tests__/mappers.test.ts`

**Interfaces:**
- Consumes: Radarr `/api/v3/movie/lookup` raw objects
- Produces:

```ts
export type MovieCandidate = {
  readonly tmdbId: number;
  readonly title: string;
  readonly year: number;
  readonly posterUrl: string | undefined;
  readonly inLibrary: boolean;
  readonly hasFile: boolean;
};
```

- [ ] **Step 1: Write the failing tests**

In `src/arr-client/__tests__/mappers.test.ts`, update the existing `maps movie candidate without raw payload` expectation to include `inLibrary: false` and `hasFile: false`, then add:

```ts
  it("maps movie candidate in library with file from lookup id and hasFile", () => {
    const actual = mapMovieCandidate(
      {
        id: 42,
        tmdbId: 99,
        title: "Night Harbor",
        year: 2024,
        hasFile: true,
        images: [],
      },
      "http://192.168.1.10:7878",
    );
    expect(actual).toEqual({
      tmdbId: 99,
      title: "Night Harbor",
      year: 2024,
      posterUrl: undefined,
      inLibrary: true,
      hasFile: true,
    });
  });

  it("maps movie candidate id 0 as not in library", () => {
    const actual = mapMovieCandidate(
      {
        id: 0,
        tmdbId: 7,
        title: "New Title",
        year: 2025,
        hasFile: false,
        images: [],
      },
      "http://192.168.1.10:7878",
    );
    expect(actual?.inLibrary).toBe(false);
    expect(actual?.hasFile).toBe(false);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/arr-client/__tests__/mappers.test.ts -t "movie candidate"`

Expected: FAIL — expectation mismatch / missing fields on mapped object.

- [ ] **Step 3: Implement types + mapper**

In `types.ts`, add `inLibrary` and `hasFile` to `MovieCandidate`.

In `mapMovieCandidate`, after validating `tmdbId`:

```ts
  const id = typeof obj.id === "number" ? obj.id : 0;
  return {
    tmdbId: obj.tmdbId,
    title: String(obj.title ?? ""),
    year: Number(obj.year ?? 0),
    posterUrl: getPosterUrl(obj.images, baseUrl),
    inLibrary: id > 0,
    hasFile: Boolean(obj.hasFile),
  };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/arr-client/__tests__/mappers.test.ts -t "movie candidate"`

Expected: PASS

- [ ] **Step 5: Commit**

```powershell
git add src/arr-client/types.ts src/arr-client/mappers/movie.ts src/arr-client/__tests__/mappers.test.ts
git commit -m "feat(arr): map movie lookup library status"
```

---

### Task 2: Enrich series candidate mapping

**Files:**
- Modify: `src/arr-client/types.ts` (`SeriesCandidate`)
- Modify: `src/arr-client/mappers/series.ts` (`mapSeriesCandidate`)
- Modify: `src/arr-client/__tests__/mappers.test.ts`

**Interfaces:**
- Consumes: Sonarr `/api/v3/series/lookup` raw objects (reuse statistics pattern from `mapSonarrSeries`)
- Produces:

```ts
export type SeriesCandidate = {
  readonly tvdbId: number;
  readonly title: string;
  readonly year: number;
  readonly posterUrl: string | undefined;
  readonly inLibrary: boolean;
  readonly episodeFileCount: number;
  readonly episodeCount: number;
};
```

- [ ] **Step 1: Write the failing tests**

Add to `mappers.test.ts` (import `mapSeriesCandidate` if not already):

```ts
  it("maps series candidate in library with episode statistics", () => {
    const actual = mapSeriesCandidate(
      {
        id: 9,
        tvdbId: 321,
        title: "Harbor Show",
        year: 2022,
        images: [],
        statistics: { episodeFileCount: 12, episodeCount: 24 },
      },
      "http://192.168.1.10:8989",
    );
    expect(actual).toEqual({
      tvdbId: 321,
      title: "Harbor Show",
      year: 2022,
      posterUrl: undefined,
      inLibrary: true,
      episodeFileCount: 12,
      episodeCount: 24,
    });
  });

  it("maps series candidate without id as not in library with zero counts", () => {
    const actual = mapSeriesCandidate(
      {
        tvdbId: 1,
        title: "Fresh Show",
        year: 2026,
        images: [],
      },
      "http://192.168.1.10:8989",
    );
    expect(actual).toEqual({
      tvdbId: 1,
      title: "Fresh Show",
      year: 2026,
      posterUrl: undefined,
      inLibrary: false,
      episodeFileCount: 0,
      episodeCount: 0,
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/arr-client/__tests__/mappers.test.ts -t "series candidate"`

Expected: FAIL — missing fields / import / expectation mismatch.

- [ ] **Step 3: Implement types + mapper**

Extend `SeriesCandidate` in `types.ts`.

In `mapSeriesCandidate`:

```ts
  const statistics = asRecord(obj.statistics);
  const id = typeof obj.id === "number" ? obj.id : 0;
  return {
    tvdbId: obj.tvdbId,
    title: String(obj.title ?? ""),
    year: Number(obj.year ?? 0),
    posterUrl: getPosterUrl(obj.images, baseUrl),
    inLibrary: id > 0,
    episodeFileCount: Number(
      statistics?.episodeFileCount ?? obj.episodeFileCount ?? 0,
    ),
    episodeCount: Number(statistics?.episodeCount ?? obj.episodeCount ?? 0),
  };
```

(`asRecord` already exists in this file.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/arr-client/__tests__/mappers.test.ts -t "series candidate"`

Expected: PASS

- [ ] **Step 5: Commit**

```powershell
git add src/arr-client/types.ts src/arr-client/mappers/series.ts src/arr-client/__tests__/mappers.test.ts
git commit -m "feat(arr): map series lookup library status"
```

---

### Task 3: Pure lookup library status helper

**Files:**
- Create: `src/features/library/lookup-library-status.ts`
- Create: `src/features/library/__tests__/lookup-library-status.test.ts`

**Interfaces:**
- Consumes: candidate library fields from Tasks 1–2
- Produces:

```ts
export type LookupLibraryBadge = "none" | "inLibrary" | "alreadyDownloaded";

export type LookupLibraryStatus = {
  readonly badge: LookupLibraryBadge;
  readonly episodeProgress:
    | { readonly have: number; readonly total: number }
    | undefined;
};

export const getMovieLookupLibraryStatus = (input: {
  readonly inLibrary: boolean;
  readonly hasFile: boolean;
}): LookupLibraryStatus;

export const getSeriesLookupLibraryStatus = (input: {
  readonly inLibrary: boolean;
  readonly episodeFileCount: number;
  readonly episodeCount: number;
}): LookupLibraryStatus;
```

- [ ] **Step 1: Write the failing tests**

Create `src/features/library/__tests__/lookup-library-status.test.ts`:

```ts
import {
  getMovieLookupLibraryStatus,
  getSeriesLookupLibraryStatus,
} from "@/features/library/lookup-library-status";

describe("lookup-library-status", () => {
  it("movie not in library has no badge", () => {
    expect(
      getMovieLookupLibraryStatus({ inLibrary: false, hasFile: false }),
    ).toEqual({ badge: "none", episodeProgress: undefined });
  });

  it("movie in library without file shows inLibrary", () => {
    expect(
      getMovieLookupLibraryStatus({ inLibrary: true, hasFile: false }),
    ).toEqual({ badge: "inLibrary", episodeProgress: undefined });
  });

  it("movie with file shows alreadyDownloaded", () => {
    expect(
      getMovieLookupLibraryStatus({ inLibrary: true, hasFile: true }),
    ).toEqual({ badge: "alreadyDownloaded", episodeProgress: undefined });
  });

  it("series not in library has no badge or progress", () => {
    expect(
      getSeriesLookupLibraryStatus({
        inLibrary: false,
        episodeFileCount: 0,
        episodeCount: 0,
      }),
    ).toEqual({ badge: "none", episodeProgress: undefined });
  });

  it("series in library with zero counts shows inLibrary without progress", () => {
    expect(
      getSeriesLookupLibraryStatus({
        inLibrary: true,
        episodeFileCount: 0,
        episodeCount: 0,
      }),
    ).toEqual({ badge: "inLibrary", episodeProgress: undefined });
  });

  it("series partial files shows inLibrary and progress", () => {
    expect(
      getSeriesLookupLibraryStatus({
        inLibrary: true,
        episodeFileCount: 12,
        episodeCount: 24,
      }),
    ).toEqual({
      badge: "inLibrary",
      episodeProgress: { have: 12, total: 24 },
    });
  });

  it("series complete files shows alreadyDownloaded and progress", () => {
    expect(
      getSeriesLookupLibraryStatus({
        inLibrary: true,
        episodeFileCount: 24,
        episodeCount: 24,
      }),
    ).toEqual({
      badge: "alreadyDownloaded",
      episodeProgress: { have: 24, total: 24 },
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/features/library/__tests__/lookup-library-status.test.ts`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the helper**

Create `src/features/library/lookup-library-status.ts`:

```ts
export type LookupLibraryBadge = "none" | "inLibrary" | "alreadyDownloaded";

export type LookupLibraryStatus = {
  readonly badge: LookupLibraryBadge;
  readonly episodeProgress:
    | { readonly have: number; readonly total: number }
    | undefined;
};

export const getMovieLookupLibraryStatus = (input: {
  readonly inLibrary: boolean;
  readonly hasFile: boolean;
}): LookupLibraryStatus => {
  if (!input.inLibrary) {
    return { badge: "none", episodeProgress: undefined };
  }
  return {
    badge: input.hasFile ? "alreadyDownloaded" : "inLibrary",
    episodeProgress: undefined,
  };
};

export const getSeriesLookupLibraryStatus = (input: {
  readonly inLibrary: boolean;
  readonly episodeFileCount: number;
  readonly episodeCount: number;
}): LookupLibraryStatus => {
  if (!input.inLibrary) {
    return { badge: "none", episodeProgress: undefined };
  }
  const isComplete =
    input.episodeCount > 0 &&
    input.episodeFileCount >= input.episodeCount;
  const showProgress =
    input.episodeFileCount !== 0 || input.episodeCount !== 0;
  return {
    badge: isComplete ? "alreadyDownloaded" : "inLibrary",
    episodeProgress: showProgress
      ? { have: input.episodeFileCount, total: input.episodeCount }
      : undefined,
  };
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/features/library/__tests__/lookup-library-status.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```powershell
git add src/features/library/lookup-library-status.ts src/features/library/__tests__/lookup-library-status.test.ts
git commit -m "feat(library): derive lookup library badges"
```

---

### Task 4: i18n strings

**Files:**
- Modify: `src/i18n/locales/fr.ts`
- Modify: `src/i18n/locales/en.ts`

**Interfaces:**
- Consumes: `MessageKey` derived from FR keys
- Produces: keys used by Task 5–6

| Key | FR | EN |
| --- | --- | --- |
| `add.inLibrary` | `Dans la bibliothèque` | `In library` |
| `add.alreadyDownloaded` | `Déjà téléchargé` | `Already downloaded` |
| `add.episodeProgress` | `{{have}}/{{total}} épisodes` | `{{have}}/{{total}} episodes` |
| `add.alreadyInLibraryHint` | `Déjà dans la bibliothèque.` | `Already in the library.` |

- [ ] **Step 1: Add FR keys**

Near other `add.*` keys in `src/i18n/locales/fr.ts`:

```ts
  "add.inLibrary": "Dans la bibliothèque",
  "add.alreadyDownloaded": "Déjà téléchargé",
  "add.episodeProgress": "{{have}}/{{total}} épisodes",
  "add.alreadyInLibraryHint": "Déjà dans la bibliothèque.",
```

- [ ] **Step 2: Add matching EN keys**

Same keys in `src/i18n/locales/en.ts` with the EN strings from the table.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`

Expected: PASS (both locale objects must share keys via `MessageKey`).

- [ ] **Step 4: Commit**

```powershell
git add src/i18n/locales/fr.ts src/i18n/locales/en.ts
git commit -m "feat(i18n): add library status strings for add search"
```

---

### Task 5: Movie add screen UI

**Files:**
- Modify: `app/(tabs)/movies/add.tsx`

**Interfaces:**
- Consumes: `MovieCandidate.inLibrary` / `hasFile`, `getMovieLookupLibraryStatus`, i18n keys from Task 4
- Produces: badges on rows; `canAdd` false when `selected.inLibrary`; confirm hint when in library

- [ ] **Step 1: Wire status helper and disable Add**

Import:

```ts
import { getMovieLookupLibraryStatus } from "@/features/library/lookup-library-status";
```

Update `canAdd` to also require `!selected.inLibrary` (keep existing default/pending checks).

In `handleAdd`, early-return if `selected.inLibrary` (belt-and-suspenders).

- [ ] **Step 2: Render badge on result rows**

Inside `renderItem`, compute:

```ts
const status = getMovieLookupLibraryStatus(item);
const badgeLabel =
  status.badge === "alreadyDownloaded"
    ? t("add.alreadyDownloaded")
    : status.badge === "inLibrary"
      ? t("add.inLibrary")
      : undefined;
```

- Include badge in `accessibilityLabel` (e.g. `` `${item.title} (${item.year})${badgeLabel ? `, ${badgeLabel}` : ""}` ``).
- Under the year `Text`, if `badgeLabel`, render a small `Text` with `colors.success` for already downloaded and `colors.secondary` for in library (or accent — prefer success for downloaded, secondary for in-library).
- Style: `fontFamily: fonts.uiMedium`, slightly smaller than title (`fontSize(12)`).

- [ ] **Step 3: Confirm card hint**

When `selected.inLibrary`, replace or supplement `add.defaultsHint` with `t("add.alreadyInLibraryHint")`. Keep Add button but ensure `disabled={!canAdd}` already covers it; button label stays `action.add` / `action.adding`.

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 5: Commit**

```powershell
git add "app/(tabs)/movies/add.tsx"
git commit -m "feat(movies): show library status on add search"
```

---

### Task 6: Series add screen UI

**Files:**
- Modify: `app/(tabs)/series/add.tsx`

**Interfaces:**
- Consumes: `SeriesCandidate` library fields, `getSeriesLookupLibraryStatus`, i18n keys
- Produces: same UX as movies, plus episode progress line

- [ ] **Step 1: Wire status helper and disable Add**

Import `getSeriesLookupLibraryStatus`. Update `canAdd` with `!selected.inLibrary`. Early-return in add handler if `selected.inLibrary`.

- [ ] **Step 2: Render badge + progress on result rows**

```ts
const status = getSeriesLookupLibraryStatus(item);
const badgeLabel =
  status.badge === "alreadyDownloaded"
    ? t("add.alreadyDownloaded")
    : status.badge === "inLibrary"
      ? t("add.inLibrary")
      : undefined;
const progressLabel = status.episodeProgress
  ? t("add.episodeProgress", {
      have: String(status.episodeProgress.have),
      total: String(status.episodeProgress.total),
    })
  : undefined;
```

Check how `t()` interpolates elsewhere in the app (number vs string). Match existing pattern in `fr.ts` usages (e.g. `t("add.movieAdded", { title })`). If numbers work, pass numbers; otherwise `String(...)`.

Show badge and progress under the year; include both in `accessibilityLabel`.

- [ ] **Step 3: Confirm card hint**

Same as movies: `add.alreadyInLibraryHint` when `selected.inLibrary`.

- [ ] **Step 4: Typecheck + targeted tests**

Run:

```powershell
npm run typecheck
npm test -- src/arr-client/__tests__/mappers.test.ts src/features/library/__tests__/lookup-library-status.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```powershell
git add "app/(tabs)/series/add.tsx"
git commit -m "feat(series): show library status on add search"
```

---

### Task 7: Manual acceptance checklist (no code)

**Files:** none

- [ ] **Step 1: Verify against acceptance criteria**

On a device/emulator with Radarr + Sonarr configured:

1. Search a movie **already in library without file** → badge « Dans la bibliothèque »; Add disabled + hint.
2. Search a movie **with file** → badge « Déjà téléchargé »; Add disabled.
3. Search a **new** movie → no badge; Add works as before.
4. Search a series in library with partial files → badge + `n/m épisodes`; Add disabled.
5. Search a complete series → « Déjà téléchargé » + progress; Add disabled.
6. Switch app language to EN and confirm strings.

- [ ] **Step 2: Mark plan tasks complete in the plan file checkboxes** (optional for humans; agents should tick as they go)

---

## Self-review (plan vs spec)

| Spec requirement | Task |
| --- | --- |
| Enrich candidates from lookup `id` / `hasFile` / stats | 1, 2 |
| Badges in-library vs already downloaded | 3, 5, 6 |
| Series `have/total` progress | 3, 6 |
| Select allowed, Add disabled + hint | 5, 6 |
| FR/EN i18n | 4 |
| Mapper + helper tests | 1, 2, 3 |
| Out of scope respected (no filter, no detail nav, no re-grab) | Global Constraints + Tasks 5–6 |

No placeholders. Types consistent across tasks (`inLibrary`, `hasFile`, `episodeFileCount`, `episodeCount`, badge union).
