# Audio & subtitle language chips — Design

Date: 2026-07-29  
Status: Approved (conversation)

## Goal

Show **short language codes** for **audio** and **subtitles** on downloaded movies and series episodes, on both **detail screens** and **MediaQuick**.

## Decisions

| Topic | Choice |
|--------|--------|
| Surfaces | Film detail, series episode rows (+ episode MediaQuick), movie MediaQuick |
| Series granularity | Per episode (when `hasFile`) |
| Display | Short codes (e.g. `FR`, `EN`, `JA`) as chips |
| Data source | Arr `mediaInfo` on the downloaded file (`movieFile` / `episodeFile`) |
| When missing | Hide the row/chips (no placeholder noise) |
| Out of scope | Indexer release language UX (VF/VO grab chooser already exists) |

## Data mapping

### Movies (Radarr)

- `GET /api/v3/movie/{id}` already embeds `movieFile` when present.
- Parse `movieFile.mediaInfo` (and related fields Radarr may expose) into:
  - `audioLanguageCodes: readonly string[]`
  - `subtitleLanguageCodes: readonly string[]`
- Normalize to short uppercase codes (prefer ISO-like tokens from Arr; collapse duplicates; drop empties).

### Series episodes (Sonarr)

- Current `GET /api/v3/episode?seriesId=` does not reliably include full `mediaInfo`.
- Load episode files for the series (`/api/v3/episodefile?seriesId=`) and join by `episodeFileId` / episode id onto each `Episode`.
- Same normalized code arrays on `Episode` when `hasFile`.

### Shared helper

- Pure mapper: Arr mediaInfo payload → `{ audioLanguageCodes, subtitleLanguageCodes }`.
- Unit-tested with representative Radarr/Sonarr fixtures (single track, multi, missing mediaInfo, odd strings).

## UI

### Film detail

- When `hasFile` and codes non-empty: show two compact chip rows (or one combined block) near existing `MediaMetaBlock` / quality chips:
  - Label **Audio** + chips
  - Label **Sous-titres** / **Subtitles** + chips
- i18n keys for labels only; codes stay language-agnostic.

### Series detail

- On each episode row that has a file: show the same short chips (audio + subs) in a compact secondary line so the list stays readable.
- No series-level aggregate in v1.

### MediaQuick

- Extend selection / view-model with optional `audioLanguageCodes` / `subtitleLanguageCodes`.
- When downloaded (`dispo` / has file) and codes present: render as library chips (alongside quality), or a short labeled line if chip budget is tight.
- Movie and episode kinds; season/series sheets skip unless an episode file is the selection.

## Non-goals

- Changing grab / indexer VF–VO logic.
- Showing languages for items without a local file.
- Full mediaInfo dump (codec, channels, forced flags) beyond language codes in v1.
- Editing tracks or downloading missing subs from the app.

## Success criteria

- Downloaded movie detail shows audio/subtitle short codes when Radarr provides mediaInfo.
- Downloaded episode rows and episode MediaQuick show the same when Sonarr provides mediaInfo.
- No codes shown when there is no file or mediaInfo is empty.
- Mappers covered by unit tests; French/English UI labels present.
