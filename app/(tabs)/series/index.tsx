import { openSettingsServices } from "@/features/settings/open-settings";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    FlatList,
    Pressable,
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

  const filteredSeries = seriesQuery.data
    ? filterSeries(seriesQuery.data, filter, search)
    : [];

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
  const filterLabelStyle = [styles.filterLabel, { fontSize: fontSize(14) }];

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
        <ErrorBanner
          message={getErrorMessage(seriesQuery.error)}
          onRetry={() => void seriesQuery.refetch()}
          onSettings={handleOpenSettings}
        />
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
          { gap: scaledSpace.sm, paddingRight: scaledSpace.md },
        ]}
        showsHorizontalScrollIndicator={false}
        style={[styles.filtersBar, { marginBottom: scaledSpace.md }]}
      >
        {filterChips.map((item) => {
          const isActive = filter === item.key;
          return (
            <Pressable
              key={item.key}
              accessibilityLabel={t("filter.byA11y", { label: item.label })}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              onPress={() => setFilter(item.key)}
              style={({ pressed }) => [
                styles.filterChip,
                {
                  height: touchTarget,
                  paddingHorizontal: scaledSpace.md,
                },
                isActive ? styles.filterChipActive : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text
                style={[
                  filterLabelStyle,
                  isActive ? styles.filterLabelActive : null,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {seriesQuery.isLoading ? (
        <PosterGridSkeleton cardWidth={CARD_WIDTH} />
      ) : filteredSeries.length === 0 ? (
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
      ) : (
        <FlatList
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          data={filteredSeries}
          extraData={quick.selected?.key}
          keyExtractor={(item) => String(item.id)}
          numColumns={3}
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
    borderColor: "rgba(244, 240, 232, 0.08)",
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
    borderColor: "rgba(244, 240, 232, 0.12)",
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: "center",
  },
  filterChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterLabel: {
    color: colors.secondary,
    fontFamily: fonts.uiMedium,
  },
  filterLabelActive: {
    color: colors.bg,
  },
  grid: {
    paddingBottom: space.xl,
  },
  list: {
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
