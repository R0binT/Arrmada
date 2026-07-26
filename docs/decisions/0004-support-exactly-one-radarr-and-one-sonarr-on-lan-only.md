---
status: accepted
date: 2026-07-26
decision-makers: "Arrmada maintainer"
---

# Support exactly one Radarr and one Sonarr on LAN only

## Context and Problem Statement

Should Arrmada support multiple \*arr instances, remote access, or sibling apps (Lidarr, Prowlarr)? Expanding scope early would complicate config, UI, and networking.

## Decision

Support **exactly one Radarr and one Sonarr**, reachable on the **local network only** (typically `http://192.168.x.x:7878` / `:8989`).

Non-goals for this ADR’s lifetime:

- Multiple Radarr/Sonarr profiles
- Built-in VPN/Tailscale/Cloudflare Tunnel UX
- Lidarr, Prowlarr, Bazarr, or other \*arr siblings

Local download Notifications are in scope under ADR-0013 (this ADR previously listed “push notifications” as a non-goal; that bullet is superseded).

## Consequences

- Good, because Settings/onboarding stay four fields + test connection
- Good, because Home/Queue can hard-code two services
- Bad, because users with 4K+HD dual Radarr need another tool (or a future ADR)
- Neutral, because LAN cleartext is accepted under ADR-0008

## Implementation Plan

- **Affected paths**: `src/lib/secure-config.ts` (`ArrConfig` four fields), `src/hooks/use-arr-clients.ts`, onboarding/settings screens, Home health dots
- **Dependencies**: none
- **Patterns to follow**: `ArrService = "radarr" | "sonarr"`; partial outage must not block the healthy service
- **Patterns to avoid**: arrays of servers; “active profile” switchers; deep links for remote hosts without a superseding ADR

### Verification

- [ ] `ArrConfig` has exactly four credential/URL fields
- [ ] UI copy assumes home Wi‑Fi for network errors
- [ ] No multi-instance data model in `src/`

## Alternatives Considered

- Multi-instance from day one: Rejected — YAGNI (ADR-0011).
- LAN + remote in one app: Rejected — networking/security scope explosion.
- Full \*arr suite: Rejected — out of MVP product scope.

## More Information

- Spec §2 and §9 Out of scope (historical MVP; product scope now also ADR-0014)
- Related: ADR-0003, ADR-0008, ADR-0009, ADR-0013, ADR-0014
