import { openSettingsServices } from "@/features/settings/open-settings";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    FlatList,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import {
    EmptyState,
    ErrorBanner,
    IconButton,
    MediaQuickSheet,
    PosterCard,
    PosterGridSkeleton,
    Screen,
} from "@/components";
import { getLibraryFilterChips } from "@/features/library/library-filter-chips";
import { resolveLibraryFilterChipStyle } from "@/features/library/library-filter-chip-style";
import { selectionFromSeries } from "@/features/media-quick/build-media-quick-selection";
import { useMediaQuickController } from "@/features/media-quick/use-media-quick-controller";
import {
    filterSeries,
    getErrorMessage,
    type SeriesFilter,
    useSeriesList,
} from "@/features/series/use-series";
import { useI18n } from "@/i18n";
import { colors, fonts, radii, space } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

const CARD_WIDTH = 108;
const CARD_GAP = space.sm;

export default function SeriesScreen() {
  const { t, locale } = useI18n();
  const {
    fontSize,
    space: scaledSpace,
    minTouchTarget: touchTarget,
  } = useUiSize();
  const [filter, setFilter] = useState<SeriesFilter>("all");
  const [search, setSearch] = useState("");
  const seriesQuery = useSeriesList();
  const quick = useMediaQuickController();
  const filterChips = useMemo(() => getLibraryFilterChips(), [locale]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredSeries = seriesQuery.data
    ? filterSeries(seriesQuery.data, filter, search)
    : [];

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    void seriesQuery.refetch().finally(() => {
      setIsRefreshing(false);
    });
  }, [seriesQuery.refetch]);

  const refreshControl = (
    <RefreshControl
      colors={[colors.text]}
      onRefresh={handleRefresh}
      refreshing={isRefreshing}
      tintColor={colors.text}
    />
  );

  const handleOpenAdd = useCallback(() => {
    router.push("/(tabs)/series/add");
  }, []);

  const handleOpenSettings = useCallback(() => {
    openSettingsServices();
  }, []);

  const titleStyle = [styles.title, { fontSize: fontSize(32) }];
  const searchStyle = [
    styles.searchInput,
    {
      fontSize: fontSize(15),
      marginBottom: scaledSpace.md,
      minHeight: touchTarget,
      paddingHorizontal: scaledSpace.md,
    },
  ];
  const filterLabelStyle = { fontSize: fontSize(12), fontFamily: fonts.uiMedium };

  if (!seriesQuery.isLoading && seriesQuery.isError) {
    return (
      <Screen>
        <View style={[styles.header, { marginBottom: scaledSpace.md }]}>
          <Text style={titleStyle}>{t("tabs.series")}</Text>
          <IconButton
            accessibilityLabel={t("library.addSeriesA11y")}
            icon="+"
            onPress={handleOpenAdd}
            variant="outline"
          />
        </View>
        <ScrollView
          contentContainerStyle={styles.refreshableFill}
          refreshControl={refreshControl}
          style={styles.refreshableScroll}
        >
          <ErrorBanner
            message={getErrorMessage(seriesQuery.error)}
            onRetry={() => void seriesQuery.refetch()}
            onSettings={handleOpenSettings}
          />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={[styles.header, { marginBottom: scaledSpace.md }]}>
        <Text style={titleStyle}>{t("tabs.series")}</Text>
        <IconButton
          accessibilityLabel={t("library.addSeriesA11y")}
          icon="+"
          onPress={handleOpenAdd}
          variant="outline"
        />
      </View>

      <TextInput
        accessibilityLabel={t("library.searchSeriesA11y")}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={setSearch}
        placeholder={t("library.searchPlaceholder")}
        placeholderTextColor={colors.secondary}
        style={searchStyle}
        value={search}
      />

      <ScrollView
        horizontal
        contentContainerStyle={[
          styles.filters,
          { gap: scaledSpace.xs, paddingRight: scaledSpace.md },
        ]}
        showsHorizontalScrollIndicator={false}
        style={[styles.filtersBar, { marginBottom: scaledSpace.sm }]}
      >
        {filterChips.map((item) => {
          const isActive = filter === item.key;
          const chipStyle = resolveLibraryFilterChipStyle(item.key, isActive);
          return (
            <Pressable
              key={item.key}
              accessibilityLabel={t("filter.byA11y", { label: item.label })}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              onPress={() => setFilter(item.key)}
              style={({ pressed }) => [
                styles.filterChip,
                {
                  paddingHorizontal: scaledSpace.sm,
                  paddingVertical: scaledSpace.xs,
                },
                chipStyle.container,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text
                style={[
                  filterLabelStyle,
                  { color: chipStyle.labelColor },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {seriesQuery.isLoading ? (
        <ScrollView
          contentContainerStyle={styles.refreshableFill}
          refreshControl={refreshControl}
          style={styles.refreshableScroll}
        >
          <PosterGridSkeleton cardWidth={CARD_WIDTH} />
        </ScrollView>
      ) : filteredSeries.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.refreshableFill}
          refreshControl={refreshControl}
          style={styles.refreshableScroll}
        >
          <EmptyState
            actionLabel={
              seriesQuery.data?.length === 0
                ? t("library.addSeriesA11y")
                : undefined
            }
            message={
              seriesQuery.data?.length === 0
                ? t("library.emptySeriesBody")
                : t("library.emptyFilterSeriesBody")
            }
            onAction={seriesQuery.data?.length === 0 ? handleOpenAdd : undefined}
            title={
              seriesQuery.data?.length === 0
                ? t("library.emptySeriesTitle")
                : t("library.emptyFilterTitle")
            }
          />
        </ScrollView>
      ) : (
        <FlatList
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          data={filteredSeries}
          extraData={quick.selected?.key}
          keyExtractor={(item) => String(item.id)}
          numColumns={3}
          refreshControl={refreshControl}
          renderItem={({ item }) => {
            const selection = selectionFromSeries(item);
            return (
              <View style={styles.cardCell}>
                <PosterCard
                  availability={selection.availability}
                  onLongPress={() => quick.openPrimaryFromSelection(selection)}
                  onPress={() => quick.toggle(selection)}
                  posterUrl={item.posterUrl}
                  selected={quick.selected?.key === selection.key}
                  title={`${item.title} (${item.year})`}
                  width={CARD_WIDTH}
                />
              </View>
            );
          }}
          showsVerticalScrollIndicator={false}
          style={styles.list}
        />
      )}
      <MediaQuickSheet {...quick.sheetProps} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    color: colors.text,
    flex: 1,
    fontFamily: fonts.display,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontFamily: fonts.ui,
  },
  filtersBar: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filters: {
    alignItems: "center",
    flexDirection: "row",
  },
  filterChip: {
    alignItems: "center",
    borderRadius: radii.full,
    borderWidth: 1,
    justifyContent: "center",
  },
  grid: {
    paddingBottom: space.xl,
  },
  list: {
    flex: 1,
  },
  refreshableFill: {
    flexGrow: 1,
  },
  refreshableScroll: {
    flex: 1,
  },
  row: {
    gap: CARD_GAP,
    justifyContent: "center",
    marginBottom: CARD_GAP,
  },
  cardCell: {
    alignItems: "center",
    flex: 1,
    maxWidth: "33.333%",
  },
  pressed: {
    opacity: 0.8,
  },
});
