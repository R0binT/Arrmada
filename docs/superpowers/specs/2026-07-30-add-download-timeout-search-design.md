# Fix add/download timeout and false Wi‑Fi — Design

Date: 2026-07-30  
Status: Implemented  
Branch: `fix/add-download-timeout-and-search`

## Problem

- Adding a series/movie can show “not on Wi‑Fi / cannot reach Sonarr” even when Sonarr works.
- New titles often never start downloading without a manual retry.

## Root cause

1. Arr HTTP used a **10s** abort; slow `POST /series` (or release searches) became `ArrHttpError` kind **`network`**, always mapped to the Wi‑Fi copy.
2. Add set `searchForMissingEpisodes` / `searchForMovie` to **false**, then raced per-episode `/release` before Sonarr was ready — empty/timeout → silent “added” with no download (or false Wi‑Fi).

## Fix

1. Raise Arr HTTP timeout to **60s**; classify `AbortError` as kind **`timeout`** with dedicated i18n (not Wi‑Fi).
2. On add, enable Arr-native search (`searchForMovie` / `searchForMissingEpisodes`).
3. After series add, call `SeriesSearch` (no per-episode release race). After movie add, try smart grab once then `MoviesSearch` fallback. Surface real errors instead of bland “added”.

## Out of scope

Emulator `10.0.2.2` onboarding hint (separate).
