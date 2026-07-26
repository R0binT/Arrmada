# Architecture Decision Records (ADR)

An Architecture Decision Record (ADR) captures an important architecture decision along with its context and consequences.

Arrmada ADRs are **executable specs for coding agents**: each includes an Implementation Plan and Verification checkboxes. Consult accepted ADRs before changing architecture, dependencies, or cross-cutting patterns (see ADR-0001).

## Conventions

- Directory: `docs/decisions`
- Naming: `NNNN-title-with-dashes.md`
- Status values: `proposed`, `accepted`, `rejected`, `deprecated`, `superseded`

## Workflow

- Create a new ADR as `proposed` (use `.agents/skills/adr-skill/scripts/new_adr.js` when possible).
- Discuss and iterate.
- When committed: mark `accepted` or `rejected`.
- If replaced later: create a new ADR and mark the old one `superseded` with a link.

## ADRs

- [Adopt architecture decision records](0001-adopt-architecture-decision-records.md) (accepted, 2026-07-26)
- [Choose Expo and TypeScript for the Android client](0002-choose-expo-and-typescript-for-the-android-client.md) (accepted, 2026-07-26)
- [Talk directly to Radarr and Sonarr APIs without a backend](0003-talk-directly-to-radarr-and-sonarr-apis-without-a-backend.md) (accepted, 2026-07-26)
- [Support exactly one Radarr and one Sonarr on LAN only](0004-support-exactly-one-radarr-and-one-sonarr-on-lan-only.md) (accepted, 2026-07-26)
- [Isolate a React-free arr-client with UI domain mappers](0005-isolate-a-react-free-arr-client-with-ui-domain-mappers.md) (accepted, 2026-07-26)
- [Use TanStack Query for server state and queue polling](0006-use-tanstack-query-for-server-state-and-queue-polling.md) (accepted, 2026-07-26)
- [Store credentials in expo-secure-store](0007-store-credentials-in-expo-secure-store.md) (accepted, 2026-07-26)
- [Allow Android cleartext HTTP for local arr URLs](0008-allow-android-cleartext-http-for-local-arr-urls.md) (accepted, 2026-07-26)
- [Enforce security baseline for credentials and app lock](0009-enforce-security-baseline-for-credentials-and-app-lock.md) (proposed, 2026-07-26)
- [Prefer DRY within two occurrences](0010-prefer-dry-within-two-occurrences.md) (accepted, 2026-07-26)
- [Prefer KISS and refuse over-engineering](0011-prefer-kiss-and-refuse-over-engineering.md) (accepted, 2026-07-26)
- [Use silent defaults when adding a Film or Série](0012-use-silent-defaults-when-adding-film-or-serie.md) (accepted, 2026-07-26)
- [Deliver local Notifications for download lifecycle on LAN](0013-deliver-local-notifications-for-download-lifecycle-on-lan.md) (proposed, 2026-07-26)
- [Target a complete personal French app, not arr UI parity](0014-target-complete-personal-french-app-not-arr-ui-parity.md) (accepted, 2026-07-26)
