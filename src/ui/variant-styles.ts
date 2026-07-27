import { colors } from "@/lib/theme";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export type ChipTone = "neutral" | "accent" | "success" | "danger" | "warning";

export type IconButtonVariant = "default" | "accent" | "outline";

type ButtonVariantStyle = {
  readonly backgroundColor: string;
  readonly borderColor: string;
  readonly borderWidth: number;
  readonly labelColor: string;
};

type ChipToneStyle = {
  readonly backgroundColor: string;
  readonly labelColor: string;
};

type IconButtonVariantStyle = {
  readonly backgroundColor: string;
  readonly borderColor: string;
  readonly borderWidth: number;
  readonly iconColor: string;
};

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
        borderColor: colors.borderSubtle,
        borderWidth: 1,
        labelColor: colors.text,
      };
    case "ghost":
      return {
        backgroundColor: "transparent",
        borderColor: "transparent",
        borderWidth: 0,
        labelColor: colors.text,
      };
    case "danger":
      return {
        backgroundColor: colors.danger,
        borderColor: "transparent",
        borderWidth: 0,
        labelColor: colors.text,
      };
  }
};

export const resolveChipToneStyle = (tone: ChipTone): ChipToneStyle => {
  switch (tone) {
    case "neutral":
      return {
        backgroundColor: colors.surface,
        labelColor: colors.textMuted,
      };
    case "accent":
      return {
        backgroundColor: colors.accentMuted,
        labelColor: colors.accent,
      };
    case "success":
      return {
        backgroundColor: colors.successMuted,
        labelColor: colors.success,
      };
    case "danger":
      return {
        backgroundColor: colors.dangerMuted,
        labelColor: colors.danger,
      };
    case "warning":
      return {
        backgroundColor: colors.warningMuted,
        labelColor: colors.warning,
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
