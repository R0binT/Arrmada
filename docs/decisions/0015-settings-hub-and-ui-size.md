---
status: accepted
date: 2026-07-26
decision-makers: "Arrmada maintainer"
---

# Settings hub with Services / Preferences and UI size presets

## Context and Problem Statement

Settings was a single long screen (Radarr/Sonarr forms, language, Verrou, locked appearance). Users need clearer navigation and a way to enlarge or tighten the interface without a light theme.

## Decision

- **Hub** at `app/(tabs)/settings/` with Stack routes: `index` (hub), `services`, `preferences`.
- **Services** owns Adresse / Clé d’accès, connection test, and Save.
- **Preferences** owns language, **interface size** (Compact / Normal / Comfortable), Verrou, and the locked dark-theme note.
- UI size scales type and density (~0.9 / 1.0 / 1.15) via `UiSizeProvider` + AsyncStorage (`arr.uiSize`). Touch targets stay ≥ 44.

## Consequences

- Good: one concern per screen; size is explicit and persisted.
- Bad: not every screen uses scaled tokens yet — migrate incrementally.
- Neutral: theme remains dark-only.

## Implementation Plan

- **Affected paths**: `app/(tabs)/settings/**`, `src/lib/ui-size.ts`, `src/lib/UiSizeProvider.tsx`, settings feature cards, Accueil / Films titles as first scaled surfaces
- **Patterns to follow**: bilingual keys; stack like Films; Secure Store for secrets only
- **Patterns to avoid**: putting API keys on Preferences; clearing UI size when clearing Arr config

### Verification

- [ ] Hub navigates to Services and Preferences
- [ ] Services save/test unchanged in behavior
- [ ] Size persists across relaunch
- [ ] `ui-size` unit tests pass

## More Information

- Spec: `docs/superpowers/specs/2026-07-26-settings-hub-preferences-design.md`
- Related: ADR-0007, ADR-0014 (i18n)
