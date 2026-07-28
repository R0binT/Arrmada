import * as WebBrowser from "expo-web-browser";
import { Alert, Linking, Pressable, View } from "react-native";

import {
  GITHUB_AUTHOR_URL,
  GITHUB_REPO_URL,
  LICENSE_URL,
} from "@/features/app-update/constants";
import { getLocalAppVersion } from "@/features/app-update/get-local-app-version";
import { useAppUpdate } from "@/features/app-update/use-app-update";
import { useI18n } from "@/i18n";
import { useUiSize } from "@/lib/UiSizeProvider";
import { Button, Surface, Text } from "@/ui";

const openExternalUrl = async (url: string, failTitle: string): Promise<void> => {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return;
    }
  } catch {
    // Fall through to in-app browser.
  }
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    Alert.alert(failTitle, url);
  }
};

export const AboutCard = () => {
  const { t } = useI18n();
  const { space } = useUiSize();
  const { isBusy, busyPhase, checkForUpdate } = useAppUpdate();
  const version = getLocalAppVersion() ?? "—";

  const buttonLabel =
    busyPhase === "downloading"
      ? t("settings.aboutDownloading")
      : busyPhase === "checking"
        ? t("settings.aboutChecking")
        : t("settings.aboutCheckUpdate");

  const handleOpenAuthor = (): void => {
    void openExternalUrl(GITHUB_AUTHOR_URL, t("settings.about"));
  };
  const handleOpenLicense = (): void => {
    void openExternalUrl(LICENSE_URL, t("settings.about"));
  };
  const handleOpenRepo = (): void => {
    void openExternalUrl(GITHUB_REPO_URL, t("settings.about"));
  };

  return (
    <Surface
      padded
      radius="lg"
      style={{ gap: space.md, marginTop: space.md }}
      tone="raised"
    >
      <Text role="headline">{t("settings.about")}</Text>
      <View style={{ gap: space.xs }}>
        <Text role="body">{t("settings.aboutAppName")}</Text>
        <Text role="body" tone="muted">
          {t("settings.aboutVersion", { version })}
        </Text>
      </View>

      <View style={{ gap: space.xs }}>
        <Text role="caption" tone="muted">
          {t("settings.aboutAuthor")}
        </Text>
        <Pressable
          accessibilityLabel={t("settings.aboutAuthorA11y")}
          accessibilityRole="link"
          onPress={handleOpenAuthor}
        >
          <Text role="body" tone="accent">
            {t("settings.aboutAuthorValue")}
          </Text>
        </Pressable>
      </View>

      <View style={{ gap: space.xs }}>
        <Text role="caption" tone="muted">
          {t("settings.aboutLicense")}
        </Text>
        <Pressable
          accessibilityLabel={t("settings.aboutLicenseA11y")}
          accessibilityRole="link"
          onPress={handleOpenLicense}
        >
          <Text role="body" tone="accent">
            {t("settings.aboutLicenseValue")}
          </Text>
        </Pressable>
      </View>

      <View style={{ gap: space.xs }}>
        <Text role="caption" tone="muted">
          {t("settings.aboutRepo")}
        </Text>
        <Pressable
          accessibilityLabel={t("settings.aboutRepoA11y")}
          accessibilityRole="link"
          onPress={handleOpenRepo}
        >
          <Text role="body" tone="accent">
            {t("settings.aboutRepoLink")}
          </Text>
        </Pressable>
      </View>

      <Button
        accessibilityLabel={t("settings.aboutCheckUpdateA11y")}
        loading={isBusy}
        onPress={checkForUpdate}
        variant="secondary"
      >
        {buttonLabel}
      </Button>
    </Surface>
  );
};
