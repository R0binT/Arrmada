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
  display: { fontFamily: fonts.display, fontSize: 40, lineHeight: 46 },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34 },
  headline: { fontFamily: fonts.uiBold, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fonts.uiMedium, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.ui, fontSize: 12, lineHeight: 16 },
};
