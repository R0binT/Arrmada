# Rich media info on detail pages and MediaQuick — design

**Date:** 2026-07-28  
**Status:** Approved for implementation after user review of this spec  
**Supersedes / extends:** `2026-07-28-cast-on-details-and-mediaquick-design.md` (cast remains; this adds the full IMDb/RT-style pack)

## Goal

Surface interesting title metadata on movie and series detail pages in an IMDb / Rotten Tomatoes–inspired layout, and keep a compact subset in MediaQuick.

Detail pages get a structured “rich info” stack. MediaQuick stays glanceable (chips + one detail line), not a mini fiche.

## Decisions (from brainstorming)

- Scope pack: **full rich set** — ratings, certification, key crew, cast, status/dates, external IDs/links, collection (movies), original language/country when available, plus existing genres/runtime/studio-network/quality/size.
- Approach: **sectioned detail layout** (not chip-only dump; not third-party OMDb/TMDB API keys).
- Data source: Radarr / Sonarr payloads (+ existing Radarr credits / TVMaze cast). No new API keys.
- MediaQuick: compact enrichment only for movie/series selections.

## Architecture

```text
Arr movie/series payload (+ credit / TVMaze for people)
  -> mappers enrich Movie / Series (+ CastMember / CrewMember)
  -> detail screen: RatingsRow -> MediaMetaBlock -> overview -> Crew -> Cast -> Links
  -> MediaQuick selection/view-model: chips + compact detail line (names, not photos)
```

Library list endpoints must not grow N+1 credit/TVMaze calls. Map scalar metadata from the existing Arr objects; load cast/crew on detail open and when MediaQuick opens for a movie/series.

## Data model

### Shared

```ts
type RatingScore = {
  readonly source: "tmdb" | "imdb" | "rottenTomatoes" | "trakt" | "value";
  readonly value: number; // provider-native (e.g. 7.8, or 92 for RT %)
  readonly votes?: number;
};

type CrewMember = {
  readonly name: string;
  readonly job: string; // e.g. Director, Creator
};

type CastMember = {
  readonly name: string;
  readonly photoUrl: string | undefined;
};

type ExternalIds = {
  readonly imdbId?: string;
  readonly tmdbId?: number;
  readonly tvdbId?: number;
  readonly tvMazeId?: number;
};
```

### Extend `Movie`

Add (when present in Radarr):

- `ratings: readonly RatingScore[]`
- `certification?: string`
- `originalLanguage?: string`
- `country?: string` (only if Arr exposes a clear field; otherwise omit)
- `statusSummary` (already) + release date fields used for display (`digitalRelease` / `physicalRelease` / `inCinemas` as optional ISO strings)
- `collectionTitle?: string`
- `externalIds: ExternalIds` (`imdbId`, `tmdbId`)
- `crew: readonly CrewMember[]` — loaded via credits fetch (not list payload)
- `cast: readonly CastMember[]` — loaded via credits fetch (not list payload)

### Extend `Series`

Add (when present in Sonarr):

- `ratings: readonly RatingScore[]`
- `certification?: string`
- `originalLanguage?: string`
- `country?: string` (omit if unavailable)
- `ended?: boolean`
- `firstAired?: string`
- `lastAired?: string`
- `externalIds: ExternalIds` (`imdbId`, `tmdbId`, `tvdbId`, `tvMazeId`)
- `crew: readonly CrewMember[]` — best-effort (TVMaze / Arr); hide section if empty
- `cast: readonly CastMember[]` — TVMaze via `tvMazeId` (existing path)

### Mapping rules

- Ratings: only include providers that actually appear in the Arr `ratings` object; never invent Rotten Tomatoes.
- Cap cast at **6**; crew at a small set of key jobs (Director / Creator / Writer primary — exact filter in plan).
- Empty strings / zero votes → drop.
- Absolute image URLs for cast photos (existing strategy).

## Detail page UI

Apply to:

- `app/(tabs)/movies/[id].tsx`
- `app/(tabs)/series/[id].tsx`

### Section order (under immersive header)

1. **Ratings** — compact line, e.g. `TMDB 7.8 · IMDb 8.1 · RT 92%` (only available scores)
2. **Meta chips** — certification, genres, runtime, language, studio/network, status, key dates, collection (movies), added, file quality/size when downloaded
3. **Overview** — unchanged
4. **Crew** — short text/list of key people (not required to use circular photos)
5. **Cast** — circular portraits + names (≤6); hide if empty
6. **Links** — open IMDb / TMDB (and TVDB if useful for series) in the system browser when IDs exist

### Shared components (suggested)

- `RatingsRow`
- Extend `MediaMetaBlock` (or replace with richer meta helper)
- `CrewSection`
- `CastSection` (existing / from cast work)
- `ExternalLinksRow`

Display-only; no fetching inside presentational components.

### Fallbacks

- Missing block → hide entirely (no empty headings).
- Missing cast photo → initial placeholder.
- Series without `tvMazeId` → no cast (and possibly no crew).

## MediaQuick

### Selection / view-model

For `kind: "movie" | "series"` only:

- Chips: up to **two** rating chips (prefer TMDB then IMDb, else first available) + certification + existing genre/runtime/studio-network chips
- `detailLine`: key date / collection / short crew + `Acteurs:` / `Cast:` names when loaded
- No cast photos, no external link buttons, no full ratings strip

Season / episode / download selections unchanged (no forced rich pack).

### Loading

When the sheet opens for a movie/series, reuse cast (and crew if needed) queries already used on detail, or pass names already present on selection when available.

## i18n

Add FR/EN keys for section titles and link labels, for example:

- `detail.ratings`, `detail.crew`, `detail.cast`, `detail.links`
- `mediaQuick.castLabel` (existing)
- Provider abbreviations can stay as `TMDB` / `IMDb` / `RT` (universal)

## Edge cases

- Arr instance without ratings populated → no ratings row.
- RT present as percentage vs 0–10 → format consistently (percent with `%` when value looks like RT %).
- Duplicate cast/crew names → de-dupe.
- Link open failures → rely on `expo-web-browser` / Linking; no crash if ID malformed.
- Preview / add-candidate screens: out of scope unless metadata already on candidate (optional follow-up).

## Testing

- Mapper tests for ratings, certification, language, ids, collection, dates.
- Cast/crew mapper limits and filters.
- MediaQuick view-model: rating chips + cast names line; absent data leaves line clean.
- Manual: movie with rich Radarr metadata; series with/without `tvMazeId`.

## Out of scope

- Third-party OMDb / direct TMDB API keys
- Full cast/crew screens
- Character names / episode guest stars
- Trailer playback UI (YouTube id may exist on Radarr but is not required in v1 of this pack)
- Changing download / monitor / remove flows
- Rich pack on season/episode MediaQuick

## Acceptance

- Movie and series detail pages show the section stack above when data exists.
- Ratings never invent providers Arr did not return.
- Cast portraits on detail; MediaQuick names only.
- External links open when IDs exist.
- Empty sections stay hidden.
- Library list performance unchanged (no N+1 people fetches on list).
