# Add cast to detail pages and MediaQuick — design

**Date:** 2026-07-28  
**Status:** Approved for implementation after user review of this spec

## Goal

Display cast members on movie and series detail pages, and surface the same cast in a lighter form inside MediaQuick.

- Detail pages: show up to 6 cast members as round portraits with their names.
- MediaQuick: show up to 6 cast names as a compact quick-info line.

## Decisions (from brainstorming)

- Default count: **6** cast members.
- Detail layout: dedicated `Casting` section below the overview block.
- Detail visual style: circular headshots with the actor name underneath.
- MediaQuick visual style: names only, no photos, appended as compact quick info.
- Keep the implementation shared between movie and series flows.

## Architecture

```text
Radarr / Sonarr detail payload
  -> arr-client mapper enriches Movie / Series
  -> detail screen renders shared cast section
  -> media quick selection carries cast names
  -> MediaQuick view model formats a compact names line
```

The smallest safe path is to enrich the existing `Movie` and `Series` domain models directly, rather than creating a separate credits fetch path just for the UI.

## Data model

Introduce a shared cast person shape in `arr-client`:

### `CastMember`

| Field | Type | Notes |
| --- | --- | --- |
| `name` | `string` | Display name |
| `photoUrl` | `string \| undefined` | Optional headshot URL |

Extend these domain models:

### `Movie`

Add:

- `cast: readonly CastMember[]`

### `Series`

Add:

- `cast: readonly CastMember[]`

Rules:

- Mapper trims names and drops empty entries.
- Mapper keeps only the first 6 members.
- Missing photos are allowed; the UI still renders a fallback circle.

## ARR client mapping

Cast is **not** embedded in Radarr/Sonarr library list payloads. Use focused follow-up fetches:

- **Movies (Radarr):** `GET /api/v3/credit?movieId={id}` — keep `type === "cast"`, sort by `order`, map `personName` + headshot image URLs.
- **Series (Sonarr):** Sonarr has no credit API. Map `tvMazeId` from the series resource, then fetch `GET https://api.tvmaze.com/shows/{tvMazeId}/cast` for names and photos.

Do not call credits while listing the full library (avoids N+1). Load cast on detail screens and when MediaQuick opens for a movie/series.

## Detail page UI

Apply the same component to:

- `app/(tabs)/movies/[id].tsx`
- `app/(tabs)/series/[id].tsx`

### Section placement

Render the cast section after the overview text and before the seasons block / monitoring actions.

### Section content

- Section title: `Casting`
- Horizontal wrap/grid of up to 6 items
- Each item shows:
  - circular image
  - actor name

### Fallbacks

- No cast returned -> hide the section entirely.
- Missing image -> show a neutral circular placeholder surface with the person initial.
- Long names -> allow two lines max, centered.

## Shared UI component

Create a small presentational component for reuse, for example:

- `src/components/CastSection.tsx`

Responsibilities:

- Receive `readonly CastMember[]`
- Render the section title and items
- Stay display-only with no fetching logic

This keeps movie and series screens aligned and avoids duplicating layout code.

## MediaQuick changes

Extend the MediaQuick data path so cast names can appear in quick info.

### `MediaQuickSelection`

Add:

- `castNames?: readonly string[]`

Selection builders for movies and series should populate `castNames` from the enriched domain models, limited to 6 names.

### `MediaQuickViewModel`

No new visual block is needed. Instead, the cast names should be appended to the quick info line, for example:

- `Ajouté le 28 juil. · Acteurs: Name 1, Name 2, Name 3`

Rules:

- Names only, never photos.
- Keep the line compact.
- If cast is absent, keep the current detail line unchanged.

## i18n

Add FR/EN keys as needed:

- `detail.cast` -> `Casting`
- `mediaQuick.castLabel` -> `Acteurs`

The detail section title and MediaQuick label should both come from i18n.

## Edge cases

- Empty cast array -> hide cast UI and keep MediaQuick unchanged.
- Duplicate names -> de-duplicate before rendering if needed.
- Image URL missing or broken -> fallback placeholder should remain stable.
- Episode and season MediaQuick entries do not need cast right now; movie and series are the target scope.

## Testing

Add focused tests where they reduce regression risk:

- Mapper test for cast extraction and 6-item limit.
- MediaQuick view-model test for compact cast-name rendering.
- UI can rely on existing manual verification unless there is already a nearby component-test pattern worth reusing.

## Out of scope

- Character names / roles
- Full cast screen or modal
- Cast support for episodes, seasons, or queue downloads
- External links to TMDB / IMDb person pages

## Acceptance

- Movie detail page shows up to 6 cast members as round portraits with names when cast exists.
- Series detail page shows the same cast section behavior.
- MediaQuick for movie and series shows cast names in quick info only.
- No cast data means no empty section and no broken MediaQuick text.
- Existing download, monitoring, and navigation flows remain unchanged.
