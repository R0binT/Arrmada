import { router } from "expo-router";
import { Text, View } from "react-native";

import { Screen } from "@/components";
import { InterfaceSizeCard } from "@/features/settings/InterfaceSizeCard";
import { LanguagePreferenceCard } from "@/features/settings/LanguagePreferenceCard";
import { SettingsBackRow } from "@/features/settings/SettingsNavRow";
import { VerrouSettingsCard } from "@/features/verrou/VerrouSettingsCard";
import { useI18n } from "@/i18n";
import { useUiSize } from "@/lib/UiSizeProvider";
import { colors, fonts } from "@/lib/theme";

export default function SettingsPreferencesScreen() {
  const { t } = useI18n();
  const { space, fontSize } = useUiSize();

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
        {t("settings.preferencesTitle")}
      </Text>

      <LanguagePreferenceCard />
      <InterfaceSizeCard />
      <VerrouSettingsCard />

      <View
        style={{
          alignItems: "center",
          backgroundColor: colors.surface,
          borderColor: "rgba(244, 240, 232, 0.08)",
          borderRadius: 12,
          borderWidth: 1,
          flexDirection: "row",
          gap: space.md,
          marginTop: space.md,
          padding: space.md,
        }}
      >
        <View style={{ flex: 1, gap: space.xs }}>
          <Text
            style={{
              color: colors.text,
              fontFamily: fonts.uiMedium,
              fontSize: fontSize(16),
            }}
          >
            {t("settings.appearance")}
          </Text>
          <Text
            style={{
              color: colors.secondary,
              fontFamily: fonts.ui,
              fontSize: fontSize(14),
              lineHeight: fontSize(20),
            }}
          >
            {t("settings.appearanceBody")}
          </Text>
        </View>
        <Text
          accessibilityLabel={t("settings.themeLockedA11y")}
          style={{ fontSize: fontSize(18), opacity: 0.6 }}
        >
          🔒
        </Text>
      </View>
    </Screen>
  );
}
