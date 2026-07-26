import { router } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ServiceHealth } from "@/arr-client";
import { AppLogo, ErrorBanner, Screen } from "@/components";
import { ServiceConnectionCard } from "@/features/settings/ServiceConnectionCard";
import { useConnectionTest } from "@/features/settings/use-connection-test";
import { useArrClients } from "@/hooks/use-arr-clients";
import { readEnvArrConfig } from "@/lib/env-arr-config";
import {
    isConfigComplete,
    saveArrConfig,
    type ArrConfig,
} from "@/lib/secure-config";
import { t } from "@/i18n";
import { colors, fonts, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

const emptyFromEnv = (): ArrConfig => {
  const fromEnv = readEnvArrConfig();
  return {
    radarrUrl: fromEnv.radarrUrl ?? "",
    radarrApiKey: fromEnv.radarrApiKey ?? "",
    sonarrUrl: fromEnv.sonarrUrl ?? "",
    sonarrApiKey: fromEnv.sonarrApiKey ?? "",
  };
};

const buildConfig = (values: ArrConfig): ArrConfig | undefined => {
  const candidate: ArrConfig = {
    radarrUrl: values.radarrUrl.trim(),
    radarrApiKey: values.radarrApiKey.trim(),
    sonarrUrl: values.sonarrUrl.trim(),
    sonarrApiKey: values.sonarrApiKey.trim(),
  };
  return isConfigComplete(candidate) ? candidate : undefined;
};

export default function OnboardingScreen() {
  const { fontSize, space: scaledSpace, minTouchTarget, scale } = useUiSize();
  const { testAll } = useConnectionTest();
  const { refreshConfig } = useArrClients();
  const [values, setValues] = useState<ArrConfig>(emptyFromEnv);
  const [health, setHealth] = useState<{
    radarr?: ServiceHealth;
    sonarr?: ServiceHealth;
  }>({});
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | undefined>();

  const handleFieldChange = useCallback(
    (field: keyof ArrConfig, value: string) => {
      setValues((current) => ({ ...current, [field]: value }));
      setHealth({});
      setBannerMessage(undefined);
    },
    [],
  );

  const handleTestConnection = useCallback(async () => {
    const config = buildConfig(values);
    if (!config) {
      setBannerMessage(t("onboarding.fillAll"));
      return;
    }

    setIsTesting(true);
    setBannerMessage(undefined);
    try {
      const result = await testAll(config);
      setHealth(result);
      if (!result.radarr.online || !result.sonarr.online) {
        const offline = [result.radarr, result.sonarr].find(
          (item) => !item.online,
        );
        setBannerMessage(
          offline?.message ?? t("onboarding.fixConnection"),
        );
      }
    } finally {
      setIsTesting(false);
    }
  }, [testAll, values]);

  const bothOnline =
    health.radarr?.online === true && health.sonarr?.online === true;

  const handleContinue = useCallback(async () => {
    const config = buildConfig(values);
    if (!config || !bothOnline) {
      return;
    }

    setIsSaving(true);
    try {
      await saveArrConfig(config);
      await refreshConfig();
      router.replace("/(tabs)");
    } finally {
      setIsSaving(false);
    }
  }, [bothOnline, refreshConfig, values]);

  return (
    <Screen scroll>
      <View
        style={[
          styles.header,
          {
            gap: scaledSpace.sm,
            marginBottom: scaledSpace.lg,
            marginTop: scaledSpace.lg,
          },
        ]}
      >
        <AppLogo size={Math.round(72 * scale)} />
        <Text style={[styles.subtitle, { fontSize: fontSize(16) }]}>
          {t("onboarding.subtitle")}
        </Text>
      </View>

      <View style={[styles.cards, { gap: scaledSpace.md }]}>
        <ServiceConnectionCard
          apiKey={values.radarrApiKey}
          health={health.radarr}
          onApiKeyChange={(value) => handleFieldChange("radarrApiKey", value)}
          onUrlChange={(value) => handleFieldChange("radarrUrl", value)}
          service="radarr"
          showReadyBadge
          url={values.radarrUrl}
        />
        <ServiceConnectionCard
          apiKey={values.sonarrApiKey}
          health={health.sonarr}
          onApiKeyChange={(value) => handleFieldChange("sonarrApiKey", value)}
          onUrlChange={(value) => handleFieldChange("sonarrUrl", value)}
          service="sonarr"
          showReadyBadge
          url={values.sonarrUrl}
        />
      </View>

      {bannerMessage ? (
        <ErrorBanner message={bannerMessage} onRetry={handleTestConnection} />
      ) : null}

      <View style={[styles.actions, { gap: scaledSpace.md, marginTop: scaledSpace.lg }]}>
        <Pressable
          accessibilityLabel={t("onboarding.testConnection")}
          accessibilityRole="button"
          disabled={isTesting}
          onPress={handleTestConnection}
          style={({ pressed }) => [
            styles.primaryButton,
            {
              minHeight: minTouchTarget,
              paddingHorizontal: scaledSpace.lg,
              paddingVertical: scaledSpace.md,
            },
            pressed ? styles.pressed : null,
            isTesting ? styles.disabled : null,
          ]}
        >
          <Text style={[styles.primaryButtonText, { fontSize: fontSize(16) }]}>
            {isTesting ? t("action.testing") : t("onboarding.testConnection")}
          </Text>
        </Pressable>

        <Pressable
          accessibilityLabel={t("onboarding.continueA11y")}
          accessibilityRole="button"
          disabled={!bothOnline || isSaving}
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.secondaryButton,
            {
              minHeight: minTouchTarget,
              paddingHorizontal: scaledSpace.lg,
              paddingVertical: scaledSpace.md,
            },
            pressed ? styles.pressed : null,
            !bothOnline || isSaving ? styles.disabled : null,
          ]}
        >
          <Text style={[styles.secondaryButtonText, { fontSize: fontSize(16) }]}>
            {isSaving ? t("action.saving") : t("onboarding.continue")}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
  },
  subtitle: {
    color: colors.secondary,
    fontFamily: fonts.ui,
  },
  cards: {},
  actions: {},
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
    borderColor: colors.accent,
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: colors.accent,
    fontFamily: fonts.uiBold,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.45,
  },
});
