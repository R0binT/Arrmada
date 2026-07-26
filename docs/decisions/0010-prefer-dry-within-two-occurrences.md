---
status: accepted
date: 2026-07-26
decision-makers: "Arrmada maintainer"
---

# Prefer DRY within two occurrences

## Context and Problem Statement

Duplication across movies/series and Radarr/Sonarr is tempting. Under-abstracting creates drift; over-abstracting creates indirection. When must agents factor shared code?

## Decision

Apply **DRY at two occurrences**:

* When the same logic or UI structure appears **twice**, extract a shared function, hook, component, or helper in the appropriate module
* Do not wait for a third copy “to be sure”
* Prefer extraction into an existing home (`src/arr-client`, `src/components`, `src/lib`, shared feature helpers) over inventing a new framework layer

Non-goals: premature generics for hypothetical Lidarr; a plugin system.

## Consequences

* Good, because movies/series and radarr/sonarr stay aligned
* Good, because agents have a clear numeric rule
* Bad, because early abstraction can be wrong — mitigate by extracting to the smallest shared unit (function > god-class)
* Neutral, because intentional parallel structure is still allowed only when the two copies are not actually the same logic

## Implementation Plan

* **Affected paths**: entire `src/` and `app/` when touching duplicated logic
* **Dependencies**: none
* **Patterns to follow**: shared mappers/http already in `arr-client`; shared UI in `src/components`; connection card reused by onboarding/settings
* **Patterns to avoid**: copy-pasting a third variant of the same hook; “temporary” duplicates left undocumented

### Verification

- [ ] New PRs that introduce a second copy of logic also extract a shared symbol in the same PR
- [ ] `arr-client` remains the single HTTP/error/mapping boundary (no parallel HTTP helpers in features)
- [ ] Reviewers/agents reject “I’ll DRY it later” without a tracked follow-up ADR/task

## Alternatives Considered

* DRY only after 3 copies: Rejected — user preference is strict at 2.
* DRY only in arr-client: Rejected — UI duplication would drift.
* Always abstract first: Rejected — conflicts with KISS when there is only one use (ADR-0011).

## More Information

* Related: ADR-0005, ADR-0011
* Note: If extraction would require a new architectural pattern, write/supersede an ADR first (ADR-0001)
