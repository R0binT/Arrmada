# TMDB-first Franchise Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On Ajouter film / Ajouter série, fill the result list from TMDB (franchise/company/keyword/title), enrich each row with Radarr/Sonarr library status, and fall back to Arr term lookup when `EXPO_PUBLIC_TMDB_API_KEY` is missing or TMDB fails.

**Architecture:** New React-free `src/tmdb-client/` (HTTP + search/discover + scoring). Feature-layer orchestrators build `MovieCandidate[]` / `SeriesCandidate[]` by enriching TMDB hits via existing Arr `lookupCandidateByTmdbId` / `lookupCandidateByTvdbId`. Lookup hooks switch path based on a static env key helper (Metro-inlined `EXPO_PUBLIC_*`).

**Tech Stack:** Expo / React Native, TypeScript, TanStack Query, Jest, TMDB API v3, Radarr/Sonarr v3.

## Global Constraints

- No backend (ADR-0003); phone calls TMDB + *arr directly.
- Key only via `.env` `EXPO_PUBLIC_TMDB_API_KEY` — no Settings UI in v1.
- Same Add screens / FlatList / MediaQuick / candidate types — no new search mode UI.
- TMDB first when key present; Arr-only fallback without key or on TMDB hard failure.
- List rows come from TMDB; Arr supplies `inLibrary` / `hasFile` / `libraryId` (and preferred poster when present).
- Series without TVDB id: omit from list (Sonarr add needs TVDB).
- Cap enrichment ~25 items; discover/search first page only.
- French app copy only where new user-visible strings appear; prefer silent Arr fallback (optional discreet toast later — skip toast in v1 unless already trivial).
- Do not call ARRapp an "MVP" in commits/PRs.
- Metro only inlines static `process.env.EXPO_PUBLIC_*` — never dynamic `process.env[name]`.

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/env-tmdb-api-key.ts` | Read/trim static TMDB env key |
| `src/tmdb-client/types.ts` | `TmdbMediaHit`, named match types |
| `src/tmdb-client/errors.ts` | `TmdbHttpError` |
| `src/tmdb-client/http.ts` | `createTmdbHttp(apiKey)` |
| `src/tmdb-client/score-name-match.ts` | Pure name scoring |
| `src/tmdb-client/pick-best-named-match.ts` | Pick best company/keyword/collection |
| `src/tmdb-client/merge-media-hits.ts` | Dedupe by `tmdbId`, cap |
| `src/tmdb-client/mappers.ts` | Raw JSON → hits / named matches |
| `src/tmdb-client/client.ts` | TMDB API methods |
| `src/tmdb-client/index.ts` | Public exports |
| `src/features/movies/lookup-movies-with-tmdb.ts` | Orchestrate movie search + Arr enrich |
| `src/features/series/lookup-series-with-tmdb.ts` | Orchestrate series search + Arr enrich |
| `src/features/movies/use-movies.ts` | Wire `useMovieLookup` |
| `src/features/series/use-series.ts` | Wire `useSeriesLookup` |
| `.env.example` | Document TMDB key |

---

### Task 1: Name match scoring

**Files:**
- Create: `src/tmdb-client/score-name-match.ts`
- Create: `src/tmdb-client/pick-best-named-match.ts`
- Test: `src/tmdb-client/__tests__/score-name-match.test.ts`

**Interfaces:**
- Produces:
  - `scoreNameMatch(query: string, name: string): 0 | 1 | 2 | 3`
  - `pickBestNamedMatch<T extends { readonly name: string }>(query: string, items: readonly T[]): T | undefined`

- [ ] **Step 1: Write the failing test**

```ts
import { scoreNameMatch } from "../score-name-match";
import { pickBestNamedMatch } from "../pick-best-named-match";

describe("scoreNameMatch", () => {
  it("scores exact, prefix, contains, and none", () => {
    expect(scoreNameMatch("marvel", "Marvel")).toBe(3);
    expect(scoreNameMatch("marvel", "Marvel Studios")).toBe(2);
    expect(scoreNameMatch("marvel", "Studio Marvel France")).toBe(1);
    expect(scoreNameMatch("marvel", "DC Comics")).toBe(0);
  });
});

describe("pickBestNamedMatch", () => {
  it("prefers exact over prefix and shorter ties", () => {
    const actual = pickBestNamedMatch("marvel", [
      { id: 1, name: "Marvel Studios" },
      { id: 2, name: "Marvel" },
      { id: 3, name: "Marvel Entertainment" },
    ]);
    expect(actual?.id).toBe(2);
  });

  it("returns undefined when nothing matches", () => {
    expect(
      pickBestNamedMatch("marvel", [{ id: 1, name: "DC Comics" }]),
    ).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/tmdb-client/__tests__/score-name-match.test.ts -v`  
Expected: FAIL (module not found)

- [ ] **Step 3: Write minimal implementation**

`score-name-match.ts`:

```ts
export type NameMatchScore = 0 | 1 | 2 | 3;

export const scoreNameMatch = (
  query: string,
  name: string,
): NameMatchScore => {
  const q = query.trim().toLowerCase();
  const n = name.trim().toLowerCase();
  if (q.length === 0 || n.length === 0) return 0;
  if (n === q) return 3;
  if (n.startsWith(q)) return 2;
  if (n.includes(q)) return 1;
  return 0;
};
```

`pick-best-named-match.ts`:

```ts
import { scoreNameMatch } from "./score-name-match";

export const pickBestNamedMatch = <T extends { readonly name: string }>(
  query: string,
  items: readonly T[],
): T | undefined => {
  let best: T | undefined;
  let bestScore = 0;
  for (const item of items) {
    const score = scoreNameMatch(query, item.name);
    if (score === 0) continue;
    if (
      score > bestScore ||
      (score === bestScore &&
        best !== undefined &&
        item.name.length < best.name.length) ||
      (score === bestScore && best === undefined)
    ) {
      best = item;
      bestScore = score;
    }
  }
  return best;
};
```

- [ ] **Step 4: Run tests and make sure they pass**

Run: `npx jest src/tmdb-client/__tests__/score-name-match.test.ts -v`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/tmdb-client/score-name-match.ts src/tmdb-client/pick-best-named-match.ts src/tmdb-client/__tests__/score-name-match.test.ts
git commit -m "feat(tmdb): add name match scoring for franchise search"
```

---

### Task 2: TMDB HTTP client + types + mappers

**Files:**
- Create: `src/tmdb-client/types.ts`
- Create: `src/tmdb-client/errors.ts`
- Create: `src/tmdb-client/http.ts`
- Create: `src/tmdb-client/mappers.ts`
- Create: `src/tmdb-client/client.ts`
- Create: `src/tmdb-client/index.ts`
- Test: `src/tmdb-client/__tests__/http.test.ts`
- Test: `src/tmdb-client/__tests__/mappers.test.ts`

**Interfaces:**
- Consumes: none from Task 1 (HTTP independent)
- Produces:
  - `TmdbMediaHit`: `{ tmdbId, title, year, posterUrl, overview }`
  - `TmdbNamedMatch`: `{ id, name }`
  - `createTmdbHttp(apiKey: string): { getJson<T>(path, query?): Promise<T> }`
  - `createTmdbClient(apiKey: string)` with:
    - `searchCompanies(query)`, `searchKeywords(query)`, `searchCollections(query)`
    - `searchMovies(query)`, `searchTv(query)`
    - `discoverMoviesByCompany(companyId)`, `discoverMoviesByKeyword(keywordId)`
    - `discoverTvByCompany(companyId)`, `discoverTvByKeyword(keywordId)`
    - `getCollectionParts(collectionId)`
    - `getTvExternalIds(tmdbId)` → `{ tvdbId: number | undefined }`
  - Poster URLs use `https://image.tmdb.org/t/p/w185` + path; language `fr-FR` on search/discover where supported

- [ ] **Step 1: Write failing HTTP + mapper tests**

HTTP test pattern (mirror `src/arr-client/__tests__/http.test.ts`): assert `api_key` query param on URL, map 401/network errors via `TmdbHttpError`.

Mapper tests: map movie/tv result objects to `TmdbMediaHit` (year from `release_date` / `first_air_date` first 4 digits; empty overview → `""`; missing poster → `undefined`).

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npx jest src/tmdb-client/__tests__/http.test.ts src/tmdb-client/__tests__/mappers.test.ts -v`

- [ ] **Step 3: Implement types, errors, http, mappers, client, index**

`types.ts`:

```ts
export type TmdbMediaHit = {
  readonly tmdbId: number;
  readonly title: string;
  readonly year: number;
  readonly posterUrl: string | undefined;
  readonly overview: string;
};

export type TmdbNamedMatch = {
  readonly id: number;
  readonly name: string;
};
```

`http.ts`: base `https://api.themoviedb.org/3`, append `api_key`, timeout 20_000 ms, throw `TmdbHttpError` with `status` + `kind: "unauthorized" | "network" | "timeout" | "http"`.

`client.ts`: each method calls `getJson` on the matching path and maps via mappers. Discover/search use `page=1`, `include_adult=false`, `language=fr-FR`.

`index.ts`: export client factory, types, scoring helpers from Task 1.

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/tmdb-client
git commit -m "feat(tmdb): add TMDB HTTP client and mappers"
```

---

### Task 3: Merge / dedupe hits

**Files:**
- Create: `src/tmdb-client/merge-media-hits.ts`
- Test: `src/tmdb-client/__tests__/merge-media-hits.test.ts`

**Interfaces:**
- Produces: `mergeMediaHits(groups: readonly (readonly TmdbMediaHit[])[], cap: number): TmdbMediaHit[]`  
  First-seen wins; preserve order across groups left-to-right; slice to `cap`.

- [ ] **Step 1: Failing test** — three groups with overlapping ids; assert order + cap 2.

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement**

```ts
import type { TmdbMediaHit } from "./types";

export const mergeMediaHits = (
  groups: readonly (readonly TmdbMediaHit[])[],
  cap: number,
): TmdbMediaHit[] => {
  const seen = new Set<number>();
  const out: TmdbMediaHit[] = [];
  for (const group of groups) {
    for (const hit of group) {
      if (seen.has(hit.tmdbId)) continue;
      seen.add(hit.tmdbId);
      out.push(hit);
      if (out.length >= cap) return out;
    }
  }
  return out;
};
```

- [ ] **Step 4: PASS**

- [ ] **Step 5: Commit**

```bash
git add src/tmdb-client/merge-media-hits.ts src/tmdb-client/__tests__/merge-media-hits.test.ts
git commit -m "feat(tmdb): dedupe and cap merged media hits"
```

---

### Task 4: Env TMDB key helper

**Files:**
- Create: `src/lib/env-tmdb-api-key.ts`
- Modify: `.env.example`
- Test: `src/lib/__tests__/env-tmdb-api-key.test.ts`

**Interfaces:**
- Produces: `readTmdbApiKeyFromProcessEnv(): string | undefined`  
  Uses static `process.env.EXPO_PUBLIC_TMDB_API_KEY` only; trim; empty → `undefined`.

- [ ] **Step 1: Failing test** — with mocked env object parameter optional; prefer:

```ts
export const resolveTmdbApiKey = (
  raw: string | undefined,
): string | undefined => {
  const trimmed = raw?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : undefined;
};

export const readTmdbApiKeyFromProcessEnv = (): string | undefined =>
  resolveTmdbApiKey(process.env.EXPO_PUBLIC_TMDB_API_KEY);
```

Test `resolveTmdbApiKey` for trim / empty / undefined.

- [ ] **Step 2: Implement + append to `.env.example`:**

```
# Optional — enables franchise/universe search on Add screens.
# Free key: https://www.themoviedb.org/settings/api
EXPO_PUBLIC_TMDB_API_KEY=
```

- [ ] **Step 3: PASS + commit**

```bash
git add src/lib/env-tmdb-api-key.ts src/lib/__tests__/env-tmdb-api-key.test.ts .env.example
git commit -m "feat: read optional EXPO_PUBLIC_TMDB_API_KEY"
```

---

### Task 5: Movie lookup orchestration (TMDB → Arr enrich)

**Files:**
- Create: `src/features/movies/lookup-movies-with-tmdb.ts`
- Create: `src/features/movies/movie-candidate-from-tmdb-hit.ts`
- Test: `src/features/movies/__tests__/lookup-movies-with-tmdb.test.ts`
- Test: `src/features/movies/__tests__/movie-candidate-from-tmdb-hit.test.ts`

**Interfaces:**
- Consumes: `createTmdbClient`, `pickBestNamedMatch`, `mergeMediaHits`, `MovieCandidate`, Radarr `lookupCandidateByTmdbId` / `lookupCandidates`
- Produces:
  - `LOOKUP_ENRICH_CAP = 25`
  - `movieCandidateFromTmdbHit(hit: TmdbMediaHit): MovieCandidate` — `inLibrary: false`, `hasFile: false`, `libraryId: undefined`, genres `[]`, `runtimeMinutes: undefined`
  - `lookupMoviesWithTmdb(input: { term; apiKey; lookupByTmdbId; lookupByTerm }): Promise<MovieCandidate[]>`

Orchestration algorithm:

1. `client = createTmdbClient(apiKey)`
2. Parallel: `searchCompanies`, `searchKeywords`, `searchCollections`, `searchMovies`
3. `company = pickBestNamedMatch(term, companies)` (same for keyword, collection)
4. Parallel expands: if company → `discoverMoviesByCompany`; if keyword → `discoverMoviesByKeyword`; if collection → `getCollectionParts`; always keep `searchMovies` results
5. `hits = mergeMediaHits([searchMovies, discoverCompany?, discoverKeyword?, collectionParts?], LOOKUP_ENRICH_CAP)`
6. For each hit: `try { arr = await lookupByTmdbId(hit.tmdbId); return arr ?? movieCandidateFromTmdbHit(hit) } catch { return movieCandidateFromTmdbHit(hit) }` with `Promise.all`
7. On any thrown error from steps 2–5 (TMDB hard fail): `return lookupByTerm(term)`

- [ ] **Step 1: Failing unit tests**
  - `movieCandidateFromTmdbHit` field mapping
  - Orchestrator with mocked client methods injected **or** mock `createTmdbClient` via injecting a `TmdbMovieSearchPort` — prefer explicit port in the function input to keep tests free of jest module mocks:

```ts
export type TmdbMovieSearchPort = {
  searchCompanies(q: string): Promise<TmdbNamedMatch[]>;
  searchKeywords(q: string): Promise<TmdbNamedMatch[]>;
  searchCollections(q: string): Promise<TmdbNamedMatch[]>;
  searchMovies(q: string): Promise<TmdbMediaHit[]>;
  discoverMoviesByCompany(id: number): Promise<TmdbMediaHit[]>;
  discoverMoviesByKeyword(id: number): Promise<TmdbMediaHit[]>;
  getCollectionParts(id: number): Promise<TmdbMediaHit[]>;
};

export const lookupMoviesWithTmdb = async (input: {
  readonly term: string;
  readonly tmdb: TmdbMovieSearchPort;
  readonly lookupByTmdbId: (tmdbId: number) => Promise<MovieCandidate | null>;
  readonly lookupByTerm: (term: string) => Promise<MovieCandidate[]>;
}): Promise<MovieCandidate[]> => { /* ... */ };
```

Test: term `marvel` → company match → discover returns Iron Man → Arr enrich sets `inLibrary: true`.  
Test: tmdb port throws → `lookupByTerm` called.

- [ ] **Step 2: Implement until PASS**

- [ ] **Step 3: Commit**

```bash
git add src/features/movies/lookup-movies-with-tmdb.ts src/features/movies/movie-candidate-from-tmdb-hit.ts src/features/movies/__tests__
git commit -m "feat(movies): TMDB-first lookup with Arr enrichment"
```

---

### Task 6: Series lookup orchestration (TMDB → TVDB → Arr)

**Files:**
- Create: `src/features/series/lookup-series-with-tmdb.ts`
- Create: `src/features/series/series-candidate-from-tmdb.ts`
- Test: `src/features/series/__tests__/lookup-series-with-tmdb.test.ts`

**Interfaces:**
- Consumes: same scoring/merge patterns; Sonarr `lookupCandidateByTvdbId` / `lookupCandidates`
- Produces:
  - `lookupSeriesWithTmdb(input: { term; tmdb: TmdbSeriesSearchPort; lookupByTvdbId; lookupByTerm }): Promise<SeriesCandidate[]>`
  - `TmdbSeriesSearchPort`: companies, keywords, `searchTv`, `discoverTvByCompany`, `discoverTvByKeyword`, `getTvExternalIds(tmdbId) => Promise<{ tvdbId?: number }>`
  - No collections for TV
  - After merge: for each hit, `external = await getTvExternalIds`; if no `tvdbId`, **omit**; else Arr lookup by TVDB; on Arr null/throw build candidate:

```ts
export const seriesCandidateFromTmdb = (input: {
  readonly tvdbId: number;
  readonly hit: TmdbMediaHit;
}): SeriesCandidate => ({
  tvdbId: input.tvdbId,
  title: input.hit.title,
  year: input.hit.year,
  posterUrl: input.hit.posterUrl,
  inLibrary: false,
  episodeFileCount: 0,
  episodeCount: 0,
  overview: input.hit.overview,
  genres: [],
  runtimeMinutes: undefined,
  libraryId: undefined,
});
```

- [ ] **Step 1: Failing tests** — omit without TVDB; enrich when Arr returns; TMDB throw → term fallback

- [ ] **Step 2: Implement + PASS**

- [ ] **Step 3: Commit**

```bash
git add src/features/series/lookup-series-with-tmdb.ts src/features/series/series-candidate-from-tmdb.ts src/features/series/__tests__/lookup-series-with-tmdb.test.ts
git commit -m "feat(series): TMDB-first lookup with TVDB Arr enrichment"
```

---

### Task 7: Wire lookup hooks

**Files:**
- Modify: `src/features/movies/use-movies.ts` (`useMovieLookup`)
- Modify: `src/features/series/use-series.ts` (`useSeriesLookup`)

**Interfaces:**
- Consumes: `readTmdbApiKeyFromProcessEnv`, `createTmdbClient`, `lookupMoviesWithTmdb`, `lookupSeriesWithTmdb`
- Produces: unchanged hook return shape (`useQuery` → `MovieCandidate[]` / `SeriesCandidate[]`)

- [ ] **Step 1: Update `useMovieLookup` queryFn**

```ts
export const useMovieLookup = (term: string) => {
  const { radarr } = useArrClients();
  const trimmed = term.trim();

  return useQuery({
    queryKey: queryKeys.movies.lookup(trimmed),
    queryFn: async () => {
      if (!radarr) throw new Error("Radarr is not configured.");
      const apiKey = readTmdbApiKeyFromProcessEnv();
      if (!apiKey) {
        return radarr.lookupCandidates(trimmed);
      }
      return lookupMoviesWithTmdb({
        term: trimmed,
        tmdb: createTmdbClient(apiKey),
        lookupByTmdbId: (tmdbId) => radarr.lookupCandidateByTmdbId(tmdbId),
        lookupByTerm: (t) => radarr.lookupCandidates(t),
      });
    },
    enabled: Boolean(radarr) && trimmed.length >= 2,
  });
};
```

- [ ] **Step 2: Same pattern for `useSeriesLookup`** with Sonarr + `lookupSeriesWithTmdb`

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`  
Expected: exit 0

- [ ] **Step 4: Commit**

```bash
git add src/features/movies/use-movies.ts src/features/series/use-series.ts
git commit -m "feat: wire TMDB-first lookup into add search hooks"
```

---

### Task 8: Verify suite + manual checklist

**Files:** none new (verification only)

- [ ] **Step 1: Run unit tests**

Run: `npx jest src/tmdb-client src/features/movies/__tests__/lookup-movies-with-tmdb.test.ts src/features/movies/__tests__/movie-candidate-from-tmdb-hit.test.ts src/features/series/__tests__/lookup-series-with-tmdb.test.ts src/lib/__tests__/env-tmdb-api-key.test.ts --coverage=false`  
Expected: all PASS

- [ ] **Step 2: Full typecheck**

Run: `npm run typecheck`  
Expected: exit 0

- [ ] **Step 3: Manual (device/emulator with `.env` key set; rebuild/restart Metro so key is inlined)**
  - [ ] Add film: `marvel` → MCU-like titles (Iron Man, etc.), not only title-substring
  - [ ] Add film: `star wars` → saga titles
  - [ ] Badge correct for a title already in library
  - [ ] Add série: same franchise queries return related shows
  - [ ] Remove/empty TMDB key, restart Metro → classic Arr title search still works
  - [ ] Rapid multi-add still usable (separate Modal freeze fix if not already merged)

- [ ] **Step 4: Commit only if Step 3 found small fixups**; otherwise done

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| TMDB first when key set | 4, 5, 6, 7 |
| Arr-only fallback without key | 4, 7 |
| TMDB hard fail → Arr lookup | 5, 6 |
| company / keyword / collection (movies) | 5 |
| company / keyword + search title | 5, 6 |
| List from TMDB, Arr enrichment | 5, 6 |
| Movies + series add hooks | 7 |
| Cap ~20–30 | 5 (`LOOKUP_ENRICH_CAP = 25`) |
| Series omit without TVDB | 6 |
| Movie keep row if Arr enrich fails | 5 |
| `.env.example` key | 4 |
| No Settings UI / no infinite scroll | out of scope — not tasked |
| Unit tests scoring / merge / orchestrators | 1, 3, 5, 6 |

## Self-review notes

- No TBD placeholders; ports are explicit for TDD without brittle module mocks.
- `createTmdbClient` must satisfy both `TmdbMovieSearchPort` and `TmdbSeriesSearchPort` (series ignores collections).
- Hook `queryKey` stays `lookup(trimmed)` so cache identity unchanged for the term.
