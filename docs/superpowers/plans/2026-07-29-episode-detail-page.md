# Episode Detail Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dedicated episode detail route wired from MediaQuick, with full episode facts, guest stars, download, suivi, and delete file.

**Architecture:** Nested Expo Router screen under series; enrich `Episode` + Sonarr client; extend MediaQuick `PrimaryDestination`; TVMaze guestcast embed for guests.

**Tech Stack:** Expo Router, React Query, Sonarr API, TVMaze, Jest, existing detail UI components.

## Global Constraints

- Prefer French product copy via i18n (`en` + `fr` + `MessageKey`).
- Do not call the app an MVP.
- Join episode files by `episodeFileId` → file `id`.
- No manual track editing.

---

### Task 1: Enrich Episode mapping + episodefile meta

**Files:**
- Modify: `src/arr-client/types.ts` (`Episode`)
- Modify: `src/arr-client/mappers/series.ts` (`mapSonarrEpisode`, `indexEpisodeFileLanguages` if needed for quality/size)
- Modify: `src/arr-client/__tests__/mappers.test.ts`
- Modify: `src/arr-client/__tests__/clients.test.ts` (fixtures)

**Interfaces:**
- Produces: `Episode` with `overview`, `episodeFileId?`, `fileQuality?`, `sizeOnDisk?`, `runtimeMinutes?`

- [ ] Extend `Episode` type and `mapSonarrEpisode` to read `overview`, `runtime`, `episodeFileId`, and file quality/size from joined file index or embedded `episodeFile`.
- [ ] Extend language index (or parallel index) to carry `fileQuality` + `sizeOnDisk` keyed by episode file id; look up via `episodeFileId` in `getSeasons`.
- [ ] Tests for mapper + getSeasons fixture.
- [ ] Commit: `feat: enrich episode model with overview and file meta`

### Task 2: Sonarr episode update + delete file + guest stars

**Files:**
- Modify: `src/arr-client/sonarr/client.ts` (+ client interface if separate)
- Modify: `src/arr-client/mappers/cast.ts` if guestcast mapping needs a thin wrapper
- Modify: `src/arr-client/__tests__/clients.test.ts`
- Modify: `src/features/series/use-series.ts` (hooks)
- Modify: `src/lib/query-keys.ts` if needed

**Interfaces:**
- Produces: `updateEpisode(id, { monitored })`, `deleteEpisodeFile(fileId)`, `getEpisodeGuestStars(seriesId, season, episode) => CastMember[]`
- Produces: `useUpdateEpisodeMonitored`, `useDeleteEpisodeFile`, `useEpisodeGuestStars`

- [ ] Implement client methods + tests.
- [ ] React Query hooks invalidating seasons/series queries.
- [ ] Commit: `feat: sonarr episode monitored, delete file, guest stars`

### Task 3: MediaQuick destination for episodes

**Files:**
- Modify: `src/features/media-quick/types.ts`
- Modify: `src/features/media-quick/build-media-quick-selection.ts`
- Modify: `src/features/media-quick/build-media-quick-view-model.ts`
- Modify: `src/features/media-quick/__tests__/build-media-quick-view-model.test.ts`
- Modify: `src/features/media-quick/__tests__/build-media-quick-selection.test.ts`

**Interfaces:**
- Produces: `PrimaryDestination` episode variant; `selection.episodeId`

- [ ] Add `episodeId` to selection; populate in `selectionFromEpisode` (+ upcoming episode if applicable).
- [ ] Episode-first branch in `resolvePrimaryDestination`.
- [ ] Tests.
- [ ] Commit: `feat: mediaquick navigates to episode detail`

### Task 4: Episode detail screen + i18n

**Files:**
- Create: `app/(tabs)/series/[id]/episode/[episodeId].tsx`
- Modify: `app/(tabs)/series/_layout.tsx` if screens are declared
- Modify: `src/i18n/locales/en.ts`, `fr.ts`, `message-key.ts`
- Optionally extract shared download helper from `app/(tabs)/series/[id].tsx` only if duplication is painful; otherwise copy the small grab pattern.

**Interfaces:**
- Consumes: hooks from Task 2, enriched `Episode`, MediaQuick destination from Task 3

- [ ] Build screen: header, meta, overview, langs, guests, cast/crew, links, see series, suivi, delete file, download + AudioChoiceSheet.
- [ ] `shouldNavigate` for self.
- [ ] i18n keys.
- [ ] Commit: `feat: add series episode detail screen`

### Task 5: Verify

- [ ] `npm test` (affected + full if fast)
- [ ] Reload Expo on emulator if running

---

## Spec coverage

| Spec item | Task |
|-----------|------|
| Route + MediaQuick | 3, 4 |
| Overview / quality / size | 1, 4 |
| Guest stars | 2, 4 |
| Series cast/crew | 4 |
| Download / suivi / delete file | 2, 4 |
| shouldNavigate | 4 |
| No track editing | — |
