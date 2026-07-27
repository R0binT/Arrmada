import AsyncStorage from "@react-native-async-storage/async-storage";

import { minTouchTarget, space } from "@/lib/theme";

export type UiSizeId = "compact" | "normal" | "comfortable";

export const UI_SIZE_IDS = ["compact", "normal", "comfortable"] as const;

export const DEFAULT_UI_SIZE: UiSizeId = "normal";

export const UI_SIZE_SCALES: Record<UiSizeId, number> = {
  compact: 0.9,
  normal: 1,
  comfortable: 1.15,
};

const STORAGE_KEY = "arr.uiSize";

export const isUiSizeId = (value: unknown): value is UiSizeId =>
  value === "compact" || value === "normal" || value === "comfortable";

export const resolveUiSizeScale = (id: UiSizeId): number => UI_SIZE_SCALES[id];

export const scaleFontSize = (size: number, scale: number): number =>
  Math.round(size * scale * 10) / 10;

export const scaleSpaceValue = (value: number, scale: number): number =>
  Math.round(value * scale);

export const scaledMinTouchTarget = (scale: number): number =>
  Math.max(minTouchTarget, Math.round(minTouchTarget * scale));

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

export const loadUiSize = async (): Promise<UiSizeId> => {
  const value = await AsyncStorage.getItem(STORAGE_KEY);
  if (isUiSizeId(value)) {
    return value;
  }
  return DEFAULT_UI_SIZE;
};

export const saveUiSize = async (id: UiSizeId): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY, id);
};

const SCALABLE_STYLE_KEYS = new Set([
  "fontSize",
  "lineHeight",
  "letterSpacing",
  "padding",
  "paddingTop",
  "paddingBottom",
  "paddingLeft",
  "paddingRight",
  "paddingHorizontal",
  "paddingVertical",
  "margin",
  "marginTop",
  "marginBottom",
  "marginLeft",
  "marginRight",
  "marginHorizontal",
  "marginVertical",
  "gap",
  "rowGap",
  "columnGap",
  "top",
  "bottom",
  "left",
  "right",
]);

/**
 * Scales typography and spacing numeric style props.
 * Leaves layout geometry (width/height/%) and colors untouched.
 */
export const scaleStyleValues = <T extends Record<string, unknown>>(
  style: T,
  scale: number,
): T => {
  if (scale === 1) {
    return style;
  }
  const next: Record<string, unknown> = { ...style };
  for (const key of Object.keys(next)) {
    if (!SCALABLE_STYLE_KEYS.has(key)) {
      continue;
    }
    const value = next[key];
    if (typeof value !== "number" || !Number.isFinite(value)) {
      continue;
    }
    next[key] =
      key === "fontSize" || key === "lineHeight" || key === "letterSpacing"
        ? scaleFontSize(value, scale)
        : scaleSpaceValue(value, scale);
  }
  return next as T;
};
