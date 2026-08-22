# Offline mode: Arr outbox + query cache

Date: 2026-08-07  
Status: Approved (conversation)  
Branch: `feat/offline-mode`

## Goal

When Radarr/Sonarr are unreachable but the device still has internet:

1. **Read** previously loaded app data from a durable cache (last successful online session).
2. **Search / prepare adds** via TMDB (unchanged external path).
3. **Queue** Arr mutations in a durable outbox and flush them when Arr connectivity returns.
4. Show queued adds **immediately** in the library with a pending-sync badge.

Primary scenario is **Arr-unreachable**, not full device offline. Device-offline is a secondary read-only path.

## Decisions (from brainstorm)

| Topic | Choice |
|-------|--------|
| Offline meaning | Arr down, internet + TMDB OK |
| Delivery | Phased **B**: v1 = persist cache + **generic outbox for all Arr mutations** + minimal UI; v2 = queue screen polish, richer conflicts |
| Cache scope | Persist whatever React Query has already loaded (library, details, Arr queue, home, upcoming, add defaults) — no aggressive prefetch |
| Connectivity | Hybrid: NetInfo (device) + periodic Arr health probes |
| Optimistic add | Item appears in library with pending-sync badge (no dedicated queue screen in v1) |
| Sync failure | Limited auto-retry, then persistent `failed` for retry/cancel |
| Architecture | Persist React Query + typed mutation outbox |

## Non-goals (v1)

- Aggressive background prefetch of the whole library/details
- Dedicated on-disk image/poster cache beyond what Expo Image already does
- Dedicated “pending actions” screen (v2)
- Advanced conflict UI (merge wizards, multi-device sync)
- Opaque raw-HTTP replay of Arr requests

## Connectivity model

Three coarse states (per Arr service and globally):

| State | Meaning |
|-------|---------|
| `device-offline` | NetInfo reports no network — read cache only; TMDB and Arr calls blocked with clear copy |
| `arr-unreachable` | Device has network; Radarr and/or Sonarr health probe fails — TMDB OK; Arr mutations go to outbox |
| `online` | Health OK — normal path; flush outbox if non-empty |

Implementation sketch:

- `@react-native-community/netinfo` for device reachability
- Reuse / extend existing Arr `getHealth` probes (Settings already has this pattern)
- Probe on app foreground, on NetInfo regain, and on a modest interval while app is active
- Transient blips should not flip UI constantly: short grace / require N consecutive failures before entering `arr-unreachable`

## Query persistence

- Use TanStack Query persistence (`PersistQueryClientProvider` + AsyncStorage persister).
- Persist successful query data for keys already used by the app (movies, series, details, cast, defaults, queue, home, upcoming, etc.).
- Do **not** invent a parallel domain database in v1.
- On cold start with Arr unreachable: hydrate from disk and show stale data with an offline/Arr-unreachable indicator.
- `staleTime` / `gcTime` tuned so offline sessions still have usable data; exact numbers chosen during implementation (prefer long `gcTime` for library lists).

## Outbox (mutation queue)

### Item shape

```ts
type ArrOutboxStatus = "pending" | "running" | "failed";

type ArrOutboxItem = {
  readonly id: string;
  readonly service: "radarr" | "sonarr";
  readonly type: ArrOutboxOpType; // discriminated union
  readonly payload: unknown; // narrowed per type
  readonly status: ArrOutboxStatus;
  readonly attempts: number;
  readonly lastError?: string;
  readonly createdAt: string; // ISO
  readonly updatedAt: string;
  readonly optimisticKey?: string; // links optimistic cache row
};
```

### Operation coverage (v1 infra)

Register **all** Arr-mutating entry points behind the outbox dispatcher, including at least:

- `addMovie` / `addSeries`
- monitor / unmonitor updates
- delete / remove from library
- grab release / download triggers used by the app today
- season / episode mutations the UI already exposes

Each op has: serializer, executor (calls existing `arr-client`), optional optimistic apply/rollback helpers.

### Execution rules

1. If target service is `online` → run immediately (same as today). Optionally still record briefly for debugging — **not required in v1**.
2. If `arr-unreachable` (or call fails with network-class error while marked online) → enqueue `pending`, apply optimistic patch when defined.
3. Flush when service returns to `online` (and on foreground if outbox non-empty).
4. FIFO **per service**; at most one `running` op per service.
5. Retryable failures (network, 5xx): increment `attempts`, backoff, keep `pending`.
6. Terminal failures (4xx business, missing profile, duplicate that cannot auto-heal) **or** attempt cap (e.g. 5): set `failed` + `lastError`.
7. Cancel (`pending` or `failed`): remove outbox row + rollback optimistic patch.
8. Manual retry on `failed`: reset to `pending` and flush.

### Add flow (Arr unreachable, TMDB OK)

1. User searches via TMDB (lookup must not hard-require live Arr when defaults + TMDB hit are enough).
2. Confirm add with **cached** quality profile / root folder defaults (last online `getAddDefaults`).
3. Enqueue `addMovie` / `addSeries`.
4. Optimistically insert into movies/series list with pending-sync badge.
5. On flush: Arr lookup-by-tmdb (or equivalent) + POST add; replace optimistic row with real entity; invalidate related queries.
6. On terminal failure: badge → error state; user can retry or cancel (removes optimistic row).

If add defaults are missing from cache, block add with a clear message (“connect to Arr once to load folders/profiles”).

## UI (v1 minimal)

- Global discreet indicator: Arr unreachable and/or `N` pending actions.
- Per-row badge on optimistic library items: syncing / error.
- No dedicated outbox management screen in v1 (v2).
- Device offline: read-only cached screens; search/add disabled with explanation.

Copy: French-first app; add i18n keys in `fr` + `en` like existing health strings.

## Module layout (proposed)

```
src/offline/
  connectivity.ts          # NetInfo + Arr health → OfflineStatus
  query-persister.ts       # AsyncStorage persister wiring
  outbox/
    types.ts
    storage.ts             # persist outbox list
    dispatcher.ts          # enqueue / flush / retry / cancel
    ops/                   # one module per op type (add-movie, …)
  optimistic/              # library patch helpers
  use-offline-status.ts
  use-arr-outbox.ts
```

Wire mutations in existing hooks (`use-movies`, `use-series`, queue/releases helpers) through the dispatcher instead of calling Arr clients directly for writes.

## Error handling matrix

| Case | Behaviour |
|------|-----------|
| Device offline | Cache read; no TMDB; no new outbox except N/A |
| Arr unreachable | Cache read; TMDB search OK; writes → outbox |
| Missing cached defaults on add | Block add + message |
| Flush network/5xx | Retry with backoff until cap |
| Flush 4xx / duplicate / invalid profile | `failed` + lastError |
| User cancels failed/pending | Rollback optimistic row + drop outbox row |
| Partial service (Radarr OK, Sonarr down) | Independent outbox lanes per service |

## Testing

- Unit: outbox storage, enqueue, FIFO flush, retry/fail transitions, cancel rollback.
- Unit: optimistic library patch apply/rollback.
- Unit/integration: connectivity state machine (NetInfo + health fixtures).
- Hook/screen-level where cheap: add-offline → pending badge → sync success replaces row; sync fail → error badge.
- Regression: online add/monitor/delete paths unchanged when `online`.

## Rollout / phasing

**v1 (this spec)**  
Connectivity, query persist, generic outbox + all mutation registration, optimistic add badge, minimal global indicator, tests above.

**v2**  
Dedicated pending-actions UI, richer conflict messaging, optional image disk cache, prefetch policies if needed.

## Open implementation details (resolved during plan, not blockers)

- Exact attempt cap and backoff schedule
- Which query keys are included/excluded from persistence (e.g. skip ephemeral lookup pages if noisy)
- Whether failed Arr calls while “online” auto-downgrade to unreachable immediately or after N failures
