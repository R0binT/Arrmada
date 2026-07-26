import { router } from "expo-router";
import { Text, View } from "react-native";

import { Screen } from "@/components";
import { SettingsNavRow } from "@/features/settings/SettingsNavRow";
import { useI18n } from "@/i18n";
import { useUiSize } from "@/lib/UiSizeProvider";
import { colors, fonts } from "@/lib/theme";

export default function SettingsHubScreen() {
  const { t } = useI18n();
  const { space, fontSize } = useUiSize();

  return (
    <Screen scroll>
      <Text
        style={{
          color: colors.text,
          fontFamily: fonts.display,
          fontSize: fontSize(32),
          marginBottom: space.lg,
        }}
      >
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
    </Screen>
  );
}
