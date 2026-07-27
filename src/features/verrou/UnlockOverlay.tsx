import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { useVerrou } from "@/features/verrou/VerrouProvider";
import { colors } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";
import { t } from "@/i18n";
import { Button } from "@/ui/Button";
import { Surface } from "@/ui/Surface";
import { Text } from "@/ui/Text";
import { TextField } from "@/ui/TextField";

export const UnlockOverlay = () => {
  const { space: scaledSpace } = useUiSize();
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
      <Surface
        padded
        radius="md"
        style={[styles.card, { gap: scaledSpace.md, maxWidth: 400 }]}
      >
        <Text role="display">{t("verrou.title")}</Text>
        <Text role="body" tone="muted">
          {t("verrou.unlockBody")}
        </Text>
        <TextField
          accessibilityLabel={t("verrou.pinA11y")}
          autoComplete="off"
          keyboardType="number-pad"
          maxLength={6}
          onChangeText={(value) => {
            setPin(value.replace(/\D/g, "").slice(0, 6));
            setErrorMessage(undefined);
          }}
          placeholder="••••"
          secureTextEntry
          style={styles.pinField}
          value={pin}
        />
        {errorMessage ? (
          <Text accessibilityRole="alert" role="caption" tone="danger">
            {errorMessage}
          </Text>
        ) : null}
        <Button
          accessibilityLabel={t("verrou.unlockWithPinA11y")}
          disabled={isBusy || pin.length < 4}
          onPress={() => void handleUnlock()}
        >
          {t("verrou.unlock")}
        </Button>
        {biometricsAvailable ? (
          <Button
            accessibilityLabel={t("verrou.biometric")}
            disabled={isBusy}
            onPress={() => void handleBiometrics()}
            variant="secondary"
          >
            {t("verrou.biometricShort")}
          </Button>
        ) : null}
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    backgroundColor: colors.overlaySolid,
    justifyContent: "center",
    zIndex: 1000,
  },
  card: {
    width: "100%",
  },
  pinField: {
    backgroundColor: colors.bg,
    borderColor: colors.borderInput,
  },
});
