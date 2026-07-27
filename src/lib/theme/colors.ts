export const colors = {
  bg: "#0B0B0F",
  bgElevated: "#101016",
  surface: "#16161C",
  surfaceRaised: "#1E1E26",
  overlay: "rgba(11, 11, 15, 0.72)",
  scrim: "rgba(11, 11, 15, 0.55)",
  overlaySolid: "rgba(8, 10, 14, 0.96)",
  text: "#F4F0E8",
  textMuted: "#9A958C",
  textFaint: "#6F6A63",
  /** @deprecated Prefer textMuted — kept for existing call sites */
  secondary: "#9A958C",
  /** Brand amber — primary CTAs and highlight chips */
  accent: "#F5A524",
  accentMuted: "rgba(245, 165, 36, 0.22)",
  accentGlow: "rgba(245, 165, 36, 0.35)",
  /** Dusty steel — upcoming / dates (cool complement to amber) */
  info: "#8B9BB4",
  infoMuted: "rgba(139, 155, 180, 0.22)",
  danger: "#C45C4A",
  dangerMuted: "rgba(196, 92, 74, 0.22)",
  /** Soft sage — available / complete */
  success: "#6FBF7A",
  successMuted: "rgba(111, 191, 122, 0.22)",
  /** Deep gold — quality / sizes (same warm family as accent) */
  warning: "#C9A227",
  warningMuted: "rgba(201, 162, 39, 0.22)",
  borderSubtle: "rgba(244, 240, 232, 0.08)",
  borderInput: "rgba(244, 240, 232, 0.12)",
  borderMuted: "rgba(244, 240, 232, 0.2)",
  borderStrong: "rgba(244, 240, 232, 0.16)",
  handle: "rgba(244, 240, 232, 0.35)",
  neutralMuted: "rgba(154, 149, 140, 0.18)",
  secondaryBorder: "rgba(154, 149, 140, 0.35)",
} as const;
