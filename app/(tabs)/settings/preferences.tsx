import { router } from "expo-router";
import { View } from "react-native";

import { Screen } from "@/components";
import { InterfaceSizeCard } from "@/features/settings/InterfaceSizeCard";
import { LanguagePreferenceCard } from "@/features/settings/LanguagePreferenceCard";
import { SettingsBackRow } from "@/features/settings/SettingsNavRow";
import { VerrouSettingsCard } from "@/features/verrou/VerrouSettingsCard";
import { useI18n } from "@/i18n";
import { useUiSize } from "@/lib/UiSizeProvider";
import { Surface, Text } from "@/ui";

export default function SettingsPreferencesScreen() {
  const { t } = useI18n();
  const { space } = useUiSize();

  return (
    <Screen scroll>
      <SettingsBackRow onPress={() => router.back()} />
      <Text role="title" style={{ marginBottom: space.lg }}>
        {t("settings.preferencesTitle")}
      </Text>

      <LanguagePreferenceCard />
      <InterfaceSizeCard />
      <VerrouSettingsCard />

      <Surface
        padded
        radius="md"
        style={{
          alignItems: "center",
          flexDirection: "row",
          gap: space.md,
          marginTop: space.md,
        }}
        tone="raised"
      >
        <View style={{ flex: 1, gap: space.xs }}>
          <Text role="headline">{t("settings.appearance")}</Text>
          <Text role="body" tone="muted">
            {t("settings.appearanceBody")}
          </Text>
        </View>
        <Text
          accessibilityLabel={t("settings.themeLockedA11y")}
          role="body"
          tone="faint"
        >
          🔒
        </Text>
      </Surface>
    </Screen>
  );
}
