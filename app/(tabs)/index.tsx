import { openSettingsServices } from "@/features/settings/open-settings";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import {
    AppLogo,
    ErrorBanner,
    HeroBanner,
    MediaQuickSheet,
    PosterCard,
    PosterRow,
    Screen,
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
import { colors, space } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

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

  return (
    <Screen scroll>
      <View style={[styles.header, { marginBottom: scaledSpace.md }]}>
        <AppLogo size={Math.round(40 * scale)} />
        <View style={styles.healthRow}>
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
        <View key={entry.service} style={styles.bannerWrap}>
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
        <Animated.View entering={FadeIn.duration(350)} style={styles.content}>
          {home.hero ? (
            <HeroBanner
              kind={home.hero.kind}
              onPress={handleHeroPress}
              posterUrl={home.hero.item.posterUrl}
              progress={getHeroProgress(home.hero)}
              subtitle={formatHeroSubtitle(home.hero)}
              title={home.hero.item.title}
            />
          ) : null}

          {home.downloadingItems.length > 0 ? (
            <View style={styles.rowWrap}>
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
                    />
                  );
                })}
              </PosterRow>
            </View>
          ) : null}

          {upcoming.previewItems.length > 0 ? (
            <View style={styles.rowWrap}>
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
                    />
                  );
                })}
              </PosterRow>
            </View>
          ) : null}

          {home.recentMovies.length > 0 ? (
            <View style={styles.rowWrap}>
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
                    />
                  );
                })}
              </PosterRow>
            </View>
          ) : null}

          {home.recentSeries.length > 0 ? (
            <View style={styles.rowWrap}>
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
                    />
                  );
                })}
              </PosterRow>
            </View>
          ) : null}
        </Animated.View>
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
    marginBottom: space.md,
  },
  healthRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.md,
  },
  bannerWrap: {
    marginBottom: space.md,
  },
  loading: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: 240,
  },
  content: {
    gap: space.xl,
    paddingBottom: space.xl,
  },
  rowWrap: {
    marginHorizontal: -space.md,
  },
});
