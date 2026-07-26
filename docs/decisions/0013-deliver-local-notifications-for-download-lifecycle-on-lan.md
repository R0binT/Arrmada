---
status: proposed
date: 2026-07-26
decision-makers: "Arrmada maintainer"
---

# Deliver local Notifications for download lifecycle on LAN

## Context and Problem Statement

ADR-0004 previously treated push notifications as a non-goal. For a complete personal app, the user wants phone alerts when a **Téléchargement** starts, becomes **Dispo**, or fails — while remaining **home Wi‑Fi only** (no backend, no remote UX).

## Decision

Ship **local Notifications** (device-scheduled / local) for exactly three events:

1. Téléchargement started
2. Became **Dispo**
3. Failed

No “sortie bientôt” / À venir spam. No cloud push provider required for v1 of this feature. Detection may use background-friendly polling against Radarr/Sonarr **only while the phone can reach the LAN** (and must degrade quietly when offline/away from home).

This **supersedes** the “Push notifications” non-goal bullet formerly in ADR-0004.

## Consequences

- Good, because the app feels complete without opening it constantly
- Good, because scope stays three clear events (`CONTEXT.md`)
- Bad, because reliable LAN background work on Android is constrained (Doze, Wi‑Fi, Expo limits)
- Bad, because no alerts when the user is away from home (accepted with ADR-0004)
- Neutral, because a future remote/push ADR could extend this

## Considered Options

- No notifications (rejected in grilling)
- Minimum: Dispo + failed only
- Dispo + failed + started (chosen)
- Also notify for À venir (rejected — noisy)

## Implementation Plan

- **Affected paths**: new notifications module under `src/`, queue/home observers, Android notification permission UX (French copy)
- **Dependencies**: Expo notifications APIs compatible with SDK 57; follow https://docs.expo.dev/versions/v57.0.0/
- **Patterns to follow**: ADR-0003 (no backend); ADR-0004 (LAN only); reuse queue polling ideas from ADR-0006 without spamming the UI layer
- **Patterns to avoid**: requiring a VPS/webhook bridge; notifying for calendar/À venir; English notification copy

### Verification

- [ ] Only the three event types can fire
- [ ] No notification when offline / not on LAN (no crash, no misleading “failed” for unreachable host unless product defines that separately)
- [ ] Copy matches `CONTEXT.md` (**Notification**, **Dispo**, **Téléchargement**)
- [ ] ADR-0004 no longer lists push notifications as a blanket non-goal

## More Information

- Related: ADR-0003, ADR-0004, ADR-0006, ADR-0011
- `CONTEXT.md` — **Notification**
- Grill-with-docs 2026-07-26
