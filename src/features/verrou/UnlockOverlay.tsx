import { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useVerrou } from "@/features/verrou/VerrouProvider";
import { colors, fonts, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";
import { t } from "@/i18n";

export const UnlockOverlay = () => {
  const { fontSize, space: scaledSpace, minTouchTarget } = useUiSize();
  const {
    isReady,
    isEnabled,
    isUnlocked,
    biometricsAvailable,
    unlockWithPin,
    unlockWithBiometrics,
  } = useVerrou();
  const [pin, setPin] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isBusy, setIsBusy] = useState(false);

  const shouldShow = isReady && isEnabled && !isUnlocked;

  useEffect(() => {
    if (!shouldShow || !biometricsAvailable) {
      return;
    }
    let cancelled = false;
    const run = async () => {
      setIsBusy(true);
      const ok = await unlockWithBiometrics();
      if (!cancelled && !ok) {
        setErrorMessage(t("verrou.biometricUnavailable"));
      }
      if (!cancelled) {
        setIsBusy(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [shouldShow, biometricsAvailable, unlockWithBiometrics]);

  if (!shouldShow) {
    return null;
  }

  const handleUnlock = async () => {
    setIsBusy(true);
    setErrorMessage(undefined);
    const ok = await unlockWithPin(pin);
    if (!ok) {
      setErrorMessage(t("verrou.pinWrong"));
      setPin("");
    } else {
      setPin("");
    }
    setIsBusy(false);
  };

  const handleBiometrics = async () => {
    setIsBusy(true);
    setErrorMessage(undefined);
    const ok = await unlockWithBiometrics();
    if (!ok) {
      setErrorMessage(t("verrou.biometricFailed"));
    }
    setIsBusy(false);
  };

  return (
    <View
      accessibilityViewIsModal
      pointerEvents="auto"
      style={[styles.overlay, { padding: scaledSpace.lg }]}
    >
      <View style={[styles.card, { gap: scaledSpace.md, padding: scaledSpace.lg }]}>
        <Text style={[styles.title, { fontSize: fontSize(28) }]}>
          {t("verrou.title")}
        </Text>
        <Text
          style={[
            styles.body,
            { fontSize: fontSize(15), lineHeight: fontSize(22) },
          ]}
        >
          {t("verrou.unlockBody")}
        </Text>
        <TextInput
          accessibilityLabel={t("verrou.pinA11y")}
          autoComplete="off"
          keyboardType="number-pad"
          maxLength={6}
          onChangeText={(value) => {
            setPin(value.replace(/\D/g, "").slice(0, 6));
            setErrorMessage(undefined);
          }}
          placeholder="••••"
          placeholderTextColor={colors.secondary}
          secureTextEntry
          style={[
            styles.input,
            {
              fontSize: fontSize(22),
              letterSpacing: fontSize(8),
              minHeight: minTouchTarget,
              paddingHorizontal: scaledSpace.md,
            },
          ]}
          value={pin}
        />
        {errorMessage ? (
          <Text
            accessibilityRole="alert"
            style={[styles.error, { fontSize: fontSize(13) }]}
          >
            {errorMessage}
          </Text>
        ) : null}
        <Pressable
          accessibilityLabel={t("verrou.unlockWithPinA11y")}
          accessibilityRole="button"
          disabled={isBusy || pin.length < 4}
          onPress={() => void handleUnlock()}
          style={({ pressed }) => [
            styles.button,
            {
              minHeight: minTouchTarget,
              paddingHorizontal: scaledSpace.lg,
            },
            pressed ? styles.pressed : null,
            isBusy || pin.length < 4 ? styles.disabled : null,
          ]}
        >
          <Text style={[styles.buttonText, { fontSize: fontSize(16) }]}>
            {t("verrou.unlock")}
          </Text>
        </Pressable>
        {biometricsAvailable ? (
          <Pressable
            accessibilityLabel={t("verrou.biometric")}
            accessibilityRole="button"
            disabled={isBusy}
            onPress={() => void handleBiometrics()}
            style={({ pressed }) => [
              styles.secondaryButton,
              {
                minHeight: minTouchTarget,
                paddingHorizontal: scaledSpace.lg,
              },
              pressed ? styles.pressed : null,
              isBusy ? styles.disabled : null,
            ]}
          >
            <Text style={[styles.secondaryButtonText, { fontSize: fontSize(15) }]}>
              {t("verrou.biometricShort")}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    backgroundColor: "rgba(8, 10, 14, 0.96)",
    justifyContent: "center",
    zIndex: 1000,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: "rgba(244, 240, 232, 0.08)",
    borderRadius: radii.md,
    borderWidth: 1,
    maxWidth: 400,
    width: "100%",
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
  },
  body: {
    color: colors.secondary,
    fontFamily: fonts.ui,
  },
  input: {
    backgroundColor: colors.bg,
    borderColor: "rgba(244, 240, 232, 0.12)",
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontFamily: fonts.ui,
    textAlign: "center",
  },
  error: {
    color: colors.danger,
    fontFamily: fonts.ui,
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    justifyContent: "center",
  },
  buttonText: {
    color: colors.bg,
    fontFamily: fonts.uiBold,
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: colors.accent,
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: colors.accent,
    fontFamily: fonts.uiMedium,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.45,
  },
});
