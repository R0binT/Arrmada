# Pull-to-refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Native pull-to-refresh on Home, Movies, Series, and Queue screens.

**Architecture:** Wire React Native `RefreshControl` on each screen’s primary vertical scroller. Extend feature hooks to expose Promise-based `refetch` / `isRefetching` (home: `refetchAll` + upcoming).

**Tech Stack:** Expo Router, React Native `RefreshControl`, TanStack Query v5.

---

### Task 1: Hook APIs

**Files:**
- Modify: `src/features/home/use-home-data.ts`
- Modify: `src/features/upcoming/use-upcoming.ts`
- Modify: `src/features/queue/use-queue.ts`

- [ ] Add `refetchAll(): Promise<void>` and `isRefetching` to `useHomeData`
- [ ] Add Promise `refetch` + `isRefetching` to `useUpcoming`
- [ ] Add Promise `refetch` + `isRefetching` to `useQueue` (keep void helpers for ErrorBanner if desired)

### Task 2: Screens

**Files:**
- Modify: `app/(tabs)/index.tsx`
- Modify: `app/(tabs)/movies/index.tsx`
- Modify: `app/(tabs)/series/index.tsx`
- Modify: `app/(tabs)/queue.tsx`

- [ ] Home: `refreshControl` on `Animated.ScrollView`; refresh home + upcoming
- [ ] Movies/Series: `RefreshControl` on `FlatList`; empty via `ScrollView`+PTR when no list
- [ ] Queue: same pattern
- [ ] Tint with `colors.text`

### Task 3: Verify

- [ ] Typecheck / lint touched files
- [ ] Manual: pull on each of the four tabs
