import { router, useLocalSearchParams } from "expo-router";
import { openSettingsServices } from "@/features/settings/open-settings";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Switch, View } from "react-native";
import Animated from "react-native-reanimated";

import {
  canOfferDownload,
  classifyMovie,
} from "@/arr-client";
import { availabilityLabel, t } from "@/i18n";
import {
  AudioChoiceSheet,
  DetailImmersiveHeader,
  DetailLoadingSkeleton,
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
import { colors } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";
import {
  Button,
  Chip,
  createFadeSlideUp,
  Surface,
  Text,
  useReduceMotion,
} from "@/ui";

export default function MovieDetailScreen() {
  const { space: scaledSpace, minTouchTarget } = useUiSize();
  const reduceMotion = useReduceMotion();
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
        <DetailLoadingSkeleton
          backLabel={t("action.back")}
          onBack={handleBack}
        />
      </Screen>
    );
  }

  if (movieQuery.isError || !movieQuery.data) {
    return (
      <Screen>
        <View style={{ marginBottom: scaledSpace.md }}>
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
      <DetailImmersiveHeader
        backLabel={t("action.back")}
        meta={
          <View style={[styles.metaRow, { gap: scaledSpace.sm }]}>
            {movie.year ? (
              <Text role="label" tone="muted">
                {movie.year}
              </Text>
            ) : null}
            <Chip tone="neutral">{statusLabel}</Chip>
          </View>
        }
        onBack={handleBack}
        posterUrl={movie.posterUrl}
        title={movie.title}
      />

      <Animated.View
        entering={createFadeSlideUp(reduceMotion, 0)}
        style={{ gap: scaledSpace.md, marginBottom: scaledSpace.lg }}
      >
        <Surface padded tone="raised">
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
            <Text role="body" tone="muted">
              {movie.overview}
            </Text>
          ) : null}
        </Surface>

        <Surface padded tone="raised">
          <View
            style={[
              styles.suiviRow,
              { minHeight: minTouchTarget },
            ]}
          >
            <Text role="headline">{t("detail.suivi")}</Text>
            <Switch
              accessibilityLabel={
                movie.monitored
                  ? t("detail.disableSuivi")
                  : t("detail.enableSuivi")
              }
              accessibilityRole="switch"
              disabled={monitoredMutation.isPending || deleteMutation.isPending}
              onValueChange={(value) => void handleToggleSuivi(value)}
              trackColor={{ false: colors.surface, true: colors.accent }}
              value={movie.monitored}
            />
          </View>
        </Surface>

        <View style={[styles.actions, { gap: scaledSpace.md }]}>
          {showDownload ? (
            <Button
              accessibilityLabel={t("detail.downloadMovieA11y")}
              disabled={actionsBusy}
              loading={downloadBusy}
              onPress={() => void handleDownload()}
              style={styles.fullWidthButton}
            >
              {downloadBusy ? t("action.searching") : t("action.download")}
            </Button>
          ) : null}
          <Button
            accessibilityLabel={t("detail.removeMovieA11y")}
            disabled={actionsBusy}
            loading={deleteMutation.isPending}
            onPress={handleRetirer}
            style={styles.fullWidthButton}
            variant="secondary"
          >
            {deleteMutation.isPending ? t("action.removing") : t("action.remove")}
          </Button>
        </View>
      </Animated.View>

      {toast ? (
        <Surface
          radius="md"
          style={[
            styles.toast,
            {
              bottom: scaledSpace.lg,
              marginTop: scaledSpace.lg,
              paddingHorizontal: scaledSpace.lg,
              paddingVertical: scaledSpace.md,
            },
          ]}
          tone="elevated"
        >
          <View accessibilityLiveRegion="polite">
            <Text role="label">{toast}</Text>
          </View>
        </Surface>
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
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  suiviRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actions: {},
  fullWidthButton: {
    alignSelf: "stretch",
  },
  toast: {
    alignSelf: "center",
    position: "absolute",
  },
});
