import {
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { colors, fonts, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

type TextFieldOwnProps = {
  readonly value: string;
  readonly onChangeText: (text: string) => void;
  readonly placeholder?: string;
  readonly editable?: boolean;
  readonly secureTextEntry?: boolean;
  readonly accessibilityLabel?: string;
  readonly style?: StyleProp<ViewStyle>;
};

type TextFieldProps = TextFieldOwnProps &
  Omit<TextInputProps, keyof TextFieldOwnProps | "style" | "placeholderTextColor">;

export const TextField = ({
  value,
  onChangeText,
  placeholder,
  editable = true,
  secureTextEntry = false,
  accessibilityLabel,
  style,
  ...rest
}: TextFieldProps) => {
  const { fontSize, minTouchTarget, space } = useUiSize();

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
          borderRadius: radii.md,
          borderWidth: 1,
          minHeight: minTouchTarget,
          paddingHorizontal: space.md,
          paddingVertical: space.sm,
        },
        !editable ? { opacity: 0.5 } : null,
        style,
      ]}
    >
      <TextInput
        accessibilityLabel={accessibilityLabel ?? placeholder}
        editable={editable}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        secureTextEntry={secureTextEntry}
        style={{
          color: colors.text,
          flex: 1,
          fontFamily: fonts.ui,
          fontSize: fontSize(15),
          lineHeight: fontSize(22),
          padding: 0,
        }}
        value={value}
        {...rest}
      />
    </View>
  );
};
