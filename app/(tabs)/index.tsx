import { openSettingsServices } from "@/features/settings/open-settings";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
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

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, []),
  );

  const home = useHomeData({ isFocused });
  const upcoming = useUpcoming();

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
          [0, 240],
          [0, -48],
          Extrapolation.CLAMP,
        ),
      },
      {
        scale: interpolate(
          scrollY.value,
          [0, 240],
          [1, 0.94],
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

  const contentPadding = {
    paddingHorizontal: scaledSpace.md,
    paddingVertical: scaledSpace.md,
  };

  const fadeIn = createFadeIn(reduceMotion);

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
      <Animated.ScrollView
        contentContainerStyle={[styles.scrollContent, contentPadding]}
        keyboardShouldPersistTaps="handled"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={styles.scroll}
      >
        <View style={[styles.header, { marginBottom: scaledSpace.md }]}>
          <View style={[styles.brandRow, { gap: scaledSpace.sm }]}>
            <AppLogo size={Math.round(36 * scale)} />
            <View style={{ gap: scaledSpace["2xs"] }}>
              <Text role="headline">Arrmada</Text>
              <Text role="caption" tone="muted">
                {t("tabs.home")}
              </Text>
            </View>
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

        {home.networkErrors.map((entry) => (
          <View
            key={entry.service}
            style={[styles.bannerWrap, { marginBottom: scaledSpace.md }]}
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
            style={[
              styles.content,
              { gap: scaledSpace.xl, paddingBottom: scaledSpace.xl },
            ]}
          >
            {home.hero ? (
              reduceMotion ? (
                <HeroBanner
                  kind={home.hero.kind}
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
              <View
                style={[styles.rowWrap, { marginHorizontal: -scaledSpace.md }]}
              >
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
                        width={Math.round(112 * scale)}
                      />
                    );
                  })}
                </PosterRow>
              </View>
            ) : null}

            {upcoming.previewItems.length > 0 ? (
              <View
                style={[styles.rowWrap, { marginHorizontal: -scaledSpace.md }]}
              >
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
                        width={Math.round(112 * scale)}
                      />
                    );
                  })}
                </PosterRow>
              </View>
            ) : null}

            {home.recentMovies.length > 0 ? (
              <View
                style={[styles.rowWrap, { marginHorizontal: -scaledSpace.md }]}
              >
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
                        width={Math.round(112 * scale)}
                      />
                    );
                  })}
                </PosterRow>
              </View>
            ) : null}

            {home.recentSeries.length > 0 ? (
              <View
                style={[styles.rowWrap, { marginHorizontal: -scaledSpace.md }]}
              >
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
                        width={Math.round(112 * scale)}
                      />
                    );
                  })}
                </PosterRow>
              </View>
            ) : null}
          </Animated.View>
        )}
      </Animated.ScrollView>

      <MediaQuickSheet {...quick.sheetProps} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.bg,
    flex: 1,
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
  bannerWrap: {},
  loading: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: 240,
  },
  content: {},
  rowWrap: {},
});
