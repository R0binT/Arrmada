export const colors = {
  bg: "#0B0B0F",
  surface: "#16161C",
  text: "#F4F0E8",
  secondary: "#9A958C",
  accent: "#F5A524",
  danger: "#C45C4A",
  success: "#6FBF7A",
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  md: 12,
  lg: 16,
} as const;

export const fonts = {
  display: "Fraunces_600SemiBold",
  ui: "Figtree_400Regular",
  uiMedium: "Figtree_500Medium",
  uiBold: "Figtree_600SemiBold",
} as const;

export const minTouchTarget = 44;

export const theme = {
  colors,
  space,
  radii,
  fonts,
  minTouchTarget,
} as const;
