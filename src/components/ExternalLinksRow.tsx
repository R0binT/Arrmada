import * as WebBrowser from "expo-web-browser";
import { Alert, Linking, Pressable, StyleSheet, View } from "react-native";

import type { ExternalIds } from "@/arr-client";
import { t } from "@/i18n";
import { useUiSize } from "@/lib/UiSizeProvider";
import { pressScaleStyle, useReduceMotion } from "@/ui";
import { Chip } from "@/ui/Chip";
import { Text } from "@/ui/Text";

type ExternalLinksRowProps = {
  readonly ids: ExternalIds;
  readonly kind: "movie" | "series";
};

type LinkItem = {
  readonly key: string;
  readonly label: string;
  readonly url: string;
};

const buildLinks = (
  ids: ExternalIds,
  kind: "movie" | "series",
): readonly LinkItem[] => {
  const links: LinkItem[] = [];
  if (ids.imdbId) {
    links.push({
      key: "imdb",
      label: t("detail.linkImdb"),
      url: `https://www.imdb.com/title/${ids.imdbId}/`,
    });
  }
  if (ids.tmdbId !== undefined) {
    const path = kind === "movie" ? "movie" : "tv";
    links.push({
      key: "tmdb",
      label: t("detail.linkTmdb"),
      url: `https://www.themoviedb.org/${path}/${ids.tmdbId}`,
    });
  }
  if (kind === "series" && ids.tvdbId !== undefined) {
    links.push({
      key: "tvdb",
      label: t("detail.linkTvdb"),
      url: `https://thetvdb.com/?tab=series&id=${ids.tvdbId}`,
    });
  }
  return links;
};

const openExternalUrl = async (url: string): Promise<void> => {
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
    return;
  } catch {
    Alert.alert(t("detail.links"), t("detail.linkOpenFailed"));
  }
};

export const ExternalLinksRow = ({ ids, kind }: ExternalLinksRowProps) => {
  const { space } = useUiSize();
  const reduceMotion = useReduceMotion();
  const links = buildLinks(ids, kind);
  if (links.length === 0) return null;

  const handleOpen = (url: string): void => {
    void openExternalUrl(url);
  };

  return (
    <View style={{ gap: space.sm }}>
      <Text role="headline">{t("detail.links")}</Text>
      <View style={[styles.row, { gap: space.sm }]}>
        {links.map((link) => (
          <Pressable
            key={link.key}
            accessibilityLabel={link.label}
            accessibilityRole="link"
            onPress={() => handleOpen(link.url)}
            style={({ pressed }) => pressScaleStyle(pressed, reduceMotion)}
          >
            <Chip tone="accent">{link.label}</Chip>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
