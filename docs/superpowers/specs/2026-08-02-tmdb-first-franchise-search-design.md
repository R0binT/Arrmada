# TMDB-first franchise / universe search on Add

Date: 2026-08-02  
Status: Approved (conversation)

## Goal

On **Ajouter film** and **Ajouter série**, searching a franchise or studio name (e.g. `marvel`, `star wars`) returns the related catalogue titles, not only titles whose name contains the query string. The list is **filled by TMDB**, then **enriched by Radarr/Sonarr** for library availability (in library / already downloaded / addable).

## Context

- Today: `useMovieLookup` / `useSeriesLookup` → Arr `*/lookup?term=` → TMDB name search via Arr → title substring matches only.
- ADR-0003: no backend; phone may call external APIs directly.
- ADR-0011: KISS — one search field, no separate “franchise mode”.
- User choices: approach TMDB Discover; movies **and** series; TMDB first when key present; Arr-only fallback without key; list = TMDB rows + Arr enrichment.

## Behaviour

### With `EXPO_PUBLIC_TMDB_API_KEY` set

1. User types ≥ 2 characters (same debounce / enable rules as today).
2. App searches TMDB first:
   - `search/company`, `search/keyword`, and (movies) `search/collection`
   - pick best match(es) with a simple score: exact name > prefix > contains (case-insensitive)
   - expand via `discover/movie` or `discover/tv` (`with_companies` / `with_keywords`) and/or collection parts
   - also merge `search/movie` or `search/tv` so exact titles (e.g. `Iron Man`) still appear
3. Deduplicate by TMDB id; cap enrichment candidates (~20–30) for LAN + rate limits.
4. Enrich each row via Arr (parallel, bounded):
   - **Movie:** `radarr.lookupCandidateByTmdbId` → `inLibrary`, `hasFile`, `libraryId`, poster/overview when Arr provides them
   - **Series:** `GET /tv/{id}/external_ids` → TVDB id → `sonarr.lookupCandidateByTvdbId` (skip row if no TVDB id)
5. UI: same FlatList / badges / MediaQuick add flow; badges still from Arr fields.

### Without TMDB key (or TMDB hard failure)

- Silent fallback to current Arr `lookupCandidates(term)` only.
- Optional discreet feedback if TMDB fails after key was present; never block adding.

### Config (v1)

- Key only in `.env` as `EXPO_PUBLIC_TMDB_API_KEY`, documented in `.env.example`.
- No Settings UI field in v1.

## Architecture

```
Add screens (movies/add, series/add)
  → useMovieLookup / useSeriesLookup (or thin wrapper)
      → if no TMDB key: radarr/sonarr.lookupCandidates
      → else:
          tmdb-client search + discover → TmdbHit[]
          arr enrich by id → MovieCandidate[] / SeriesCandidate[]
```

### New module: `src/tmdb-client/`

Isolated like `arr-client` (React-free):

- HTTP helper (API key query param or header per TMDB v3)
- Search company / keyword / collection
- Discover movie / TV
- Search movie / TV
- TV external ids
- Mappers to a small internal `TmdbMediaHit` type (`tmdbId`, title, year, poster path, overview, media kind)

### Existing Arr client

- Reuse `lookupCandidateByTmdbId` / `lookupCandidateByTvdbId`
- Keep candidate types (`MovieCandidate` / `SeriesCandidate`) as the UI contract so add/preview sheets stay unchanged

### Hooks

- Extend or wrap lookup hooks so screens keep the same props shape (`data`, `isFetching`, `isError`, `refetch`)
- When enriching, prefer Arr poster/overview when present; otherwise TMDB image base URL + path

## Error handling

| Case | Behaviour |
|------|-----------|
| Missing env key | Arr lookup only |
| TMDB 401 / network | Fallback Arr lookup; optional short toast |
| Arr enrich fails for one id | Keep TMDB row with `inLibrary: false` (still addable via tmdbId / later resolve) |
| Series without TVDB | Omit from list or show without add until resolve works — prefer omit for Sonarr add reliability |

For movies, add still uses `tmdbId` even if Arr enrich failed (existing add path). For series, Sonarr add needs TVDB: omit unrevolvable rows in v1.

## Testing

- Unit: TMDB match scoring; merge/dedupe; “no key → Arr path”; enrich mapper (TMDB hit + Arr candidate → UI candidate)
- Unit: company/keyword scoring fixtures (`marvel` → Marvel Studios-like names)
- Manual: with key, `marvel` / `star wars` on both add screens; without key, title search still works; badges for items already in library

## Out of scope (v1)

- Settings screen for TMDB key
- Infinite scroll / multi-page discover beyond first page (or small fixed page count)
- Disk cache of TMDB responses
- Library list filter (home Movies/Series index) franchise search
- Direct TMDB add without Arr resolve for series
- Changing download/smart-grab behaviour after add

## Related freeze fix (separate)

Rapid consecutive adds freezing Android: MediaQuick `Modal` was unmounted via `return null`. Fix: keep Modal mounted, toggle `visible`; defer `AudioChoiceSheet` one tick. Tracked in code, not this feature’s acceptance criteria.
