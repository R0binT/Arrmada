---
status: accepted
date: 2026-07-26
decision-makers: "Arrmada maintainer"
consulted: ""
informed: ""
---

# Choose Expo and TypeScript for the Android client

## Context and Problem Statement

Arrmada needs an Android mobile client written in TypeScript with a polished UI. Which mobile stack should we use so a solo maintainer can ship fast while keeping a modern React component model?

## Decision Drivers

* TypeScript end-to-end
* Fast local iteration for a personal LAN app
* Access to secure storage, fonts, images, and Android cleartext config
* Prefer managed workflow over heavy native setup

## Considered Options

* Expo (React Native) + TypeScript + Expo Router
* React Native CLI (bare) + TypeScript
* Capacitor / Ionic (web shell)

## Decision Outcome

Chosen option: "Expo (React Native) + TypeScript + Expo Router", because it matches the TypeScript requirement, minimizes native toolchain friction, and already powers the MVP (`expo ~57`, `expo-router`).

Non-goals: iOS-first shipping; bare RN workflow unless Expo cannot meet a measured need.

### Consequences

* Good, because OTA/dev client workflows and Expo modules cover Secure Store, fonts, and build properties
* Good, because Expo Router file routes match `app/` structure
* Bad, because some native modules require config plugins / prebuild
* Neutral, because Android is the primary target; iOS may work but is unverified

## Implementation Plan

* **Affected paths**: `package.json`, `app.json`, `app/`, `src/`, `tsconfig.json`, `jest.config.js`
* **Dependencies**: keep Expo SDK 57 line; do not introduce a second navigation library beside Expo Router
* **Patterns to follow**: Expo Router tabs/stacks under `app/`; `@/*` → `src/*`; TypeScript `strict: true`
* **Patterns to avoid**: ejecting to bare RN without an ADR that supersedes this one; mixing Next.js/web-only UI frameworks into the mobile app
* **Configuration**: `app.json` scheme `arrmada`, package `com.arrmada.mobile`, `userInterfaceStyle: dark`

### Verification

- [ ] `package.json` `main` is `expo-router/entry`
- [ ] `npx tsc --noEmit` passes
- [ ] `npm test` passes
- [ ] `npx expo export --platform web` (or Android) completes without module resolution errors

## Pros and Cons of the Options

### Expo + TypeScript + Expo Router

* Good, because managed modules and fast DX
* Good, because aligns with design/plan already implemented
* Bad, because native escape hatches need plugins

### React Native CLI

* Good, because full native control
* Bad, because heavier setup for a personal LAN MVP

### Capacitor / Ionic

* Good, because web skills transfer
* Bad, because weaker native feel for cinema UI and poster-heavy scrolling

## More Information

* Related: ADR-0008 (cleartext), ADR-0007 (Secure Store)
* Spec §2 Constraints
