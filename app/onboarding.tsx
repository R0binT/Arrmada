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
import { colors, fonts, minTouchTarget, radii, space } from "@/lib/theme";

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
      <View style={styles.header}>
        <AppLogo size={72} />
        <Text style={styles.subtitle}>{t("onboarding.subtitle")}</Text>
      </View>

      <View style={styles.cards}>
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

      <View style={styles.actions}>
        <Pressable
          accessibilityLabel={t("onboarding.testConnection")}
          accessibilityRole="button"
          disabled={isTesting}
          onPress={handleTestConnection}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed ? styles.pressed : null,
            isTesting ? styles.disabled : null,
          ]}
        >
          <Text style={styles.primaryButtonText}>
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
            pressed ? styles.pressed : null,
            !bothOnline || isSaving ? styles.disabled : null,
          ]}
        >
          <Text style={styles.secondaryButtonText}>
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
    gap: space.sm,
    marginBottom: space.lg,
    marginTop: space.lg,
  },
  subtitle: {
    color: colors.secondary,
    fontFamily: fonts.ui,
    fontSize: 16,
  },
  cards: {
    gap: space.md,
  },
  actions: {
    gap: space.md,
    marginTop: space.lg,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    minHeight: minTouchTarget,
    justifyContent: "center",
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  primaryButtonText: {
    color: colors.bg,
    fontFamily: fonts.uiBold,
    fontSize: 16,
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: colors.accent,
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: minTouchTarget,
    justifyContent: "center",
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  secondaryButtonText: {
    color: colors.accent,
    fontFamily: fonts.uiBold,
    fontSize: 16,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.45,
  },
});
