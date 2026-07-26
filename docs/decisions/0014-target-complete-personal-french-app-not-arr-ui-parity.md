---
status: accepted
date: 2026-07-26
decision-makers: "Arrmada maintainer"
---

# Target a complete personal French app, not arr UI parity

## Context and Problem Statement

The first MVP sliced ARRapp thinly (no episode lists, English chrome, queue jargon). The product goal is now a **complete personal** client for one non-technical user: full day-to-day control of Films and Séries at home — **without** cloning the Radarr/Sonarr web UIs.

## Decision

1. **Scope**: complete for personal use (libraries, **Saison** / **Épisode**, **À venir** list + **Calendrier**, Accueil preview + dedicated tab, **Télécharger**, **Retirer**, **Téléchargements** with Pause/Reprendre + Annuler, optional **Verrou**, local **Notifications** per ADR-0013). Not feature parity with \*arr (no indexers UI, custom formats, blocklist browsers, etc.).
2. **Language**: Bilingual UI (**fr** / **en**). Resolution: Settings preference `system` | `fr` | `en` (default `system`); when `system`, device `fr*` → French, otherwise English. Natural English copy (Movies, Series, …). Product glossary for agents remains French in root `CONTEXT.md`.
3. **Network**: still one Radarr + one Sonarr, **LAN only** (ADR-0004).
4. **Availability language**: **À venir** / **À télécharger** / **Dispo** — never a single catch-all “missing”.

## Consequences

- Good, because agents have a clear ceiling (_arr parity out_) and floor (episodes/seasons/calendar in)
- Good, because `CONTEXT.md` becomes the copy/domain source of truth
- Bad, because current MVP screens/code lag the glossary (expected debt)
- Neutral, because technical ADRs 0002–0008 remain in force unless superseded

## Considered Options

- Stay MVP-thin and defer episodes/calendar (rejected)
- Full \*arr parity on mobile (rejected — ADR-0011)
- Complete personal French app (chosen)

## Implementation Plan

- **Affected paths**: all `app/**` UI copy; series detail (seasons/episodes); new À venir tab; Accueil preview; filters for availability states; README smoke checklist
- **Patterns to follow**: `CONTEXT.md` terms; silent add (ADR-0012); notifications (ADR-0013); Verrou (ADR-0009)
- **Patterns to avoid**: reintroducing Interactive Search as a primary path; hardcoding a single UI language; “missing” as one filter meaning both unreleased and undownloaded

### Verification

- [ ] `CONTEXT.md` exists and is consulted for user-facing terms
- [ ] No new user-facing English jargon for concepts already named in `CONTEXT.md`
- [ ] Series UI exposes Saison / Épisode; À venir has list ↔ Calendrier switch
- [ ] Filters/badges distinguish À venir vs À télécharger vs Dispo

## More Information

- `CONTEXT.md`
- Grill-with-docs session 2026-07-26
- Related: ADR-0004, ADR-0009, ADR-0011, ADR-0012, ADR-0013
