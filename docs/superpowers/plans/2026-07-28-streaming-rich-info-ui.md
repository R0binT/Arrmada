# Streaming-style rich info UI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle detail-page rich info and MediaQuick crew formatting to a streaming look: rating badges, compact crew line, horizontal cast rail, pill links — presentation only.

**Architecture:** Keep existing Arr/credits data. Add a pure `formatCrewLine` helper (shared by detail `CrewSection` and MediaQuick). Rework four presentational components (`RatingsRow`, `CrewSection`, `CastSection`, `ExternalLinksRow`) to use `Chip` / horizontal scroll / pressable pills. MediaQuick already pushes ≤2 rating chips; only switch its crew string to the compact formatter.

**Tech Stack:** React Native, Expo Image, existing `@/ui/Chip` + `@/ui/Text`, Jest, i18n FR/EN.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-28-streaming-rich-info-ui-design.md`
- No Arr mapper / type / network changes
- No cast character/role; no MediaQuick cast photos; no section “cards”
- Detail ratings: separate badges, cap ~4
- Crew detail: headline + one compact line (`Réal. Name · …`)
- Cast: horizontal scroll
- Links: pressable pills
- MediaQuick: ≤2 rating badges (already), compact crew + cast names in detail line
- Avoid “MVP” wording; FR + EN i18n
- Commit only when the user asks

## File map

| File | Role |
| --- | --- |
| `src/arr-client/mappers/crew-line.ts` | Pure `formatCrewLine` + short job labels |
| `src/arr-client/index.ts` | Export helper |
| `src/arr-client/__tests__/mappers.test.ts` | Unit tests for `formatCrewLine` |
| `src/i18n/locales/fr.ts` / `en.ts` | Short crew job keys |
| `src/components/RatingsRow.tsx` | Chip badges instead of joined text |
| `src/components/CrewSection.tsx` | Headline + `formatCrewLine` |
| `src/components/CastSection.tsx` | Horizontal `ScrollView` rail |
| `src/components/ExternalLinksRow.tsx` | Pressable `Chip` pills |
| `src/components/MediaQuickSheet.tsx` | Build `crewLine` via `formatCrewLine` |
| `src/features/media-quick/__tests__/build-media-quick-view-model.test.ts` | Adjust if crew format assertions exist |

---

### Task 1: `formatCrewLine` + i18n

**Files:**
- Create: `src/arr-client/mappers/crew-line.ts`
- Modify: `src/arr-client/index.ts`
- Modify: `src/arr-client/__tests__/mappers.test.ts`
- Modify: `src/i18n/locales/fr.ts`
- Modify: `src/i18n/locales/en.ts`

**Interfaces:**
- Produces:

```ts
export const formatCrewLine = (
  members: readonly CrewMember[],
  options?: { readonly max?: number },
): string | undefined;
```

- Consumes: `CrewMember`, `t()` from `@/i18n`

- [ ] **Step 1: Add i18n keys**

FR:

```ts
"detail.crewJobDirector": "Réal.",
"detail.crewJobCreator": "Créat.",
"detail.crewJobWriter": "Scénario",
"detail.crewJobExecProducer": "Prod. exéc.",
"detail.crewJobShowrunner": "Showrunner",
```

EN:

```ts
"detail.crewJobDirector": "Dir.",
"detail.crewJobCreator": "Creator",
"detail.crewJobWriter": "Writer",
"detail.crewJobExecProducer": "Exec. prod.",
"detail.crewJobShowrunner": "Showrunner",
```

- [ ] **Step 2: Write failing tests**

In `mappers.test.ts`:

```ts
import { formatCrewLine } from "../mappers/crew-line";

it("formats a compact crew line with short jobs", () => {
  const actual = formatCrewLine([
    { job: "Director", name: "Nolan" },
    { job: "Writer", name: "Nolan" },
  ]);
  expect(actual).toBe("Réal. Nolan · Scénario Nolan"); // default locale in tests is FR if project defaults to fr
});

it("returns undefined for empty crew", () => {
  expect(formatCrewLine([])).toBeUndefined();
});

it("respects max option", () => {
  const actual = formatCrewLine(
    [
      { job: "Director", name: "A" },
      { job: "Writer", name: "B" },
      { job: "Creator", name: "C" },
    ],
    { max: 2 },
  );
  expect(actual).toBe("Réal. A · Scénario B");
});
```

Match the project’s test locale (check existing i18n test setup). If tests run in EN, assert EN strings instead.

- [ ] **Step 3: Implement `crew-line.ts`**

```ts
import type { CrewMember } from "../types";
import { t } from "@/i18n";

const DEFAULT_MAX = 3;

const shortJob = (job: string): string => {
  const key = job.trim().toLowerCase();
  if (key === "director") return t("detail.crewJobDirector");
  if (key === "creator") return t("detail.crewJobCreator");
  if (key === "writer" || key === "writers") return t("detail.crewJobWriter");
  if (key === "executive producer") return t("detail.crewJobExecProducer");
  if (key === "showrunner") return t("detail.crewJobShowrunner");
  return job.trim();
};

export const formatCrewLine = (
  members: readonly CrewMember[],
  options?: { readonly max?: number },
): string | undefined => {
  const max = options?.max ?? DEFAULT_MAX;
  const parts = members
    .slice(0, max)
    .map((member) => {
      const name = member.name.trim();
      if (name.length === 0) return undefined;
      return `${shortJob(member.job)} ${name}`;
    })
    .filter((part): part is string => part !== undefined);
  if (parts.length === 0) return undefined;
  return parts.join(" · ");
};
```

Export from `src/arr-client/index.ts`.

- [ ] **Step 4: Run tests**

Run: `npx jest src/arr-client/__tests__/mappers.test.ts --no-coverage`

Expected: PASS for new `formatCrewLine` cases.

- [ ] **Step 5: Commit** (only if user asks)

---

### Task 2: `RatingsRow` badges

**Files:**
- Modify: `src/components/RatingsRow.tsx`

**Interfaces:**
- Consumes: `RatingScore[]`, `formatRatingLabel`, `Chip`
- Produces: unchanged props `{ ratings: readonly RatingScore[] }`

- [ ] **Step 1: Replace joined text with chips**

```tsx
import { StyleSheet, View } from "react-native";
import type { RatingScore } from "@/arr-client";
import { formatRatingLabel } from "@/arr-client/mappers/ratings";
import { useUiSize } from "@/lib/UiSizeProvider";
import { Chip } from "@/ui/Chip";

const MAX_RATING_BADGES = 4;

export const RatingsRow = ({ ratings }: { readonly ratings: readonly RatingScore[] }) => {
  const { space } = useUiSize();
  if (ratings.length === 0) return null;
  return (
    <View style={[styles.wrap, { gap: space.xs, marginBottom: space.sm }]}>
      {ratings.slice(0, MAX_RATING_BADGES).map((score) => (
        <Chip key={`${score.source}-${score.value}`} tone="warning">
          {formatRatingLabel(score)}
        </Chip>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap" },
});
```

- [ ] **Step 2: Typecheck touch**

Run: `npx tsc --noEmit`

Expected: no errors from this file.

- [ ] **Step 3: Commit** (only if user asks)

---

### Task 3: Crew, Cast rail, Links pills

**Files:**
- Modify: `src/components/CrewSection.tsx`
- Modify: `src/components/CastSection.tsx`
- Modify: `src/components/ExternalLinksRow.tsx`

**Interfaces:**
- Consumes: `formatCrewLine`, `Chip`, `ScrollView`
- Produces: same public props as today

- [ ] **Step 1: `CrewSection` — headline + one line**

```tsx
import { View } from "react-native";
import type { CrewMember } from "@/arr-client";
import { formatCrewLine } from "@/arr-client";
import { t } from "@/i18n";
import { useUiSize } from "@/lib/UiSizeProvider";
import { Text } from "@/ui/Text";

export const CrewSection = ({ members }: { readonly members: readonly CrewMember[] }) => {
  const { space } = useUiSize();
  const line = formatCrewLine(members);
  if (!line) return null;
  return (
    <View style={{ gap: space.xs }}>
      <Text role="headline">{t("detail.crew")}</Text>
      <Text role="body" tone="muted">{line}</Text>
    </View>
  );
};
```

- [ ] **Step 2: `CastSection` — horizontal scroll**

Replace the wrapping `View` row with:

```tsx
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={{ gap: space.sm }}
>
  {/* existing avatar + name items; keep width based on avatarSize */}
</ScrollView>
```

Keep circular avatar + name; do not add character captions. Import `ScrollView` from `react-native`.

- [ ] **Step 3: `ExternalLinksRow` — pressable chips**

Wrap each link:

```tsx
<Pressable
  key={link.key}
  accessibilityLabel={link.label}
  accessibilityRole="link"
  onPress={() => handleOpen(link.url)}
  style={({ pressed }) => pressScaleStyle(pressed, reduceMotion)}
>
  <Chip tone="accent">{link.label}</Chip>
</Pressable>
```

Remove bare `Text role="label"` for the link label. Keep headline + row layout.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 5: Commit** (only if user asks)

---

### Task 4: MediaQuick compact crew line

**Files:**
- Modify: `src/components/MediaQuickSheet.tsx`
- Modify: `src/features/media-quick/__tests__/build-media-quick-view-model.test.ts` (only if assertions depend on `Job: Name` format)

**Interfaces:**
- Consumes: `formatCrewLine(credits.crew)`
- MediaQuick rating chips already capped at 2 via `pushRatingChips` — do not regress

- [ ] **Step 1: Wire `formatCrewLine` in sheet**

Replace:

```ts
credits.crew
  .slice(0, 3)
  .map((member) => `${member.job}: ${member.name}`)
  .join(", ")
```

with:

```ts
formatCrewLine(credits.crew)
```

Import from `@/arr-client`.

- [ ] **Step 2: Update / add view-model test if needed**

If a test asserts `Director:` style, update to compact `Réal.` / `Dir.` form matching test locale. Confirm rating chips still length ≤2 and cast stays names-only on `detailLine`.

- [ ] **Step 3: Run focused tests**

Run:

```bash
npx jest src/features/media-quick/__tests__/build-media-quick-view-model.test.ts src/arr-client/__tests__/mappers.test.ts --no-coverage
```

Expected: PASS.

- [ ] **Step 4: Commit** (only if user asks)

---

### Task 5: Full verification

**Files:** none new

- [ ] **Step 1: Typecheck**

Run: `npx tsc --noEmit`  
Expected: exit 0

- [ ] **Step 2: Unit tests**

Run: `npm test -- --no-coverage`  
Expected: all pass

- [ ] **Step 3: Manual check on emulator (if running)**

- Detail movie/series: rating chips, crew one line, cast scrolls, link pills  
- MediaQuick: ≤2 rating chips; compact crew; cast names only  

- [ ] **Step 4: Commit** (only if user asks)

---

## Spec coverage check

| Spec item | Task |
| --- | --- |
| Ratings as badges (detail, ~4) | Task 2 |
| Meta chips unchanged | (no task — leave `MediaMetaBlock`) |
| Crew headline + compact line | Tasks 1, 3 |
| Cast horizontal rail, no role | Task 3 |
| Links as pills | Task 3 |
| MediaQuick ≤2 rating badges | Task 4 (verify existing) |
| MediaQuick compact crew + cast names | Task 4 |
| No mapper/API/type changes | All tasks |
| FR/EN short job labels | Task 1 |

## Out of scope (do not implement)

- Character under cast photos  
- Hero meta strip / section surface cards  
- New rating providers  
- MediaQuick cast avatars  
