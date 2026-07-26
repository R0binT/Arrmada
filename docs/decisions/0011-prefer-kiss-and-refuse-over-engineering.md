---
status: accepted
date: 2026-07-26
decision-makers: "Arrmada maintainer"
---

# Prefer KISS and refuse over-engineering

## Context and Problem Statement

Agents and humans tend to “improve” Arrmada with extra layers (DI, repositories over `arr-client`, feature flags, multi-package monorepos). That fights a personal LAN MVP. What is explicitly forbidden?

## Decision

Prefer **KISS** and **YAGNI**. If it is not in an accepted ADR, the design spec, or a user request, do not add it.

**Explicitly forbidden without a new ADR that supersedes relevant decisions:**

* New global client state managers (Redux, MobX, Zustand for server entities) — use TanStack Query (ADR-0006)
* Backend/proxy/BFF for *arr (ADR-0003)
* DI frameworks / IoC containers
* Generic multi-app `*arr` factory supporting Lidarr/Prowlarr/etc. while ADR-0004 holds
* Extra “repository” layer on top of `arr-client`
* Internal micro-packages / monorepo split for this single app
* Feature-flag systems
* New runtime dependencies not required by an accepted ADR or explicit user request

**Process rule:** Before adding a dependency or architectural layer, the agent must either point to an accepted ADR or stop and propose one.

Non-goals: banning all abstractions — shared components and `arr-client` are required (ADR-0005, ADR-0010).

## Consequences

* Good, because the codebase stays navigable for a solo maintainer
* Good, because agents have a deny-list, not vibes
* Bad, because some “nice” enterprise patterns are unavailable
* Neutral, because complexity can return later via superseding ADRs

## Implementation Plan

* **Affected paths**: all future changes under `src/`, `app/`, `package.json`
* **Dependencies**: do not add packages unless justified by ADR/user request; prefer Expo-ecosystem modules when needed
* **Patterns to follow**: thin feature hooks → `arr-client`; UI composition from `src/components`
* **Patterns to avoid**: speculative generalization; “clean architecture” folders without an ADR; adding `ai`/analytics/crash SDKs without an ADR

### Verification

- [ ] `package.json` has no DI/state-manager packages beyond React Query unless an ADR accepts them
- [ ] No `src/repositories/` (or equivalent) wrapping `arr-client` without an ADR
- [ ] PR descriptions for architectural additions link an ADR
- [ ] Agents refuse backend scaffolds for this app while ADR-0003 is accepted

## Alternatives Considered

* Soft guidelines only: Rejected — too easy for agents to ignore.
* Full clean architecture now: Rejected — over-engineering for MVP.
* Allow any dependency if TypeScript-typed: Rejected — still adds ops and surface area.

## More Information

* Related: ADR-0001, ADR-0003, ADR-0004, ADR-0005, ADR-0006, ADR-0010
* Spec §9 Out of scope is product YAGNI; this ADR is engineering YAGNI
