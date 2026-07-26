---
status: accepted
date: 2026-07-26
decision-makers: "Arrmada maintainer"
consulted: ""
informed: ""
---

# Use TanStack Query for server state and queue polling

## Context and Problem Statement

Arrmada needs cache, refetch-on-focus, mutations with invalidation, and live queue updates. Which client state approach should agents use?

## Decision Drivers

* Server state dominates (libraries, queue, health)
* Queue must poll while relevant screens are focused and app is active, without hammering the LAN
* Polling must stop when the app backgrounds
* Avoid inventing a custom store

## Considered Options

* TanStack Query v5
* Redux Toolkit Query / Zustand + manual fetch
* Polling only inside `setInterval` in components

## Decision Outcome

Chosen option: "TanStack Query v5", with `QUEUE_POLL_MS = 30000` (30s), focus-aware refetch, and AppState → `focusManager` so backgrounded apps stop polling. A 3s interval was too aggressive for home LAN load and phone battery.

Non-goals: offline-first persistence; GraphQL; global mutable stores for server entities.

### Consequences

* Good, because cache keys and invalidation are standardized (`src/lib/query-keys.ts`)
* Good, because Queue/Home share polling semantics
* Bad, because agents must learn Query patterns
* Neutral, because secure config stays outside Query (Secure Store)

## Implementation Plan

* **Affected paths**: `src/lib/query-client.ts`, `query-keys.ts`, `app/_layout.tsx` (provider + AppState focusManager), `src/hooks/use-app-is-active.ts`, `src/features/queue/use-queue.ts`, `src/features/home/use-home-data.ts`, feature mutation hooks
* **Dependencies**: `@tanstack/react-query` (already present)
* **Patterns to follow**: `refetchInterval: poll && isAppActive ? QUEUE_POLL_MS : false`; invalidate on settings save and failed mutations
* **Patterns to avoid**: storing movies/series arrays in Context/Zustand; polling with bare `setInterval`; continuing refetch when `AppState !== "active"`
* **Configuration**: library `staleTime` ~30s; `retry: 1`

### Verification

- [ ] `QUEUE_POLL_MS === 30000` in `src/lib/query-client.ts`
- [ ] Queue and Home polling gated by app-active hook
- [ ] Root layout wires `QueryClientProvider` and AppState focusManager
- [ ] Settings save invalidates queries

## Pros and Cons of the Options

### TanStack Query

* Good, because purpose-built for server state
* Bad, because another conceptual layer

### Zustand + manual fetch

* Good, because flexible
* Bad, because reinventing cache/invalidation

### setInterval in UI

* Good, because simple for one screen
* Bad, because leaks, duplicates, no shared cache

## More Information

* Related: ADR-0005, ADR-0011
* Spec §4 Queue polling rules
