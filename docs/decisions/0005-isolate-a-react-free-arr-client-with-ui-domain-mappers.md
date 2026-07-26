---
status: accepted
date: 2026-07-26
decision-makers: "Arrmada maintainer"
consulted: ""
informed: ""
---

# Isolate a React-free arr-client with UI domain mappers

## Context and Problem Statement

Radarr/Sonarr JSON shapes change and differ. Screens must not depend on raw API payloads. Where should HTTP, errors, and mapping live so they stay testable without React?

## Decision Drivers

* Unit-testable networking without mounting UI
* Stable UI models (`Movie`, `Series`, `QueueItem`, `ServiceHealth`)
* Clear boundary for API version quirks
* Align with ADR-0003 (direct client)

## Considered Options

* React-free `src/arr-client` + mappers at the boundary
* Fetch inside React Query hooks with inline mapping
* Generate OpenAPI clients and use them raw in screens

## Decision Outcome

Chosen option: "React-free `src/arr-client` + mappers", because it isolates transport and keeps screens on stable types.

Non-goals: shared SDK published to npm; supporting Lidarr in the same client until an ADR expands scope.

### Consequences

* Good, because Jest can test HTTP/mappers/clients without React Native
* Good, because UI stays decoupled from *arr schema drift
* Bad, because every new endpoint needs a mapper/client method
* Neutral, because movies/series clients may look similar (DRY via ADR-0010)

## Implementation Plan

* **Affected paths**: `src/arr-client/http.ts`, `errors.ts`, `types.ts`, `mappers/**`, `radarr/client.ts`, `sonarr/client.ts`, `index.ts`, `src/arr-client/__tests__/**`
* **Dependencies**: none (use global `fetch`)
* **Patterns to follow**: `createArrHttp`; `ArrHttpError` kinds; map `remoteUrl` posters; queue progress helpers
* **Patterns to avoid**: `import "react"` inside `src/arr-client`; screens importing raw JSON types; `any` in public client APIs
* **Configuration**: timeout ~10s in `http.ts`

### Verification

- [ ] `rg "from \"react\"|from 'react'" src/arr-client` returns no matches
- [ ] `npm test -- src/arr-client` passes
- [ ] Feature hooks consume mapped types only

## Pros and Cons of the Options

### React-free arr-client

* Good, because testable and bounded
* Bad, because more files

### Mapping in hooks

* Good, because fewer files
* Bad, because harder to unit-test and easy to leak raw shapes

### Raw OpenAPI in screens

* Good, because less mapping code
* Bad, because UI couples to vendor schema

## More Information

* Related: ADR-0003, ADR-0010, ADR-0011
