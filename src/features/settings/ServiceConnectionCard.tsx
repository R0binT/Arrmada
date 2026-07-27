import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { ArrService, ServiceHealth } from "@/arr-client";
import { ServiceHealthDot } from "@/components/ServiceHealthDot";
import { useVerrou } from "@/features/verrou/VerrouProvider";
import { useUiSize } from "@/lib/UiSizeProvider";
import { t } from "@/i18n";
import {
  Button,
  Chip,
  IconButton,
  Surface,
  Text,
  TextField,
} from "@/ui";

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
  const { space: scaledSpace, minTouchTarget } = useUiSize();
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
        <Chip
          tone="success"
          style={{ alignSelf: "flex-start" }}
        >
          ✓ {t("connection.ready")}
        </Chip>
      );
    }
    if (!showReadyBadge) {
      return <ServiceHealthDot health={health} />;
    }
    return null;
  };

  return (
    <Surface
      padded
      radius="md"
      style={{ gap: scaledSpace.md }}
      tone="raised"
    >
      <View style={styles.header}>
        <Text role="headline">{serviceLabel}</Text>
        {renderStatus()}
      </View>

      <View style={{ gap: scaledSpace.xs }}>
        <Text role="caption" tone="muted">
          {t("connection.address")}
        </Text>
        <TextField
          accessibilityLabel={t("connection.addressA11y", { service: serviceLabel })}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          onChangeText={onUrlChange}
          placeholder="http://192.168.1.10:7878"
          value={url}
        />
      </View>

      <View style={{ gap: scaledSpace.xs }}>
        <Text role="caption" tone="muted">
          {t("connection.accessKey")}
        </Text>
        <View style={[styles.apiKeyRow, { gap: scaledSpace.sm }]}>
          <TextField
            accessibilityLabel={t("connection.keyA11y", { service: serviceLabel })}
            autoCapitalize="none"
            autoCorrect={false}
            editable={canEditKeys}
            onChangeText={(value) => void handleApiKeyChange(value)}
            placeholder="••••••••••••••••"
            secureTextEntry={!apiKeyVisible}
            style={styles.apiKeyInput}
            value={apiKey}
          />
          <IconButton
            accessibilityLabel={
              apiKeyVisible
                ? t("connection.hideKey")
                : t("connection.showKey")
            }
            icon={apiKeyVisible ? "◉" : "◎"}
            onPress={() => void handleRevealPress()}
            style={{ minHeight: minTouchTarget, minWidth: minTouchTarget }}
            variant="default"
          />
        </View>
      </View>

      {onTest ? (
        <Button
          accessibilityLabel={t("connection.testService", { service: serviceLabel })}
          loading={isTesting}
          onPress={onTest}
          style={{ alignSelf: "flex-end" }}
          variant="secondary"
        >
          {isTesting ? t("connection.testServiceBusy") : t("onboarding.testConnection")}
        </Button>
      ) : null}

      {health && !health.online && health.message ? (
        <Text accessibilityRole="alert" role="caption" tone="danger">
          {health.message}
        </Text>
      ) : null}
    </Surface>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  apiKeyRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  apiKeyInput: {
    flex: 1,
  },
});
