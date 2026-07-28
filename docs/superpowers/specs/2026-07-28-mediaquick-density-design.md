# MediaQuick density — design

**Date:** 2026-07-28  
**Status:** Approved (revised after empty-sheet feedback)  
**Extends:** `2026-07-28-streaming-rich-info-ui-design.md`

## Goal

Make MediaQuick less cramped for movie/series without looking empty. Full rich info stays on the detail page.

## Decisions

- Approach: chips + **separate** detail lines (not one joined ` · ` blob).
- People: **crew if present, else cast** — never both.
- Chips keep reliable Arr fields: ratings ≤2, cert, **genres ≤2**, runtime, studio/network, quality when `dispo`, series episode progress.
- Detail lines: release/air date; people line.
- Still out: collection, “added on”, size on disk, dual people lines.
- Season / episode / other kinds: unchanged (still use genres there).

## Why the sheet looked empty

After the first density pass, genres/quality/added were removed. Ratings, certification, and release dates are often missing in Arr payloads, and cast/crew arrive only after an async credits fetch — so many titles showed almost nothing until credits loaded (or forever if credits were empty).

## Layout

- Slightly larger gap between header, chips, and detail lines in `MediaQuickPanel`.
- `detailLines: readonly string[]` instead of a single joined `detailLine`.

## Out of scope

- Redesign of add-flow buttons / poster header  
- Cast photos in MediaQuick  
- Changing detail-page rich info structure  
