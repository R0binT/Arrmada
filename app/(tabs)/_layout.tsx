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
  readonly focused: boolean;
  readonly name: SymbolName;
  readonly size: number;
};

const TabIcon = ({ color, focused, name, size }: TabIconProps) => (
  <SymbolView
    name={name}
    size={size}
    style={{ opacity: focused ? 1 : 0.72 }}
    tintColor={color}
  />
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
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: [styles.tabBarLabel, { fontSize: fontSize(11) }],
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              color={color}
              focused={focused}
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
        listeners={{
          tabPress: () => {
            navigateToTabRoot("/(tabs)/movies");
          },
        }}
        options={{
          title: t("tabs.movies"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              color={color}
              focused={focused}
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
        listeners={{
          tabPress: () => {
            navigateToTabRoot("/(tabs)/series");
          },
        }}
        options={{
          title: t("tabs.series"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              color={color}
              focused={focused}
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
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              color={color}
              focused={focused}
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
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              color={color}
              focused={focused}
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
        listeners={{
          tabPress: () => {
            router.dismissTo("/(tabs)/settings");
          },
        }}
        options={{
          title: t("tabs.settings"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              color={color}
              focused={focused}
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
    backgroundColor: colors.bgElevated,
    borderTopColor: colors.borderSubtle,
    ...(Platform.OS === "ios"
      ? { borderTopWidth: StyleSheet.hairlineWidth }
      : {}),
  },
  tabBarLabel: {
    fontFamily: fonts.uiMedium,
  },
});
