# GitHub Pages hero support copy — design

**Date:** 2026-07-26  
**Status:** Approved for implementation after user review of this spec

## Goal

Make the first-section support paragraph on the GitHub Pages site feel welcoming and everyday-use oriented, not stack- or architecture-oriented.

## Audience intent

- Lead with what the person does in the app (browse, add, follow releases, manage downloads).
- Keep a soft “phone at home” nod.
- Avoid jargon: Expo, Android-first, “talking directly”, repeating one Radarr / one Sonarr (already covered by the tagline).

## Final copy

**Support paragraph (`.support`):**

> Browse movies and series, add what you want, follow upcoming releases, and manage downloads — all from your phone at home.

## Scope

| In scope | Out of scope |
| --- | --- |
| `docs/index.html` — `.support` paragraph only | Tagline, H1, CTAs, features section, layout/CSS |
| `README.md` — matching support sentence only (keep the UI-language sentence) | Meta / Open Graph description rewrite |
| | French translation of the marketing page |

## Non-goals

- No visual redesign of the hero.
- No change to product positioning beyond this wording (Radarr/Sonarr + home LAN remain in the tagline).

## Acceptance

- GitHub Pages hero support text matches the final copy above.
- README intro support sentence matches the same wording (language-preference sentence unchanged).
- No new technical terms introduced in that sentence.
