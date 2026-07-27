# UI Design System & Premium Visual Lift — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an in-house design system (enriched tokens, `src/ui` primitives, cinematic motion presets) and migrate Arrmada to a premium dark-cinema UI in chained waves without changing Arr business logic.

**Architecture:** Split `src/lib/theme` into token modules with a stable `@/lib/theme` barrel. Add `src/ui` primitives that wrap React Native + Reanimated and scale via `UiSizeProvider`. Restyle domain components in `src/components`, then polish screens wave-by-wave (home/detail/add-preview → queue/upcoming/settings/onboarding → residual sheets/overlays). Keep dark-only (ADR-0015).

**Tech Stack:** Expo 57, React Native, Expo Router, StyleSheet, `react-native-reanimated`, `expo-image`, existing `UiSizeProvider`, Jest (`*.test.ts` only).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-27-ui-design-system-design.md`
- In-house DS only — no NativeWind, Paper, Tamagui as primary UI layer
- Dark-only; enrich palette DNA near `#0B0B0F` / cream / `#F5A524`
- No hardcoded colors / font families / radii in migrated screens or domain components
- `UiSize` Compact/Normal/Comfortable must keep working; touch targets ≥ 44
- Respect Reduce Motion (simplified fades, no parallax)
- Do not change Arr client, feature hooks, or i18n system except new labels if required
- Avoid “MVP” wording in commits/UI
- Jest only picks up `**/__tests__/**/*.test.ts` — put pure-logic tests there (not `.tsx`)
- Prefer reviewable commits per task/wave slice

## File map

| Path | Responsibility |
| --- | --- |
| `src/lib/theme.ts` → `src/lib/theme/index.ts` (+ modules) | Token barrel; keep `@/lib/theme` imports working |
| `src/lib/theme/colors.ts` | Layered color tokens |
| `src/lib/theme/space.ts` | Spacing scale `2xs`→`2xl` |
| `src/lib/theme/radii.ts` | Radius scale |
| `src/lib/theme/typography.ts` | Font families + type roles |
| `src/lib/theme/elevation.ts` | Shadow / elevation tokens |
| `src/lib/theme/motion.ts` | Durations, easings, preset ids |
| `src/lib/theme/__tests__/tokens.test.ts` | Token shape / DNA sanity |
| `src/lib/ui-size.ts` | Extend `ScaledSpace` for new space keys; optional type-role scaling helpers |
| `src/lib/__tests__/ui-size.test.ts` | Update scaleSpace expectations |
| `src/ui/Text.tsx` | Typed text roles |
| `src/ui/Surface.tsx` | Elevated surfaces |
| `src/ui/Button.tsx` | Primary/secondary/ghost/danger |
| `src/ui/IconButton.tsx` | DS icon button (replace component impl) |
| `src/ui/Screen.tsx` | Safe area screen shell |
| `src/ui/TextField.tsx` | Search/input shell |
| `src/ui/Chip.tsx` | Status / meta chips |
| `src/ui/Skeleton.tsx` | Loading blocks |
| `src/ui/Divider.tsx` | Hairline divider |
| `src/ui/motion/presets.ts` | Reanimated entering/press helpers |
| `src/ui/motion/use-reduce-motion.ts` | AccessibilityInfo reduce-motion hook |
| `src/ui/index.ts` | Barrel |
| `src/components/*` | Domain restyles consuming `@/ui` + tokens |
| `app/(tabs)/*` | Screen polish by wave |
| `app/_layout.tsx` | Fonts / theme wiring if needed |

---

### Task 1: Theme token modules + DNA tests

**Files:**
- Delete (after move): `src/lib/theme.ts`
- Create: `src/lib/theme/colors.ts`
- Create: `src/lib/theme/space.ts`
- Create: `src/lib/theme/radii.ts`
- Create: `src/lib/theme/typography.ts`
- Create: `src/lib/theme/elevation.ts`
- Create: `src/lib/theme/motion.ts`
- Create: `src/lib/theme/index.ts`
- Create: `src/lib/theme/__tests__/tokens.test.ts`

**Interfaces:**
- Produces: `@/lib/theme` exports `colors`, `space`, `radii`, `fonts`, `typeRoles`, `elevation`, `motion`, `minTouchTarget`, `theme`
- Consumes: nothing new

- [ ] **Step 1: Write failing token tests**

Create `src/lib/theme/__tests__/tokens.test.ts`:

```ts
import {
  colors,
  elevation,
  fonts,
  minTouchTarget,
  motion,
  radii,
  space,
  theme,
  typeRoles,
} from "@/lib/theme";

describe("theme tokens", () => {
  it("keeps dark-cinema DNA anchors", () => {
    expect(colors.bg).toBe("#0B0B0F");
    expect(colors.text).toBe("#F4F0E8");
    expect(colors.accent).toBe("#F5A524");
    expect(colors.danger).toBe("#C45C4A");
    expect(colors.success).toBe("#6FBF7A");
  });

  it("exposes layered surfaces and borders", () => {
    expect(colors.bgElevated).toBeTruthy();
    expect(colors.surface).toBeTruthy();
    expect(colors.surfaceRaised).toBeTruthy();
    expect(colors.overlay).toBeTruthy();
    expect(colors.textMuted).toBeTruthy();
    expect(colors.textFaint).toBeTruthy();
    expect(colors.accentMuted).toBeTruthy();
    expect(colors.accentGlow).toBeTruthy();
    expect(colors.warning).toBeTruthy();
    expect(colors.borderSubtle).toBeTruthy();
    expect(colors.borderStrong).toBeTruthy();
  });

  it("exposes expanded space and radii", () => {
    expect(space["2xs"]).toBe(2);
    expect(space.xs).toBe(4);
    expect(space.sm).toBe(8);
    expect(space.md).toBe(16);
    expect(space.lg).toBe(24);
    expect(space.xl).toBe(32);
    expect(space["2xl"]).toBe(48);
    expect(radii.sm).toBeLessThan(radii.md);
    expect(radii.md).toBe(12);
    expect(radii.lg).toBe(16);
    expect(radii.xl).toBeGreaterThan(radii.lg);
    expect(radii.full).toBe(9999);
  });

  it("exposes fonts, type roles, elevation, motion, theme bag", () => {
    expect(fonts.display).toBe("Fraunces_600SemiBold");
    expect(fonts.ui).toBe("Figtree_400Regular");
    expect(typeRoles.display.fontFamily).toBe(fonts.display);
    expect(typeRoles.body.fontFamily).toBe(fonts.ui);
    expect(elevation.none).toEqual({});
    expect(motion.duration.fast).toBeLessThan(motion.duration.normal);
    expect(motion.duration.normal).toBeLessThan(motion.duration.slow);
    expect(minTouchTarget).toBe(44);
    expect(theme.colors).toBe(colors);
    expect(theme.space).toBe(space);
  });

  it("keeps legacy secondary alias for gradual migration", () => {
    expect(colors.secondary).toBe(colors.textMuted);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=theme/__tests__/tokens`

Expected: FAIL (module path / missing exports)

- [ ] **Step 3: Implement token modules**

`src/lib/theme/colors.ts`:

```ts
export const colors = {
  bg: "#0B0B0F",
  bgElevated: "#101016",
  surface: "#16161C",
  surfaceRaised: "#1E1E26",
  overlay: "rgba(11, 11, 15, 0.72)",
  text: "#F4F0E8",
  textMuted: "#9A958C",
  textFaint: "#6F6A63",
  /** @deprecated Prefer textMuted — kept for existing call sites */
  secondary: "#9A958C",
  accent: "#F5A524",
  accentMuted: "rgba(245, 165, 36, 0.18)",
  accentGlow: "rgba(245, 165, 36, 0.35)",
  danger: "#C45C4A",
  dangerMuted: "rgba(196, 92, 74, 0.18)",
  success: "#6FBF7A",
  successMuted: "rgba(111, 191, 122, 0.18)",
  warning: "#E0B35A",
  warningMuted: "rgba(224, 179, 90, 0.18)",
  borderSubtle: "rgba(244, 240, 232, 0.08)",
  borderStrong: "rgba(244, 240, 232, 0.16)",
} as const;
```

`src/lib/theme/space.ts`:

```ts
export const space = {
  "2xs": 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
} as const;
```

`src/lib/theme/radii.ts`:

```ts
export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;
```

`src/lib/theme/typography.ts`:

```ts
export const fonts = {
  display: "Fraunces_600SemiBold",
  ui: "Figtree_400Regular",
  uiMedium: "Figtree_500Medium",
  uiBold: "Figtree_600SemiBold",
} as const;

export type TypeRoleName =
  | "display"
  | "title"
  | "headline"
  | "body"
  | "label"
  | "caption";

export type TypeRole = {
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly lineHeight: number;
};

export const typeRoles: Record<TypeRoleName, TypeRole> = {
  display: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38 },
  title: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28 },
  headline: { fontFamily: fonts.uiBold, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fonts.uiMedium, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.ui, fontSize: 12, lineHeight: 16 },
};
```

`src/lib/theme/elevation.ts`:

```ts
import { Platform, type ViewStyle } from "react-native";

import { colors } from "@/lib/theme/colors";

export const elevation = {
  none: {} as ViewStyle,
  low: Platform.select<ViewStyle>({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
    },
    android: { elevation: 2 },
    default: {},
  })!,
  mid: Platform.select<ViewStyle>({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
    },
    android: { elevation: 6 },
    default: {},
  })!,
  glowAccent: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    ...(Platform.OS === "android" ? { elevation: 4 } : {}),
  } as ViewStyle,
} as const;
```

`src/lib/theme/motion.ts`:

```ts
export const motion = {
  duration: {
    instant: 100,
    fast: 180,
    normal: 280,
    slow: 420,
  },
  easing: {
    standard: "cubic-bezier(0.2, 0, 0, 1)",
    emphasized: "cubic-bezier(0.2, 0, 0, 1)",
  },
  presets: {
    fadeIn: "fadeIn",
    fadeSlideUp: "fadeSlideUp",
    heroParallax: "heroParallax",
    pressScale: "pressScale",
    sheetPresent: "sheetPresent",
  },
} as const;
```

`src/lib/theme/index.ts`:

```ts
export { colors } from "@/lib/theme/colors";
export { space } from "@/lib/theme/space";
export { radii } from "@/lib/theme/radii";
export { fonts, typeRoles, type TypeRole, type TypeRoleName } from "@/lib/theme/typography";
export { elevation } from "@/lib/theme/elevation";
export { motion } from "@/lib/theme/motion";

export const minTouchTarget = 44;

import { colors } from "@/lib/theme/colors";
import { elevation } from "@/lib/theme/elevation";
import { fonts, typeRoles } from "@/lib/theme/typography";
import { motion } from "@/lib/theme/motion";
import { radii } from "@/lib/theme/radii";
import { space } from "@/lib/theme/space";

export const theme = {
  colors,
  space,
  radii,
  fonts,
  typeRoles,
  elevation,
  motion,
  minTouchTarget,
} as const;
```

Remove `src/lib/theme.ts` so the directory barrel resolves (Node/TS path `@/lib/theme` → `theme/index.ts`).

- [ ] **Step 4: Run tests + typecheck**

Run: `npm test -- --testPathPattern=theme/__tests__/tokens`  
Expected: PASS

Run: `npm run typecheck`  
Expected: PASS (existing `colors.secondary` / `space.*` / `radii.md` still resolve)

- [ ] **Step 5: Commit**

```bash
git add src/lib/theme src/lib/theme.ts
git commit -m "feat(ui): expand theme into layered design tokens"
```

---

### Task 2: Scale new space keys in UiSize

**Files:**
- Modify: `src/lib/ui-size.ts`
- Modify: `src/lib/__tests__/ui-size.test.ts`

**Interfaces:**
- Consumes: `space` from `@/lib/theme` (now includes `2xs`, `2xl`)
- Produces: `ScaledSpace` with `2xs` | `xs` | `sm` | `md` | `lg` | `xl` | `2xl`

- [ ] **Step 1: Update failing ui-size expectations**

In `src/lib/__tests__/ui-size.test.ts`, extend the space scaling test:

```ts
  it("scales fonts and space including 2xs and 2xl", () => {
    expect(scaleFontSize(16, 0.9)).toBe(14.4);
    expect(scaleSpace(1.15).md).toBe(18);
    expect(scaleSpace(1).["2xs"]).toBe(2);
    expect(scaleSpace(1).["2xl"]).toBe(48);
    expect(scaleSpace(1.15)["2xl"]).toBe(55);
  });
```

(Replace the existing `"scales fonts and space"` test.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=ui-size`

Expected: FAIL on `2xs` / `2xl` missing from `ScaledSpace`

- [ ] **Step 3: Extend ScaledSpace**

In `src/lib/ui-size.ts`, update:

```ts
export type ScaledSpace = {
  readonly "2xs": number;
  readonly xs: number;
  readonly sm: number;
  readonly md: number;
  readonly lg: number;
  readonly xl: number;
  readonly "2xl": number;
};

export const scaleSpace = (scale: number): ScaledSpace => ({
  "2xs": scaleSpaceValue(space["2xs"], scale),
  xs: scaleSpaceValue(space.xs, scale),
  sm: scaleSpaceValue(space.sm, scale),
  md: scaleSpaceValue(space.md, scale),
  lg: scaleSpaceValue(space.lg, scale),
  xl: scaleSpaceValue(space.xl, scale),
  "2xl": scaleSpaceValue(space["2xl"], scale),
});
```

- [ ] **Step 4: Run tests**

Run: `npm test -- --testPathPattern=ui-size`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/ui-size.ts src/lib/__tests__/ui-size.test.ts
git commit -m "feat(ui): scale expanded spacing tokens via UiSize"
```

---

### Task 3: Motion presets + reduce-motion hook

**Files:**
- Create: `src/ui/motion/use-reduce-motion.ts`
- Create: `src/ui/motion/presets.ts`
- Create: `src/ui/motion/__tests__/presets.test.ts`
- Create: `src/ui/index.ts` (barrel start)

**Interfaces:**
- Produces:

```ts
export const useReduceMotion = (): boolean;

export const createFadeIn = (reduceMotion: boolean) => EntryOrUndefined;
export const createFadeSlideUp = (reduceMotion: boolean, index?: number) => EntryOrUndefined;
export const pressScaleStyle = (pressed: boolean, reduceMotion: boolean) => ViewStyle;
export const heroParallaxStyle = (scrollY: SharedValue<number>, reduceMotion: boolean) => AnimatedStyle;
```

- [ ] **Step 1: Write failing preset helper tests**

Create `src/ui/motion/__tests__/presets.test.ts`:

```ts
import { pressScaleStyle } from "@/ui/motion/presets";

describe("motion presets", () => {
  it("scales down when pressed unless reduce motion", () => {
    expect(pressScaleStyle(true, false)).toEqual({
      opacity: 0.92,
      transform: [{ scale: 0.97 }],
    });
    expect(pressScaleStyle(true, true)).toEqual({ opacity: 0.92 });
    expect(pressScaleStyle(false, false)).toEqual({});
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=ui/motion`

Expected: FAIL (module not found)

- [ ] **Step 3: Implement hook + presets**

`src/ui/motion/use-reduce-motion.ts`:

```ts
import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

export const useReduceMotion = (): boolean => {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
};
```

`src/ui/motion/presets.ts`:

```ts
import { FadeIn, FadeInDown } from "react-native-reanimated";
import type { ViewStyle } from "react-native";

import { motion } from "@/lib/theme";

export const createFadeIn = (reduceMotion: boolean) => {
  if (reduceMotion) return undefined;
  return FadeIn.duration(motion.duration.normal);
};

export const createFadeSlideUp = (reduceMotion: boolean, index = 0) => {
  if (reduceMotion) return FadeIn.duration(motion.duration.fast);
  return FadeInDown.duration(motion.duration.normal).delay(
    Math.min(index * 40, 240),
  );
};

export const pressScaleStyle = (
  pressed: boolean,
  reduceMotion: boolean,
): ViewStyle => {
  if (!pressed) return {};
  if (reduceMotion) return { opacity: 0.92 };
  return { opacity: 0.92, transform: [{ scale: 0.97 }] };
};
```

`src/ui/index.ts`:

```ts
export { useReduceMotion } from "@/ui/motion/use-reduce-motion";
export {
  createFadeIn,
  createFadeSlideUp,
  pressScaleStyle,
} from "@/ui/motion/presets";
```

Defer `heroParallaxStyle` to Task 8/9 when wiring Home scroll (implement there with `useAnimatedStyle` + `interpolate`).

- [ ] **Step 4: Run tests**

Run: `npm test -- --testPathPattern=ui/motion`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui
git commit -m "feat(ui): add motion presets and reduce-motion hook"
```

---

### Task 4: Text + Surface primitives

**Files:**
- Create: `src/ui/Text.tsx`
- Create: `src/ui/Surface.tsx`
- Modify: `src/ui/index.ts`

**Interfaces:**
- Produces:

```ts
type TextProps = {
  readonly role?: TypeRoleName; // default "body"
  readonly color?: keyof typeof colors | string; // prefer token keys via helper
  readonly children: ReactNode;
  // ... Text props subset
};

type SurfaceProps = {
  readonly tone?: "base" | "raised" | "elevated";
  readonly radius?: keyof typeof radii;
  readonly padded?: boolean;
  readonly children: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
};
```

- [ ] **Step 1: Implement `Text`**

```tsx
import { Text as RNText, type TextProps as RNTextProps } from "react-native";

import { colors, typeRoles, type TypeRoleName } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

type AppTextProps = Omit<RNTextProps, "children"> & {
  readonly role?: TypeRoleName;
  readonly tone?: "default" | "muted" | "faint" | "accent" | "danger" | "success";
  readonly children: RNTextProps["children"];
};

const TONE_COLOR = {
  default: colors.text,
  muted: colors.textMuted,
  faint: colors.textFaint,
  accent: colors.accent,
  danger: colors.danger,
  success: colors.success,
} as const;

export const Text = ({
  role = "body",
  tone = "default",
  style,
  children,
  ...rest
}: AppTextProps) => {
  const { fontSize } = useUiSize();
  const roleStyle = typeRoles[role];
  return (
    <RNText
      {...rest}
      style={[
        {
          color: TONE_COLOR[tone],
          fontFamily: roleStyle.fontFamily,
          fontSize: fontSize(roleStyle.fontSize),
          lineHeight: fontSize(roleStyle.lineHeight),
        },
        style,
      ]}
    >
      {children}
    </RNText>
  );
};
```

- [ ] **Step 2: Implement `Surface`**

```tsx
import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { colors, elevation, radii, space } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

type SurfaceProps = {
  readonly children: ReactNode;
  readonly tone?: "base" | "raised" | "elevated";
  readonly radius?: keyof typeof radii;
  readonly padded?: boolean;
  readonly style?: StyleProp<ViewStyle>;
};

export const Surface = ({
  children,
  tone = "base",
  radius = "lg",
  padded = false,
  style,
}: SurfaceProps) => {
  const { space: scaled } = useUiSize();
  const backgroundColor =
    tone === "elevated"
      ? colors.bgElevated
      : tone === "raised"
        ? colors.surfaceRaised
        : colors.surface;
  return (
    <View
      style={[
        {
          backgroundColor,
          borderColor: colors.borderSubtle,
          borderRadius: radii[radius],
          borderWidth: 1,
          ...(tone === "raised" || tone === "elevated" ? elevation.low : {}),
          ...(padded ? { padding: scaled.md } : {}),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};
```

- [ ] **Step 3: Export from barrel + typecheck**

Add exports to `src/ui/index.ts`. Run: `npm run typecheck` — Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/ui
git commit -m "feat(ui): add Text and Surface primitives"
```

---

### Task 5: Button, IconButton, TextField, Chip, Skeleton, Divider, Screen

**Files:**
- Create: `src/ui/Button.tsx`
- Create: `src/ui/IconButton.tsx`
- Create: `src/ui/TextField.tsx`
- Create: `src/ui/Chip.tsx`
- Create: `src/ui/Skeleton.tsx`
- Create: `src/ui/Divider.tsx`
- Create: `src/ui/Screen.tsx` (port from `src/components/Screen.tsx` using tokens)
- Modify: `src/ui/index.ts`
- Modify: `src/components/Screen.tsx` → re-export from `@/ui/Screen`
- Modify: `src/components/IconButton.tsx` → re-export from `@/ui/IconButton`
- Modify: `src/components/SkeletonBlock.tsx` → thin wrapper around `@/ui/Skeleton` **or** keep API and implement with tokens

**Interfaces:**
- `Button`: `variant: "primary" | "secondary" | "ghost" | "danger"`, `loading?: boolean`, min height `minTouchTarget`
- `IconButton`: preserve existing props (`accessibilityLabel`, `icon`, `variant`, `onPress`, `disabled`, `style`)
- `Screen`: preserve `{ children, scroll?: boolean }`
- `Chip`: `tone: "neutral" | "accent" | "success" | "danger" | "warning"`
- `TextField`: controlled `value` / `onChangeText` / `placeholder`, surface styling
- `Skeleton`: width/height/radius props (replace ad-hoc gray blocks)

- [ ] **Step 1: Port `Screen` to `src/ui/Screen.tsx`**

Copy behaviour from `src/components/Screen.tsx`; use `colors.bg` and scaled space. Then:

```ts
// src/components/Screen.tsx
export { Screen } from "@/ui/Screen";
```

- [ ] **Step 2: Implement `Button` + `IconButton` with `pressScaleStyle` + `useReduceMotion`**

Primary = `colors.accent` fill + `colors.bg` label; secondary = surface + border; ghost = transparent; danger = `colors.danger`.

Preserve `IconButton` public API so call sites keep working via re-export.

- [ ] **Step 3: Implement TextField, Chip, Skeleton, Divider**

`Chip` should be usable by `LookupStatusBadge` / `StatusChip` later (Wave residual can migrate those).

- [ ] **Step 4: Barrel exports + typecheck + existing tests**

Run: `npm run typecheck` && `npm test`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui src/components/Screen.tsx src/components/IconButton.tsx src/components/SkeletonBlock.tsx
git commit -m "feat(ui): add Button IconButton Screen and form primitives"
```

---

### Task 6: Wave 1 domain restyle — Hero, posters, empty/error

**Files:**
- Modify: `src/components/HeroBanner.tsx`
- Modify: `src/components/PosterCard.tsx`
- Modify: `src/components/PosterRow.tsx`
- Modify: `src/components/EmptyState.tsx`
- Modify: `src/components/ErrorBanner.tsx`
- Modify: `src/components/ProgressBar.tsx` (token borders/colors only if needed)

**Interfaces:**
- Consumes: `@/ui` Text/Surface/motion, `@/lib/theme` layered colors
- Public props of Hero/Poster stay stable (no feature regress)

- [ ] **Step 1: Restyle `HeroBanner`**

- Stronger multi-stop overlay (`colors.overlay` → transparent gradient via stacked Views if no LinearGradient dependency; if adding a dep, prefer `expo-linear-gradient` only if already acceptable — otherwise stacked absolute Views with opacity steps)
- Title via `Text role="title"`; subtitle muted
- CTA chip using accent surface
- `pressScaleStyle` on press

- [ ] **Step 2: Restyle `PosterCard` / `PosterRow`**

- Border `borderSubtle`, radius `radii.lg`, selected ring `accentGlow`
- Staggered `entering={createFadeSlideUp(reduceMotion, index)}` on row children
- Press scale on cards

- [ ] **Step 3: Restyle EmptyState + ErrorBanner with Surface + Text**

- [ ] **Step 4: typecheck + test suite**

Run: `npm run typecheck` && `npm test`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components
git commit -m "feat(ui): restyle hero posters and feedback components"
```

---

### Task 7: Wave 1 — Home + tab bar

**Files:**
- Modify: `app/(tabs)/index.tsx`
- Modify: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Home cinematic layout**

- Animated scroll (`Animated.ScrollView` from Reanimated) driving optional hero parallax (`translateY` / `scale` from `scrollY`); skip transforms when `useReduceMotion()`
- Header: tighter branding hierarchy with `Text` roles + `ServiceHealthDot`
- Poster sections use updated `PosterRow`
- Replace raw `ActivityIndicator` color with `colors.accent` (token) already used — ensure no new literals

- [ ] **Step 2: Tab bar chrome**

```ts
tabBarStyle: {
  backgroundColor: colors.bgElevated,
  borderTopColor: colors.borderSubtle,
  // keep platform hairline behaviour
}
tabBarActiveTintColor: colors.accent
tabBarInactiveTintColor: colors.textMuted
```

Optional: slightly larger active icon opacity; no IA changes.

- [ ] **Step 3: Manual checklist (document in commit body)**

- Home loads with hero + rows
- Reduce Motion: no parallax / no scale press (opacity only)
- UiSize comfortable: larger type/spacing

- [ ] **Step 4: typecheck + tests + commit**

```bash
git add app/(tabs)/index.tsx app/(tabs)/_layout.tsx
git commit -m "feat(ui): cinematic home and tokenized tab bar"
```

---

### Task 8: Wave 1 — Movie/series detail

**Files:**
- Modify: `app/(tabs)/movies/[id].tsx`
- Modify: `app/(tabs)/series/[id].tsx`

- [ ] **Step 1: Immersive header**

- Backdrop/poster full-bleed top with gradient/overlay stack
- Title `Text role="display"` or `title`; meta with `Chip` / muted text
- Action buttons → `@/ui/Button` / `IconButton`

- [ ] **Step 2: Body sections on `Surface tone="raised"`**

Monitor toggles, episode lists, etc. keep behaviour; only visual shell changes.

- [ ] **Step 3: Loading/error use Skeleton + ErrorBanner**

- [ ] **Step 4: typecheck + tests + commit**

```bash
git add "app/(tabs)/movies/[id].tsx" "app/(tabs)/series/[id].tsx"
git commit -m "feat(ui): immersive movie and series detail screens"
```

---

### Task 9: Wave 1 — Add search + preview

**Files:**
- Modify: `app/(tabs)/movies/add.tsx`
- Modify: `app/(tabs)/series/add.tsx`
- Modify: `app/(tabs)/movies/preview.tsx`
- Modify: `app/(tabs)/series/preview.tsx`
- Modify: `src/components/LookupStatusBadge.tsx` (use `Chip` if straightforward)

- [ ] **Step 1: Add screens**

- `TextField` for search
- Candidate rows with clearer hierarchy + `LookupStatusBadge` chips
- Keep MediaQuick wiring unchanged

- [ ] **Step 2: Preview screens**

- Cinematic poster-dominant layout, DS buttons for Add
- Entering animation via `createFadeIn`

- [ ] **Step 3: typecheck + tests (esp. media-quick + mappers) + commit**

```bash
git add app/(tabs)/movies/add.tsx app/(tabs)/series/add.tsx app/(tabs)/movies/preview.tsx app/(tabs)/series/preview.tsx src/components/LookupStatusBadge.tsx
git commit -m "feat(ui): premium add search and preview screens"
```

---

### Task 10: Wave 2 — Queue, Upcoming, Settings, Onboarding

**Files:**
- Modify: `app/(tabs)/queue.tsx`
- Modify: `app/(tabs)/upcoming.tsx`
- Modify: `app/(tabs)/settings/index.tsx`
- Modify: `app/(tabs)/settings/services.tsx`
- Modify: `app/(tabs)/settings/preferences.tsx`
- Modify: `app/onboarding.tsx`
- Modify: `src/components/QueueRow.tsx`
- Modify: `src/components/UpcomingRow.tsx`
- Modify: `src/components/UpcomingCalendar.tsx`
- Modify: `src/features/settings/*.tsx` cards/rows as needed

- [ ] **Step 1: Queue + Upcoming visual parity**

Same surfaces, type roles, motion entrances as Wave 1. Calendar cells use token colors only (no raw rgba).

- [ ] **Step 2: Settings + Onboarding**

Cards → `Surface`; nav rows → DS press states; onboarding CTA → `Button`.

- [ ] **Step 3: typecheck + tests + commit**

```bash
git add app/(tabs)/queue.tsx app/(tabs)/upcoming.tsx app/(tabs)/settings app/onboarding.tsx src/components/QueueRow.tsx src/components/UpcomingRow.tsx src/components/UpcomingCalendar.tsx src/features/settings
git commit -m "feat(ui): wave 2 premium polish for library ops screens"
```

---

### Task 11: Residual surfaces (chained)

**Files:**
- Modify: `src/components/MediaQuickPanel.tsx`
- Modify: `src/components/MediaQuickSheet.tsx`
- Modify: `src/components/AudioChoiceSheet.tsx`
- Modify: `src/features/verrou/UnlockOverlay.tsx`
- Modify: `src/features/verrou/VerrouSettingsCard.tsx`
- Modify: `app/+not-found.tsx`
- Modify: remaining skeletons (`PosterGridSkeleton`, `QueueSkeleton`)
- Grep sweep: `rg -n "#[0-9A-Fa-f]{3,8}|rgba\(" app src/components src/features src/ui` and eliminate stragglers outside `src/lib/theme`

- [ ] **Step 1: Sheets / overlays / not-found on DS**

Sheet present animation uses `motion.duration` + reduce-motion safe opacity fade.

- [ ] **Step 2: Hex/rgba sweep — only theme module may define raw colors**

Allow exceptions only inside `src/lib/theme/**`.

- [ ] **Step 3: Full verification**

Run: `npm run typecheck && npm run lint && npm test`  
Expected: all PASS

Manual: Wave 1 flows + MediaQuick add + unlock overlay + UiSize presets + Reduce Motion.

- [ ] **Step 4: Commit**

```bash
git add app src
git commit -m "feat(ui): finish residual surfaces on design system"
```

---

## Spec coverage checklist (self-review)

| Spec requirement | Task |
| --- | --- |
| Enriched tokens / DNA | Task 1 |
| UiSize scales tokens | Task 2 |
| Motion presets + Reduce Motion | Task 3 |
| `src/ui` primitives | Tasks 4–5 |
| Domain components consume DS | Task 6 |
| Wave 1 home + tabs | Task 7 |
| Wave 1 detail | Task 8 |
| Wave 1 add/preview | Task 9 |
| Wave 2 chained | Task 10 |
| Residual chained | Task 11 |
| No Arr/i18n/hook rewrites | Global constraints |
| Dark-only | Global + Task 1 |
| Success: no magic colors in migrated UI | Task 11 grep sweep |

## Execution notes

- Prefer **subagent-driven-development**: one fresh agent per task, review between tasks.
- If a task PR grows too large, split commits as already listed — do not skip later waves.
- Visual hex values may be tuned during Tasks 6–11; keep DNA anchors tested in Task 1 unless product explicitly changes them.
