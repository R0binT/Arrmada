import {
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { colors, fonts, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

type TextFieldProps = {
  readonly value: string;
  readonly onChangeText: (text: string) => void;
  readonly placeholder?: string;
  readonly editable?: boolean;
  readonly secureTextEntry?: boolean;
  readonly autoCapitalize?: TextInputProps["autoCapitalize"];
  readonly keyboardType?: TextInputProps["keyboardType"];
  readonly returnKeyType?: TextInputProps["returnKeyType"];
  readonly onSubmitEditing?: TextInputProps["onSubmitEditing"];
  readonly accessibilityLabel?: string;
  readonly style?: StyleProp<ViewStyle>;
};

export const TextField = ({
  value,
  onChangeText,
  placeholder,
  editable = true,
  secureTextEntry = false,
  autoCapitalize,
  keyboardType,
  returnKeyType,
  onSubmitEditing,
  accessibilityLabel,
  style,
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
        autoCapitalize={autoCapitalize}
        editable={editable}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        returnKeyType={returnKeyType}
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
      />
    </View>
  );
};
