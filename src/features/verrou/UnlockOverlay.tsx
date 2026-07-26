import { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useVerrou } from "@/features/verrou/VerrouProvider";
import { colors, fonts, minTouchTarget, radii, space } from "@/lib/theme";
import { t } from "@/i18n";

export const UnlockOverlay = () => {
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
      style={styles.overlay}
    >
      <View style={styles.card}>
        <Text style={styles.title}>{t("verrou.title")}</Text>
        <Text style={styles.body}>
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
          style={styles.input}
          value={pin}
        />
        {errorMessage ? (
          <Text accessibilityRole="alert" style={styles.error}>
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
            pressed ? styles.pressed : null,
            isBusy || pin.length < 4 ? styles.disabled : null,
          ]}
        >
          <Text style={styles.buttonText}>{t("verrou.unlock")}</Text>
        </Pressable>
        {biometricsAvailable ? (
          <Pressable
            accessibilityLabel={t("verrou.biometric")}
            accessibilityRole="button"
            disabled={isBusy}
            onPress={() => void handleBiometrics()}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed ? styles.pressed : null,
              isBusy ? styles.disabled : null,
            ]}
          >
            <Text style={styles.secondaryButtonText}>{t("verrou.biometricShort")}</Text>
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
    padding: space.lg,
    zIndex: 1000,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: "rgba(244, 240, 232, 0.08)",
    borderRadius: radii.md,
    borderWidth: 1,
    gap: space.md,
    maxWidth: 400,
    padding: space.lg,
    width: "100%",
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 28,
  },
  body: {
    color: colors.secondary,
    fontFamily: fonts.ui,
    fontSize: 15,
    lineHeight: 22,
  },
  input: {
    backgroundColor: colors.bg,
    borderColor: "rgba(244, 240, 232, 0.12)",
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontFamily: fonts.ui,
    fontSize: 22,
    letterSpacing: 8,
    minHeight: minTouchTarget,
    paddingHorizontal: space.md,
    textAlign: "center",
  },
  error: {
    color: colors.danger,
    fontFamily: fonts.ui,
    fontSize: 13,
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    justifyContent: "center",
    minHeight: minTouchTarget,
    paddingHorizontal: space.lg,
  },
  buttonText: {
    color: colors.bg,
    fontFamily: fonts.uiBold,
    fontSize: 16,
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: colors.accent,
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: minTouchTarget,
    paddingHorizontal: space.lg,
  },
  secondaryButtonText: {
    color: colors.accent,
    fontFamily: fonts.uiMedium,
    fontSize: 15,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.45,
  },
});
