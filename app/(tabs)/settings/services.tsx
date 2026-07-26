import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { ArrService, ServiceHealth } from "@/arr-client";
import { ErrorBanner, Screen } from "@/components";
import { ServiceConnectionCard } from "@/features/settings/ServiceConnectionCard";
import { SettingsBackRow } from "@/features/settings/SettingsNavRow";
import { testServiceConnection } from "@/features/settings/test-arr-connection";
import { useConnectionTest } from "@/features/settings/use-connection-test";
import { useArrClients } from "@/hooks/use-arr-clients";
import { useI18n } from "@/i18n";
import { queryClient } from "@/lib/query-client";
import {
    isConfigComplete,
    loadArrConfig,
    saveArrConfig,
    type ArrConfig,
} from "@/lib/secure-config";
import { colors, fonts, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

const EMPTY_CONFIG: ArrConfig = {
  radarrUrl: "",
  radarrApiKey: "",
  sonarrUrl: "",
  sonarrApiKey: "",
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

export default function SettingsServicesScreen() {
  const { t } = useI18n();
  const { space, fontSize, minTouchTarget } = useUiSize();
  const { testAll } = useConnectionTest();
  const { refreshConfig } = useArrClients();
  const [values, setValues] = useState<ArrConfig>(EMPTY_CONFIG);
  const [health, setHealth] = useState<{
    radarr?: ServiceHealth;
    sonarr?: ServiceHealth;
  }>({});
  const [testingService, setTestingService] = useState<ArrService | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | undefined>();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const stored = await loadArrConfig();
      if (isConfigComplete(stored)) {
        setValues(stored);
        const result = await testAll(stored);
        setHealth(result);
      }
      setIsLoaded(true);
    };
    void load();
  }, [testAll]);

  const handleFieldChange = useCallback(
    (field: keyof ArrConfig, value: string) => {
      setValues((current) => ({ ...current, [field]: value }));
      setHealth((current) => ({
        ...current,
        [field.startsWith("radarr") ? "radarr" : "sonarr"]: undefined,
      }));
      setBannerMessage(undefined);
    },
    [],
  );

  const handleTestService = useCallback(
    async (service: ArrService) => {
      const config = buildConfig(values);
      if (!config) {
        setBannerMessage(t("onboarding.fillAll"));
        return;
      }

      setTestingService(service);
      setBannerMessage(undefined);
      try {
        const url = service === "radarr" ? config.radarrUrl : config.sonarrUrl;
        const apiKey =
          service === "radarr" ? config.radarrApiKey : config.sonarrApiKey;
        const result = await testServiceConnection(service, url, apiKey);
        setHealth((current) => ({ ...current, [service]: result }));
        if (!result.online && result.message) {
          setBannerMessage(result.message);
        }
      } finally {
        setTestingService(null);
      }
    },
    [t, values],
  );

  const handleSave = useCallback(async () => {
    const config = buildConfig(values);
    if (!config) {
      setBannerMessage(t("settings.fillBeforeSave"));
      return;
    }

    setIsSaving(true);
    setBannerMessage(undefined);
    try {
      await saveArrConfig(config);
      await refreshConfig();
      await queryClient.invalidateQueries();
      const result = await testAll(config);
      setHealth(result);
    } finally {
      setIsSaving(false);
    }
  }, [refreshConfig, t, testAll, values]);

  if (!isLoaded) {
    return (
      <Screen>
        <View
          style={{
            alignItems: "center",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: colors.secondary,
              fontFamily: fonts.ui,
              fontSize: fontSize(14),
            }}
          >
            {t("settings.loading")}
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <SettingsBackRow onPress={() => router.back()} />
      <Text
        style={{
          color: colors.text,
          fontFamily: fonts.display,
          fontSize: fontSize(28),
          marginBottom: space.lg,
        }}
      >
        {t("settings.servicesTitle")}
      </Text>

      <View style={{ gap: space.md }}>
        <ServiceConnectionCard
          apiKey={values.radarrApiKey}
          health={health.radarr}
          isTesting={testingService === "radarr"}
          onApiKeyChange={(value) => handleFieldChange("radarrApiKey", value)}
          onTest={() => void handleTestService("radarr")}
          onUrlChange={(value) => handleFieldChange("radarrUrl", value)}
          service="radarr"
          url={values.radarrUrl}
        />
        <ServiceConnectionCard
          apiKey={values.sonarrApiKey}
          health={health.sonarr}
          isTesting={testingService === "sonarr"}
          onApiKeyChange={(value) => handleFieldChange("sonarrApiKey", value)}
          onTest={() => void handleTestService("sonarr")}
          onUrlChange={(value) => handleFieldChange("sonarrUrl", value)}
          service="sonarr"
          url={values.sonarrUrl}
        />
      </View>

      {bannerMessage ? (
        <View style={{ marginTop: space.md }}>
          <ErrorBanner
            message={bannerMessage}
            onRetry={() => void handleTestService("radarr")}
          />
        </View>
      ) : null}

      <Pressable
        accessibilityLabel={t("settings.saveA11y")}
        accessibilityRole="button"
        disabled={isSaving}
        onPress={() => void handleSave()}
        style={({ pressed }) => [
          {
            alignItems: "center",
            borderColor: colors.accent,
            borderRadius: radii.md,
            borderWidth: 1,
            justifyContent: "center",
            marginTop: space.lg,
            minHeight: minTouchTarget,
            opacity: isSaving ? 0.45 : pressed ? 0.75 : 1,
            paddingHorizontal: space.lg,
            paddingVertical: space.md,
          },
        ]}
      >
        <Text
          style={{
            color: colors.accent,
            fontFamily: fonts.uiBold,
            fontSize: fontSize(16),
          }}
        >
          {isSaving ? t("action.saving") : t("action.save")}
        </Text>
      </Pressable>
    </Screen>
  );
}
