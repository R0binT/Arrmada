import { colors } from "@/lib/theme";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "ghostAccent"
  | "danger";

/** Semantic chip tones — warm cinema set only (no candy hues). */
export type ChipTone =
  | "neutral"
  | "accent"
  | "success"
  | "danger"
  | "warning"
  | "info";

export type IconButtonVariant = "default" | "accent" | "outline";

type ButtonVariantStyle = {
  readonly backgroundColor: string;
  readonly borderColor: string;
  readonly borderWidth: number;
  readonly labelColor: string;
};

type ChipToneStyle = {
  readonly backgroundColor: string;
  readonly borderColor: string;
  readonly labelColor: string;
};

type IconButtonVariantStyle = {
  readonly backgroundColor: string;
  readonly borderColor: string;
  readonly borderWidth: number;
  readonly iconColor: string;
};

/**
 * Action → color mapping:
 * - primary: download / add / confirm (amber)
 * - danger: remove / destructive (terracotta)
 * - secondary: cancel / alternate (neutral outline)
 * - ghost: dismiss / low emphasis
 * - ghostAccent: inline download (amber text)
 */
export const resolveButtonVariantStyle = (
  variant: ButtonVariant,
): ButtonVariantStyle => {
  switch (variant) {
    case "primary":
      return {
        backgroundColor: colors.accent,
        borderColor: "transparent",
        borderWidth: 0,
        labelColor: colors.bg,
      };
    case "secondary":
      return {
        backgroundColor: colors.surface,
        borderColor: colors.borderMuted,
        borderWidth: 1,
        labelColor: colors.text,
      };
    case "ghost":
      return {
        backgroundColor: "transparent",
        borderColor: "transparent",
        borderWidth: 0,
        labelColor: colors.textMuted,
      };
    case "ghostAccent":
      return {
        backgroundColor: colors.accentMuted,
        borderColor: colors.accent,
        borderWidth: 1,
        labelColor: colors.accent,
      };
    case "danger":
      return {
        backgroundColor: colors.dangerMuted,
        borderColor: colors.danger,
        borderWidth: 1,
        labelColor: colors.danger,
      };
  }
};

/**
 * Soft tint + colored label — readable without neon pills fighting the UI.
 */
export const resolveChipToneStyle = (tone: ChipTone): ChipToneStyle => {
  switch (tone) {
    case "neutral":
      return {
        backgroundColor: colors.surfaceRaised,
        borderColor: colors.borderMuted,
        labelColor: colors.textMuted,
      };
    case "accent":
      return {
        backgroundColor: colors.accentMuted,
        borderColor: colors.accent,
        labelColor: colors.accent,
      };
    case "success":
      return {
        backgroundColor: colors.successMuted,
        borderColor: colors.success,
        labelColor: colors.success,
      };
    case "danger":
      return {
        backgroundColor: colors.dangerMuted,
        borderColor: colors.danger,
        labelColor: colors.danger,
      };
    case "warning":
      return {
        backgroundColor: colors.warningMuted,
        borderColor: colors.warning,
        labelColor: colors.warning,
      };
    case "info":
      return {
        backgroundColor: colors.infoMuted,
        borderColor: colors.info,
        labelColor: colors.info,
      };
  }
};

export const resolveIconButtonVariantStyle = (
  variant: IconButtonVariant,
): IconButtonVariantStyle => {
  switch (variant) {
    case "accent":
      return {
        backgroundColor: colors.accent,
        borderColor: "transparent",
        borderWidth: 0,
        iconColor: colors.bg,
      };
    case "outline":
      return {
        backgroundColor: "transparent",
        borderColor: colors.accent,
        borderWidth: 1.5,
        iconColor: colors.accent,
      };
    case "default":
      return {
        backgroundColor: colors.surface,
        borderColor: "transparent",
        borderWidth: 0,
        iconColor: colors.text,
      };
  }
};
