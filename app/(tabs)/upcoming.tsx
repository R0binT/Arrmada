import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Animated from "react-native-reanimated";

import type { CalendarEvent, UpcomingItem } from "@/arr-client";
import {
  EmptyState,
  ErrorBanner,
  Screen,
  UpcomingCalendar,
  UpcomingRow,
} from "@/components";
import { openSettingsServices } from "@/features/settings/open-settings";
import {
  loadUpcomingViewMode,
  saveUpcomingViewMode,
  type UpcomingViewMode,
} from "@/features/upcoming/upcoming-view-preference";
import { useUpcoming } from "@/features/upcoming/use-upcoming";
import { useI18n } from "@/i18n";
import { colors, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";
import {
  createFadeSlideUp,
  pressScaleStyle,
  Surface,
  Text,
  useReduceMotion,
} from "@/ui";

const startOfMonth = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), 1);

export default function UpcomingScreen() {
  const { t } = useI18n();
  const { space: scaledSpace, minTouchTarget: touchTarget } = useUiSize();
  const reduceMotion = useReduceMotion();
  const [viewMode, setViewMode] = useState<UpcomingViewMode>("list");
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const upcoming = useUpcoming(viewMode === "calendar" ? { visibleMonth } : {});

  useFocusEffect(
    useCallback(() => {
      void loadUpcomingViewMode().then(setViewMode);
    }, []),
  );

  const handleSetViewMode = useCallback((mode: UpcomingViewMode) => {
    setViewMode(mode);
    void saveUpcomingViewMode(mode);
  }, []);

  const handleOpenSettings = useCallback(() => {
    openSettingsServices();
  }, []);

  const handleOpenItem = useCallback((item: UpcomingItem | CalendarEvent) => {
    if (item.kind === "movie") {
      router.push({
        pathname: "/(tabs)/movies/[id]",
        params: { id: String(item.id) },
      });
      return;
    }
    router.push({
      pathname: "/(tabs)/series/[id]",
      params: { id: String(item.seriesId) },
    });
  }, []);

  const listEmpty = !upcoming.isLoading && upcoming.items.length === 0;

  const renderToggle = (mode: UpcomingViewMode, label: string, a11y: string) => {
    const selected = viewMode === mode;
    return (
      <Pressable
        accessibilityLabel={a11y}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={() => handleSetViewMode(mode)}
        style={({ pressed }) => [
          styles.toggleButton,
          {
            minHeight: touchTarget - 8,
            paddingHorizontal: scaledSpace.md,
          },
          selected ? styles.toggleActive : null,
          pressScaleStyle(pressed, reduceMotion),
        ]}
      >
        <Text role="label" tone={selected ? "accent" : "muted"}>
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <Screen>
      <View
        style={[
          styles.header,
          { gap: scaledSpace.md, marginBottom: scaledSpace.md },
        ]}
      >
        <Text role="title">{t("upcoming.title")}</Text>
        <Surface
          radius="md"
          style={[styles.toggle, { padding: 4 }]}
          tone="base"
        >
          {renderToggle("list", t("upcoming.list"), t("upcoming.listA11y"))}
          {renderToggle(
            "calendar",
            t("upcoming.calendar"),
            t("upcoming.calendarA11y"),
          )}
        </Surface>
      </View>

      {upcoming.networkErrors.map((entry) => (
        <View
          key={entry.service}
          style={{ marginBottom: scaledSpace.md }}
        >
          <ErrorBanner
            message={entry.message}
            onRetry={() => upcoming.refetchService(entry.service)}
            onSettings={handleOpenSettings}
          />
        </View>
      ))}

      {upcoming.isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : viewMode === "calendar" ? (
        <ScrollView contentContainerStyle={{ paddingBottom: scaledSpace.xl }}>
          <UpcomingCalendar
            events={upcoming.calendarEvents}
            month={visibleMonth}
            onMonthChange={setVisibleMonth}
            onPressItem={handleOpenItem}
          />
        </ScrollView>
      ) : listEmpty ? (
        <EmptyState
          message={t("upcoming.emptyBody")}
          title={t("upcoming.emptyTitle")}
        />
      ) : (
        <FlatList
          contentContainerStyle={{
            gap: scaledSpace.sm,
            paddingBottom: scaledSpace.xl,
          }}
          data={[...upcoming.items]}
          keyExtractor={(item) => `${item.kind}-${item.id}`}
          renderItem={({ item, index }) => (
            <Animated.View entering={createFadeSlideUp(reduceMotion, index)}>
              <UpcomingRow item={item} onPress={() => handleOpenItem(item)} />
            </Animated.View>
          )}
          ItemSeparatorComponent={() => (
            <View style={{ height: scaledSpace.sm }} />
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {},
  toggle: {
    alignSelf: "flex-start",
    flexDirection: "row",
  },
  toggleButton: {
    borderRadius: radii.md - 2,
    justifyContent: "center",
  },
  toggleActive: {
    backgroundColor: colors.accentMuted,
  },
  loading: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
});
