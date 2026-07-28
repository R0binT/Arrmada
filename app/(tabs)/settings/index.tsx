import { router } from "expo-router";
import { View } from "react-native";

import { Screen } from "@/components";
import { AboutCard } from "@/features/settings/AboutCard";
import { SettingsNavRow } from "@/features/settings/SettingsNavRow";
import { useI18n } from "@/i18n";
import { useUiSize } from "@/lib/UiSizeProvider";
import { Text } from "@/ui";

export default function SettingsHubScreen() {
  const { t } = useI18n();
  const { space } = useUiSize();

  return (
    <Screen scroll>
      <Text role="title" style={{ marginBottom: space.lg }}>
        {t("settings.title")}
      </Text>

      <View style={{ gap: space.md }}>
        <SettingsNavRow
          accessibilityLabel={t("settings.servicesA11y")}
          hint={t("settings.servicesHint")}
          onPress={() => router.push("/(tabs)/settings/services")}
          title={t("settings.services")}
        />
        <SettingsNavRow
          accessibilityLabel={t("settings.preferencesA11y")}
          hint={t("settings.preferencesHint")}
          onPress={() => router.push("/(tabs)/settings/preferences")}
          title={t("settings.preferences")}
        />
      </View>

      <AboutCard />
    </Screen>
  );
}
