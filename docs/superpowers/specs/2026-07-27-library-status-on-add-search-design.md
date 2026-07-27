# Library status on add search — design

**Date:** 2026-07-27  
**Status:** Approved for implementation after user review of this spec

## Goal

When searching to add a movie or series, make it obvious which titles are already in the library (and which already have files), and prevent a redundant add.

## Decisions (from brainstorming)

- Show **both** states: in library vs already downloaded (option C).
- Same behaviour for **movies and series**.
- User may still **select** an in-library title; **Add is disabled** with an explanatory hint (option B).
- Series progress shown as **`have/total` episodes** (option C), not a binary “any episode” / “all episodes” only.
- Data comes from the **existing Radarr/Sonarr lookup payload** (approach 1) — no second library list fetch.

## Architecture

```
lookup API (unchanged call)
  → mapMovieCandidate / mapSeriesCandidate (enriched fields)
  → AddMovieScreen / AddSeriesScreen
       → row badges + confirm card disables Add when inLibrary
```

No new network endpoints. No change to `addMovie` / `addSeries` success paths for titles that are not yet in the library.

## Data model

### `MovieCandidate` (extended)

| Field | Source | Meaning |
| --- | --- | --- |
| existing fields | unchanged | `tmdbId`, `title`, `year`, `posterUrl` |
| `inLibrary` | Radarr lookup `id` is a number `> 0` | Already tracked in Radarr |
| `hasFile` | Radarr lookup `hasFile` | File present on disk |

Missing / zero `id` ⇒ `inLibrary: false`. Missing `hasFile` ⇒ `false`.

### `SeriesCandidate` (extended)

| Field | Source | Meaning |
| --- | --- | --- |
| existing fields | unchanged | `tvdbId`, `title`, `year`, `posterUrl` |
| `inLibrary` | Sonarr lookup `id` is a number `> 0` | Already tracked in Sonarr |
| `episodeFileCount` | `statistics.episodeFileCount` (fallback top-level) | Files on disk |
| `episodeCount` | `statistics.episodeCount` (fallback top-level) | Expected episodes |

Missing stats ⇒ `0` / `0`. UI hides the progress line when both are `0`.

## UI

Applies to `app/(tabs)/movies/add.tsx` and `app/(tabs)/series/add.tsx`.

### Result row

| Condition | Badge / secondary text |
| --- | --- |
| Not in library | No badge (current look) |
| Movie in library, `!hasFile` | Badge: in library |
| Movie in library, `hasFile` | Badge: already downloaded (takes priority over “in library”) |
| Series in library | Badge: in library **or** already downloaded if `episodeCount > 0` and `episodeFileCount >= episodeCount`; always show progress `{{have}}/{{total}}` when not both zero |

Selection behaviour unchanged (tap to select/deselect). Include status in `accessibilityLabel`.

### Confirm card

- If selected and `inLibrary`: **Add disabled**; hint text that the title is already in the library.
- Else: current add + smart-grab flow unchanged.

No navigation to the existing detail screen in this change.

## i18n

Add FR/EN keys (wording may be tuned in implementation, meaning fixed):

- `add.inLibrary` — short badge (“Dans la bibliothèque” / “In library”)
- `add.alreadyDownloaded` — short badge (“Déjà téléchargé” / “Already downloaded”)
- `add.episodeProgress` — `{{have}}/{{total}}` with episode label
- `add.alreadyInLibraryHint` — confirm-card message when Add is disabled

## Edge cases

- Lookup payload without library fields → treat as not in library (safe default; Add remains available).
- Series in library with `0/0` stats → in-library badge only, no progress line.
- Disabling Add must not call `addMovie` / `addSeries`.

## Testing

- Unit tests for `mapMovieCandidate` / `mapSeriesCandidate`: not in library; in library without file; in library with file; series with statistics.
- Optional pure helper for badge/progress derivation if logic is non-trivial in the screen — unit-test that helper.
- Manual: search a known library title and a new title on both add screens.

## Out of scope

- Filter/hide already-present results.
- Re-download / grab from the add screen for in-library titles.
- Opening the existing detail page from search.
- Changing house defaults or smart-grab for **new** adds.

## Acceptance

- Search results for movies/series show library / downloaded status when the lookup payload indicates it.
- Series in library show episode file progress when counts are available.
- Selecting an in-library title disables Add and shows the hint; no add API call.
- New titles still add as today.
- FR and EN strings cover the new labels.
