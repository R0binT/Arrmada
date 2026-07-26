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
import { colors, fonts, minTouchTarget, radii, space } from "@/lib/theme";

export default function MovieDetailScreen() {
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
        <View style={styles.topBar}>
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
        <View style={styles.topBar}>
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
      <View style={styles.topBar}>
        <IconButton accessibilityLabel={t("action.back")} icon="←" onPress={handleBack} />
      </View>

      <View style={styles.hero}>
        {movie.posterUrl ? (
          <Image
            accessibilityIgnoresInvertColors
            contentFit="cover"
            source={{ uri: movie.posterUrl }}
            style={styles.poster}
            transition={200}
          />
        ) : (
          <View style={[styles.poster, styles.posterPlaceholder]}>
            <Text style={styles.posterInitial}>
              {movie.title.slice(0, 1).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.heroCopy}>
          <Text style={styles.movieTitle}>{movie.title}</Text>
          <Text style={styles.movieMeta}>
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
        <Text style={styles.overview}>{movie.overview}</Text>
      ) : null}

      <View style={styles.suiviRow}>
        <Text style={styles.suiviLabel}>{t("detail.suivi")}</Text>
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

      <View style={styles.actions}>
        {showDownload ? (
          <Pressable
            accessibilityLabel={t("detail.downloadMovieA11y")}
            accessibilityRole="button"
            disabled={actionsBusy}
            onPress={() => void handleDownload()}
            style={({ pressed }) => [
              styles.searchButton,
              pressed ? styles.pressed : null,
              actionsBusy ? styles.disabled : null,
            ]}
          >
            <Text style={styles.searchButtonText}>
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
            pressed ? styles.pressed : null,
            actionsBusy ? styles.disabled : null,
          ]}
        >
          <Text style={styles.dangerButtonText}>
            {deleteMutation.isPending ? t("action.removing") : t("action.remove")}
          </Text>
        </Pressable>
      </View>

      {toast ? (
        <View accessibilityLiveRegion="polite" style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
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
  topBar: {
    marginBottom: space.md,
  },
  loading: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  hero: {
    flexDirection: "row",
    gap: space.md,
    marginBottom: space.lg,
  },
  poster: {
    borderRadius: radii.md,
    height: 180,
    width: 120,
  },
  posterPlaceholder: {
    alignItems: "center",
    backgroundColor: colors.surface,
    justifyContent: "center",
  },
  posterInitial: {
    color: colors.secondary,
    fontFamily: fonts.display,
    fontSize: 40,
  },
  heroCopy: {
    flex: 1,
    gap: space.sm,
    justifyContent: "center",
  },
  movieTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 28,
  },
  movieMeta: {
    color: colors.secondary,
    fontFamily: fonts.uiMedium,
    fontSize: 15,
  },
  overview: {
    color: colors.secondary,
    fontFamily: fonts.ui,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: space.lg,
  },
  suiviRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: space.lg,
    minHeight: minTouchTarget,
  },
  suiviLabel: {
    color: colors.text,
    fontFamily: fonts.uiBold,
    fontSize: 16,
  },
  actions: {
    gap: space.md,
  },
  searchButton: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    minHeight: minTouchTarget,
    justifyContent: "center",
    paddingHorizontal: space.lg,
  },
  searchButtonText: {
    color: colors.bg,
    fontFamily: fonts.uiBold,
    fontSize: 16,
  },
  dangerButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.accent,
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: minTouchTarget,
    paddingHorizontal: space.lg,
  },
  dangerButtonText: {
    color: colors.accent,
    fontFamily: fonts.uiBold,
    fontSize: 16,
  },
  toast: {
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    bottom: space.lg,
    marginTop: space.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    position: "absolute",
  },
  toastText: {
    color: colors.text,
    fontFamily: fonts.uiMedium,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});
