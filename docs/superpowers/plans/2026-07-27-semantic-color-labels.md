# Semantic color labels — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Shared semantic ChipTone for availability, MediaQuick, detail chips, library filters, and lookup badge.

**Architecture:** One pure mapper `availabilityChipTone` + MediaQuick chips as `{ label, tone }`; shared `libraryFilterChipStyle` for movies/series filter bars.

**Tech stack:** Existing `@/ui/Chip`, `@/ui/variant-styles` ChipTone, theme tokens only.

---

### Task 1: Availability tone helper + tests

**Files:**
- Create: `src/features/library/availability-chip-tone.ts`
- Create: `src/features/library/__tests__/availability-chip-tone.test.ts`

**Step 1:** Map `dispo→success`, `aTelecharger→accent`, `aVenir→warning`, undefined→neutral.

**Step 2:** Run `npx jest src/features/library/__tests__/availability-chip-tone.test.ts`

---

### Task 2: MediaQuick toned chips

**Files:**
- Modify: `src/features/media-quick/types.ts`
- Modify: `src/features/media-quick/build-media-quick-view-model.ts`
- Modify: `src/features/media-quick/__tests__/build-media-quick-view-model.test.ts`
- Modify: `src/components/MediaQuickPanel.tsx`
- Modify: `src/components/MediaQuickSheet.tsx`

Chips become `{ label: string; tone: ChipTone }[]`. Status uses semantic tones without gray overrides. Sheet/panel use `surfaceRaised`. Optional poster if selection has `posterUrl` (stretch in same PR).

---

### Task 3: Detail + lookup badges

**Files:**
- Modify: `app/(tabs)/movies/[id].tsx`
- Modify: `app/(tabs)/series/[id].tsx`
- Modify: `src/components/LookupStatusBadge.tsx`

Use `availabilityChipTone` on detail status chips. Lookup `inLibrary` → accent.

---

### Task 4: Library filter chip styles

**Files:**
- Create: `src/features/library/library-filter-chip-style.ts`
- Modify: `app/(tabs)/movies/index.tsx`
- Modify: `app/(tabs)/series/index.tsx`

Shared inactive/active styles per filter key per spec.

---

### Task 5: Verify

- `npm run typecheck`
- Targeted jest for media-quick + library helpers
- Reload emulator app
