import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { openSettingsServices } from "@/features/settings/open-settings";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";

import {
    canOfferDownload,
    classifyMovie,
} from "@/arr-client";
import { availabilityLabel, t } from "@/i18n";
import {
    AudioChoiceSheet,
    ErrorBanner,
    IconButton,
    MediaMetaBlock,
    Screen,
} from "@/components";
import {
    confirmRetirer,
    deleteFilesForRetirerAction,
    type RetirerAction,
} from "@/features/library/retirer-action";
import {
    getErrorMessage,
    useDeleteMovie,
    useGrabMovieRelease,
    useMovie,
    useUpdateMovieMonitored,
} from "@/features/movies/use-movies";
import type { AudioPreference } from "@/features/releases/resolve-release-decision";
import {
    finishPendingAudioChoice,
    smartGrabReleases,
    type PendingAudioChoice,
} from "@/features/releases/smart-grab";
import { useArrClients } from "@/hooks/use-arr-clients";
import { colors, fonts, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

export default function MovieDetailScreen() {
  const { fontSize, space: scaledSpace, minTouchTarget, scale } = useUiSize();
  const posterWidth = Math.round(120 * scale);
  const posterHeight = Math.round(180 * scale);
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const movieId = Number(idParam);
  const { radarr } = useArrClients();
  const movieQuery = useMovie(movieId);
  const grabMutation = useGrabMovieRelease();
  const monitoredMutation = useUpdateMovieMonitored();
  const deleteMutation = useDeleteMovie();
  const [toast, setToast] = useState<string | undefined>();
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [pendingChoice, setPendingChoice] = useState<
    PendingAudioChoice | undefined
  >();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(undefined), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleOpenSettings = useCallback(() => {
    openSettingsServices();
  }, []);

  const handleDownload = useCallback(async () => {
    if (!radarr) {
      setToast(t("detail.radarrMissing"));
      return;
    }
    setDownloadBusy(true);
    try {
      const releases = await radarr.getMovieReleases(movieId);
      const outcome = await smartGrabReleases(releases, (release) =>
        grabMutation.mutateAsync(release),
      );
      if (outcome.type === "empty") {
        setToast(t("detail.noRelease"));
        return;
      }
      if (outcome.type === "grabbed") {
        setToast(t("detail.downloadStarted"));
        return;
      }
      setPendingChoice(outcome.pending);
    } catch (error) {
      setToast(getErrorMessage(error));
    } finally {
      setDownloadBusy(false);
    }
  }, [grabMutation, movieId, radarr]);

  const handleAudioChoice = useCallback(
    async (preference: AudioPreference) => {
      if (!pendingChoice) return;
      const pending = pendingChoice;
      setPendingChoice(undefined);
      setDownloadBusy(true);
      try {
        await finishPendingAudioChoice(pending, preference, (release) =>
          grabMutation.mutateAsync(release),
        );
        setToast(t("detail.downloadStarted"));
      } catch (error) {
        setToast(getErrorMessage(error));
      } finally {
        setDownloadBusy(false);
      }
    },
    [grabMutation, pendingChoice],
  );

  const handleToggleSuivi = useCallback(
    async (nextMonitored: boolean) => {
      try {
        await monitoredMutation.mutateAsync({
          movieId,
          monitored: nextMonitored,
        });
        setToast(nextMonitored ? t("detail.suiviOn") : t("detail.suiviOff"));
      } catch (error) {
        setToast(getErrorMessage(error));
      }
    },
    [movieId, monitoredMutation],
  );

  const handleRetirerAction = useCallback(
    async (action: RetirerAction) => {
      try {
        await deleteMutation.mutateAsync({
          movieId,
          deleteFiles: deleteFilesForRetirerAction(action),
        });
        router.replace("/(tabs)/movies");
      } catch (error) {
        setToast(getErrorMessage(error));
      }
    },
    [deleteMutation, movieId],
  );

  const handleRetirer = useCallback(() => {
    const title = movieQuery.data?.title ?? "ce film";
    confirmRetirer(title, (action) => {
      void handleRetirerAction(action);
    });
  }, [handleRetirerAction, movieQuery.data?.title]);

  if (movieQuery.isLoading) {
    return (
      <Screen>
        <View style={[styles.topBar, { marginBottom: scaledSpace.md }]}>
          <IconButton
            accessibilityLabel={t("action.back")}
            icon="←"
            onPress={handleBack}
          />
        </View>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </Screen>
    );
  }

  if (movieQuery.isError || !movieQuery.data) {
    return (
      <Screen>
        <View style={[styles.topBar, { marginBottom: scaledSpace.md }]}>
          <IconButton
            accessibilityLabel={t("action.back")}
            icon="←"
            onPress={handleBack}
          />
        </View>
        <ErrorBanner
          message={getErrorMessage(movieQuery.error)}
          onRetry={() => void movieQuery.refetch()}
          onSettings={handleOpenSettings}
        />
      </Screen>
    );
  }

  const movie = movieQuery.data;
  const movieAvailability = classifyMovie(movie);
  const statusLabel = availabilityLabel(movieAvailability);
  const showDownload = canOfferDownload(movieAvailability);
  const actionsBusy =
    downloadBusy ||
    grabMutation.isPending ||
    monitoredMutation.isPending ||
    deleteMutation.isPending;

  return (
    <Screen scroll>
      <View style={[styles.topBar, { marginBottom: scaledSpace.md }]}>
        <IconButton accessibilityLabel={t("action.back")} icon="←" onPress={handleBack} />
      </View>

      <View
        style={[
          styles.hero,
          { gap: scaledSpace.md, marginBottom: scaledSpace.lg },
        ]}
      >
        {movie.posterUrl ? (
          <Image
            accessibilityIgnoresInvertColors
            contentFit="cover"
            source={{ uri: movie.posterUrl }}
            style={[
              styles.poster,
              { height: posterHeight, width: posterWidth },
            ]}
            transition={200}
          />
        ) : (
          <View
            style={[
              styles.poster,
              styles.posterPlaceholder,
              { height: posterHeight, width: posterWidth },
            ]}
          >
            <Text style={[styles.posterInitial, { fontSize: fontSize(40) }]}>
              {movie.title.slice(0, 1).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={[styles.heroCopy, { gap: scaledSpace.sm }]}>
          <Text style={[styles.movieTitle, { fontSize: fontSize(28) }]}>
            {movie.title}
          </Text>
          <Text style={[styles.movieMeta, { fontSize: fontSize(15) }]}>
            {movie.year} · {statusLabel}
          </Text>
        </View>
      </View>

      <MediaMetaBlock
        added={movie.added}
        fileQuality={
          movieAvailability === "dispo" ? movie.fileQuality : undefined
        }
        genres={movie.genres}
        networkOrStudio={movie.studio}
        runtimeMinutes={movie.runtimeMinutes}
        sizeOnDisk={
          movieAvailability === "dispo" ? movie.sizeOnDisk : undefined
        }
      />

      {movie.overview.trim().length > 0 ? (
        <Text
          style={[
            styles.overview,
            {
              fontSize: fontSize(15),
              lineHeight: fontSize(22),
              marginBottom: scaledSpace.lg,
            },
          ]}
        >
          {movie.overview}
        </Text>
      ) : null}

      <View
        style={[
          styles.suiviRow,
          { marginBottom: scaledSpace.lg, minHeight: minTouchTarget },
        ]}
      >
        <Text style={[styles.suiviLabel, { fontSize: fontSize(16) }]}>
          {t("detail.suivi")}
        </Text>
        <Switch
          accessibilityLabel={
            movie.monitored ? t("detail.disableSuivi") : t("detail.enableSuivi")
          }
          accessibilityRole="switch"
          disabled={monitoredMutation.isPending || deleteMutation.isPending}
          onValueChange={(value) => void handleToggleSuivi(value)}
          trackColor={{ false: colors.surface, true: colors.accent }}
          value={movie.monitored}
        />
      </View>

      <View style={[styles.actions, { gap: scaledSpace.md }]}>
        {showDownload ? (
          <Pressable
            accessibilityLabel={t("detail.downloadMovieA11y")}
            accessibilityRole="button"
            disabled={actionsBusy}
            onPress={() => void handleDownload()}
            style={({ pressed }) => [
              styles.searchButton,
              {
                minHeight: minTouchTarget,
                paddingHorizontal: scaledSpace.lg,
              },
              pressed ? styles.pressed : null,
              actionsBusy ? styles.disabled : null,
            ]}
          >
            <Text style={[styles.searchButtonText, { fontSize: fontSize(16) }]}>
              {downloadBusy ? t("action.searching") : t("action.download")}
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityLabel={t("detail.removeMovieA11y")}
          accessibilityRole="button"
          disabled={actionsBusy}
          onPress={handleRetirer}
          style={({ pressed }) => [
            styles.dangerButton,
            {
              minHeight: minTouchTarget,
              paddingHorizontal: scaledSpace.lg,
            },
            pressed ? styles.pressed : null,
            actionsBusy ? styles.disabled : null,
          ]}
        >
          <Text style={[styles.dangerButtonText, { fontSize: fontSize(16) }]}>
            {deleteMutation.isPending ? t("action.removing") : t("action.remove")}
          </Text>
        </Pressable>
      </View>

      {toast ? (
        <View
          accessibilityLiveRegion="polite"
          style={[
            styles.toast,
            {
              bottom: scaledSpace.lg,
              marginTop: scaledSpace.lg,
              paddingHorizontal: scaledSpace.lg,
              paddingVertical: scaledSpace.md,
            },
          ]}
        >
          <Text style={[styles.toastText, { fontSize: fontSize(14) }]}>
            {toast}
          </Text>
        </View>
      ) : null}

      <AudioChoiceSheet
        onChooseVf={() => void handleAudioChoice("vf")}
        onChooseVo={() => void handleAudioChoice("vo")}
        onDismiss={() => setPendingChoice(undefined)}
        qualityName={pendingChoice?.qualityName ?? ""}
        visible={pendingChoice !== undefined}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {},
  loading: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  hero: {
    flexDirection: "row",
  },
  poster: {
    borderRadius: radii.md,
  },
  posterPlaceholder: {
    alignItems: "center",
    backgroundColor: colors.surface,
    justifyContent: "center",
  },
  posterInitial: {
    color: colors.secondary,
    fontFamily: fonts.display,
  },
  heroCopy: {
    flex: 1,
    justifyContent: "center",
  },
  movieTitle: {
    color: colors.text,
    fontFamily: fonts.display,
  },
  movieMeta: {
    color: colors.secondary,
    fontFamily: fonts.uiMedium,
  },
  overview: {
    color: colors.secondary,
    fontFamily: fonts.ui,
  },
  suiviRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  suiviLabel: {
    color: colors.text,
    fontFamily: fonts.uiBold,
  },
  actions: {},
  searchButton: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    justifyContent: "center",
  },
  searchButtonText: {
    color: colors.bg,
    fontFamily: fonts.uiBold,
  },
  dangerButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.accent,
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: "center",
  },
  dangerButtonText: {
    color: colors.accent,
    fontFamily: fonts.uiBold,
  },
  toast: {
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    position: "absolute",
  },
  toastText: {
    color: colors.text,
    fontFamily: fonts.uiMedium,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});
