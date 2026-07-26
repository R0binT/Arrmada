import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

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
import { colors, fonts, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

const startOfMonth = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), 1);

export default function UpcomingScreen() {
  const { t } = useI18n();
  const {
    fontSize,
    space: scaledSpace,
    minTouchTarget: touchTarget,
  } = useUiSize();
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

  return (
    <Screen>
      <View
        style={[
          styles.header,
          { gap: scaledSpace.md, marginBottom: scaledSpace.md },
        ]}
      >
        <Text style={[styles.title, { fontSize: fontSize(28) }]}>
          {t("upcoming.title")}
        </Text>
        <View style={styles.toggle}>
          <Pressable
            accessibilityLabel={t("upcoming.listA11y")}
            accessibilityRole="button"
            accessibilityState={{ selected: viewMode === "list" }}
            onPress={() => handleSetViewMode("list")}
            style={[
              styles.toggleButton,
              {
                minHeight: touchTarget - 8,
                paddingHorizontal: scaledSpace.md,
              },
              viewMode === "list" ? styles.toggleActive : null,
            ]}
          >
            <Text
              style={[
                styles.toggleText,
                { fontSize: fontSize(14) },
                viewMode === "list" ? styles.toggleTextActive : null,
              ]}
            >
              {t("upcoming.list")}
            </Text>
          </Pressable>
          <Pressable
            accessibilityLabel={t("upcoming.calendarA11y")}
            accessibilityRole="button"
            accessibilityState={{ selected: viewMode === "calendar" }}
            onPress={() => handleSetViewMode("calendar")}
            style={[
              styles.toggleButton,
              {
                minHeight: touchTarget - 8,
                paddingHorizontal: scaledSpace.md,
              },
              viewMode === "calendar" ? styles.toggleActive : null,
            ]}
          >
            <Text
              style={[
                styles.toggleText,
                { fontSize: fontSize(14) },
                viewMode === "calendar" ? styles.toggleTextActive : null,
              ]}
            >
              {t("upcoming.calendar")}
            </Text>
          </Pressable>
        </View>
      </View>

      {upcoming.networkErrors.map((entry) => (
        <View
          key={entry.service}
          style={[styles.bannerWrap, { marginBottom: scaledSpace.md }]}
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
          renderItem={({ item }) => (
            <UpcomingRow item={item} onPress={() => handleOpenItem(item)} />
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
  title: {
    color: colors.text,
    fontFamily: fonts.display,
  },
  toggle: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    flexDirection: "row",
    padding: 4,
  },
  toggleButton: {
    borderRadius: radii.md - 2,
    justifyContent: "center",
  },
  toggleActive: {
    backgroundColor: "rgba(245, 165, 36, 0.18)",
  },
  toggleText: {
    color: colors.secondary,
    fontFamily: fonts.uiMedium,
  },
  toggleTextActive: {
    color: colors.accent,
  },
  bannerWrap: {},
  loading: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
});
