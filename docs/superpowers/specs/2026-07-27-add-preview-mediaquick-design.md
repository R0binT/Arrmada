# Add search preview via MediaQuick — design

**Date:** 2026-07-27  
**Status:** Approved for implementation after user review of this spec

## Goal

When searching to add a movie or series, let the user confirm the title before downloading: reuse the MediaQuick bottom sheet for selection, open a full fiche when needed, and show library/download status as real badges in the result list.

## Decisions (from brainstorming)

- Bottom bar + full fiche (option C): quick glance in sheet, optional full preview.
- Full fiche: library detail if already tracked; otherwise a light add-only preview (option C).
- Sheet content: year + genres (+ runtime when available) as chips — synopsis lives on the light fiche, not in the sheet (option B, refined to match MediaQuick).
- **Reuse** `MediaQuickSheet` / `MediaQuickPanel` (not a lookalike card).
- After add: stay on add search (existing behaviour); dismiss sheet; refetch lookup.
- Result-list library status must be a **badge/pill**, not plain coloured text.

## Architecture

```
lookup API (existing)
  → enriched MovieCandidate / SeriesCandidate
  → add screen list (badge pills)
  → MediaQuickSheet (reuse) for selection
       → primary: Add (or disabled if in library)
       → secondary: Voir la fiche
            → libraryId present → movies/[id] | series/[id]
            → else → movies/preview | series/preview (light fiche + Add)
```

No second TMDB/TVDB client. Overview/genres/runtime come from Arr lookup payloads already returned today but currently stripped by mappers.

## Data model

Extend candidates mapped from Radarr/Sonarr lookup:

### `MovieCandidate`

| Field | Source | Notes |
| --- | --- | --- |
| existing | unchanged | `tmdbId`, `title`, `year`, `posterUrl`, `inLibrary`, `hasFile` |
| `overview` | lookup `overview` | string, may be empty |
| `genres` | lookup `genres` | string array |
| `runtimeMinutes` | lookup `runtime` | optional number |
| `libraryId` | lookup `id` when `> 0` | for navigating to existing detail |

### `SeriesCandidate`

Same pattern with `tvdbId`, plus existing episode counts; add `overview`, `genres`, `runtimeMinutes`, `libraryId`.

## MediaQuick extensions (add flow)

Reuse `MediaQuickSheet` + `MediaQuickPanel` on `movies/add` and `series/add`.

### Selection

Build a `MediaQuickSelection` from the candidate:

- `kind`: `"movie"` | `"series"`
- `title`, `year`, `posterUrl`, `genres`, `runtimeMinutes`
- Status pill from existing library-status helper (`inLibrary` / `alreadyDownloaded`)
- When in library: set `movieId` / `seriesId` from `libraryId`

### Actions (panel API change)

Today MediaQuick has a single navigate CTA. Extend the panel/sheet to support an **add mode**:

| Control | Behaviour |
| --- | --- |
| Primary CTA | **Ajouter** — runs existing add + smart-grab; disabled when `inLibrary` with hint |
| Secondary | **Voir la fiche** — library detail if `libraryId`, else light preview route |
| Dismiss | Clears selection (sheet closes) |

Existing library/home MediaQuick call sites stay on the current single-CTA navigate behaviour unless they opt into add mode.

## Light preview fiche

New routes (names exact in implementation plan):

- `app/(tabs)/movies/preview.tsx` — param `tmdbId`
- `app/(tabs)/series/preview.tsx` — param `tvdbId`

Content:

- Poster, title, year
- Overview / synopsis
- Genres / runtime when available
- **Ajouter** using house defaults + existing smart-grab
- Back returns to add search with sheet **closed**

Out of this screen: monitor toggle, delete, release list, queue actions (library detail only).

Data for preview: pass via route params is insufficient for overview; load from lookup by id (`movie/lookup/tmdb`, series lookup `tvdb:…`) or pass through query cache / shared candidate store. Prefer Arr lookup-by-id already used by `addMovie` / `addSeries` so the preview stays consistent with add.

## Result list badges

Replace plain status `Text` under the year with a **pill badge** matching MediaQuick status-pill / chip visual language:

- Background tint + label colour by tone (e.g. success for already downloaded, secondary/muted for in library)
- Same labels: `add.inLibrary`, `add.alreadyDownloaded`
- Series episode progress (`n/m`) remains secondary text or a second chip — badge for status, progress can stay as compact secondary line or chip

## i18n

Add FR/EN keys as needed, for example:

- `add.seeFiche` — secondary sheet action
- `add.previewTitle` / screen titles if needed
- Reuse `action.add`, existing library-status strings

## Edge cases

- Empty overview → hide synopsis block; sheet still works with chips only.
- Missing genres/runtime → omit chips.
- Add from sheet or from preview → same mutation path; stay on add search after success; refetch lookup.
- In-library selection → primary Add disabled; secondary / primary navigation opens library fiche.
- Audio VF/VO sheet after add → unchanged; does not leave add search.

## Out of scope

- Synopsis inside MediaQuick sheet
- Changing MediaQuick presentation on home / library lists beyond shared API extensions
- Batch multi-select add
- Opening TMDB/TVDB external browser pages

## Acceptance

- Selecting an add-search result opens MediaQuick (same component family as library quick sheet).
- Sheet shows title, year, genre/runtime chips, library status when relevant, Add + Voir la fiche.
- Voir la fiche opens library detail when tracked, else light preview with synopsis and Add.
- Result rows show library/download status as pill badges, not plain text.
- Add from sheet or preview keeps the user on add search and updates badges after refetch.
- Movies and series behave the same.
