---
status: accepted
date: 2026-07-26
decision-makers: "Arrmada maintainer"
---

# Adopt architecture decision records

## Context and Problem Statement

ARRapp’s MVP architecture was decided in a design spec and implementation plan, but those docs are long and not structured as durable, agent-executable decision records. Without ADRs, future contributors (human or coding agents) cannot tell which choices are binding, which alternatives were rejected, or how to implement new work without relitigating settled questions.

## Decision

Adopt Architecture Decision Records stored in `docs/decisions/`, using MADR-aligned templates from the project’s `adr-skill`.

Conventions:

- One ADR per file: `NNNN-title-with-dashes.md`
- Statuses: `proposed` → `accepted` | `rejected`; superseded ADRs link both ways
- Every ADR includes an **Implementation Plan** and checkbox **Verification**
- Agents must consult accepted ADRs before changing architecture, dependencies, or patterns
- New architectural choices require a new ADR (or superseding an existing one) before coding

Non-goals: wiki/Notion as system of record; RFC ceremony for every change.

## Consequences

- Good, because binding decisions live next to the code and are discoverable
- Good, because agents get measurable constraints and file-level guidance
- Bad, because writing ADRs costs time up front
- Neutral, because outdated ADRs must be deprecated or superseded explicitly

## Implementation Plan

- **Affected paths**: `docs/decisions/`, `docs/decisions/README.md`, code comments at entry points with `ADR-NNNN`
- **Dependencies**: none
- **Patterns to follow**: templates in `.agents/skills/adr-skill/assets/templates/`; create via `scripts/new_adr.js` when possible
- **Patterns to avoid**: undocumented architecture changes; ADRs without Implementation Plan / Verification

### Verification

- [ ] `docs/decisions/README.md` lists every ADR with status
- [ ] Filenames match `NNNN-*.md` numbering without gaps for active records
- [ ] Each accepted/proposed ADR has Context, Decision (or Outcome), Consequences, Implementation Plan, Verification
- [ ] No architecture change lands without referencing an ADR in the PR description when applicable

## Alternatives Considered

- No formal records: Rejected — tribal knowledge is lost.
- External wiki only: Rejected — drifts from the repo.
- Spec-only (`docs/superpowers/specs/`): Rejected — specs are product narrative; ADRs are binding decisions for agents.

## More Information

- Spec: `docs/superpowers/specs/2026-07-25-arrapp-design.md`
- Plan: `docs/superpowers/plans/2026-07-25-arrapp-mvp.md`
- MADR: https://adr.github.io/madr/
