import { useState } from "react";
import {
    Pressable,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";

import { useVerrou } from "@/features/verrou/VerrouProvider";
import { t } from "@/i18n";
import { isValidPin } from "@/lib/app-lock";
import { colors, fonts, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

export const VerrouSettingsCard = () => {
  const { isEnabled, enable, disable } = useVerrou();
  const { space, fontSize, minTouchTarget } = useUiSize();
  const [draftPin, setDraftPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [mode, setMode] = useState<"idle" | "enable" | "disable">("idle");
  const [message, setMessage] = useState<string | undefined>();
  const [isBusy, setIsBusy] = useState(false);

  const resetForm = () => {
    setDraftPin("");
    setConfirmPin("");
    setMode("idle");
  };

  const handleToggle = (nextValue: boolean) => {
    setMessage(undefined);
    if (nextValue) {
      setMode("enable");
      return;
    }
    setMode("disable");
  };

  const handleEnable = async () => {
    if (!isValidPin(draftPin)) {
      setMessage(t("verrou.pinLength"));
      return;
    }
    if (draftPin !== confirmPin) {
      setMessage(t("verrou.pinMismatch"));
      return;
    }
    setIsBusy(true);
    try {
      await enable(draftPin);
      resetForm();
      setMessage(t("verrou.enabled"));
    } finally {
      setIsBusy(false);
    }
  };

  const handleDisable = async () => {
    if (!isValidPin(draftPin)) {
      setMessage(t("verrou.enterPinDisable"));
      return;
    }
    setIsBusy(true);
    try {
      const ok = await disable(draftPin);
      if (!ok) {
        setMessage(t("verrou.pinWrong"));
        setDraftPin("");
        return;
      }
      resetForm();
      setMessage(t("verrou.disabled"));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          gap: space.md,
          marginTop: space.md,
          padding: space.md,
        },
      ]}
    >
      <View style={[styles.header, { gap: space.md }]}>
        <View style={[styles.copy, { gap: space.xs }]}>
          <Text style={[styles.title, { fontSize: fontSize(16) }]}>
            {t("verrou.title")}
          </Text>
          <Text
            style={[
              styles.body,
              { fontSize: fontSize(14), lineHeight: fontSize(20) },
            ]}
          >
            {t("verrou.description")}
          </Text>
        </View>
        <Switch
          accessibilityLabel={t("verrou.enableA11y")}
          onValueChange={handleToggle}
          trackColor={{ false: colors.bg, true: colors.accent }}
          value={isEnabled || mode === "enable"}
        />
      </View>

      {mode === "enable" ? (
        <View style={[styles.form, { gap: space.sm }]}>
          <TextInput
            accessibilityLabel={t("verrou.newPinA11y")}
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={(value) =>
              setDraftPin(value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder={t("verrou.pinPlaceholder")}
            placeholderTextColor={colors.secondary}
            secureTextEntry
            style={[
              styles.input,
              {
                fontSize: fontSize(15),
                minHeight: minTouchTarget,
                paddingHorizontal: space.md,
              },
            ]}
            value={draftPin}
          />
          <TextInput
            accessibilityLabel={t("verrou.confirmPinA11y")}
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={(value) =>
              setConfirmPin(value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder={t("verrou.pinConfirm")}
            placeholderTextColor={colors.secondary}
            secureTextEntry
            style={[
              styles.input,
              {
                fontSize: fontSize(15),
                minHeight: minTouchTarget,
                paddingHorizontal: space.md,
              },
            ]}
            value={confirmPin}
          />
          <View style={[styles.actions, { gap: space.sm }]}>
            <Pressable
              accessibilityLabel={t("action.cancel")}
              accessibilityRole="button"
              onPress={() => {
                resetForm();
                setMessage(undefined);
              }}
              style={[
                styles.secondaryButton,
                {
                  minHeight: minTouchTarget,
                  paddingHorizontal: space.lg,
                },
              ]}
            >
              <Text
                style={[styles.secondaryButtonText, { fontSize: fontSize(14) }]}
              >
                {t("action.cancel")}
              </Text>
            </Pressable>
            <Pressable
              accessibilityLabel={t("verrou.enableA11y")}
              accessibilityRole="button"
              disabled={isBusy}
              onPress={() => void handleEnable()}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  minHeight: minTouchTarget,
                  paddingHorizontal: space.lg,
                },
                pressed ? styles.pressed : null,
                isBusy ? styles.disabled : null,
              ]}
            >
              <Text
                style={[styles.primaryButtonText, { fontSize: fontSize(14) }]}
              >
                {t("verrou.enable")}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {mode === "disable" ? (
        <View style={[styles.form, { gap: space.sm }]}>
          <TextInput
            accessibilityLabel={t("verrou.pinCurrent")}
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={(value) =>
              setDraftPin(value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder={t("verrou.pinCurrent")}
            placeholderTextColor={colors.secondary}
            secureTextEntry
            style={[
              styles.input,
              {
                fontSize: fontSize(15),
                minHeight: minTouchTarget,
                paddingHorizontal: space.md,
              },
            ]}
            value={draftPin}
          />
          <View style={[styles.actions, { gap: space.sm }]}>
            <Pressable
              accessibilityLabel={t("action.cancel")}
              accessibilityRole="button"
              onPress={() => {
                resetForm();
                setMessage(undefined);
              }}
              style={[
                styles.secondaryButton,
                {
                  minHeight: minTouchTarget,
                  paddingHorizontal: space.lg,
                },
              ]}
            >
              <Text
                style={[styles.secondaryButtonText, { fontSize: fontSize(14) }]}
              >
                {t("action.cancel")}
              </Text>
            </Pressable>
            <Pressable
              accessibilityLabel={t("verrou.disableA11y")}
              accessibilityRole="button"
              disabled={isBusy}
              onPress={() => void handleDisable()}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  minHeight: minTouchTarget,
                  paddingHorizontal: space.lg,
                },
                pressed ? styles.pressed : null,
                isBusy ? styles.disabled : null,
              ]}
            >
              <Text
                style={[styles.primaryButtonText, { fontSize: fontSize(14) }]}
              >
                {t("verrou.disable")}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {message ? (
        <Text
          accessibilityRole="text"
          style={[styles.message, { fontSize: fontSize(13) }]}
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: "rgba(244, 240, 232, 0.08)",
    borderRadius: radii.md,
    borderWidth: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
  },
  copy: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.uiMedium,
  },
  body: {
    color: colors.secondary,
    fontFamily: fonts.ui,
  },
  form: {},
  input: {
    backgroundColor: colors.bg,
    borderColor: "rgba(244, 240, 232, 0.12)",
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontFamily: fonts.ui,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    justifyContent: "center",
  },
  primaryButtonText: {
    color: colors.bg,
    fontFamily: fonts.uiBold,
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: "rgba(244, 240, 232, 0.2)",
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: colors.secondary,
    fontFamily: fonts.uiMedium,
  },
  message: {
    color: colors.secondary,
    fontFamily: fonts.ui,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.45,
  },
});
