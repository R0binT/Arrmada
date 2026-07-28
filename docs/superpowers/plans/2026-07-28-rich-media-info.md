# Rich media info — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add IMDb/RT-style rich metadata on movie/series detail pages and a compact subset in MediaQuick, extending the existing cast work.

**Architecture:** Map scalar metadata from Arr movie/series payloads; load cast+crew via existing credit/TVMaze fetches. Detail UI stacks Ratings → Meta → Overview → Crew → Cast → Links. MediaQuick adds rating/cert chips and compact detail facts.

**Tech Stack:** Expo Router, React Native, TanStack Query, `@/arr-client`, MediaQuick, Jest, `expo-web-browser` / Linking.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-28-rich-media-info-design.md`
- No third-party API keys; never invent Rotten Tomatoes scores
- No N+1 people fetches on library lists
- Cast ≤6; key crew only; hide empty sections
- FR+EN i18n; English PR updates
- Extend current `feature/cast-details-mediaquick` branch / PR #41

## File map

| File | Role |
| --- | --- |
| `src/arr-client/types.ts` | RatingScore, CrewMember, ExternalIds; extend Movie/Series |
| `src/arr-client/mappers/ratings.ts` | Map Arr ratings objects |
| `src/arr-client/mappers/cast.ts` | Also map Radarr crew; series credits shape |
| `src/arr-client/mappers/movie.ts` / `series.ts` | Map rich scalar fields |
| `src/arr-client/radarr/client.ts` / `sonarr/client.ts` | Credits return cast+crew |
| `src/features/movies/use-movies.ts` / `series/use-series.ts` | Cast/crew hooks |
| `src/components/RatingsRow.tsx` | Ratings strip |
| `src/components/CrewSection.tsx` | Key crew |
| `src/components/ExternalLinksRow.tsx` | IMDb/TMDB/TVDB links |
| `src/components/MediaMetaBlock.tsx` | Richer chips |
| `src/components/CastSection.tsx` | Existing |
| Detail screens + MediaQuick types/view-model/sheet | Wire UI |
| i18n + tests | Strings + coverage |

---

### Task 1: Types + scalar mappers + tests

- [ ] Add types; map ratings/cert/language/ids/dates/collection on Movie/Series
- [ ] Update factories/tests for new required fields (default empty arrays / undefined)
- [ ] Commit

### Task 2: Credits return cast + crew

- [ ] `MediaCredits` from Radarr credit endpoint; TVMaze cast (+ crew best-effort)
- [ ] Update hooks/clients/tests
- [ ] Commit

### Task 3: Detail UI components + screens

- [ ] RatingsRow, CrewSection, ExternalLinksRow; extend MediaMetaBlock
- [ ] Wire movies/[id] and series/[id] in spec order
- [ ] i18n keys
- [ ] Commit

### Task 4: MediaQuick compact rich info

- [ ] Selection + view-model rating chips / detail facts
- [ ] Sheet loads credits for names when needed
- [ ] Tests
- [ ] Commit

### Task 5: Verify + update PR #41

- [ ] `npm test`, `tsc`
- [ ] Push; English PR body + labels already present; refresh Summary/What changed
