---
status: accepted
date: 2026-07-26
decision-makers: "Arrmada maintainer"
consulted: ""
informed: ""
---

# Talk directly to Radarr and Sonarr APIs without a backend

## Context and Problem Statement

How should the phone reach Radarr and Sonarr? A backend proxy could centralize auth and remote access later, but adds hosting and complexity for a single-user LAN app.

## Decision Drivers

* LAN-only MVP
* One phone talking to home services
* Minimize moving parts and ops
* Keep API keys on-device (see ADR-0007)

## Considered Options

* Direct device → *arr REST (no backend)
* Expo app + small Node/proxy backend
* Fork an existing ARR client and wrap APIs

## Decision Outcome

Chosen option: "Direct device → *arr REST (no backend)", because the MVP is LAN-only, personal, and already implemented via `src/arr-client`.

Non-goals: cloud sync; multi-user auth server; API aggregation gateway.

### Consequences

* Good, because zero server to deploy or secure
* Good, because latency is one hop on LAN
* Bad, because remote access later needs VPN/tunnel outside the app
* Bad, because each client holds API keys (mitigated by Secure Store + ADR-0009)
* Neutral, because *arr API version quirks stay in `arr-client`

## Implementation Plan

* **Affected paths**: `src/arr-client/**`, `src/hooks/use-arr-clients.ts`, feature hooks under `src/features/**`
* **Dependencies**: none beyond `fetch` / Expo networking
* **Patterns to follow**: `createArrHttp` + `X-Api-Key`; map JSON at boundary; screens never parse raw *arr payloads
* **Patterns to avoid**: adding Express/Fastify/Supabase “just for proxy”; putting secrets in env files shipped with the app
* **Configuration**: URLs + keys only via Secure Store (`src/lib/secure-config.ts`)

### Verification

- [ ] No server package or deploy config exists in the repo for ARR proxying
- [ ] All *arr HTTP calls go through `src/arr-client`
- [ ] `npm test` covers HTTP client + mappers + clients

## Pros and Cons of the Options

### Direct client

* Good, because simplest for LAN
* Bad, because keys on device

### Backend proxy

* Good, because future remote/auth centralization
* Bad, because overkill for current constraints (violates ADR-0011)

### Fork existing client

* Good, because features already exist
* Bad, because stack/UX debt and TypeScript/Expo mismatch

## More Information

* Related: ADR-0004, ADR-0005, ADR-0007, ADR-0011
