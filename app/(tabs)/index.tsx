import { openSettingsServices } from "@/features/settings/open-settings";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, StyleSheet, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  AppLogo,
  ErrorBanner,
  HeroBanner,
  MediaQuickSheet,
  PosterCard,
  PosterRow,
  ServiceHealthDot,
} from "@/components";
import { type HomeHero, useHomeData } from "@/features/home/use-home-data";
import {
  selectionFromDownload,
  selectionFromMovie,
  selectionFromSeries,
  selectionFromUpcoming,
} from "@/features/media-quick/build-media-quick-selection";
import { formatPosterDate } from "@/features/media-quick/format-media-meta";
import { useMediaQuickController } from "@/features/media-quick/use-media-quick-controller";
import { useUpcoming } from "@/features/upcoming/use-upcoming";
import { t, useI18n } from "@/i18n";
import { colors } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";
import { createFadeIn, Text, useReduceMotion } from "@/ui";

const HERO_PARALLAX_RANGE = 180;
const HERO_PARALLAX_TRANSLATE_Y = -18;
const HERO_PARALLAX_SCALE_MIN = 0.96;

const formatHeroSubtitle = (hero: HomeHero): string => {
  if (hero.kind === "download") {
    const percent = Math.round(hero.item.progress * 100);
    return t("home.downloadsInProgress", { percent });
  }
  if (hero.kind === "movie") {
    return hero.item.year > 0
      ? String(hero.item.year)
      : t("home.addedRecently");
  }
  return hero.item.year > 0 ? String(hero.item.year) : t("home.addedRecently");
};

const getHeroProgress = (hero: HomeHero): number | undefined => {
  if (hero.kind !== "download") return undefined;
  return hero.item.progress > 0 ? hero.item.progress : undefined;
};

export default function HomeScreen() {
  const { t } = useI18n();
  const { space: scaledSpace, scale } = useUiSize();
  const reduceMotion = useReduceMotion();
  const scrollY = useSharedValue(0);
  const [isFocused, setIsFocused] = useState(false);
  const quick = useMediaQuickController();
  const posterWidth = Math.round(128 * scale);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, []),
  );

  const home = useHomeData({ isFocused });
  const upcoming = useUpcoming();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    void Promise.all([home.refetchAll(), upcoming.refetch()]).finally(() => {
      setIsRefreshing(false);
    });
  }, [home.refetchAll, upcoming.refetch]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const heroParallaxStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, HERO_PARALLAX_RANGE],
          [0, HERO_PARALLAX_TRANSLATE_Y],
          Extrapolation.CLAMP,
        ),
      },
      {
        scale: interpolate(
          scrollY.value,
          [0, HERO_PARALLAX_RANGE],
          [1, HERO_PARALLAX_SCALE_MIN],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const handleOpenSettings = useCallback(() => {
    openSettingsServices();
  }, []);

  const handleOpenQueue = useCallback(() => {
    router.push("/(tabs)/queue");
  }, []);

  const handleOpenMovies = useCallback(() => {
    router.navigate("/(tabs)/movies");
  }, []);

  const handleOpenSeries = useCallback(() => {
    router.navigate("/(tabs)/series");
  }, []);

  const handleOpenUpcoming = useCallback(() => {
    router.push("/(tabs)/upcoming");
  }, []);

  const handleOpenMovie = useCallback((id: number) => {
    router.push({
      pathname: "/(tabs)/movies/[id]",
      params: { id: String(id) },
    });
  }, []);

  const handleOpenSeriesItem = useCallback((id: number) => {
    router.push({
      pathname: "/(tabs)/series/[id]",
      params: { id: String(id) },
    });
  }, []);

  const handleHeroPress = useCallback(() => {
    if (!home.hero) return;
    if (home.hero.kind === "download") {
      handleOpenQueue();
      return;
    }
    if (home.hero.kind === "movie") {
      handleOpenMovie(home.hero.item.id);
      return;
    }
    handleOpenSeriesItem(home.hero.item.id);
  }, [handleOpenMovie, handleOpenQueue, handleOpenSeriesItem, home.hero]);

  const fadeIn = createFadeIn(reduceMotion);

  return (
    <View style={styles.root}>
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        onScroll={scrollHandler}
        refreshControl={
          <RefreshControl
            colors={[colors.text]}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            tintColor={colors.text}
          />
        }
        scrollEventThrottle={16}
        style={styles.scroll}
      >
        <SafeAreaView edges={["top"]} style={styles.topSafe}>
          <View
            style={[
              styles.header,
              {
                paddingHorizontal: scaledSpace.md,
                paddingBottom: scaledSpace.sm,
              },
            ]}
          >
            <View style={[styles.brandRow, { gap: scaledSpace.sm }]}>
              <AppLogo size={Math.round(34 * scale)} />
              <Text role="headline">Arrmada</Text>
            </View>
            <View style={[styles.healthRow, { gap: scaledSpace.md }]}>
              {home.health.radarr ? (
                <ServiceHealthDot
                  health={home.health.radarr}
                  showLabel={false}
                  useLogo
                />
              ) : null}
              {home.health.sonarr ? (
                <ServiceHealthDot
                  health={home.health.sonarr}
                  showLabel={false}
                  useLogo
                />
              ) : null}
            </View>
          </View>
        </SafeAreaView>

        {home.networkErrors.map((entry) => (
          <View
            key={entry.service}
            style={{
              marginBottom: scaledSpace.md,
              paddingHorizontal: scaledSpace.md,
            }}
          >
            <ErrorBanner
              message={entry.message}
              onRetry={() => home.refetchService(entry.service)}
              onSettings={handleOpenSettings}
            />
          </View>
        ))}

        {home.isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        ) : (
          <Animated.View
            entering={fadeIn}
            style={{ gap: scaledSpace.lg, paddingBottom: scaledSpace["2xl"] }}
          >
            {home.hero ? (
              reduceMotion ? (
                <HeroBanner
                  kind={home.hero.kind}
                  layout="cinema"
                  onPress={handleHeroPress}
                  posterUrl={home.hero.item.posterUrl}
                  progress={getHeroProgress(home.hero)}
                  subtitle={formatHeroSubtitle(home.hero)}
                  title={home.hero.item.title}
                />
              ) : (
                <Animated.View style={heroParallaxStyle}>
                  <HeroBanner
                    kind={home.hero.kind}
                    layout="cinema"
                    onPress={handleHeroPress}
                    posterUrl={home.hero.item.posterUrl}
                    progress={getHeroProgress(home.hero)}
                    subtitle={formatHeroSubtitle(home.hero)}
                    title={home.hero.item.title}
                  />
                </Animated.View>
              )
            ) : null}

            {home.downloadingItems.length > 0 ? (
              <PosterRow
                onSeeAll={handleOpenQueue}
                title={t("home.inProgress")}
              >
                {home.downloadingItems.map((item) => {
                  const selection = selectionFromDownload(item);
                  return (
                    <PosterCard
                      key={selection.key}
                      onLongPress={() =>
                        quick.openPrimaryFromSelection(selection)
                      }
                      onPress={() => quick.toggle(selection)}
                      posterUrl={item.posterUrl}
                      progress={item.progress > 0 ? item.progress : undefined}
                      selected={quick.selected?.key === selection.key}
                      title={item.title}
                      width={posterWidth}
                    />
                  );
                })}
              </PosterRow>
            ) : null}

            {upcoming.previewItems.length > 0 ? (
              <PosterRow
                onSeeAll={handleOpenUpcoming}
                title={t("home.sectionUpcoming")}
              >
                {upcoming.previewItems.map((item) => {
                  const selection = selectionFromUpcoming(item, {
                    movies: home.movies,
                    series: home.series,
                  });
                  return (
                    <PosterCard
                      key={selection.key}
                      availability={selection.availability}
                      cornerBadge={formatPosterDate(item.date)}
                      onLongPress={() =>
                        quick.openPrimaryFromSelection(selection)
                      }
                      onPress={() => quick.toggle(selection)}
                      posterUrl={item.posterUrl}
                      selected={quick.selected?.key === selection.key}
                      title={item.title}
                      width={posterWidth}
                    />
                  );
                })}
              </PosterRow>
            ) : null}

            {home.recentMovies.length > 0 ? (
              <PosterRow
                onSeeAll={handleOpenMovies}
                title={t("home.sectionRecentMovies")}
              >
                {home.recentMovies.map((movie) => {
                  const selection = selectionFromMovie(movie);
                  return (
                    <PosterCard
                      key={selection.key}
                      availability={selection.availability}
                      onLongPress={() =>
                        quick.openPrimaryFromSelection(selection)
                      }
                      onPress={() => quick.toggle(selection)}
                      posterUrl={movie.posterUrl}
                      selected={quick.selected?.key === selection.key}
                      title={movie.title}
                      width={posterWidth}
                    />
                  );
                })}
              </PosterRow>
            ) : null}

            {home.recentSeries.length > 0 ? (
              <PosterRow
                onSeeAll={handleOpenSeries}
                title={t("home.sectionRecentSeries")}
              >
                {home.recentSeries.map((series) => {
                  const selection = selectionFromSeries(series);
                  return (
                    <PosterCard
                      key={selection.key}
                      availability={selection.availability}
                      onLongPress={() =>
                        quick.openPrimaryFromSelection(selection)
                      }
                      onPress={() => quick.toggle(selection)}
                      posterUrl={series.posterUrl}
                      selected={quick.selected?.key === selection.key}
                      title={series.title}
                      width={posterWidth}
                    />
                  );
                })}
              </PosterRow>
            ) : null}
          </Animated.View>
        )}
      </Animated.ScrollView>

      <MediaQuickSheet {...quick.sheetProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  topSafe: {
    backgroundColor: "transparent",
  },
  scroll: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  healthRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  loading: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: 320,
  },
});
