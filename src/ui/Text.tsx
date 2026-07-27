import { Text as RNText, type TextProps as RNTextProps } from "react-native";

import { colors, typeRoles, type TypeRoleName } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

type AppTextProps = Omit<RNTextProps, "children" | "role"> & {
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
