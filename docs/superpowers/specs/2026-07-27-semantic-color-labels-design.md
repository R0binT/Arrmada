# Semantic color coherence — MediaQuick, labels, filters

**Date:** 2026-07-27  
**Branch:** `feat/ui-design-system`  
**Status:** Draft for approval

## Goal

Give status and filter labels a small, consistent set of semantic colors so the app no longer reads as “everything gray,” while keeping the dark-cinema DNA (cream text, amber accent `#F5A524`, `#0B0B0F`).

## Principles

1. **Semantic first** — color encodes meaning (available / to download / upcoming / error), not decoration.
2. **One mapping** — availability and related statuses share the same `ChipTone` rules everywhere.
3. **Muted fills** — prefer `*Muted` backgrounds + colored label text (existing Chip tones), not solid neon pills, except where already established (active library filter = solid amber; queue `StatusChip` solid accents).
4. **No rainbow meta** — genres / runtime / studio stay mostly neutral; only a few meta chips get soft accent (service Radarr/Sonarr, quality).

## Shared availability → tone

| Availability / meaning | ChipTone | Notes |
| --- | --- | --- |
| `dispo` | `success` | Green |
| `aTelecharger` | `accent` | Amber |
| `aVenir` | `warning` | Soft gold |
| Unknown / neutral info | `neutral` | Gray |

Queue statuses keep the existing solid `StatusChip` styles (downloading accent, completed success, failed/stalled danger). MediaQuick status line continues to map via `MediaQuickStatusTone` → ChipTone (`success` / `accent` / `neutral` / `danger`).

Helper: add a small pure function (e.g. `availabilityChipTone(availability)`) used by detail headers, MediaQuick (already parallel), and any other availability Chip.

## MediaQuick

- **Status chip:** use tone styles as-is; remove gray overrides that force `neutralMuted` / `borderSubtle` over semantic colors.
- **Meta chips:** default `neutral`; tint:
  - Radarr / Sonarr → `accent`
  - file quality (when shown as chip later) → `warning`
  - genres, runtime, network, ETA, sizes → `neutral`
- **Sheet chrome:** `surfaceRaised` (or elevated token) for sheet + panel so it lifts off the scrim; keep drag handle on `handle`.
- **Layout:** optional compact poster thumbnail beside title when `posterUrl` is present (glanceable, streaming-ish). If poster wiring adds friction, ship colors first and poster as same-PR stretch.

View-model change: chips become `{ label: string; tone: ChipTone }[]` (or parallel arrays) so the panel does not guess tones from strings.

## Detail screens (movie / series)

- Replace `<Chip tone="neutral">{statusLabel}</Chip>` with tone from `availabilityChipTone(...)`.
- Episode availability text/chips (series detail) use the same mapping when rendered as Chip; plain muted text for long lists is OK if Chip density would clutter — prefer Chip when space allows.

## Library filter chips (movies + series)

Inactive chips today are gray border + muted label; only active is solid amber for *all* filters.

Target:

| Filter key | Inactive | Active |
| --- | --- | --- |
| `all` | neutral border / muted text | solid amber (current) |
| `suivi` | soft accent border/text | solid amber or accent fill |
| `aVenir` | warning muted | warning fill + dark label |
| `aTelecharger` | accent muted | accent fill + dark label |
| `dispo` | success muted | success fill + dark label |

Active state must remain clearly selected (contrast on cream/dark). Prefer shared style helper used by both library screens so movies/series stay identical.

## Other labels

- `LookupStatusBadge`: `alreadyDownloaded` → `success` (already); `inLibrary` → `accent` instead of neutral.
- Do **not** recolor body copy / meta rows / captions — only chips and filter pills.

## Out of scope

- New brand colors beyond existing theme tokens.
- Redesigning PosterCard overlays or home hero.
- Changing queue `StatusChip` solid style language (already coherent).

## Acceptance

- Opening MediaQuick on a “Dispo” vs “À télécharger” item shows differently colored status chips.
- Movie/series detail status chip matches that color language.
- Library filters show distinct inactive tints; active state remains obvious.
- No hard-coded hex outside `src/lib/theme`.
- Typecheck + existing media-quick / variant-styles tests updated/green.
