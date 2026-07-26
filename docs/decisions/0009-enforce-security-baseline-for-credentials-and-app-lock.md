---
status: accepted
date: 2026-07-26
decision-makers: "Arrmada maintainer"
consulted: ""
informed: ""
---

# Enforce security baseline for credentials and app lock

## Context and Problem Statement

API keys unlock full control of media libraries. ADR-0007 stores them in Secure Store, but Settings may still show secrets, and the unlocked phone can open the app freely. What additional security baseline should bind future work for a non-technical personal user?

## Decision Drivers

- Protect API keys at rest and in UI
- Prefer optional friction (user is non-technical; not every open needs a PIN)
- Prefer platform biometrics when available
- Stay compatible with LAN cleartext (ADR-0008) without pretending WAN cleartext is safe
- Align with ubiquitous language: **Clé d’accès**, **Verrou** (`CONTEXT.md`)

## Considered Options

- Baseline only (Secure Store + no logging) — status quo
- Mandatory Verrou on every app open
- Baseline + UI masking + **optional** Verrou (off by default; on before revealing/editing keys when enabled)

## Decision Outcome

Chosen option: **Baseline + masking + optional Verrou (off by default)**, status **`accepted`**.

**Baseline (already required by ADR-0007, restated here):**

- Credentials only in Secure Store via `secure-config.ts`
- Never log keys
- No cloud sync of secrets

**Hardening:**

- Mask Clés d’accès in Settings/onboarding (reveal only on explicit user action)
- **Verrou** (PIN or biometrics via Expo Local Authentication) is **optional**, **off by default**, toggled in Settings
- When Verrou is on: require success before opening the app and before revealing or editing Clés d’accès
- Refuse any new persistence path for *arr secrets outside Secure Store (`secure-config.ts`); PIN hash for Verrou lives in `app-lock.ts` via Secure Store

### Consequences

- Good, because security intent is explicit for agents
- Good, because non-tech users are not forced into PIN friction
- Bad, because optional lock can stay off on a shared phone unless the user enables it
- Neutral, because LAN cleartext remains a separate accepted risk (ADR-0008)

## Implementation Plan

- **Affected paths**: `src/lib/secure-config.ts`, `src/lib/app-lock.ts`, `src/features/verrou/**`, `src/features/settings/**`, `app/onboarding.tsx`, `app/(tabs)/settings.tsx`, `app/_layout.tsx`
- **Dependencies**: `expo-local-authentication`, `expo-crypto` (Expo SDK 57)
- **Patterns to follow**: ADR-0007 storage module; French UI labels (**Clé d’accès**, **Verrou**); never pass raw keys into logs; PIN fallback if biometrics fail
- **Patterns to avoid**: mandatory lock on first install; storing PIN as a substitute for *arr keys; inventing bespoke crypto beyond SHA-256 + salt for the PIN hash
- **Migration steps**: done — mask keys → Verrou setting (default off) → gate reveal/edit + cold start / resume → mark accepted

### Verification

- [x] Clé d’accès fields masked by default
- [x] Verrou defaults to off; when on, unlock required to open app and to reveal/edit keys
- [x] *arr secrets remain in `secure-config.ts` only
- [x] ADR status flipped to `accepted`

## More Information

- Related: ADR-0007, ADR-0008, ADR-0011, `CONTEXT.md`
- Grill-with-docs session 2026-07-26: Verrou = B (optional, off by default)
- Ticket: https://github.com/R0binT/ARRapp/issues/14
