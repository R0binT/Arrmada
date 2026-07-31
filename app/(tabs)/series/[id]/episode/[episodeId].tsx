import { router, useLocalSearchParams } from "expo-router";
import { openSettingsServices } from "@/features/settings/open-settings";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Switch, View } from "react-native";
import Animated from "react-native-reanimated";

import { canOfferDownload, type ReleaseOffer } from "@/arr-client";
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
  ReleasePickerSheet,
  Screen,
} from "@/components";
import { formatEpisodeCode } from "@/features/media-quick/format-media-meta";
import { startSmartOrPickDownload } from "@/features/releases/start-smart-or-pick-download";
import {
  getErrorMessage,
  useDeleteEpisodeFile,
  useEpisodeGuestStars,
  useGrabSeriesRelease,
  useSeries,
  useSeriesCast,
  useSeriesSeasons,
  useUpdateEpisodeMonitored,
} from "@/features/series/use-series";
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

export default function EpisodeDetailScreen() {
  const { space: scaledSpace } = useUiSize();
  const reduceMotion = useReduceMotion();
  const { id: idParam, episodeId: episodeIdParam } = useLocalSearchParams<{
    id: string;
    episodeId: string;
  }>();
  const seriesId = Number(idParam);
  const episodeId = Number(episodeIdParam);
  const { sonarr } = useArrClients();
  const seriesQuery = useSeries(seriesId);
  const castQuery = useSeriesCast(seriesId);
  const seasonsQuery = useSeriesSeasons(seriesId);
  const grabMutation = useGrabSeriesRelease();
  const monitoredMutation = useUpdateEpisodeMonitored();
  const deleteFileMutation = useDeleteEpisodeFile();
  const [toast, setToast] = useState<string | undefined>();
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerReleases, setPickerReleases] = useState<ReleaseOffer[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerError, setPickerError] = useState<string | undefined>();
  const [grabbingGuid, setGrabbingGuid] = useState<string | undefined>();

  const episode = useMemo(() => {
    if (!seasonsQuery.data) return undefined;
    return seasonsQuery.data
      .flatMap((season) => season.episodes)
      .find((item) => item.id === episodeId);
  }, [episodeId, seasonsQuery.data]);

  const guestQuery = useEpisodeGuestStars(seriesId, episode);

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
    if (!sonarr) {
      setToast(t("detail.sonarrMissing"));
      return;
    }
    if (!episode) {
      setToast(t("detail.episodeMissing"));
      return;
    }
    setDownloadBusy(true);
    try {
      const releases = await sonarr.getEpisodeReleases(episode.id);
      const outcome = await startSmartOrPickDownload({
        releases,
        grab: (release) => grabMutation.mutateAsync(release),
      });
      if (outcome.type === "empty") {
        setToast(t("detail.noRelease"));
        return;
      }
      if (outcome.type === "needPick") {
        openPicker(outcome.releases);
        return;
      }
      setToast(t("detail.downloadStarted"));
    } catch (error) {
      setToast(getErrorMessage(error));
    } finally {
      setDownloadBusy(false);
    }
  }, [episode, grabMutation, openPicker, sonarr]);

  const handleChooseFile = useCallback(async () => {
    if (!sonarr) {
      setToast(t("detail.sonarrMissing"));
      return;
    }
    if (!episode) {
      setToast(t("detail.episodeMissing"));
      return;
    }
    setPickerVisible(true);
    setPickerLoading(true);
    setPickerError(undefined);
    try {
      const releases = await sonarr.getEpisodeReleases(episode.id);
      setPickerReleases(releases);
    } catch (error) {
      setPickerError(getErrorMessage(error));
    } finally {
      setPickerLoading(false);
    }
  }, [episode, sonarr]);

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
          seriesId,
          episodeId,
          monitored: nextMonitored,
        });
        setToast(nextMonitored ? t("detail.suiviOn") : t("detail.suiviOff"));
      } catch (error) {
        setToast(getErrorMessage(error));
      }
    },
    [episodeId, monitoredMutation, seriesId],
  );

  const handleDeleteFile = useCallback(() => {
    const fileId = episode?.episodeFileId;
    if (fileId === undefined || !episode) return;
    const title =
      episode.title.trim().length > 0
        ? episode.title
        : t("detail.thisEpisode");
    Alert.alert(
      t("detail.deleteEpisodeFileTitle"),
      t("detail.deleteEpisodeFileMessage", { title }),
      [
        { text: t("action.cancel"), style: "cancel" },
        {
          text: t("detail.deleteEpisodeFile"),
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await deleteFileMutation.mutateAsync({
                  seriesId,
                  episodeFileId: fileId,
                });
                setToast(t("detail.deleteEpisodeFileDone"));
              } catch (error) {
                setToast(getErrorMessage(error));
              }
            })();
          },
        },
      ],
    );
  }, [deleteFileMutation, episode, seriesId]);

  if (seriesQuery.isLoading || seasonsQuery.isLoading) {
    return (
      <Screen>
        <DetailLoadingSkeleton
          backLabel={t("action.back")}
          onBack={handleBack}
        />
      </Screen>
    );
  }

  if (seriesQuery.isError || !seriesQuery.data) {
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
          message={getErrorMessage(seriesQuery.error)}
          onRetry={() => void seriesQuery.refetch()}
          onSettings={handleOpenSettings}
        />
      </Screen>
    );
  }

  if (seasonsQuery.isError) {
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
          message={getErrorMessage(seasonsQuery.error)}
          onRetry={() => void seasonsQuery.refetch()}
          onSettings={handleOpenSettings}
        />
      </Screen>
    );
  }

  if (!episode) {
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
          message={t("detail.episodeMissing")}
          onRetry={() => void seasonsQuery.refetch()}
          onSettings={handleOpenSettings}
        />
      </Screen>
    );
  }

  const series = seriesQuery.data;
  const episodeCode =
    formatEpisodeCode(episode.seasonNumber, episode.episodeNumber) ??
    t("detail.fallbackEpisode");
  const episodeTitle =
    episode.title.trim().length > 0 ? episode.title : episodeCode;
  const showDownload = canOfferDownload(episode.availability);
  const actionsBusy =
    downloadBusy ||
    grabMutation.isPending ||
    monitoredMutation.isPending ||
    deleteFileMutation.isPending;

  return (
    <Screen scroll>
      <DetailImmersiveHeader
        actions={
          showDownload ? (
            <View style={{ gap: scaledSpace.sm, width: "100%" }}>
              <Button
                accessibilityLabel={t("detail.downloadEpisodeA11y")}
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
            <Text role="label" tone="muted">
              {episodeCode}
            </Text>
            <Chip tone={availabilityChipTone(episode.availability)}>
              {availabilityLabel(episode.availability)}
            </Chip>
          </View>
        }
        onBack={handleBack}
        posterUrl={series.posterUrl}
        subtitle={
          <Text role="label" tone="muted">
            {series.title}
          </Text>
        }
        title={episodeTitle}
      />

      <Animated.View
        entering={createFadeSlideUp(reduceMotion, 0)}
        style={{ gap: scaledSpace.sm, marginBottom: scaledSpace.md }}
      >
        <MediaMetaBlock
          added={undefined}
          fileQuality={
            episode.availability === "dispo" ? episode.fileQuality : undefined
          }
          genres={series.genres}
          networkOrStudio={series.network}
          releaseDate={episode.airDateUtc}
          runtimeMinutes={episode.runtimeMinutes ?? series.runtimeMinutes}
          sizeOnDisk={
            episode.availability === "dispo" ? episode.sizeOnDisk : undefined
          }
        />
        {episode.hasFile ? (
          <MediaLanguageChipRows
            audioLanguageCodes={episode.audioLanguageCodes}
            subtitleLanguageCodes={episode.subtitleLanguageCodes}
          />
        ) : null}
        {episode.overview.trim().length > 0 ? (
          <Text role="body" tone="muted">
            {episode.overview}
          </Text>
        ) : null}
        <CastSection
          members={guestQuery.data ?? []}
          title={t("detail.guestStars")}
        />
        <CrewSection members={castQuery.data?.crew ?? []} />
        <CastSection members={castQuery.data?.cast ?? []} />
        <ExternalLinksRow ids={series.externalIds} kind="series" />
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
          <View style={[styles.suiviRow, { gap: scaledSpace.sm }]}>
            <Text role="label">{t("detail.suivi")}</Text>
            <Switch
              accessibilityLabel={
                episode.monitored
                  ? t("detail.disableSuivi")
                  : t("detail.enableSuivi")
              }
              disabled={actionsBusy}
              onValueChange={(value) => void handleToggleSuivi(value)}
              value={episode.monitored}
            />
          </View>
        </Surface>
        {episode.hasFile && episode.episodeFileId !== undefined ? (
          <Button
            accessibilityLabel={t("detail.deleteEpisodeFileA11y")}
            disabled={actionsBusy}
            loading={deleteFileMutation.isPending}
            onPress={handleDeleteFile}
            style={styles.fullWidthButton}
            variant="danger"
          >
            {t("detail.deleteEpisodeFile")}
          </Button>
        ) : null}
      </Animated.View>

      {toast ? (
        <View
          pointerEvents="none"
          style={[
            styles.toast,
            {
              backgroundColor: colors.surfaceRaised,
              bottom: scaledSpace.lg,
              borderRadius: 12,
              paddingHorizontal: scaledSpace.md,
              paddingVertical: scaledSpace.sm,
            },
          ]}
        >
          <Text role="caption">{toast}</Text>
        </View>
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
