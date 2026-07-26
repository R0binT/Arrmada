---
status: accepted
date: 2026-07-26
decision-makers: "Arrmada maintainer"
---

# Use silent defaults when adding a Film or Série

## Context and Problem Statement

Radarr/Sonarr require a quality profile and root folder to add media. Exposing those controls confuses a non-technical user. The add screens today still show “Quality profile” and folder pickers even though API defaults are already loaded.

## Decision

**Ajouter** uses server defaults only: one primary action to add the chosen title. Do not show quality profile or root folder choosers in the normal flow. Advanced overrides need a future ADR if ever required.

Align UI copy with `CONTEXT.md` (**Ajouter**, French UI).

## Consequences

- Good, because add stays one mental step (pick title → Ajouter)
- Good, because matches KISS / anti over-engineering (ADR-0011)
- Bad, because users with multiple profiles/folders cannot pick per-title without leaving the app
- Neutral, because defaults still come from the \*arr instance

## Considered Options

- Silent defaults (chosen)
- Soft labels « Qualité » / « Dossier » pre-filled and editable
- Quality only; folder always default

## Implementation Plan

- **Affected paths**: `app/(tabs)/movies/add.tsx`, `app/(tabs)/series/add.tsx`, related feature hooks
- **Patterns to follow**: keep calling defaults APIs internally; pass `defaultQualityProfileId` / `defaultRootFolderPath` on POST
- **Patterns to avoid**: reintroducing profile/folder pickers “just in case”; English jargon on add screens

### Verification

- [x] Add screens have no quality/folder picker UI
- [x] Add still succeeds when defaults exist on the \*arr instance
- [x] User-visible copy uses French domain terms from `CONTEXT.md`

## More Information

- `CONTEXT.md` — **Ajouter**
- Grill-with-docs 2026-07-26
