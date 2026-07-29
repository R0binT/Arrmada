# Audio & subtitle language chips — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show short audio/subtitle language codes on downloaded movies and episodes (detail + MediaQuick).

**Architecture:** Pure mapper from Arr `mediaInfo` (+ optional `languages` array) → code lists; extend `Movie`/`Episode`; Sonarr joins `/episodefile`; UI chips on meta/episode/MediaQuick.

**Tech Stack:** Expo RN, existing Chip/`MediaMetaBlock`, Jest unit tests.

## Global Constraints

- Short uppercase codes only; hide when empty / no file.
- No indexer VF/VO grab changes.
- French + English i18n for labels.

---

### Task 1: MediaInfo → language codes mapper

**Files:**
- Create: `src/arr-client/mappers/media-info-languages.ts`
- Test: `src/arr-client/__tests__/media-info-languages.test.ts`

**Produces:** `mapMediaInfoLanguageCodes(mediaInfo, languages?) → { audioLanguageCodes, subtitleLanguageCodes }`

- [ ] Failing tests for slash-separated `audioLanguages`/`subtitles`, name map (French→FR), dedupe, empty
- [ ] Implement mapper
- [ ] Tests pass; commit

### Task 2: Domain types + movie/episode mapping

**Files:**
- Modify: `src/arr-client/types.ts`, `mappers/movie.ts`, `mappers/series.ts`
- Modify: `src/arr-client/sonarr/client.ts` (`getSeasons` + episodefile fetch)
- Test: extend `mappers.test.ts` / `clients.test.ts`

- [ ] Add fields on `Movie` / `Episode`
- [ ] Map from `movieFile`; join episode files for Sonarr
- [ ] Tests pass; commit

### Task 3: UI detail + MediaQuick + i18n

**Files:**
- Modify: `MediaMetaBlock`, movie/series detail, media-quick types/selection/view-model/panel
- Modify: `fr.ts` / `en.ts`

- [ ] Chips on movie meta + episode rows
- [ ] MediaQuick chips for movie/episode
- [ ] Typecheck + tests; commit
