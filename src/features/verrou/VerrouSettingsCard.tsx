import { useState } from "react";
import { StyleSheet, Switch, View } from "react-native";

import { useVerrou } from "@/features/verrou/VerrouProvider";
import { t } from "@/i18n";
import { isValidPin } from "@/lib/app-lock";
import { colors } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";
import { Button } from "@/ui/Button";
import { Surface } from "@/ui/Surface";
import { Text } from "@/ui/Text";
import { TextField } from "@/ui/TextField";

export const VerrouSettingsCard = () => {
  const { isEnabled, enable, disable } = useVerrou();
  const { space } = useUiSize();
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
    <Surface
      padded
      radius="md"
      style={[styles.card, { gap: space.md, marginTop: space.md }]}
    >
      <View style={[styles.header, { gap: space.md }]}>
        <View style={[styles.copy, { gap: space.xs }]}>
          <Text role="label">{t("verrou.title")}</Text>
          <Text role="body" tone="muted">
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
        <View style={{ gap: space.sm }}>
          <TextField
            accessibilityLabel={t("verrou.newPinA11y")}
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={(value) =>
              setDraftPin(value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder={t("verrou.pinPlaceholder")}
            secureTextEntry
            style={styles.input}
            value={draftPin}
          />
          <TextField
            accessibilityLabel={t("verrou.confirmPinA11y")}
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={(value) =>
              setConfirmPin(value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder={t("verrou.pinConfirm")}
            secureTextEntry
            style={styles.input}
            value={confirmPin}
          />
          <View style={[styles.actions, { gap: space.sm }]}>
            <Button
              accessibilityLabel={t("action.cancel")}
              onPress={() => {
                resetForm();
                setMessage(undefined);
              }}
              variant="secondary"
            >
              {t("action.cancel")}
            </Button>
            <Button
              accessibilityLabel={t("verrou.enableA11y")}
              disabled={isBusy}
              onPress={() => void handleEnable()}
            >
              {t("verrou.enable")}
            </Button>
          </View>
        </View>
      ) : null}

      {mode === "disable" ? (
        <View style={{ gap: space.sm }}>
          <TextField
            accessibilityLabel={t("verrou.pinCurrent")}
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={(value) =>
              setDraftPin(value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder={t("verrou.pinCurrent")}
            secureTextEntry
            style={styles.input}
            value={draftPin}
          />
          <View style={[styles.actions, { gap: space.sm }]}>
            <Button
              accessibilityLabel={t("action.cancel")}
              onPress={() => {
                resetForm();
                setMessage(undefined);
              }}
              variant="secondary"
            >
              {t("action.cancel")}
            </Button>
            <Button
              accessibilityLabel={t("verrou.disableA11y")}
              disabled={isBusy}
              onPress={() => void handleDisable()}
            >
              {t("verrou.disable")}
            </Button>
          </View>
        </View>
      ) : null}

      {message ? (
        <Text accessibilityRole="text" role="caption" tone="muted">
          {message}
        </Text>
      ) : null}
    </Surface>
  );
};

const styles = StyleSheet.create({
  card: {},
  header: {
    alignItems: "center",
    flexDirection: "row",
  },
  copy: {
    flex: 1,
  },
  input: {
    backgroundColor: colors.bg,
    borderColor: colors.borderInput,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});
