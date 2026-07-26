import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { ArrService, ServiceHealth } from "@/arr-client";
import { ServiceHealthDot } from "@/components/ServiceHealthDot";
import { useVerrou } from "@/features/verrou/VerrouProvider";
import { colors, fonts, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";
import { t } from "@/i18n";

type ServiceConnectionCardProps = {
  readonly service: ArrService;
  readonly url: string;
  readonly apiKey: string;
  readonly health?: ServiceHealth;
  readonly onUrlChange: (value: string) => void;
  readonly onApiKeyChange: (value: string) => void;
  readonly onTest?: () => void;
  readonly isTesting?: boolean;
  readonly showReadyBadge?: boolean;
};

const SERVICE_LABELS: Record<ArrService, string> = {
  radarr: "Radarr",
  sonarr: "Sonarr",
};

export const ServiceConnectionCard = ({
  service,
  url,
  apiKey,
  health,
  onUrlChange,
  onApiKeyChange,
  onTest,
  isTesting = false,
  showReadyBadge = false,
}: ServiceConnectionCardProps) => {
  const { fontSize, space: scaledSpace, minTouchTarget } = useUiSize();
  const { isEnabled: isVerrouEnabled, isUnlocked, requireUnlock } = useVerrou();
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const serviceLabel = SERVICE_LABELS[service];
  const isReady = health?.online === true;
  const canEditKeys = !isVerrouEnabled || isUnlocked;

  const handleRevealPress = async () => {
    if (apiKeyVisible) {
      setApiKeyVisible(false);
      return;
    }
    const unlocked = await requireUnlock();
    if (!unlocked) {
      return;
    }
    setApiKeyVisible(true);
  };

  const handleApiKeyChange = async (value: string) => {
    if (!canEditKeys) {
      const unlocked = await requireUnlock();
      if (!unlocked) {
        return;
      }
    }
    onApiKeyChange(value);
  };

  const renderStatus = () => {
    if (!health) {
      return null;
    }
    if (showReadyBadge && isReady) {
      return (
        <View
          accessibilityLabel={t("connection.readyA11y", { service: serviceLabel })}
          style={[
            styles.readyBadge,
            {
              gap: scaledSpace.xs,
              paddingHorizontal: scaledSpace.sm,
              paddingVertical: scaledSpace.xs,
            },
          ]}
        >
          <Text style={[styles.readyIcon, { fontSize: fontSize(12) }]}>✓</Text>
          <Text style={[styles.readyText, { fontSize: fontSize(12) }]}>
            {t("connection.ready")}
          </Text>
        </View>
      );
    }
    if (!showReadyBadge) {
      return <ServiceHealthDot health={health} />;
    }
    return null;
  };

  const inputStyle = [
    styles.input,
    {
      fontSize: fontSize(15),
      minHeight: minTouchTarget,
      paddingHorizontal: scaledSpace.md,
      paddingVertical: scaledSpace.sm,
    },
  ];

  return (
    <View style={[styles.card, { gap: scaledSpace.md, padding: scaledSpace.md }]}>
      <View style={styles.header}>
        <Text style={[styles.serviceTitle, { fontSize: fontSize(22) }]}>
          {serviceLabel}
        </Text>
        {renderStatus()}
      </View>

      <View style={[styles.field, { gap: scaledSpace.xs }]}>
        <Text style={[styles.label, { fontSize: fontSize(12) }]}>
          {t("connection.address")}
        </Text>
        <TextInput
          accessibilityLabel={t("connection.addressA11y", { service: serviceLabel })}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          onChangeText={onUrlChange}
          placeholder="http://192.168.1.10:7878"
          placeholderTextColor={colors.secondary}
          style={inputStyle}
          value={url}
        />
      </View>

      <View style={[styles.field, { gap: scaledSpace.xs }]}>
        <Text style={[styles.label, { fontSize: fontSize(12) }]}>
          {t("connection.accessKey")}
        </Text>
        <View style={[styles.apiKeyRow, { gap: scaledSpace.sm }]}>
          <TextInput
            accessibilityLabel={t("connection.keyA11y", { service: serviceLabel })}
            autoCapitalize="none"
            autoCorrect={false}
            editable={canEditKeys}
            onChangeText={(value) => void handleApiKeyChange(value)}
            placeholder="••••••••••••••••"
            placeholderTextColor={colors.secondary}
            secureTextEntry={!apiKeyVisible}
            style={[inputStyle, styles.apiKeyInput]}
            value={apiKey}
          />
          <Pressable
            accessibilityLabel={
              apiKeyVisible
                ? t("connection.hideKey")
                : t("connection.showKey")
            }
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => void handleRevealPress()}
            style={[
              styles.visibilityButton,
              { minHeight: minTouchTarget, minWidth: minTouchTarget },
            ]}
          >
            <Text style={[styles.visibilityIcon, { fontSize: fontSize(18) }]}>
              {apiKeyVisible ? "◉" : "◎"}
            </Text>
          </Pressable>
        </View>
      </View>

      {onTest ? (
        <Pressable
          accessibilityLabel={t("connection.testService", { service: serviceLabel })}
          accessibilityRole="button"
          disabled={isTesting}
          onPress={onTest}
          style={({ pressed }) => [
            styles.testButton,
            {
              minHeight: minTouchTarget,
              paddingHorizontal: scaledSpace.lg,
              paddingVertical: scaledSpace.sm,
            },
            pressed ? styles.pressed : null,
            isTesting ? styles.disabled : null,
          ]}
        >
          <Text style={[styles.testButtonText, { fontSize: fontSize(14) }]}>
            {isTesting ? t("connection.testServiceBusy") : t("onboarding.testConnection")}
          </Text>
        </Pressable>
      ) : null}

      {health && !health.online && health.message ? (
        <Text
          accessibilityRole="alert"
          style={[styles.errorText, { fontSize: fontSize(13) }]}
        >
          {health.message}
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
    justifyContent: "space-between",
  },
  serviceTitle: {
    color: colors.text,
    fontFamily: fonts.display,
  },
  readyBadge: {
    alignItems: "center",
    backgroundColor: "rgba(111, 191, 122, 0.15)",
    borderRadius: radii.md,
    flexDirection: "row",
  },
  readyIcon: {
    color: colors.success,
    fontFamily: fonts.uiMedium,
  },
  readyText: {
    color: colors.success,
    fontFamily: fonts.uiMedium,
  },
  field: {},
  label: {
    color: colors.secondary,
    fontFamily: fonts.ui,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: colors.bg,
    borderColor: "rgba(244, 240, 232, 0.12)",
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontFamily: fonts.ui,
  },
  apiKeyRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  apiKeyInput: {
    flex: 1,
  },
  visibilityButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  visibilityIcon: {
    color: colors.secondary,
  },
  testButton: {
    alignSelf: "flex-end",
    borderColor: colors.accent,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  testButtonText: {
    color: colors.accent,
    fontFamily: fonts.uiMedium,
  },
  errorText: {
    color: colors.danger,
    fontFamily: fonts.ui,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.5,
  },
});
