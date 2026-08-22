# Offline Mode (Arr Outbox + Query Cache) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When Arr is unreachable but the device has internet, serve previously loaded React Query data from disk, allow TMDB search/add, queue all Arr mutations in a durable outbox, and flush them when Arr returns — with optimistic library rows + pending-sync badges for adds.

**Architecture:** Hybrid connectivity (NetInfo + Arr health) drives a typed durable outbox. Mutations go through a dispatcher that either executes immediately or enqueues. TanStack Query persistence (AsyncStorage) hydrates last-known reads. Optimistic patches live in the movies/series list cache keyed by negative temporary ids.

**Tech Stack:** Expo 57 / React Native, TypeScript, TanStack Query v5 + `@tanstack/react-query-persist-client` + `@tanstack/query-async-storage-persister`, `@react-native-async-storage/async-storage` (already present), `@react-native-community/netinfo`, Jest.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-07-offline-mode-design.md`
- Scenario v1: Arr-unreachable + TMDB OK; device-offline = read-only cache
- Generic outbox covers **all** Arr write hooks in the app; UI for queue management is **minimal** (no dedicated screen)
- Optimistic add appears in library with sync/error badge
- Retry cap **5**; exponential backoff `min(60_000, 1000 * 2^attempt)` ms
- Health: **2** consecutive probe failures before `arr-unreachable`; **1** success restores `online`
- French-first i18n (`fr` + `en` keys); do not call the app an "MVP"
- Prefer small pure modules under `src/offline/`; keep `arr-client` / `tmdb-client` React-free
- One export per new file where practical; no `any`; no enums (unions)
- Work in `.worktrees/feat-offline-mode` on branch `feat/offline-mode`

## File map

| File | Responsibility |
|------|----------------|
| `src/offline/constants.ts` | Attempt cap, backoff, health failure threshold, storage keys, gcTime |
| `src/offline/connectivity/types.ts` | `DeviceNetworkState`, `ArrReachability`, `OfflineStatus` |
| `src/offline/connectivity/reduce-offline-status.ts` | Pure reducer NetInfo + health → status |
| `src/offline/connectivity/arr-health-probe.ts` | Probe helpers wrapping `getHealth` |
| `src/offline/connectivity/offline-status-store.ts` | Mutable store + subscribe |
| `src/offline/use-offline-status.ts` | React hook over store |
| `src/offline/outbox/types.ts` | `ArrOutboxItem`, op discriminant union |
| `src/offline/outbox/storage.ts` | AsyncStorage load/save outbox |
| `src/offline/outbox/classify-error.ts` | Retryable vs terminal |
| `src/offline/outbox/backoff.ts` | Delay from attempts |
| `src/offline/outbox/dispatcher.ts` | enqueue / flush / cancel / retry |
| `src/offline/outbox/ops/registry.ts` | Map `type` → execute + optimistic helpers |
| `src/offline/outbox/ops/add-movie.ts` | addMovie execute + optimistic |
| `src/offline/outbox/ops/add-series.ts` | addSeries execute + optimistic |
| `src/offline/outbox/ops/*.ts` | Remaining mutation ops |
| `src/offline/optimistic/pending-meta.ts` | `pendingSync` / `syncFailed` markers on rows |
| `src/offline/query-persister.ts` | AsyncStorage persister + dehydrate filter |
| `src/offline/OfflineBootstrap.tsx` | Start probes, flush on online, NetInfo listener |
| `src/offline/OfflineBanner.tsx` | Global discreet indicator |
| `src/offline/PendingSyncBadge.tsx` | Row badge |
| `src/lib/query-client.ts` | Raise `gcTime` for persistence |
| `app/_layout.tsx` | PersistQueryClientProvider + OfflineBootstrap |
| `src/features/movies/use-movies.ts` | Route writes via dispatcher; soften lookup `enabled` |
| `src/features/series/use-series.ts` | Same for Sonarr |
| `src/features/queue/use-queue.ts` | Queue remove/pause via dispatcher |
| `src/i18n/locales/fr.ts` / `en.ts` | Offline copy |
| Library list item UIs | Show `PendingSyncBadge` when meta present |

---

### Task 1: Offline constants + outbox types + storage

**Files:**
- Create: `src/offline/constants.ts`
- Create: `src/offline/outbox/types.ts`
- Create: `src/offline/outbox/storage.ts`
- Test: `src/offline/outbox/__tests__/storage.test.ts`

**Interfaces:**
- Produces:
  - `OUTBOX_MAX_ATTEMPTS = 5`
  - `OUTBOX_STORAGE_KEY = "arr.outbox.v1"`
  - `QUERY_CACHE_STORAGE_KEY = "arr.query-cache.v1"`
  - `HEALTH_FAILURES_BEFORE_UNREACHABLE = 2`
  - `LIBRARY_GC_TIME_MS = 1000 * 60 * 60 * 24 * 7`
  - `ArrOutboxStatus = "pending" | "running" | "failed"`
  - `ArrOutboxOpType` union of all mutation kinds
  - `ArrOutboxItem` as in the design spec
  - `loadOutbox(): Promise<readonly ArrOutboxItem[]>`
  - `saveOutbox(items: readonly ArrOutboxItem[]): Promise<void>`

- [ ] **Step 1: Write the failing test**

```ts
import AsyncStorage from "@react-native-async-storage/async-storage";

import { OUTBOX_STORAGE_KEY } from "../../constants";
import { loadOutbox, saveOutbox } from "../storage";
import type { ArrOutboxItem } from "../types";

describe("outbox storage", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("round-trips items", async () => {
    const inputItems: readonly ArrOutboxItem[] = [
      {
        id: "op-1",
        service: "radarr",
        type: "addMovie",
        payload: {
          tmdbId: 42,
          qualityProfileId: 1,
          rootFolderPath: "/movies",
          title: "Test",
          year: 2020,
          posterUrl: undefined,
          overview: "",
        },
        status: "pending",
        attempts: 0,
        createdAt: "2026-08-07T00:00:00.000Z",
        updatedAt: "2026-08-07T00:00:00.000Z",
        optimisticKey: "movie:-42",
      },
    ];
    await saveOutbox(inputItems);
    const raw = await AsyncStorage.getItem(OUTBOX_STORAGE_KEY);
    expect(raw).toContain("addMovie");
    const actual = await loadOutbox();
    expect(actual).toEqual(inputItems);
  });

  it("returns empty array when missing or corrupt", async () => {
    expect(await loadOutbox()).toEqual([]);
    await AsyncStorage.setItem(OUTBOX_STORAGE_KEY, "{not-json");
    expect(await loadOutbox()).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/offline/outbox/__tests__/storage.test.ts --no-coverage`  
Expected: FAIL (module not found)

- [ ] **Step 3: Write minimal implementation**

`constants.ts`:

```ts
export const OUTBOX_MAX_ATTEMPTS = 5;
export const OUTBOX_STORAGE_KEY = "arr.outbox.v1";
export const QUERY_CACHE_STORAGE_KEY = "arr.query-cache.v1";
export const HEALTH_FAILURES_BEFORE_UNREACHABLE = 2;
export const LIBRARY_GC_TIME_MS = 1000 * 60 * 60 * 24 * 7;

export const outboxBackoffMs = (attempts: number): number =>
  Math.min(60_000, 1000 * 2 ** Math.max(0, attempts));
```

`types.ts` — define full op union used by later tasks:

```ts
export type ArrOutboxStatus = "pending" | "running" | "failed";

export type ArrOutboxOpType =
  | "addMovie"
  | "addSeries"
  | "updateMovieMonitored"
  | "updateSeriesMonitored"
  | "updateEpisodeMonitored"
  | "deleteMovie"
  | "deleteSeries"
  | "deleteEpisodeFile"
  | "grabMovieRelease"
  | "grabSeriesRelease"
  | "movieSearch"
  | "seriesSearch"
  | "seasonSearch"
  | "episodeSearch"
  | "queueRemove"
  | "queuePauseOrResume";

export type ArrOutboxItem = {
  readonly id: string;
  readonly service: "radarr" | "sonarr";
  readonly type: ArrOutboxOpType;
  readonly payload: unknown;
  readonly status: ArrOutboxStatus;
  readonly attempts: number;
  readonly lastError?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly optimisticKey?: string;
};
```

`storage.ts`: load/parse array / save JSON; on parse failure return `[]`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/offline/outbox/__tests__/storage.test.ts --no-coverage`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/offline/constants.ts src/offline/outbox/types.ts src/offline/outbox/storage.ts src/offline/outbox/__tests__/storage.test.ts
git commit -m "feat(offline): add outbox types and AsyncStorage persistence"
```

---

### Task 2: Error classification + backoff + dispatcher core

**Files:**
- Create: `src/offline/outbox/classify-error.ts`
- Create: `src/offline/outbox/dispatcher.ts`
- Create: `src/offline/outbox/ops/registry.ts` (stub registry returning execute that throws “unregistered”)
- Test: `src/offline/outbox/__tests__/classify-error.test.ts`
- Test: `src/offline/outbox/__tests__/dispatcher.test.ts`

**Interfaces:**
- Consumes: `loadOutbox`, `saveOutbox`, `OUTBOX_MAX_ATTEMPTS`, `outboxBackoffMs`, `ArrOutboxItem`
- Produces:
  - `isRetryableArrError(error: unknown): boolean` — true for network / timeout / status >= 500; false for 4xx with status when available
  - `createOutboxDispatcher(deps)` with:
    - `enqueue(input): Promise<ArrOutboxItem>`
    - `flush(service: "radarr" | "sonarr"): Promise<void>`
    - `cancel(id: string): Promise<void>`
    - `retry(id: string): Promise<void>`
    - `list(): Promise<readonly ArrOutboxItem[]>`
  - Deps: `{ now: () => Date; createId: () => string; getExecutor: (type) => OpExecutor; onOptimisticApply?; onOptimisticRollback?; isServiceOnline: (service) => boolean; executeOnline: (item) => Promise<void> }` — keep deps injectable for tests
  - `OpExecutor = { execute(item, ctx): Promise<void>; applyOptimistic?(item, qc): void; rollbackOptimistic?(item, qc): void }`

- [ ] **Step 1: Write the failing tests**

`classify-error.test.ts`:

```ts
import { ArrHttpError } from "@/arr-client"; // use existing error type if exported; else shape-check status

import { isRetryableArrError } from "../classify-error";

describe("isRetryableArrError", () => {
  it("treats network errors as retryable", () => {
    expect(isRetryableArrError(new TypeError("Network request failed"))).toBe(
      true,
    );
  });

  it("treats 5xx as retryable and 4xx as terminal", () => {
    expect(isRetryableArrError({ status: 503, message: "down" })).toBe(true);
    expect(isRetryableArrError({ status: 400, message: "bad" })).toBe(false);
  });
});
```

`dispatcher.test.ts` (in-memory fake storage via mocking `storage` module or injecting save/load):

```ts
describe("outbox dispatcher", () => {
  it("runs immediately when service online", async () => {
    const executed: string[] = [];
    const dispatcher = createTestDispatcher({
      isServiceOnline: () => true,
      executors: {
        addMovie: {
          execute: async (item) => {
            executed.push(String((item.payload as { tmdbId: number }).tmdbId));
          },
        },
      },
    });
    await dispatcher.enqueue({
      service: "radarr",
      type: "addMovie",
      payload: { tmdbId: 7, qualityProfileId: 1, rootFolderPath: "/" },
    });
    expect(executed).toEqual(["7"]);
    expect(await dispatcher.list()).toEqual([]);
  });

  it("enqueues when offline and flushes FIFO on online", async () => {
    let online = false;
    const order: number[] = [];
    const dispatcher = createTestDispatcher({
      isServiceOnline: () => online,
      executors: {
        addMovie: {
          execute: async (item) => {
            order.push((item.payload as { tmdbId: number }).tmdbId);
          },
        },
      },
    });
    await dispatcher.enqueue({
      service: "radarr",
      type: "addMovie",
      payload: { tmdbId: 1, qualityProfileId: 1, rootFolderPath: "/" },
    });
    await dispatcher.enqueue({
      service: "radarr",
      type: "addMovie",
      payload: { tmdbId: 2, qualityProfileId: 1, rootFolderPath: "/" },
    });
    expect((await dispatcher.list()).map((i) => (i.payload as { tmdbId: number }).tmdbId)).toEqual([
      1, 2,
    ]);
    online = true;
    await dispatcher.flush("radarr");
    expect(order).toEqual([1, 2]);
    expect(await dispatcher.list()).toEqual([]);
  });

  it("marks failed after max retryable attempts", async () => {
    const dispatcher = createTestDispatcher({
      isServiceOnline: () => true,
      executors: {
        addMovie: {
          execute: async () => {
            throw { status: 503, message: "nope" };
          },
        },
      },
      maxAttempts: 2,
    });
    // Force enqueue path then flush repeatedly — or enqueue while online but executor throws:
    // Implementation: if online execute fails with retryable, keep in outbox as pending until cap then failed.
    await dispatcher.enqueue({
      service: "radarr",
      type: "addMovie",
      payload: { tmdbId: 1, qualityProfileId: 1, rootFolderPath: "/" },
    });
    const items = await dispatcher.list();
    expect(items[0]?.status).toBe("failed");
    expect(items[0]?.attempts).toBeGreaterThanOrEqual(2);
  });
});
```

Implement a small `createTestDispatcher` helper inside the test file that wires in-memory load/save.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/offline/outbox/__tests__/classify-error.test.ts src/offline/outbox/__tests__/dispatcher.test.ts --no-coverage`  
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

- `classify-error.ts`: inspect `status` number if present; `TypeError` / message matching `/network|timeout|failed to fetch/i` → retryable; default retryable for unknown Error without status, terminal if status 400–499.
- `dispatcher.ts`:
  - Online success → do not persist
  - Online retryable fail → persist pending, bump attempts, stop at max → failed
  - Online terminal fail → persist failed (attempts at least 1) **or** rethrow without queue for online-only UX — **prefer rethrow when still online and never queued** so today’s online UX stays the same; only persist when already in outbox or when `!isServiceOnline`
  - Offline enqueue → pending + `applyOptimistic`
  - `flush`: pick oldest pending for service, set running, execute, on success remove + no rollback needed (caller invalidates); on retryable leave pending; on terminal/cap → failed
  - `cancel`: rollback + remove
  - `retry`: failed → pending, then flush
- Stub `registry.ts` with `getOpExecutor(type): OpExecutor` throwing until ops registered.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/offline/outbox/__tests__ --no-coverage`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/offline/outbox
git commit -m "feat(offline): add outbox dispatcher with retry and FIFO flush"
```

---

### Task 3: Connectivity reducer + store

**Files:**
- Create: `src/offline/connectivity/types.ts`
- Create: `src/offline/connectivity/reduce-offline-status.ts`
- Create: `src/offline/connectivity/offline-status-store.ts`
- Create: `src/offline/use-offline-status.ts`
- Test: `src/offline/connectivity/__tests__/reduce-offline-status.test.ts`

**Interfaces:**
- Produces:
  - `DeviceNetworkState = "online" | "offline" | "unknown"`
  - `ArrServiceReachability = "online" | "unreachable" | "unknown"`
  - `OfflineStatus = { device: DeviceNetworkState; radarr: ArrServiceReachability; sonarr: ArrServiceReachability }`
  - `reduceOfflineStatus(prev, event): OfflineStatus` events: `{ type: "netinfo"; state }`, `{ type: "health"; service; ok: boolean }`
  - Store: `getOfflineStatus`, `subscribeOfflineStatus`, `dispatchOfflineEvent`
  - Hook: `useOfflineStatus(): OfflineStatus`
  - Helpers: `isArrServiceOnline(status, service): boolean`, `isDeviceOffline(status): boolean`

- [ ] **Step 1: Write the failing test**

```ts
import { HEALTH_FAILURES_BEFORE_UNREACHABLE } from "../../constants";
import {
  createInitialOfflineStatus,
  reduceOfflineStatus,
} from "../reduce-offline-status";

describe("reduceOfflineStatus", () => {
  it("marks device offline from netinfo", () => {
    const next = reduceOfflineStatus(createInitialOfflineStatus(), {
      type: "netinfo",
      state: "offline",
    });
    expect(next.device).toBe("offline");
  });

  it("requires consecutive health failures before unreachable", () => {
    let state = createInitialOfflineStatus();
    state = reduceOfflineStatus(state, {
      type: "health",
      service: "radarr",
      ok: false,
    });
    expect(state.radarr).toBe("unknown"); // still counting
    for (let i = 1; i < HEALTH_FAILURES_BEFORE_UNREACHABLE; i += 1) {
      state = reduceOfflineStatus(state, {
        type: "health",
        service: "radarr",
        ok: false,
      });
    }
    expect(state.radarr).toBe("unreachable");
    state = reduceOfflineStatus(state, {
      type: "health",
      service: "radarr",
      ok: true,
    });
    expect(state.radarr).toBe("online");
  });
});
```

Keep failure streak in reducer closure via extending status with internal counters **or** pass streak in a separate `ConnectivityMachineState` that includes `{ status, radarrFailStreak, sonarrFailStreak }`. Prefer exporting `ConnectivityMachineState` and deriving public `OfflineStatus` from it.

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Implement reducer + store + `useSyncExternalStore` hook**

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(offline): add connectivity status reducer and store"
```

---

### Task 4: Query persistence wiring

**Files:**
- Create: `src/offline/query-persister.ts`
- Modify: `src/lib/query-client.ts` — set `gcTime: LIBRARY_GC_TIME_MS` on default queries
- Modify: `app/_layout.tsx` — replace `QueryClientProvider` with `PersistQueryClientProvider`
- Modify: `package.json` — add `@tanstack/react-query-persist-client` and `@tanstack/query-async-storage-persister` (versions compatible with react-query ^5.101.4)
- Test: `src/offline/__tests__/should-persist-query.test.ts`

**Interfaces:**
- Produces:
  - `shouldPersistQuery(query: { queryKey: readonly unknown[] }): boolean` — persist keys starting with `movies`, `series`, `queue`, `upcoming`, `health` **except** segments `lookup`, `releases`, `preview`, `guests`
  - `createArrQueryPersister()` using AsyncStorage + `QUERY_CACHE_STORAGE_KEY`
  - `persistOptions` object for the provider (`persister`, `maxAge: LIBRARY_GC_TIME_MS`, `dehydrateOptions: { shouldDehydrateQuery }`)

- [ ] **Step 1: Write the failing test** for `shouldPersistQuery`

```ts
import { shouldPersistQuery } from "../query-persister";

describe("shouldPersistQuery", () => {
  it("persists library and skips lookup/releases", () => {
    expect(shouldPersistQuery({ queryKey: ["movies"] })).toBe(true);
    expect(shouldPersistQuery({ queryKey: ["movies", 1] })).toBe(true);
    expect(shouldPersistQuery({ queryKey: ["movies", "lookup", "matrix"] })).toBe(
      false,
    );
    expect(shouldPersistQuery({ queryKey: ["movies", 1, "releases"] })).toBe(
      false,
    );
    expect(shouldPersistQuery({ queryKey: ["series", "defaults"] })).toBe(true);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Install deps + implement persister + wire layout**

```bash
npm install @tanstack/react-query-persist-client @tanstack/query-async-storage-persister
```

In `_layout.tsx`:

```tsx
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { queryClient } from "@/lib/query-client";
import { arrPersistOptions } from "@/offline/query-persister";

// ...
<PersistQueryClientProvider client={queryClient} persistOptions={arrPersistOptions}>
  ...
</PersistQueryClientProvider>
```

Also raise `gcTime` in `createQueryClient` to `LIBRARY_GC_TIME_MS`.

- [ ] **Step 4: Run unit test PASS; run `npm test -- --passWithNoTests` smoke**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(offline): persist React Query cache to AsyncStorage"
```

---

### Task 5: Optimistic pending meta + addMovie / addSeries ops

**Files:**
- Create: `src/offline/optimistic/pending-meta.ts`
- Create: `src/offline/outbox/ops/add-movie.ts`
- Create: `src/offline/outbox/ops/add-series.ts`
- Modify: `src/offline/outbox/ops/registry.ts`
- Test: `src/offline/optimistic/__tests__/pending-meta.test.ts`
- Test: `src/offline/outbox/ops/__tests__/add-movie.test.ts`

**Interfaces:**
- Produces:
  - `PendingSyncState = "pending" | "failed"`
  - Extend list row via parallel map OR attach optional fields if types allow — **prefer** side map: `optimisticKey -> PendingSyncState` stored in a small module `pending-sync-index.ts` that UI reads, **and** insert placeholder `Movie`/`Series` into query cache
  - `optimisticMovieId(tmdbId: number): number` → `-tmdbId` (document collision assumption)
  - `optimisticSeriesId(tvdbId: number): number` → `-tvdbId`
  - `buildOptimisticMovie(payload): Movie` with empty arrays / defaults, `hasFile: false`, `monitored: true`, `statusSummary: ""`, `externalIds: { tmdbId, ...undefined }`
  - `buildOptimisticSeries(payload): Series` similarly
  - `addMovie` executor calls `radarr.addMovie` with `{ tmdbId, qualityProfileId, rootFolderPath }` only
  - On success flush: remove optimistic id from list, `invalidateQueries(movies.all)`
  - Payloads for enqueue must include display fields: `title`, `year`, `posterUrl`, `overview` plus Arr add fields

- [ ] **Step 1: Failing tests** for id helpers, buildOptimisticMovie shape, apply inserts into a fake QueryClient movies list, rollback removes it, registry execute calls client

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement ops + register in `registry.ts`**

- [ ] **Step 4: PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(offline): add optimistic addMovie/addSeries outbox ops"
```

---

### Task 6: Wire movie/series add + TMDB lookup when Arr unreachable

**Files:**
- Modify: `src/features/movies/use-movies.ts`
- Modify: `src/features/series/use-series.ts`
- Create: `src/offline/use-arr-mutation.ts` (helper: enqueue vs execute based on status)
- Create: `src/offline/outbox/singleton.ts` — app-level dispatcher instance factory taking clients + queryClient
- Test: extend or add hook-level test if patterns exist; otherwise unit-test `shouldEnqueueArrWrite(status, service)`

**Interfaces:**
- Produces:
  - `shouldEnqueueArrWrite(status: OfflineStatus, service): boolean` — true when device online/unknown AND service unreachable
  - `useArrWrite()` or mutate helpers used by `useAddMovie` / `useAddSeries`
- Behaviour:
  - `useAddMovie`: if enqueue → dispatcher with optimistic; resolve mutation success locally (do not throw)
  - If missing defaults / missing qualityProfileId → throw user-facing error (i18n key)
  - `useMovieLookup` / `useSeriesLookup`: when Arr unreachable but TMDB key present, `enabled` on TMDB path without requiring live Arr; enrichment via Arr skipped or best-effort catch → candidates from TMDB-only mapper (`movie-candidate-from-tmdb-hit` already exists)
  - Preview hooks: when unreachable, build candidate from TMDB hit / cached preview if possible; else show message

- [ ] **Step 1: Write failing unit test for `shouldEnqueueArrWrite`**

```ts
expect(
  shouldEnqueueArrWrite(
    { device: "online", radarr: "unreachable", sonarr: "online" },
    "radarr",
  ),
).toBe(true);
expect(
  shouldEnqueueArrWrite(
    { device: "offline", radarr: "unreachable", sonarr: "unreachable" },
    "radarr",
  ),
).toBe(false);
```

- [ ] **Step 2: FAIL → implement helper → PASS**

- [ ] **Step 3: Wire `useAddMovie` / `useAddSeries` through dispatcher; adjust lookup `enabled` + queryFn branches for Arr-unreachable + TMDB**

Concrete lookup change sketch for movies:

```ts
enabled:
  trimmed.length >= 2 &&
  (Boolean(radarr) || (hasTmdbKey && !isDeviceOffline(status))),
```

When `radarr` missing/unreachable and TMDB available, call `lookupMoviesWithTmdb` with `lookupByTmdbId` / `lookupByTerm` that return empty enrichment (or catch and continue) so rows still appear.

- [ ] **Step 4: `npx tsc --noEmit` + targeted jest**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(offline): queue movie/series adds when Arr unreachable"
```

---

### Task 7: Register remaining Arr mutation ops + wire hooks

**Files:**
- Create: `src/offline/outbox/ops/update-movie-monitored.ts`
- Create: `src/offline/outbox/ops/update-series-monitored.ts`
- Create: `src/offline/outbox/ops/update-episode-monitored.ts`
- Create: `src/offline/outbox/ops/delete-movie.ts`
- Create: `src/offline/outbox/ops/delete-series.ts`
- Create: `src/offline/outbox/ops/delete-episode-file.ts`
- Create: `src/offline/outbox/ops/grab-movie-release.ts`
- Create: `src/offline/outbox/ops/grab-series-release.ts`
- Create: `src/offline/outbox/ops/movie-search.ts`
- Create: `src/offline/outbox/ops/series-search.ts`
- Create: `src/offline/outbox/ops/season-search.ts`
- Create: `src/offline/outbox/ops/episode-search.ts`
- Create: `src/offline/outbox/ops/queue-remove.ts`
- Create: `src/offline/outbox/ops/queue-pause-or-resume.ts`
- Modify: `registry.ts` to register all
- Modify: corresponding hooks in `use-movies.ts`, `use-series.ts`, `use-queue.ts` to call dispatcher when `shouldEnqueueArrWrite`

**Interfaces:**
- Each op file exports `createXxxExecutor(getClient): OpExecutor` with `execute` calling the existing client method using typed payload
- Optimistic optional:
  - monitored toggles: patch cache immediately when enqueueing
  - deletes: remove from list optimistically
  - grabs/searches/queue: **no** library optimistic required (enqueue only; toast/status via pending count)

- [ ] **Step 1: Write one representative failing test** (e.g. `update-movie-monitored` execute + optimistic patch)

- [ ] **Step 2: FAIL**

- [ ] **Step 3: Implement all op modules + wire every `useMutation` listed in File map**

Checklist of hooks that must go through dispatcher:

| Hook | Op type | Service |
|------|---------|---------|
| `useAddMovie` | `addMovie` | radarr |
| `useMovieSearch` | `movieSearch` | radarr |
| `useGrabMovieRelease` | `grabMovieRelease` | radarr |
| `useUpdateMovieMonitored` | `updateMovieMonitored` | radarr |
| `useDeleteMovie` | `deleteMovie` | radarr |
| `useAddSeries` | `addSeries` | sonarr |
| `useSeriesSearch` | `seriesSearch` | sonarr |
| `useSeasonSearch` | `seasonSearch` | sonarr |
| `useEpisodeSearch` | `episodeSearch` | sonarr |
| `useGrabSeriesRelease` | `grabSeriesRelease` | sonarr |
| `useUpdateSeriesMonitored` | `updateSeriesMonitored` | sonarr |
| `useUpdateEpisodeMonitored` | `updateEpisodeMonitored` | sonarr |
| `useDeleteEpisodeFile` | `deleteEpisodeFile` | sonarr |
| `useDeleteSeries` | `deleteSeries` | sonarr |
| `useQueueMutations.remove` | `queueRemove` | item.service |
| `useQueueMutations.pause` | `queuePauseOrResume` | item.service |

- [ ] **Step 4: Full `npm test` + `npm run typecheck`**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(offline): route all Arr mutations through outbox dispatcher"
```

---

### Task 8: OfflineBootstrap — NetInfo, health probes, auto-flush

**Files:**
- Create: `src/offline/connectivity/arr-health-probe.ts`
- Create: `src/offline/OfflineBootstrap.tsx`
- Create: `src/offline/outbox/get-dispatcher.ts` (singleton bound to queryClient + arr clients)
- Modify: `app/_layout.tsx` — mount `<OfflineBootstrap />` inside providers
- Add dep: `@react-native-community/netinfo`
- Test: `src/offline/connectivity/__tests__/arr-health-probe.test.ts` (mock client)

**Interfaces:**
- `OfflineBootstrap`:
  - subscribe NetInfo → `dispatchOfflineEvent({ type: "netinfo", state })`
  - interval ~30s + AppState active: call `radarr?.getHealth()` / `sonarr?.getHealth()` → health events
  - when a service transitions to `online` and outbox non-empty → `dispatcher.flush(service)`
  - on foreground same
- Do not probe when `device === "offline"`

- [ ] **Step 1: Failing test for probe mapping** (`getHealth` online true/false → event)

- [ ] **Step 2–4: Implement, install netinfo, wire layout, tests pass**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(offline): probe Arr health and flush outbox on reconnect"
```

---

### Task 9: UI — banner, badge, i18n, library rows

**Files:**
- Create: `src/offline/OfflineBanner.tsx`
- Create: `src/offline/PendingSyncBadge.tsx`
- Modify: library row components (find poster/title row used by movies/series index — e.g. shared library card) to render badge when `getPendingSyncState(optimisticKey)` is set
- Modify: `src/i18n/locales/fr.ts`, `src/i18n/locales/en.ts`
- Modify: home or tabs layout to show `OfflineBanner`
- Test: light render test optional; prefer unit test on pending state selector

**Copy keys (exact):**

| Key | FR | EN |
|-----|----|----|
| `offline.arrUnreachable` | Serveur Arr injoignable | Arr server unreachable |
| `offline.pendingCount` | {{count}} action(s) en attente | {{count}} pending action(s) |
| `offline.deviceOffline` | Hors ligne — cache uniquement | Offline — cached data only |
| `offline.syncPending` | Sync | Syncing |
| `offline.syncFailed` | Échec sync | Sync failed |
| `offline.missingDefaults` | Reconnecte Arr une fois pour charger dossiers et profils | Connect to Arr once to load folders and profiles |
| `offline.addQueued` | Ajout mis en file — sync dès que Arr est joignable | Add queued — will sync when Arr is reachable |

- [ ] **Step 1: Add i18n keys (fail typecheck/tests if keys missing from both locales — follow existing i18n test patterns if any)**

- [ ] **Step 2: Implement banner** — show when device offline OR any service unreachable OR pendingCount > 0

- [ ] **Step 3: Implement badge** on optimistic rows (`pending` vs `failed`); long-press or tap on failed can call `retry`/`cancel` via ActionSheet/Alert (minimal)

- [ ] **Step 4: Manual checklist in commit body; run `npm test` + `npm run lint`

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(offline): add unreachable banner and pending sync badges"
```

---

### Task 10: Device-offline read-only guards + final verification

**Files:**
- Modify: add screens `app/(tabs)/movies/add.tsx`, `app/(tabs)/series/add.tsx` — disable search/submit when `isDeviceOffline`
- Modify: mutation helper to refuse enqueue when device offline (throw i18n `offline.deviceOffline`)
- Test: `shouldEnqueueArrWrite` already false; add `assertCanMutateArr` tests

- [ ] **Step 1: Failing test** — `assertCanUseTmdb(status)` false when device offline

- [ ] **Step 2–3: Implement guards on add screens + helper**

- [ ] **Step 4: Full verification**

```bash
npm run typecheck
npm run lint
npm test
```

Expected: all green.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(offline): block TMDB and writes when device has no network"
```

---

## Self-review (plan vs spec)

| Spec requirement | Task |
|------------------|------|
| Cache previously loaded RQ data | Task 4 |
| TMDB search while Arr down | Task 6 |
| Outbox for Arr mutations | Tasks 1–2, 5, 7 |
| Flush on reconnect | Task 8 |
| Optimistic add + badge | Tasks 5, 9 |
| Hybrid NetInfo + health | Tasks 3, 8 |
| Retry then failed | Task 2 |
| Minimal UI / no queue screen | Task 9 |
| Device offline read-only | Task 10 |
| All mutation hooks | Task 7 checklist |
| Tests | Each task |

**Resolved open details:** attempts=5; backoff `min(60s, 1s*2^n)`; health failures=2; persist filter skips lookup/releases/preview/guests; online first-failure does not queue (preserve current UX) — only unreachable or already-queued items use outbox retry.
