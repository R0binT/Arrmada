# Cast on details and MediaQuick — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show up to 6 cast members as round portraits on movie/series detail pages, and show their names as compact quick info in MediaQuick.

**Architecture:** Cast is a parallel resource, not embedded in library list payloads. Movies load cast from Radarr `GET /api/v3/credit?movieId=`. Series load cast from TVMaze `GET https://api.tvmaze.com/shows/{tvMazeId}/cast` using `tvMazeId` from Sonarr. Shared `CastMember` + `CastSection` UI; MediaQuick appends names to `detailLine` when cast is available on the selection or fetched for the open sheet.

**Tech Stack:** Expo Router, React Native, TanStack Query, existing `@/arr-client`, MediaQuick view-model, Jest.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-28-cast-on-details-and-mediaquick-design.md`
- Limit to **6** cast members.
- Detail: circular photos + names; hide section when empty.
- MediaQuick: names only on the compact detail line (`Acteurs: …`).
- Movies and series both get cast when data exists; no character/role names; no full cast modal.
- FR + EN i18n; avoid “MVP” wording.
- Do not bloat `getMovies()` / `getSeries()` with N+1 credit calls.

## File map

| File | Role |
| --- | --- |
| `src/arr-client/types.ts` | `CastMember`; `tvMazeId` on `Series` |
| `src/arr-client/mappers/cast.ts` | Map Radarr credits + TVMaze cast |
| `src/arr-client/mappers/series.ts` | Map `tvMazeId` |
| `src/arr-client/radarr/client.ts` | `getMovieCredits` |
| `src/arr-client/sonarr/client.ts` | `getSeriesCredits` via TVMaze |
| `src/arr-client/index.ts` | Export `CastMember` |
| `src/lib/query-keys.ts` | Cast query keys |
| `src/features/movies/use-movies.ts` | `useMovieCast` |
| `src/features/series/use-series.ts` | `useSeriesCast` |
| `src/components/CastSection.tsx` | Round portraits UI |
| `src/components/index.ts` | Export |
| `app/(tabs)/movies/[id].tsx` / `series/[id].tsx` | Render cast |
| `src/features/media-quick/types.ts` | `castNames?` |
| `src/features/media-quick/build-media-quick-selection.ts` | Pass names when present |
| `src/features/media-quick/build-media-quick-view-model.ts` | Append cast line |
| `src/components/MediaQuickSheet.tsx` | Load cast names when sheet opens |
| `src/i18n/locales/fr.ts` / `en.ts` | Keys |
| Tests | Mapper + view-model |

---

### Task 1: Cast domain + mappers

**Files:**
- Create: `src/arr-client/mappers/cast.ts`
- Modify: `src/arr-client/types.ts`
- Modify: `src/arr-client/mappers/series.ts`
- Modify: `src/arr-client/index.ts`
- Modify: `src/arr-client/__tests__/mappers.test.ts`

**Interfaces:**
- Produces:

```ts
export type CastMember = {
  readonly name: string;
  readonly photoUrl: string | undefined;
};

export const MAX_CAST_MEMBERS = 6;

export const mapRadarrCredits = (
  raw: unknown,
  baseUrl: string,
): readonly CastMember[];

export const mapTvMazeCast = (raw: unknown): readonly CastMember[];
```

- [ ] **Step 1: Add types and mapper helpers**

`CastMember` on types; `tvMazeId: number | undefined` on `Series`.

`mapRadarrCredits`: filter `type === "cast"`, sort by `order`, take 6 unique names, photo from credit `images` (`headshot` preferred, else first remote/relative URL via existing poster helper pattern).

`mapTvMazeCast`: read `person.name` + `person.image.medium|original`, take 6.

Map `tvMazeId` in `mapSonarrSeries`.

- [ ] **Step 2: Tests for limit, cast-only filter, empty payloads**

- [ ] **Step 3: Commit** (only if user asks — otherwise leave uncommitted)

---

### Task 2: Client methods + hooks

**Files:**
- Modify: `src/arr-client/radarr/client.ts`
- Modify: `src/arr-client/sonarr/client.ts`
- Modify: `src/lib/query-keys.ts`
- Modify: `src/features/movies/use-movies.ts`
- Modify: `src/features/series/use-series.ts`
- Modify: `src/arr-client/__tests__/clients.test.ts`

**Interfaces:**
- Produces:

```ts
// RadarrClient
getMovieCredits: (movieId: number) => Promise<readonly CastMember[]>;

// SonarrClient — uses series tvMazeId from getSeriesById then TVMaze
getSeriesCredits: (seriesId: number) => Promise<readonly CastMember[]>;

useMovieCast(movieId: number);
useSeriesCast(seriesId: number);
```

- [ ] **Step 1: Implement clients**
  - Radarr: `/api/v3/credit?movieId=`
  - Sonarr: load series → if no `tvMazeId` return `[]`; else fetch TVMaze cast

- [ ] **Step 2: Query keys + hooks**

- [ ] **Step 3: Client tests with mocked fetch**

---

### Task 3: CastSection UI + detail screens + i18n

**Files:**
- Create: `src/components/CastSection.tsx`
- Modify: `src/components/index.ts`
- Modify: `app/(tabs)/movies/[id].tsx`
- Modify: `app/(tabs)/series/[id].tsx`
- Modify: `src/i18n/locales/fr.ts`
- Modify: `src/i18n/locales/en.ts`

- [ ] **Step 1: i18n** — `detail.cast`, `mediaQuick.castLabel`

- [ ] **Step 2: `CastSection`** — title + horizontal wrap of circular photos + names; hide if empty; initial fallback

- [ ] **Step 3: Wire detail screens** after overview

---

### Task 4: MediaQuick cast names

**Files:**
- Modify: `src/features/media-quick/types.ts`
- Modify: `src/features/media-quick/build-media-quick-view-model.ts`
- Modify: `src/components/MediaQuickSheet.tsx`
- Modify: `src/features/media-quick/__tests__/build-media-quick-view-model.test.ts`

- [ ] **Step 1: `castNames?: readonly string[]` on selection + view-model detail line**
  Format: `t("mediaQuick.castLabel") + ": " + names.join(", ")` appended via `joinDetail`.

- [ ] **Step 2: MediaQuickSheet** — when selection is movie/series with id, call cast hook and merge names into view model (override/enrich selection castNames).

- [ ] **Step 3: View-model tests**

---

## Acceptance

- Movie detail shows ≤6 round cast portraits when Radarr credits exist.
- Series detail shows ≤6 when TVMaze id + cast exist.
- MediaQuick movie/series shows `Acteurs: …` names only.
- Empty cast → no empty section / no broken detail line.
- Library list fetch unchanged (no N+1).
