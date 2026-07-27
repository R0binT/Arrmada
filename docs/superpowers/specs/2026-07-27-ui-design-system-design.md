# UI design system & premium visual lift — design

**Date:** 2026-07-27  
**Status:** Approved for implementation after user review of this spec

## Goal

Raise Arrmada’s UI from “pleasant but basic” to a **professional, cinematic, premium** feel while keeping the existing dark-cinema identity (Fraunces + Figtree, cream text, amber accent). Introduce a **real in-house design system** (tokens + primitives + motion), then migrate every screen to it in chained waves—without changing Arr business logic.

## Decisions (from brainstorming)

| Topic | Choice |
| --- | --- |
| Ambition | **A poussé** — same identity, much stronger craft + atmosphere |
| Wow focus | **Both** — immersive media (heroes, posters, gradients) + high-end UI craft |
| Rollout | **Wave 1 first**, then **Wave 2 immediately**, then **any remaining surfaces with no artificial pause** |
| Motion | **Cinematic** (parallax, blur where viable, marked but intentional motion) |
| Palette | **Enriched** — same DNA, richer layered tokens (surfaces, accents, borders, states) |
| Implementation | **In-house DS** (`src/lib/theme` + `src/ui`) — no NativeWind migration, no third-party UI kit |
| Theme mode | **Dark-only** (ADR-0015 unchanged) |

Tokens and visual details may be refined during implementation; this spec locks direction and structure.

## Out of scope

These stay unchanged except where UI must consume them differently:

- **Arr client / networking / credentials** (Radarr/Sonarr APIs, SecureStore, mappers’ data contracts unless a pure display need appears)
- **Feature hooks & server state** (TanStack Query, home/queue/upcoming/media-quick controllers)
- **i18n system** (FR/EN keys and `t(...)`); copy changes only if a new UI pattern requires a label
- **Product navigation IA** (tab set and routes stay; visual chrome of tabs may change)

## Architecture

```
src/lib/theme/     → design tokens (colors, space, radii, type, elevation, motion)
src/ui/            → primitives (Text, Button, Surface, Screen, Chip, …) + motion presets
src/components/    → domain UI (PosterCard, HeroBanner, QueueRow, …) — tokens + src/ui only
app/               → screens compose src/ui + src/components — no magic colors/fonts/radii
```

### Rules

1. Screens and domain components must not hardcode colors, font families, or radii; use tokens / primitives.
2. `UiSize` scales named type and density tokens (Compact / Normal / Comfortable); touch targets stay ≥ 44.
3. Motion uses shared Reanimated presets; respect system Reduce Motion with simplified variants.
4. Heavy effects (blur, parallax) degrade gracefully on low-end Android (opaque overlays / no parallax).

### Suggested token surface (enrich, don’t replace DNA)

- **Color:** `bg`, `bgElevated`, `surface`, `surfaceRaised`, `overlay`, `text`, `textMuted`, `textFaint`, `accent`, `accentMuted`, `accentGlow`, `success` / `danger` / `warning` (+ muted variants), `borderSubtle`, `borderStrong`
- **Type roles:** `display`, `title`, `headline`, `body`, `label`, `caption` (Fraunces for display/title heroes; Figtree for UI)
- **Space:** `2xs` → `2xl`; **radii:** `sm` / `md` / `lg` / `xl` / `full`
- **Elevation / motion:** named shadow levels + presets (`fadeIn`, `fadeSlideUp`, `heroParallax`, `pressScale`, `sheetPresent`) with shared durations/easings

Exact hex values are refined in implementation; base DNA remains near current `#0B0B0F` / cream / `#F5A524`.

### Primitives (`src/ui`) — minimum set

`Text`, `Button`, `IconButton`, `Surface`, `Screen` (migrate from `src/components/Screen.tsx`), `TextField`, `Chip`, `Skeleton`, `Divider`, plus `motion/` presets.

Domain components in `src/components/` are restyled to consume the DS; they are not replaced by a generic kit.

## Waves

### Wave 1 — DS foundation + showcase screens

- Tokens + `src/ui` primitives + motion presets
- **Home** — full-bleed cinematic hero (gradient overlays, light scroll parallax), poster rows with staggered entrance + press scale, stronger header (logo + health)
- **Movie / series detail** — immersive backdrop/poster header, Fraunces titles, layered surfaces, DS actions, upgraded loading/error
- **Add + preview** — clearer candidate list (status chips), cinematic preview composition, animated sheet/panel
- **Tab bar** — tokenized surface/border/active state (not tint-only)

Non–Wave-1 screens may already import new tokens/primitives without full immersive treatment yet.

### Wave 2 — remaining primary tabs

- Queue, Upcoming, Settings (hub + services + preferences), Onboarding  
- Same visual language and motion system as Wave 1 (not a second style)

### Wave 3+ — residual surfaces (chained immediately)

Any leftover chrome at the same premium level, including but not limited to:

- MediaQuick sheet/panel, audio choice sheet, unlock overlay, empty/error banners, not-found, skeletons not yet migrated

No intentional gap between Wave 2 and residual surfaces.

## Motion & performance

- Cinematic but intentional: mount/interaction-driven; no continuous idle animations that drain battery
- Reduce Motion → fade-only / no parallax
- Keep `expo-image` and list virtualization patterns; animate Reanimated wrappers, not entire trees unnecessarily

## Delivery & verification

- Prefer reviewable PRs/commits per wave (or per coherent slice), not one unreviewable megadiff
- Automated: `npm run typecheck`, `npm run lint`, `npm test` (preserve existing MediaQuick / add-flow behaviour)
- Manual: Wave 1 hero/detail/preview; Reduce Motion; UiSize Compact / Normal / Comfortable; Android + iOS smoke if available

## Success criteria

1. Migrated screens have **no** ad-hoc color/font/radius literals outside the theme module.
2. Wave 1 feels clearly more premium/cinematic without changing Arr workflows.
3. Motion is noticeable and polished; Reduce Motion still usable.
4. UiSize and accessibility baselines (touch ≥ 44, labels) remain intact.
5. Waves 2 and residual surfaces follow without a separate “later someday” redesign.

## Non-goals

- Light theme
- Arr UI feature parity / new Arr product features
- Introducing NativeWind, Paper, Tamagui, or similar as the primary UI layer
- Rewriting navigation structure or tab information architecture
