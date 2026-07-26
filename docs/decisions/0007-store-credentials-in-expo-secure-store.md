---
status: accepted
date: 2026-07-26
decision-makers: "Arrmada maintainer"
---

# Store credentials in expo-secure-store

## Context and Problem Statement

Radarr/Sonarr API keys are secrets. Where may the app persist URLs and keys on Android?

## Decision

Persist `radarrUrl`, `radarrApiKey`, `sonarrUrl`, `sonarrApiKey` **only** via `expo-secure-store`, through `src/lib/secure-config.ts`.

Rules:

* Never log API keys (or write them to analytics/crash reports)
* Never commit live keys to git, AsyncStorage, plain files, or `app.json`
* Incomplete Secure Store config forces onboarding (`isConfigComplete`), unless a complete **optional** build-time `.env` seeds the store once (personal self-builds — see below)

**Optional env bootstrap (personal builds):** `EXPO_PUBLIC_RADARR_*` / `EXPO_PUBLIC_SONARR_*` may seed Secure Store on first launch when the store is empty (`src/lib/env-arr-config.ts`). After a successful seed, `arr.envBootstrapped` is set (via `markEnvBootstrapped` in `secure-config.ts`) so a later wipe does **not** re-inject keys from the APK (key rotation / intentional clear). These values are inlined into the JS bundle — suitable for LAN self-builds only, not for shipping secrets to untrusted users. `.env` is gitignored; `.env.example` is the template.

Non-goals: cloud backup of credentials; sharing keys across devices.

## Consequences

* Good, because keys use platform secure storage
* Good, because a single module owns read/write/clear
* Bad, because Secure Store behavior differs slightly by platform
* Neutral, because URLs are also stored there for consistency

## Implementation Plan

* **Affected paths**: `src/lib/secure-config.ts`, `src/lib/env-arr-config.ts`, `src/lib/__tests__/secure-config.test.ts`, `src/lib/__tests__/env-arr-config.test.ts`, `src/hooks/use-arr-clients.ts`, onboarding/settings, `app/index.tsx`
* **Dependencies**: `expo-secure-store` (already present); Expo `EXPO_PUBLIC_*` dotenv for optional personal builds
* **Patterns to follow**: trim URLs on save; keys named `arr.*`; clients memoized only when config complete; env seeds store only when store incomplete and `arr.envBootstrapped` is unset
* **Patterns to avoid**: `console.log` of config objects that include keys; duplicating Secure Store calls outside `secure-config.ts`; committing a filled `.env`; re-seeding from `EXPO_PUBLIC_*` after the user cleared credentials

### Verification

- [ ] All Secure Store access is in `src/lib/secure-config.ts`
- [ ] `isConfigComplete` unit tests pass
- [ ] Env bootstrap only writes when store incomplete and not yet bootstrapped (`env-arr-config` tests)
- [ ] `rg "apiKey|ApiKey" src -g'!**/secure-config.ts' -g'!**/env-arr-config.ts' -g'!**/__tests__/**'` shows no persistence outside secure-config/clients headers
- [ ] No filled `.env` is required to run the app (onboarding still works)

## Alternatives Considered

* AsyncStorage / MMKV: Rejected — not appropriate for secrets.
* Hardcoded constants: Rejected — insecure and inflexible.
* OS password manager only: Rejected — worse UX for LAN URLs + keys pairing.

## More Information

* Related: ADR-0009 (broader security, including app lock — proposed)
* Related: ADR-0003
