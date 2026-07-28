# Streaming-style rich info UI — design

**Date:** 2026-07-28  
**Status:** Approved in brainstorming; pending user review of this written spec  
**Extends:** `2026-07-28-rich-media-info-design.md` (data/model stay; this is presentation only)

## Goal

Replace the wall-of-text rich-info presentation with a streaming-app look (Netflix / Disney+–inspired): badges, compact crew, horizontal cast rail, pill links — without new APIs or data fields.

MediaQuick keeps the same visual language in an ultra-compact form (no cast photos).

## Decisions

- Direction: **streaming** (not IMDb-dense, not polish-only).
- Approach: **rails + badges** (not hero meta strip, not surface cards per section).
- MediaQuick: same language, compact — ≤2 rating badges, crew line + cast names in detail text, no avatars.
- Crew on detail: **headline + single compact line** (not bare line, not multi-line `Job: Name`).
- Cast character/role captions: **out of scope** (not on `CastMember` today).
- No new background cards; hierarchy via existing `Chip`, `Text`, spacing, and avatars.

## Detail page

Order under header (unchanged):

1. Ratings  
2. Meta chips  
3. Overview  
4. Crew  
5. Cast  
6. Links  

### Ratings

- One badge / chip per score (source label + value), horizontal wrap.
- Stop joining scores with ` · ` into a single text node.
- Cap around 4 badges; hide section when empty.
- Reuse existing `formatRatingLabel` (or split label/value for chip content) and `Chip` tones.

### Meta

- Keep `MediaMetaBlock` chips.
- Prefer short chip labels; avoid turning date chips into long sentences when a short form already exists.

### Crew

- Headline (`detail.crew`) + **one** muted body line.
- Format: short job labels + names, separated by ` · `  
  e.g. `Réal. Nolan · Scénario Nolan` / `Dir. Nolan · Writer Nolan`.
- Job priority unchanged (Director / Creator / Writer first); still driven by existing credits data (max 6).
- Add compact i18n keys for short job prefixes (FR/EN).

### Cast

- Headline kept.
- Horizontal `ScrollView` (no wrap grid).
- Circular photo (or initial fallback) + name under (2 lines max).
- No character name under the actor for this pass.

### Links

- Headline kept.
- Pressable pills/chips for IMDb / TMDB / TVDB (same URLs as today).
- Not plain underlined text labels only.

## MediaQuick

- Ratings: up to **2** chips/badges near other chips (or dedicated small row); remove joined rating string from the dense detail line when badges are shown.
- Crew: one compact line in `detailLine` (same short-job format as detail).
- Cast: names only (`Acteurs: …` / existing cast label); no photos, no rail.
- Other chips (quality, dates, certification, etc.): keep current behavior.

## Components / touch points

| Area | Change |
|------|--------|
| `RatingsRow` | Badges instead of single joined `Text` |
| `CrewSection` | Headline + one compact line |
| `CastSection` | Horizontal scroll rail |
| `ExternalLinksRow` | Pill/chip pressables |
| MediaQuick view-model + panel | Rating chips ≤2; crew/cast still in detail line; no photos |
| i18n | Short crew job prefixes FR/EN |

No Arr mapper / type changes required for this pass.

## Out of scope

- Character/role on cast members  
- Third-party rating APIs  
- Redesign of overview, poster header, or add-flow  
- Surface “card” wrappers around each section  
- Cast photos in MediaQuick  

## Acceptance

- Detail: ratings read as badges; crew is one line under a headline; cast scrolls horizontally; links look like pills.
- MediaQuick: ≤2 rating badges; crew + cast remain text-only and glanceable.
- Empty states still hide the empty block.
- Existing unit tests updated for formatting / view-model changes; no new network calls.
