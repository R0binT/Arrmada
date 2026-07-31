# Choose release file — Design

Date: 2026-07-30  
Status: Approved  
Branch: `fix/add-download-timeout-and-search` (or follow-up branch if that PR lands first)

## Goal

On movie, episode, and season detail actions, let the user pick which Arr release (“file”) to download, while keeping a smart **Download** path that grabs automatically when the choice is clear.

## Decisions

| Topic | Choice |
| --- | --- |
| Where | Movie fiche, episode fiche, season action on series fiche |
| Primary CTA | **Download** — auto if clear, else open picker |
| Secondary CTA | **Choose a file** — always opens the picker |
| Ambiguous VF/VO | Open full release list (not only `AudioChoiceSheet`) |
| Season | `getSeriesReleases` filtered to that `seasonNumber` (packs + episode releases); packs sorted first when detectable |
| Out of scope | Add/preview flows, MediaQuick, whole-series `SeriesSearch` button behaviour, dedicated VF/VO-only sheet redesign |

## UX

### Buttons

- **Download** (primary): fetch offers → `resolveReleaseDecision`:
  - `grab` → `grabRelease` → toast download started
  - `choose` → open `ReleasePickerSheet` with the full list
  - `empty` → toast no release
- **Choose a file** (secondary, always visible when download is offered): open the same sheet (fetch if needed).

### ReleasePickerSheet

Modal sheet (same present/dismiss pattern as `AudioChoiceSheet`):

- States: loading, empty, list
- Row: title, quality, size, seeders, indexer, languages
- Rejected offers: shown muted, not tappable (show rejection reason when short)
- Sort: quality weight → seeders → size; season packs preferred at top for season scope
- Tap eligible row → grab → dismiss → toast

## Data / API

- Movie: existing `getMovieReleases` / `useMovieReleases` + `grabRelease`
- Episode: `getEpisodeReleases` + new `useEpisodeReleases` (mirror movie hook) + series `grabRelease`
- Season: `getSeriesReleases(seriesId)` then filter `seasonNumber === N` (include packs where `episodeId` is missing)

Reuse `resolveReleaseDecision` for the smart path. No change to Arr HTTP timeout work from the parallel fix.

## Architecture

```
Detail screen CTAs
  ├─ Download → startSmartOrPickDownload(fetch, grab, onNeedPick)
  └─ Choose file → open ReleasePickerSheet(fetch)

ReleasePickerSheet
  └─ FlatList<ReleaseOffer> → grabRelease(guid, indexerId)
```

- New: `src/components/ReleasePickerSheet.tsx`
- New: `src/features/releases/start-smart-or-pick-download.ts` (or equivalent small helper)
- Wire: `app/(tabs)/movies/[id].tsx`, `app/(tabs)/series/[id]/episode/[episodeId].tsx`, season download in `app/(tabs)/series/[id].tsx`
- i18n (`fr` / `en`): `action.chooseFile`, `release.pickerTitle`, `release.noOffers`, `release.rejected` (as needed)

## Error handling

Surface Arr errors via existing `getArrErrorMessage` / `getErrorMessage` (timeout vs Wi‑Fi already distinguished). Picker fetch failures show inline error + dismiss/retry.

## Testing

- Unit: season filter / pack ordering helper
- Unit: smart-or-pick maps `grab` / `choose` / `empty` correctly
- Keep existing `resolveReleaseDecision` tests green

## Out of scope

- Interactive-search full screen with filters
- Changing add-flow to show the picker
- Replacing `SeriesSearch` for “download whole series”
