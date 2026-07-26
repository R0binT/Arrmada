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
import {
  colors,
  fonts,
  minTouchTarget,
  radii,
  space,
} from "@/lib/theme";
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
        <View accessibilityLabel={t("connection.readyA11y", { service: serviceLabel })} style={styles.readyBadge}>
          <Text style={styles.readyIcon}>✓</Text>
          <Text style={styles.readyText}>{t("connection.ready")}</Text>
        </View>
      );
    }
    if (!showReadyBadge) {
      return <ServiceHealthDot health={health} />;
    }
    return null;
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.serviceTitle}>{serviceLabel}</Text>
        {renderStatus()}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t("connection.address")}</Text>
        <TextInput
          accessibilityLabel={t("connection.addressA11y", { service: serviceLabel })}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          onChangeText={onUrlChange}
          placeholder="http://192.168.1.10:7878"
          placeholderTextColor={colors.secondary}
          style={styles.input}
          value={url}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t("connection.accessKey")}</Text>
        <View style={styles.apiKeyRow}>
          <TextInput
            accessibilityLabel={t("connection.keyA11y", { service: serviceLabel })}
            autoCapitalize="none"
            autoCorrect={false}
            editable={canEditKeys}
            onChangeText={(value) => void handleApiKeyChange(value)}
            placeholder="••••••••••••••••"
            placeholderTextColor={colors.secondary}
            secureTextEntry={!apiKeyVisible}
            style={[styles.input, styles.apiKeyInput]}
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
            style={styles.visibilityButton}
          >
            <Text style={styles.visibilityIcon}>{apiKeyVisible ? "◉" : "◎"}</Text>
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
            pressed ? styles.pressed : null,
            isTesting ? styles.disabled : null,
          ]}
        >
          <Text style={styles.testButtonText}>
            {isTesting ? t("connection.testServiceBusy") : t("onboarding.testConnection")}
          </Text>
        </Pressable>
      ) : null}

      {health && !health.online && health.message ? (
        <Text accessibilityRole="alert" style={styles.errorText}>
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
    gap: space.md,
    padding: space.md,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  serviceTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 22,
  },
  readyBadge: {
    alignItems: "center",
    backgroundColor: "rgba(111, 191, 122, 0.15)",
    borderRadius: radii.md,
    flexDirection: "row",
    gap: space.xs,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  readyIcon: {
    color: colors.success,
    fontFamily: fonts.uiMedium,
    fontSize: 12,
  },
  readyText: {
    color: colors.success,
    fontFamily: fonts.uiMedium,
    fontSize: 12,
  },
  field: {
    gap: space.xs,
  },
  label: {
    color: colors.secondary,
    fontFamily: fonts.ui,
    fontSize: 12,
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
    fontSize: 15,
    minHeight: minTouchTarget,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  apiKeyRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.sm,
  },
  apiKeyInput: {
    flex: 1,
  },
  visibilityButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: minTouchTarget,
    minWidth: minTouchTarget,
  },
  visibilityIcon: {
    color: colors.secondary,
    fontSize: 18,
  },
  testButton: {
    alignSelf: "flex-end",
    borderColor: colors.accent,
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: minTouchTarget,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  testButtonText: {
    color: colors.accent,
    fontFamily: fonts.uiMedium,
    fontSize: 14,
  },
  errorText: {
    color: colors.danger,
    fontFamily: fonts.ui,
    fontSize: 13,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.5,
  },
});
