import { router, useLocalSearchParams } from "expo-router";
import { openSettingsServices } from "@/features/settings/open-settings";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Switch, View } from "react-native";
import Animated from "react-native-reanimated";

import {
  canOfferDownload,
  classifyMovie,
  type ReleaseOffer,
} from "@/arr-client";
import { availabilityChipTone } from "@/features/library/availability-chip-tone";
import { availabilityLabel, t } from "@/i18n";
import {
  CastSection,
  CrewSection,
  DetailImmersiveHeader,
  DetailLoadingSkeleton,
  ErrorBanner,
  ExternalLinksRow,
  IconButton,
  MediaLanguageChipRows,
  MediaMetaBlock,
  RatingsRow,
  ReleasePickerSheet,
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
  useMovieCast,
  useUpdateMovieMonitored,
} from "@/features/movies/use-movies";
import { startSmartOrPickDownload } from "@/features/releases/start-smart-or-pick-download";
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
  const { space: scaledSpace } = useUiSize();
  const reduceMotion = useReduceMotion();
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const movieId = Number(idParam);
  const { radarr } = useArrClients();
  const movieQuery = useMovie(movieId);
  const castQuery = useMovieCast(movieId);
  const grabMutation = useGrabMovieRelease();
  const monitoredMutation = useUpdateMovieMonitored();
  const deleteMutation = useDeleteMovie();
  const [toast, setToast] = useState<string | undefined>();
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerReleases, setPickerReleases] = useState<ReleaseOffer[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerError, setPickerError] = useState<string | undefined>();
  const [grabbingGuid, setGrabbingGuid] = useState<string | undefined>();

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

  const openPicker = useCallback((releases: readonly ReleaseOffer[]) => {
    setPickerReleases([...releases]);
    setPickerError(undefined);
    setPickerVisible(true);
  }, []);

  const handleDownload = useCallback(async () => {
    if (!radarr) {
      setToast(t("detail.radarrMissing"));
      return;
    }
    setDownloadBusy(true);
    try {
      const releases = await radarr.getMovieReleases(movieId);
      const outcome = await startSmartOrPickDownload({
        releases,
        grab: (release) => grabMutation.mutateAsync(release),
      });
      if (outcome.type === "empty") {
        await radarr.command("MoviesSearch", { movieIds: [movieId] });
        setToast(t("detail.downloadStarted"));
        return;
      }
      if (outcome.type === "needPick") {
        openPicker(outcome.releases);
        return;
      }
      setToast(t("detail.downloadStarted"));
    } catch (error) {
      try {
        await radarr.command("MoviesSearch", { movieIds: [movieId] });
        setToast(t("detail.downloadStarted"));
      } catch {
        setToast(getErrorMessage(error));
      }
    } finally {
      setDownloadBusy(false);
    }
  }, [grabMutation, movieId, openPicker, radarr]);

  const handleChooseFile = useCallback(async () => {
    if (!radarr) {
      setToast(t("detail.radarrMissing"));
      return;
    }
    setPickerVisible(true);
    setPickerLoading(true);
    setPickerError(undefined);
    try {
      const releases = await radarr.getMovieReleases(movieId);
      setPickerReleases(releases);
    } catch (error) {
      setPickerError(getErrorMessage(error));
    } finally {
      setPickerLoading(false);
    }
  }, [movieId, radarr]);

  const handlePickRelease = useCallback(
    async (release: ReleaseOffer) => {
      setGrabbingGuid(release.guid);
      try {
        await grabMutation.mutateAsync(release);
        setPickerVisible(false);
        setToast(t("detail.downloadStarted"));
      } catch (error) {
        setToast(getErrorMessage(error));
      } finally {
        setGrabbingGuid(undefined);
      }
    },
    [grabMutation],
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
        actions={
          showDownload ? (
            <View style={{ gap: scaledSpace.sm, width: "100%" }}>
              <Button
                accessibilityLabel={t("detail.downloadMovieA11y")}
                disabled={actionsBusy}
                loading={downloadBusy}
                onPress={() => void handleDownload()}
                style={styles.fullWidthButton}
              >
                {downloadBusy ? t("action.searching") : t("action.download")}
              </Button>
              <Button
                accessibilityLabel={t("action.chooseFileA11y")}
                disabled={actionsBusy}
                onPress={() => void handleChooseFile()}
                style={styles.fullWidthButton}
                variant="secondary"
              >
                {t("action.chooseFile")}
              </Button>
            </View>
          ) : null
        }
        backLabel={t("action.back")}
        meta={
          <View style={[styles.metaRow, { gap: scaledSpace.sm }]}>
            {movie.year ? (
              <Text role="label" tone="muted">
                {movie.year}
              </Text>
            ) : null}
            <Chip tone={availabilityChipTone(movieAvailability)}>
              {statusLabel}
            </Chip>
          </View>
        }
        onBack={handleBack}
        posterUrl={movie.posterUrl}
        title={movie.title}
      />

      <Animated.View
        entering={createFadeSlideUp(reduceMotion, 0)}
        style={{ gap: scaledSpace.sm, marginBottom: scaledSpace.md }}
      >
        <RatingsRow ratings={movie.ratings} />
        <MediaMetaBlock
          added={movie.added}
          certification={movie.certification}
          collectionTitle={movie.collectionTitle}
          fileQuality={
            movieAvailability === "dispo" ? movie.fileQuality : undefined
          }
          genres={movie.genres}
          networkOrStudio={movie.studio}
          originalLanguage={movie.originalLanguage}
          releaseDate={
            movie.digitalRelease ?? movie.physicalRelease ?? movie.inCinemas
          }
          runtimeMinutes={movie.runtimeMinutes}
          sizeOnDisk={
            movieAvailability === "dispo" ? movie.sizeOnDisk : undefined
          }
          statusLabel={
            movie.statusSummary.trim().length > 0
              ? movie.statusSummary
              : undefined
          }
        />
        {movieAvailability === "dispo" ? (
          <MediaLanguageChipRows
            audioLanguageCodes={movie.audioLanguageCodes}
            subtitleLanguageCodes={movie.subtitleLanguageCodes}
          />
        ) : null}
        {movie.overview.trim().length > 0 ? (
          <Text role="body" tone="muted">
            {movie.overview}
          </Text>
        ) : null}
        <CrewSection members={castQuery.data?.crew ?? []} />
        <CastSection members={castQuery.data?.cast ?? []} />
        <ExternalLinksRow ids={movie.externalIds} kind="movie" />
      </Animated.View>

      <Animated.View
        entering={createFadeSlideUp(reduceMotion, 1)}
        style={{ gap: scaledSpace.sm, marginBottom: scaledSpace.xl }}
      >
        <Surface
          padded
          radius="md"
          style={{ padding: scaledSpace.sm }}
          tone="raised"
        >
          <View style={styles.suiviRow}>
            <Text role="label">{t("detail.suivi")}</Text>
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

        <Button
          accessibilityLabel={t("detail.removeMovieA11y")}
          disabled={actionsBusy}
          loading={deleteMutation.isPending}
          onPress={handleRetirer}
          size="compact"
          style={styles.fullWidthButton}
          variant="danger"
        >
          {deleteMutation.isPending ? t("action.removing") : t("action.remove")}
        </Button>
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

      <ReleasePickerSheet
        errorMessage={pickerError}
        grabbingGuid={grabbingGuid}
        loading={pickerLoading}
        onDismiss={() => setPickerVisible(false)}
        onRetry={() => void handleChooseFile()}
        onSelect={(release) => void handlePickRelease(release)}
        releases={pickerReleases}
        visible={pickerVisible}
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
  fullWidthButton: {
    alignSelf: "stretch",
  },
  toast: {
    alignSelf: "center",
    position: "absolute",
  },
});
