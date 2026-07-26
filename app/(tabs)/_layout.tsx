import { Tabs, router } from "expo-router";
import { SymbolView } from "expo-symbols";
import type { ComponentProps } from "react";
import { Platform, StyleSheet, type ColorValue } from "react-native";

import { useI18n } from "@/i18n";
import { colors, fonts } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

type SymbolName = ComponentProps<typeof SymbolView>["name"];

type TabIconProps = {
  readonly color: ColorValue;
  readonly name: SymbolName;
  readonly size: number;
};

const TabIcon = ({ color, name, size }: TabIconProps) => (
  <SymbolView name={name} size={size} tintColor={color} />
);

const navigateToTabRoot = (href: "/(tabs)/movies" | "/(tabs)/series") => {
  router.dismissTo(href);
};

export default function TabLayout() {
  const { t } = useI18n();
  const { fontSize, scale } = useUiSize();
  const iconSize = Math.round(24 * scale);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.secondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: [styles.tabBarLabel, { fontSize: fontSize(11) }],
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color }) => (
            <TabIcon
              color={color}
              name={{
                ios: "house.fill",
                android: "home",
                web: "home",
              }}
              size={iconSize}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="movies"
        listeners={({ navigation }) => ({
          tabPress: () => {
            if (!navigation.isFocused()) return;
            navigateToTabRoot("/(tabs)/movies");
          },
        })}
        options={{
          title: t("tabs.movies"),
          tabBarIcon: ({ color }) => (
            <TabIcon
              color={color}
              name={{
                ios: "film.fill",
                android: "movie",
                web: "movie",
              }}
              size={iconSize}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="series"
        listeners={({ navigation }) => ({
          tabPress: () => {
            if (!navigation.isFocused()) return;
            navigateToTabRoot("/(tabs)/series");
          },
        })}
        options={{
          title: t("tabs.series"),
          tabBarIcon: ({ color }) => (
            <TabIcon
              color={color}
              name={{
                ios: "tv.fill",
                android: "live_tv",
                web: "live_tv",
              }}
              size={iconSize}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="upcoming"
        options={{
          title: t("tabs.upcoming"),
          tabBarIcon: ({ color }) => (
            <TabIcon
              color={color}
              name={{
                ios: "calendar",
                android: "calendar_month",
                web: "calendar_month",
              }}
              size={iconSize}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="queue"
        options={{
          title: t("tabs.downloads"),
          tabBarIcon: ({ color }) => (
            <TabIcon
              color={color}
              name={{
                ios: "arrow.down.circle.fill",
                android: "download",
                web: "download",
              }}
              size={iconSize}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        listeners={({ navigation }) => ({
          tabPress: () => {
            if (!navigation.isFocused()) return;
            router.dismissTo("/(tabs)/settings");
          },
        })}
        options={{
          title: t("tabs.settings"),
          tabBarIcon: ({ color }) => (
            <TabIcon
              color={color}
              name={{
                ios: "gearshape.fill",
                android: "settings",
                web: "settings",
              }}
              size={iconSize}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bg,
    borderTopColor: "rgba(244, 240, 232, 0.08)",
    ...(Platform.OS === "ios"
      ? { borderTopWidth: StyleSheet.hairlineWidth }
      : {}),
  },
  tabBarLabel: {
    fontFamily: fonts.uiMedium,
  },
});
