# Episode detail page — Design

Date: 2026-07-29  
Status: Approved (conversation)

## Goal

From MediaQuick on a series episode, **Voir la fiche** opens a dedicated episode detail screen (parity with movie/series detail where it makes sense for an episode).

## Decisions

| Topic | Choice |
|--------|--------|
| Route | `/(tabs)/series/[id]/episode/[episodeId]` |
| Entry | MediaQuick episode CTA; list press stays MediaQuick |
| Poster | Series poster |
| Cast | Series cast/crew (existing TVMaze hooks) **plus** episode guest stars |
| File actions | Download (smart grab), episode monitored toggle, delete episode **file** only |
| Track editing | Out of scope |
| When MediaQuick already on this episode page | `shouldNavigate` suppresses same-destination push |

## Navigation

1. Add `episodeId` on `MediaQuickSelection` when `kind === "episode"`.
2. Extend `PrimaryDestination` with episode pathname + params `{ id, episodeId }`.
3. `resolvePrimaryDestination`: episode branch **before** series branch.
4. Episode screen `shouldNavigate` mirrors series screen (ignore nav to self).

## Data

### Episode model extensions

Map from Sonarr episode (+ joined episodefile):

- `overview: string`
- `episodeFileId: number | undefined`
- `fileQuality: string | undefined`
- `sizeOnDisk: number | undefined`
- `runtimeMinutes: number | undefined`
- Keep existing: ids, title, air date, hasFile, monitored, availability, language codes

Join remains `episode.episodeFileId` → `episodefile.id` (not `episodeId` on files).

### Sonarr client

- `updateEpisode(id, { monitored })` — GET then PUT `/api/v3/episode/{id}`
- `deleteEpisodeFile(episodeFileId)` — DELETE `/api/v3/episodefile/{id}`
- Reuse `getEpisodeReleases` + `grabRelease` for download

### Guest stars

- Resolve series `tvMazeId`, then TVMaze episode-by-number with `embed=guestcast` (or equivalent).
- Map with existing cast mapper shape; show in a **Guest stars** section (hide if empty).
- Series cast/crew unchanged on the same screen.

## UI (screen)

Immersive header: series poster, episode title, subtitle `Series · SxxEyy`, availability chip, optional year/air meta.

Body:

- Meta: air date, runtime, file quality/size when present
- Overview when non-empty
- Audio / subtitle language chip rows when `hasFile` and codes present
- Guest stars (episode)
- Series cast + crew
- External links for the **series**
- Suivi switch (episode `monitored`)
- Retirer le fichier (only if `hasFile` / `episodeFileId`) — confirm, then delete file and refresh; stay on page or back to series after success
- Download when `canOfferDownload(availability)` — same smart-grab + audio choice sheet as series list

Back navigates to the previous screen (typically the series fiche); no separate « see series » CTA.

Loading / error: same skeleton + `ErrorBanner` pattern as movie/series detail.

## i18n

Add keys as needed (`detail.guestStars`, delete-file confirm/a11y, see-series CTA, etc.) in `en` + `fr` + `MessageKey`.

## Non-goals

- Manual audio/subtitle track editing or remux
- Removing the whole series from this screen
- Changing indexer VF/VO grab logic beyond reusing smart-grab

## Success criteria

- MediaQuick on an episode navigates to the new page and shows episode facts.
- Guest stars appear when TVMaze provides them; otherwise section hidden.
- Download / suivi / delete file work against Sonarr.
- Same-page « Voir la fiche » does not stack duplicate routes.
- Unit tests cover destination resolution, episode mapping extensions, and new client methods.
