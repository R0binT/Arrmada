# Add preview via MediaQuick — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On add-search, open MediaQuick for selected titles, allow Voir la fiche (library detail or light preview), and show library status as pill badges in the result list.

**Architecture:** Enrich lookup candidates with overview/genres/runtime/libraryId. Extend MediaQuick panel for an optional add mode (Ajouter + Voir la fiche). Replace the add-screen confirm card with `MediaQuickSheet`. Add light preview routes that load a candidate by TMDB/TVDB and share the existing add/smart-grab path.

**Tech Stack:** Expo Router, React Native, TanStack Query, existing `@/arr-client` mappers, MediaQuick components, Jest.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-27-add-preview-mediaquick-design.md`
- Reuse `MediaQuickSheet` / `MediaQuickPanel` — do not invent a parallel bottom card.
- Synopsis on light preview only — not inside the sheet.
- After add: stay on add search, dismiss sheet, refetch lookup (existing stay-on-add behaviour).
- Result-list status = pill badge (MediaQuick status-pill / chip language), not plain text.
- If `libraryId` present → open `movies/[id]` or `series/[id]`; else → preview routes.
- No batch multi-select; no external TMDB/TVDB browser links.
- Avoid “MVP” wording in commits/UI.
- FR + EN for new keys; `MessageKey` from `fr.ts`.

## File map

| File | Role |
| --- | --- |
| `src/arr-client/types.ts` | Extend candidates |
| `src/arr-client/mappers/movie.ts` / `series.ts` | Map new fields |
| `src/arr-client/radarr/client.ts` / `sonarr/client.ts` | Lookup-by-id for preview |
| `src/arr-client/__tests__/mappers.test.ts` | Mapper tests |
| `src/components/LookupStatusBadge.tsx` | Pill badge for list rows |
| `src/features/media-quick/types.ts` | Add-mode action types |
| `src/components/MediaQuickPanel.tsx` / `MediaQuickSheet.tsx` | Add-mode UI |
| `src/features/media-quick/build-add-candidate-selection.ts` | Candidate → MediaQuickSelection |
| `src/features/media-quick/__tests__/build-add-candidate-selection.test.ts` | Selection builder tests |
| `src/i18n/locales/fr.ts` / `en.ts` | New strings |
| `app/(tabs)/movies/add.tsx` / `series/add.tsx` | Wire sheet + badges |
| `app/(tabs)/movies/preview.tsx` / `series/preview.tsx` | Light fiches |
| `app/(tabs)/movies/_layout.tsx` / `series/_layout.tsx` | Register preview screens |

---

### Task 1: Enrich lookup candidates

**Files:**
- Modify: `src/arr-client/types.ts`
- Modify: `src/arr-client/mappers/movie.ts` (`mapMovieCandidate`)
- Modify: `src/arr-client/mappers/series.ts` (`mapSeriesCandidate`)
- Modify: `src/arr-client/__tests__/mappers.test.ts`

**Interfaces:**
- Produces:

```ts
export type MovieCandidate = {
  readonly tmdbId: number;
  readonly title: string;
  readonly year: number;
  readonly posterUrl: string | undefined;
  readonly inLibrary: boolean;
  readonly hasFile: boolean;
  readonly overview: string;
  readonly genres: readonly string[];
  readonly runtimeMinutes: number | undefined;
  readonly libraryId: number | undefined;
};

export type SeriesCandidate = {
  readonly tvdbId: number;
  readonly title: string;
  readonly year: number;
  readonly posterUrl: string | undefined;
  readonly inLibrary: boolean;
  readonly episodeFileCount: number;
  readonly episodeCount: number;
  readonly overview: string;
  readonly genres: readonly string[];
  readonly runtimeMinutes: number | undefined;
  readonly libraryId: number | undefined;
};
```

- [ ] **Step 1: Update failing mapper expectations + new cases**

In `mappers.test.ts`, extend every existing `mapMovieCandidate` / `mapSeriesCandidate` expectation with:

```ts
overview: "",
genres: [],
runtimeMinutes: undefined,
libraryId: undefined,
```

(adjust when the fixture provides values). Add:

```ts
  it("maps movie candidate overview genres runtime and libraryId", () => {
    const actual = mapMovieCandidate(
      {
        id: 42,
        tmdbId: 99,
        title: "Night Harbor",
        year: 2024,
        hasFile: true,
        overview: "Dockside noir.",
        genres: ["Drama"],
        runtime: 118,
        images: [],
      },
      "http://192.168.1.10:7878",
    );
    expect(actual).toMatchObject({
      tmdbId: 99,
      inLibrary: true,
      hasFile: true,
      overview: "Dockside noir.",
      genres: ["Drama"],
      runtimeMinutes: 118,
      libraryId: 42,
    });
  });

  it("maps series candidate overview genres runtime and libraryId", () => {
    const actual = mapSeriesCandidate(
      {
        id: 9,
        tvdbId: 321,
        title: "Harbor Show",
        year: 2022,
        overview: "Dockside drama.",
        genres: ["Drama"],
        runtime: 45,
        images: [],
        statistics: { episodeFileCount: 12, episodeCount: 24 },
      },
      "http://192.168.1.10:8989",
    );
    expect(actual).toMatchObject({
      tvdbId: 321,
      inLibrary: true,
      overview: "Dockside drama.",
      genres: ["Drama"],
      runtimeMinutes: 45,
      libraryId: 9,
      episodeFileCount: 12,
      episodeCount: 24,
    });
  });
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npm test -- src/arr-client/__tests__/mappers.test.ts -t "candidate"`

Expected: FAIL on missing fields / expectation mismatch.

- [ ] **Step 3: Implement mappers**

In `mapMovieCandidate` (reuse existing `mapStringArray` / `mapOptionalNumber` helpers already in the file):

```ts
  const id = typeof obj.id === "number" ? obj.id : 0;
  return {
    tmdbId: obj.tmdbId,
    title: String(obj.title ?? ""),
    year: Number(obj.year ?? 0),
    posterUrl: getPosterUrl(obj.images, baseUrl),
    inLibrary: id > 0,
    hasFile: Boolean(obj.hasFile),
    overview: String(obj.overview ?? ""),
    genres: mapStringArray(obj.genres),
    runtimeMinutes: mapOptionalNumber(obj.runtime),
    libraryId: id > 0 ? id : undefined,
  };
```

Mirror in `mapSeriesCandidate` (keep existing statistics mapping). Update `types.ts` accordingly.

- [ ] **Step 4: Run tests — expect PASS**

Run: `npm test -- src/arr-client/__tests__/mappers.test.ts -t "candidate"`

- [ ] **Step 5: Commit**

```powershell
git add src/arr-client/types.ts src/arr-client/mappers/movie.ts src/arr-client/mappers/series.ts src/arr-client/__tests__/mappers.test.ts
git commit -m "feat(arr): enrich lookup candidates for add preview"
```

---

### Task 2: Lookup status pill badge + list wiring

**Files:**
- Create: `src/components/LookupStatusBadge.tsx`
- Modify: `src/components/index.ts` (export)
- Modify: `app/(tabs)/movies/add.tsx` (list row badge only in this task if MediaQuick not ready — or do both screens’ list rows)
- Modify: `app/(tabs)/series/add.tsx` (list row badge)

**Interfaces:**
- Consumes: `LookupLibraryBadge` from `@/features/library/lookup-library-status`
- Produces:

```ts
export type LookupStatusBadgeProps = {
  readonly badge: Exclude<LookupLibraryBadge, "none">;
};
```

- [ ] **Step 1: Implement `LookupStatusBadge`**

Match MediaQuick status-pill colours:

```ts
import { StyleSheet, Text, View } from "react-native";

import type { LookupLibraryBadge } from "@/features/library/lookup-library-status";
import { useI18n } from "@/i18n";
import { colors, fonts } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

type LookupStatusBadgeProps = {
  readonly badge: Exclude<LookupLibraryBadge, "none">;
};

const TONE = {
  inLibrary: {
    backgroundColor: "rgba(154, 149, 140, 0.18)",
    color: colors.secondary,
  },
  alreadyDownloaded: {
    backgroundColor: "rgba(111, 191, 122, 0.18)",
    color: colors.success,
  },
} as const;

export const LookupStatusBadge = ({ badge }: LookupStatusBadgeProps) => {
  const { t } = useI18n();
  const { fontSize } = useUiSize();
  const tone = TONE[badge];
  const label =
    badge === "alreadyDownloaded"
      ? t("add.alreadyDownloaded")
      : t("add.inLibrary");
  return (
    <View
      accessibilityLabel={label}
      style={[styles.pill, { backgroundColor: tone.backgroundColor }]}
    >
      <Text
        style={[
          styles.label,
          { color: tone.color, fontSize: fontSize(12) },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: {
    fontFamily: fonts.uiMedium,
  },
});
```

Export from `src/components/index.ts`.

- [ ] **Step 2: Replace plain status text on both add lists**

In `renderItem`, when `status.badge !== "none"`, render `<LookupStatusBadge badge={status.badge} />` instead of coloured `Text`. Keep series `progressLabel` as secondary `Text` under the badge (or as a chip later — keep text for YAGNI).

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 4: Commit**

```powershell
git add src/components/LookupStatusBadge.tsx src/components/index.ts "app/(tabs)/movies/add.tsx" "app/(tabs)/series/add.tsx"
git commit -m "feat(ui): pill badges for add-search library status"
```

---

### Task 3: MediaQuick add-mode API

**Files:**
- Modify: `src/features/media-quick/types.ts`
- Modify: `src/components/MediaQuickPanel.tsx`
- Modify: `src/components/MediaQuickSheet.tsx`
- Modify: any existing MediaQuick call sites only if props become required (they must remain optional)

**Interfaces:**
- Produces:

```ts
export type MediaQuickAddActions = {
  readonly canAdd: boolean;
  readonly onAdd: () => void;
  readonly onSeeFiche: () => void;
};
```

`MediaQuickSheet` / `MediaQuickPanel` gain optional `addActions?: MediaQuickAddActions`.

When `addActions` is defined:
- Secondary pressable: `t("add.seeFiche")` → `addActions.onSeeFiche`
- Primary CTA: `t("action.add")` (or `action.adding` if parent passes busy state — keep simple: parent disables via `canAdd`), `disabled={!addActions.canAdd}`, `onPress={addActions.onAdd}`
- Do **not** call `onOpenPrimary` for the primary button in add mode

When `addActions` is undefined: existing single CTA behaviour unchanged.

- [ ] **Step 1: Extend types**

Add `MediaQuickAddActions` to `types.ts`. Optionally add to `MediaQuickSelection`:

```ts
  readonly glanceStatusLine?: string;
  readonly glanceStatusTone?: MediaQuickStatusTone;
```

Update `buildMediaQuickViewModel` so if `glanceStatusLine` is set, it overrides `statusLine` / `statusTone` (for in-library / downloaded pills on add selections).

- [ ] **Step 2: Update panel UI**

In `MediaQuickPanel`, add prop `addActions?: MediaQuickAddActions`.

Below the ScrollView content, when `addActions` is set:

```tsx
      {addActions ? (
        <View style={{ gap: space.sm }}>
          <Pressable
            accessibilityLabel={t("add.seeFiche")}
            accessibilityRole="button"
            onPress={addActions.onSeeFiche}
            style={({ pressed }) => [
              styles.secondaryCta,
              { minHeight: minTouchTarget },
              pressed ? styles.ctaPressed : null,
            ]}
          >
            <Text style={[styles.secondaryCtaText, { fontSize: fontSize(16) }]}>
              {t("add.seeFiche")}
            </Text>
          </Pressable>
          <Pressable
            accessibilityLabel={t("action.add")}
            accessibilityRole="button"
            disabled={!addActions.canAdd}
            onPress={addActions.onAdd}
            style={({ pressed }) => [
              styles.cta,
              { minHeight: minTouchTarget },
              pressed ? styles.ctaPressed : null,
              !addActions.canAdd ? styles.ctaDisabled : null,
            ]}
          >
            <Text style={[styles.ctaText, { fontSize: fontSize(16) }]}>
              {t("action.add")}
            </Text>
          </Pressable>
        </View>
      ) : (
        // existing primary navigate CTA
      )}
```

Styles: secondary = transparent/surface border using `colors.secondary` text; disabled CTA `opacity: 0.5`.

- [ ] **Step 3: Thread props through `MediaQuickSheet`**

Pass `addActions` into `MediaQuickPanel`. Keep `onOpenPrimary` for navigate mode.

- [ ] **Step 4: Typecheck + smoke existing sheets**

Run: `npm run typecheck`

Manually confirm home/movies MediaQuick call sites still typecheck (no required new props).

- [ ] **Step 5: Commit**

```powershell
git add src/features/media-quick/types.ts src/features/media-quick/build-media-quick-view-model.ts src/components/MediaQuickPanel.tsx src/components/MediaQuickSheet.tsx
git commit -m "feat(media-quick): support add-mode actions"
```

---

### Task 4: Candidate → MediaQuick selection + i18n

**Files:**
- Create: `src/features/media-quick/build-add-candidate-selection.ts`
- Create: `src/features/media-quick/__tests__/build-add-candidate-selection.test.ts`
- Modify: `src/i18n/locales/fr.ts` / `en.ts`

**Interfaces:**
- Consumes: enriched candidates + `getMovieLookupLibraryStatus` / `getSeriesLookupLibraryStatus`
- Produces:

```ts
export const buildMovieAddSelection = (
  candidate: MovieCandidate,
): MediaQuickSelection;

export const buildSeriesAddSelection = (
  candidate: SeriesCandidate,
): MediaQuickSelection;
```

- [ ] **Step 1: i18n keys**

FR:

```ts
  "add.seeFiche": "Voir la fiche",
  "add.previewMovieTitle": "Aperçu Film",
  "add.previewSeriesTitle": "Aperçu Série",
```

EN:

```ts
  "add.seeFiche": "View details",
  "add.previewMovieTitle": "Movie preview",
  "add.previewSeriesTitle": "Series preview",
```

- [ ] **Step 2: Failing tests for selection builder**

```ts
import { buildMovieAddSelection } from "@/features/media-quick/build-add-candidate-selection";

describe("build-add-candidate-selection", () => {
  it("maps movie candidate genres and downloaded status", () => {
    const actual = buildMovieAddSelection({
      tmdbId: 1,
      title: "Night Harbor",
      year: 2024,
      posterUrl: undefined,
      inLibrary: true,
      hasFile: true,
      overview: "x",
      genres: ["Drama", "Mystery"],
      runtimeMinutes: 118,
      libraryId: 9,
    });
    expect(actual.kind).toBe("movie");
    expect(actual.movieId).toBe(9);
    expect(actual.genres).toEqual(["Drama", "Mystery"]);
    expect(actual.runtimeMinutes).toBe(118);
    expect(actual.glanceStatusTone).toBe("success");
  });

  it("omits movieId when not in library", () => {
    const actual = buildMovieAddSelection({
      tmdbId: 2,
      title: "New",
      year: 2025,
      posterUrl: undefined,
      inLibrary: false,
      hasFile: false,
      overview: "",
      genres: [],
      runtimeMinutes: undefined,
      libraryId: undefined,
    });
    expect(actual.movieId).toBeUndefined();
    expect(actual.glanceStatusLine).toBeUndefined();
  });
});
```

(Add analogous series cases.)

- [ ] **Step 3: Implement builder**

Use lookup-library-status; map badge → `glanceStatusLine` via `t("add.inLibrary")` / `t("add.alreadyDownloaded")` and tone `muted` / `success`. Set `key` to `movie-add:${tmdbId}` / `series-add:${tvdbId}`. Year as `year`. Do not put overview on the selection.

- [ ] **Step 4: Tests PASS + typecheck**

Run:

```powershell
npm test -- src/features/media-quick/__tests__/build-add-candidate-selection.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```powershell
git add src/features/media-quick/build-add-candidate-selection.ts src/features/media-quick/__tests__/build-add-candidate-selection.test.ts src/i18n/locales/fr.ts src/i18n/locales/en.ts
git commit -m "feat(media-quick): build add-candidate sheet selection"
```

---

### Task 5: Wire MediaQuick on add screens

**Files:**
- Modify: `app/(tabs)/movies/add.tsx`
- Modify: `app/(tabs)/series/add.tsx`

**Interfaces:**
- Consumes: Tasks 2–4, existing `handleAdd` logic
- Produces: selecting a row opens MediaQuick; confirm card removed

- [ ] **Step 1: Replace confirm card with MediaQuickSheet**

On row press: `setSelected(item)` (keep toggle-off on second press or always set — prefer set + sheet dismiss clears).

Render:

```tsx
      <MediaQuickSheet
        selection={
          selected ? buildMovieAddSelection(selected) : undefined
        }
        onDismiss={() => setSelected(undefined)}
        onOpenPrimary={() => {
          /* unused in add mode */
        }}
        addActions={
          selected
            ? {
                canAdd:
                  !selected.inLibrary &&
                  qualityProfileId !== undefined &&
                  rootFolderPath !== undefined &&
                  !addMutation.isPending &&
                  !defaultsQuery.isLoading,
                onAdd: () => void handleAdd(),
                onSeeFiche: () => {
                  if (selected.libraryId !== undefined) {
                    router.push({
                      pathname: "/(tabs)/movies/[id]",
                      params: { id: String(selected.libraryId) },
                    });
                    return;
                  }
                  router.push({
                    pathname: "/(tabs)/movies/preview",
                    params: { tmdbId: String(selected.tmdbId) },
                  });
                },
              }
            : undefined
        }
      />
```

Mirror for series (`tvdbId`, `series/preview`, `series/[id]`).

Remove the old confirm card JSX/styles.

- [ ] **Step 2: Keep add success behaviour**

After successful add: `setSelected(undefined)` (dismisses sheet), `await lookupQuery.refetch()`, stay on screen (already implemented).

If audio choice appears, do not navigate away.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`

- [ ] **Step 4: Commit**

```powershell
git add "app/(tabs)/movies/add.tsx" "app/(tabs)/series/add.tsx"
git commit -m "feat(add): open MediaQuick for search selection"
```

---

### Task 6: Lookup-by-id clients + hooks

**Files:**
- Modify: `src/arr-client/radarr/client.ts`
- Modify: `src/arr-client/sonarr/client.ts`
- Modify: `src/features/movies/use-movies.ts`
- Modify: `src/features/series/use-series.ts`
- Modify: `src/lib/query-keys.ts` (if needed)

**Interfaces:**
- Produces:

```ts
// radarr
lookupCandidateByTmdbId: (tmdbId: number) => Promise<MovieCandidate | null>;

// sonarr
lookupCandidateByTvdbId: (tvdbId: number) => Promise<SeriesCandidate | null>;
```

- [ ] **Step 1: Implement client methods**

Radarr (reuse endpoint already used in `addMovie`):

```ts
    lookupCandidateByTmdbId: async (
      tmdbId: number,
    ): Promise<MovieCandidate | null> => {
      const raw = await http.getJson<unknown>(
        `/api/v3/movie/lookup/tmdb?tmdbId=${encodeURIComponent(String(tmdbId))}`,
      );
      const payload = Array.isArray(raw) ? raw[0] : raw;
      return mapMovieCandidate(payload, baseUrl);
    },
```

Sonarr:

```ts
    lookupCandidateByTvdbId: async (
      tvdbId: number,
    ): Promise<SeriesCandidate | null> => {
      const raw = await http.getJson<unknown[]>(
        `/api/v3/series/lookup?term=${encodeURIComponent(`tvdb:${tvdbId}`)}`,
      );
      const match = raw.find((item) => {
        const obj = asRecord(item);
        return obj !== null && Number(obj.tvdbId) === tvdbId;
      });
      return match ? mapSeriesCandidate(match, baseUrl) : null;
    },
```

(`asRecord` already exists in sonarr client.)

- [ ] **Step 2: Hooks**

```ts
export const useMovieCandidatePreview = (tmdbId: number) => {
  const { radarr } = useArrClients();
  return useQuery({
    queryKey: queryKeys.movies.preview(tmdbId),
    queryFn: async () => {
      if (!radarr) throw new Error("Radarr is not configured.");
      return radarr.lookupCandidateByTmdbId(tmdbId);
    },
    enabled: Boolean(radarr) && Number.isFinite(tmdbId) && tmdbId > 0,
  });
};
```

Add `preview: (tmdbId: number) => [...queryKeys.movies.all, "preview", tmdbId]` (and series equivalent) to `query-keys.ts`.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`

- [ ] **Step 4: Commit**

```powershell
git add src/arr-client/radarr/client.ts src/arr-client/sonarr/client.ts src/features/movies/use-movies.ts src/features/series/use-series.ts src/lib/query-keys.ts
git commit -m "feat(arr): lookup candidates by tmdb/tvdb for preview"
```

---

### Task 7: Light preview screens

**Files:**
- Create: `app/(tabs)/movies/preview.tsx`
- Create: `app/(tabs)/series/preview.tsx`
- Modify: `app/(tabs)/movies/_layout.tsx` — add `<Stack.Screen name="preview" />`
- Modify: `app/(tabs)/series/_layout.tsx` — same

**Interfaces:**
- Consumes: preview hooks, `useMovieDefaults` / `useAddMovie` (and series equivalents), smart-grab helpers already used on add screens

- [ ] **Step 1: Movie preview screen**

Structure (mirror detail header simplicity, not full library actions):

- Back button → `router.back()`
- Title: `t("add.previewMovieTitle")` or candidate title as hero
- Poster (`expo-image`)
- Title + year
- Overview text if non-empty
- `MediaMetaBlock` with genres/runtime (studio/added undefined)
- If `candidate.inLibrary` → show hint + button to open library id instead of Add
- Else Add button → same add+grab flow as add screen; on success `router.back()` to add search (sheet already closed)

Parse `tmdbId` from `useLocalSearchParams`.

- [ ] **Step 2: Series preview screen**

Same pattern with `tvdbId` / `useSeriesCandidatePreview` / `useAddSeries`.

- [ ] **Step 3: Register layouts**

Add `preview` screens to both `_layout.tsx` stacks.

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`

- [ ] **Step 5: Commit**

```powershell
git add "app/(tabs)/movies/preview.tsx" "app/(tabs)/series/preview.tsx" "app/(tabs)/movies/_layout.tsx" "app/(tabs)/series/_layout.tsx"
git commit -m "feat(add): light preview fiches before add"
```

---

### Task 8: Verification

**Files:** none (commands + manual)

- [ ] **Step 1: Automated**

```powershell
npm run typecheck
npm test -- src/arr-client/__tests__/mappers.test.ts src/features/media-quick/__tests__/build-add-candidate-selection.test.ts src/features/library/__tests__/lookup-library-status.test.ts
```

Expected: PASS

- [ ] **Step 2: Manual checklist**

1. Add search → tap result → MediaQuick opens (same sheet chrome as library).
2. Chips show genres/runtime when present; no synopsis in sheet.
3. Voir la fiche (new title) → light preview with synopsis + Add.
4. Add from sheet → stay on search; badge becomes pill in-library/downloaded after refetch.
5. Already-in-library title → badge pill; Add disabled; Voir la fiche opens library detail.
6. Same flows for series.
7. Result list status is a pill, not plain text.

---

## Self-review (plan vs spec)

| Spec requirement | Task |
| --- | --- |
| Enrich candidates | 1 |
| Pill badges in list | 2 |
| Reuse MediaQuick + add mode | 3, 4, 5 |
| Light preview + library detail branch | 5, 6, 7 |
| Stay on add after submit | 5 (preserve), 7 |
| i18n | 4 |
| Movies + series parity | 5, 7 |
| Out of scope respected | Global Constraints |

No placeholders. Types consistent (`libraryId`, `glanceStatusLine`, `MediaQuickAddActions`).
