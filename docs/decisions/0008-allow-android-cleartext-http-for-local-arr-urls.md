---
status: accepted
date: 2026-07-26
decision-makers: "Arrmada maintainer"
---

# Allow Android cleartext HTTP for local arr URLs

## Context and Problem Statement

Home Radarr/Sonarr installs commonly expose HTTP on the LAN. Android blocks cleartext by default. How should Arrmada reach `http://192.168.x.x` services?

## Decision

Enable Android cleartext HTTP for the app via Expo config:

* `android.usesCleartextTraffic: true` in `app.json`
* `expo-build-properties` plugin with `android.usesCleartextTraffic: true`

This is an explicit tradeoff accepted under LAN-only scope (ADR-0004). It is **not** permission to ship remote cleartext over the public internet as a product feature.

Non-goals: custom per-domain Network Security Config allowlists (may be added later); forcing all users onto HTTPS reverse proxies for MVP.

## Consequences

* Good, because typical home *arr setups work without TLS
* Bad, because traffic on LAN is readable by other LAN devices (accepted risk for MVP)
* Bad, because misconfigured remote HTTP URLs would also be allowed by the OS flag — mitigate with product scope + future ADR-0009 hardening
* Neutral, because HTTPS local URLs still work if the user provides them

## Implementation Plan

* **Affected paths**: `app.json` (`expo.android`, `expo.plugins`)
* **Dependencies**: `expo-build-properties`
* **Patterns to follow**: document LAN HTTP in README; error copy mentions home Wi‑Fi
* **Patterns to avoid**: removing cleartext without a migration path for LAN users; adding remote-access marketing that implies safe cleartext WAN

### Verification

- [ ] `app.json` contains `usesCleartextTraffic: true` at Android level and in `expo-build-properties`
- [ ] README states LAN / HTTP expectation
- [ ] Design/spec still mark remote access out of scope unless superseded

## Alternatives Considered

* Require HTTPS only: Rejected — breaks common home installs.
* Per-domain cleartext allowlist: Deferred — nicer hardening, not required for MVP.
* Always-on VPN assumption: Rejected — out of product scope.

## More Information

* Related: ADR-0004, ADR-0009
* Spec §5 HTTP client rules
