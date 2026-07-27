import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Switch, View } from "react-native";
import Animated from "react-native-reanimated";

import type { Episode, Season } from "@/arr-client";
import {
  canOfferDownload,
  classifySeries,
  seasonNeedsDownload,
} from "@/arr-client";
import {
  AudioChoiceSheet,
  DetailImmersiveHeader,
  DetailLoadingSkeleton,
  ErrorBanner,
  IconButton,
  MediaMetaBlock,
  MediaQuickSheet,
  Screen,
} from "@/components";
import {
  confirmRetirer,
  deleteFilesForRetirerAction,
  type RetirerAction,
} from "@/features/library/retirer-action";
import {
  selectionFromEpisode,
  selectionFromSeason,
} from "@/features/media-quick/build-media-quick-selection";
import { useMediaQuickController } from "@/features/media-quick/use-media-quick-controller";
import type { AudioPreference } from "@/features/releases/resolve-release-decision";
import {
  finishPendingAudioChoice,
  smartGrabReleaseBatches,
  smartGrabReleases,
  type PendingAudioChoice,
} from "@/features/releases/smart-grab";
import {
  getErrorMessage,
  useDeleteSeries,
  useGrabSeriesRelease,
  useSeries,
  useSeriesDefaults,
  useSeriesSeasons,
  useUpdateSeriesMonitored,
} from "@/features/series/use-series";
import { openSettingsServices } from "@/features/settings/open-settings";
import { useArrClients } from "@/hooks/use-arr-clients";
import { availabilityChipTone } from "@/features/library/availability-chip-tone";
import { availabilityLabel, t } from "@/i18n";
import { colors } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";
import {
  Button,
  Chip,
  createFadeSlideUp,
  pressScaleStyle,
  Skeleton,
  Surface,
  Text,
  useReduceMotion,
} from "@/ui";

const seasonHeading = (seasonNumber: number): string =>
  seasonNumber === 0
    ? t("detail.specialEpisodes")
    : t("detail.seasonN", { n: seasonNumber });

const episodeHeading = (episode: Episode): string => {
  const numberLabel = `E${String(episode.episodeNumber).padStart(2, "0")}`;
  const title = episode.title.trim();
  return title.length > 0 ? `${numberLabel} · ${title}` : numberLabel;
};

const formatProfileLabel = (
  qualityProfileId: number | undefined,
  profiles: readonly { readonly id: number; readonly name: string }[],
): string | undefined => {
  if (qualityProfileId === undefined) return undefined;
  const match = profiles.find((profile) => profile.id === qualityProfileId);
  return match?.name ?? t("detail.profileFallback", { id: qualityProfileId });
};

const episodesNeedingDownload = (
  seasons: readonly Season[],
  seasonNumber?: number,
): Episode[] =>
  seasons
    .filter((season) =>
      seasonNumber === undefined ? true : season.seasonNumber === seasonNumber,
    )
    .flatMap((season) =>
      season.episodes.filter((episode) =>
        canOfferDownload(episode.availability),
      ),
    );

export default function SeriesDetailScreen() {
  const { space: scaledSpace } = useUiSize();
  const reduceMotion = useReduceMotion();
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const seriesId = Number(idParam);
  const { sonarr } = useArrClients();
  const seriesQuery = useSeries(seriesId);
  const seasonsQuery = useSeriesSeasons(seriesId);
  const defaultsQuery = useSeriesDefaults();
  const grabMutation = useGrabSeriesRelease();
  const monitoredMutation = useUpdateSeriesMonitored();
  const deleteMutation = useDeleteSeries();
  const quick = useMediaQuickController({
    shouldNavigate: (destination) => {
      if (
        typeof destination.href !== "string" &&
        destination.href.pathname === "/(tabs)/series/[id]" &&
        destination.href.params.id === String(seriesId)
      ) {
        return false;
      }
      return true;
    },
  });
  const [toast, setToast] = useState<string | undefined>();
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [pendingChoice, setPendingChoice] = useState<
    PendingAudioChoice | undefined
  >();
  const [expandedSeasons, setExpandedSeasons] = useState<ReadonlySet<number>>(
    () => new Set(),
  );

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(undefined), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const profileLabel = useMemo(
    () =>
      formatProfileLabel(
        seriesQuery.data?.qualityProfileId,
        defaultsQuery.data?.qualityProfiles ?? [],
      ),
    [defaultsQuery.data?.qualityProfiles, seriesQuery.data?.qualityProfileId],
  );

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleOpenSettings = useCallback(() => {
    openSettingsServices();
  }, []);

  const handleDownloadEpisodes = useCallback(
    async (episodes: readonly Episode[], emptyMessage: string) => {
      if (!sonarr) {
        setToast(t("detail.sonarrMissing"));
        return;
      }
      if (episodes.length === 0) {
        setToast(emptyMessage);
        return;
      }
      setDownloadBusy(true);
      try {
        const batches = await Promise.all(
          episodes.map((episode) => sonarr.getEpisodeReleases(episode.id)),
        );
        const outcome =
          batches.length === 1
            ? await smartGrabReleases(batches[0] ?? [], (release) =>
                grabMutation.mutateAsync(release),
              )
            : await smartGrabReleaseBatches(batches, (release) =>
                grabMutation.mutateAsync(release),
              );
        if (outcome.type === "empty") {
          setToast(t("detail.noRelease"));
          return;
        }
        if (outcome.type === "grabbed") {
          setToast(
            outcome.count > 1
              ? t("detail.downloadsStarted", { count: outcome.count })
              : t("detail.downloadStarted"),
          );
          return;
        }
        setPendingChoice(outcome.pending);
      } catch (error) {
        setToast(getErrorMessage(error));
      } finally {
        setDownloadBusy(false);
      }
    },
    [grabMutation, sonarr],
  );

  const handleDownloadSeries = useCallback(async () => {
    const episodes = episodesNeedingDownload(seasonsQuery.data ?? []);
    await handleDownloadEpisodes(episodes, t("detail.nothingToDownload"));
  }, [handleDownloadEpisodes, seasonsQuery.data]);

  const handleDownloadSeason = useCallback(
    async (seasonNumber: number) => {
      const episodes = episodesNeedingDownload(
        seasonsQuery.data ?? [],
        seasonNumber,
      );
      await handleDownloadEpisodes(
        episodes,
        t("detail.nothingToDownloadSeason"),
      );
    },
    [handleDownloadEpisodes, seasonsQuery.data],
  );

  const handleDownloadEpisode = useCallback(
    async (episodeId: number) => {
      const episode = (seasonsQuery.data ?? [])
        .flatMap((season) => season.episodes)
        .find((item) => item.id === episodeId);
      if (!episode) {
        setToast(t("detail.episodeMissing"));
        return;
      }
      await handleDownloadEpisodes([episode], t("detail.nothingToDownload"));
    },
    [handleDownloadEpisodes, seasonsQuery.data],
  );

  const handleAudioChoice = useCallback(
    async (preference: AudioPreference) => {
      if (!pendingChoice) return;
      const pending = pendingChoice;
      setPendingChoice(undefined);
      setDownloadBusy(true);
      try {
        const count = await finishPendingAudioChoice(
          pending,
          preference,
          (release) => grabMutation.mutateAsync(release),
        );
        setToast(
          count > 1
            ? t("detail.downloadsStarted", { count })
            : t("detail.downloadStarted"),
        );
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
          seriesId,
          monitored: nextMonitored,
        });
        setToast(nextMonitored ? t("detail.suiviOn") : t("detail.suiviOff"));
      } catch (error) {
        setToast(getErrorMessage(error));
      }
    },
    [monitoredMutation, seriesId],
  );

  const handleRetirerAction = useCallback(
    async (action: RetirerAction) => {
      try {
        await deleteMutation.mutateAsync({
          seriesId,
          deleteFiles: deleteFilesForRetirerAction(action),
        });
        router.replace("/(tabs)/series");
      } catch (error) {
        setToast(getErrorMessage(error));
      }
    },
    [deleteMutation, seriesId],
  );

  const handleRetirer = useCallback(() => {
    const title = seriesQuery.data?.title ?? t("detail.thisSeries");
    confirmRetirer(title, (action) => {
      void handleRetirerAction(action);
    });
  }, [handleRetirerAction, seriesQuery.data?.title]);

  const handleToggleSeason = useCallback((seasonNumber: number) => {
    setExpandedSeasons((current) => {
      const next = new Set(current);
      if (next.has(seasonNumber)) {
        next.delete(seasonNumber);
      } else {
        next.add(seasonNumber);
      }
      return next;
    });
  }, []);

  if (seriesQuery.isLoading) {
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

  const series = seriesQuery.data;
  const seriesAvailability = classifySeries(series);
  const statusLabel = availabilityLabel(seriesAvailability);
  const showSeriesDownload = canOfferDownload(seriesAvailability);
  const episodeSummary = t("detail.episodeProgress", {
    have: series.episodeFileCount,
    total: series.episodeCount,
  });
  const actionsBusy =
    downloadBusy ||
    grabMutation.isPending ||
    monitoredMutation.isPending ||
    deleteMutation.isPending;

  return (
    <Screen scroll>
      <DetailImmersiveHeader
        actions={
          showSeriesDownload ? (
            <Button
              accessibilityLabel={t("detail.downloadSeriesA11y")}
              disabled={actionsBusy}
              loading={downloadBusy}
              onPress={() => void handleDownloadSeries()}
              style={styles.fullWidthButton}
            >
              {downloadBusy ? t("action.searching") : t("action.download")}
            </Button>
          ) : null
        }
        backLabel={t("action.back")}
        meta={
          <View style={[styles.metaRow, { gap: scaledSpace.sm }]}>
            {series.year ? (
              <Text role="label" tone="muted">
                {series.year}
              </Text>
            ) : null}
            <Chip tone={availabilityChipTone(seriesAvailability)}>
              {statusLabel}
            </Chip>
          </View>
        }
        onBack={handleBack}
        posterUrl={series.posterUrl}
        subtitle={
          <View style={{ gap: scaledSpace.xs }}>
            <Text role="label" tone="muted">
              {episodeSummary}
            </Text>
            {profileLabel ? (
              <Text role="caption" tone="faint">
                {profileLabel}
              </Text>
            ) : null}
          </View>
        }
        title={series.title}
      />

      <Animated.View
        entering={createFadeSlideUp(reduceMotion, 0)}
        style={{ gap: scaledSpace.sm, marginBottom: scaledSpace.md }}
      >
        <MediaMetaBlock
          added={series.added}
          genres={series.genres}
          networkOrStudio={series.network}
          runtimeMinutes={series.runtimeMinutes}
        />
        {series.overview.trim().length > 0 ? (
          <Text role="body" tone="muted">
            {series.overview}
          </Text>
        ) : null}
      </Animated.View>

      <Animated.View
        entering={createFadeSlideUp(reduceMotion, 1)}
        style={[
          styles.seasonsSection,
          { gap: scaledSpace.sm, marginBottom: scaledSpace.xl },
        ]}
      >
        <Text role="headline">{t("detail.seasons")}</Text>
        {seasonsQuery.isLoading ? (
          <View style={{ gap: scaledSpace.sm }}>
            <Skeleton height={40} />
            <Skeleton height={40} />
          </View>
        ) : seasonsQuery.isError ? (
          <ErrorBanner
            message={getErrorMessage(seasonsQuery.error)}
            onRetry={() => void seasonsQuery.refetch()}
            onSettings={handleOpenSettings}
          />
        ) : (seasonsQuery.data?.length ?? 0) === 0 ? (
          <Text role="body" tone="muted">
            {t("detail.noEpisodesYet")}
          </Text>
        ) : (
          seasonsQuery.data?.map((season: Season) => {
            const isExpanded = expandedSeasons.has(season.seasonNumber);
            const heading = seasonHeading(season.seasonNumber);
            const showSeasonDownload = seasonNeedsDownload(season);
            const seasonBusy = downloadBusy;
            return (
              <Surface
                key={season.seasonNumber}
                radius="md"
                style={{ overflow: "hidden" }}
                tone="raised"
              >
                <View
                  style={[
                    styles.seasonHeaderRow,
                    {
                      gap: scaledSpace.xs,
                      paddingLeft: scaledSpace.sm,
                      paddingRight: scaledSpace.xs,
                      paddingVertical: scaledSpace.xs,
                    },
                  ]}
                >
                  <Pressable
                    accessibilityLabel={
                      isExpanded
                        ? t("detail.collapseA11y", { title: heading })
                        : t("detail.expandA11y", { title: heading })
                    }
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isExpanded }}
                    delayLongPress={350}
                    onLongPress={() =>
                      quick.toggle(selectionFromSeason(series, season))
                    }
                    onPress={() => handleToggleSeason(season.seasonNumber)}
                    style={({ pressed }) => [
                      styles.seasonHeader,
                      { gap: scaledSpace.sm },
                      pressScaleStyle(pressed, reduceMotion),
                    ]}
                  >
                    <Text role="label" style={{ flex: 1 }} numberOfLines={1}>
                      {heading}
                    </Text>
                    <Text role="caption" tone="muted">
                      {season.episodes.length === 1
                        ? t("detail.episodeCount", {
                            count: season.episodes.length,
                          })
                        : t("detail.episodeCountPlural", {
                            count: season.episodes.length,
                          })}
                    </Text>
                  </Pressable>
                  <View
                    style={[styles.seasonActions, { gap: scaledSpace["2xs"] }]}
                  >
                    {showSeasonDownload ? (
                      <Button
                        accessibilityLabel={t("detail.downloadNamedA11y", {
                          title: heading,
                        })}
                        disabled={actionsBusy}
                        loading={seasonBusy}
                        onPress={() =>
                          void handleDownloadSeason(season.seasonNumber)
                        }
                        size="compact"
                        variant="primary"
                      >
                        {seasonBusy ? "…" : t("action.download")}
                      </Button>
                    ) : null}
                    <IconButton
                      accessibilityLabel={
                        isExpanded
                          ? t("detail.collapseA11y", { title: heading })
                          : t("detail.expandA11y", { title: heading })
                      }
                      icon={isExpanded ? "▼" : "▶"}
                      onPress={() => handleToggleSeason(season.seasonNumber)}
                      size="compact"
                    />
                  </View>
                </View>
                {isExpanded
                  ? season.episodes.map((episode) => {
                      const episodeBusy = downloadBusy;
                      const showEpisodeDownload = canOfferDownload(
                        episode.availability,
                      );
                      return (
                        <View
                          key={episode.id}
                          style={[
                            styles.episodeRow,
                            {
                              borderTopColor: colors.borderSubtle,
                              gap: scaledSpace.sm,
                              paddingHorizontal: scaledSpace.sm,
                              paddingVertical: scaledSpace.xs,
                            },
                          ]}
                        >
                          <Pressable
                            accessibilityLabel={t("detail.detailsNamedA11y", {
                              title: episodeHeading(episode),
                            })}
                            accessibilityRole="button"
                            onPress={() =>
                              quick.toggle(
                                selectionFromEpisode(series, episode),
                              )
                            }
                            style={({ pressed }) => [
                              styles.episodeCopy,
                              { gap: scaledSpace.sm },
                              pressScaleStyle(pressed, reduceMotion),
                            ]}
                          >
                            <Text
                              numberOfLines={1}
                              role="caption"
                              style={styles.episodeTitle}
                            >
                              {episodeHeading(episode)}
                            </Text>
                            <Chip
                              tone={availabilityChipTone(episode.availability)}
                            >
                              {availabilityLabel(episode.availability)}
                            </Chip>
                          </Pressable>
                          {showEpisodeDownload ? (
                            <Button
                              accessibilityLabel={t(
                                "detail.downloadNamedA11y",
                                {
                                  title: episodeHeading(episode),
                                },
                              )}
                              disabled={actionsBusy}
                              loading={episodeBusy}
                              onPress={() =>
                                void handleDownloadEpisode(episode.id)
                              }
                              size="compact"
                              variant="primary"
                            >
                              {episodeBusy ? "…" : t("action.download")}
                            </Button>
                          ) : null}
                        </View>
                      );
                    })
                  : null}
              </Surface>
            );
          })
        )}
      </Animated.View>

      <Animated.View
        entering={createFadeSlideUp(reduceMotion, 2)}
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
                series.monitored
                  ? t("detail.disableSuivi")
                  : t("detail.enableSuivi")
              }
              accessibilityRole="switch"
              disabled={monitoredMutation.isPending || deleteMutation.isPending}
              onValueChange={(value) => void handleToggleSuivi(value)}
              trackColor={{ false: colors.surface, true: colors.accent }}
              value={series.monitored}
            />
          </View>
        </Surface>

        <Button
          accessibilityLabel={t("detail.removeSeriesA11y")}
          disabled={actionsBusy}
          loading={deleteMutation.isPending}
          onPress={handleRetirer}
          size="compact"
          style={styles.fullWidthButton}
          variant="danger"
        >
          {deleteMutation.isPending
            ? t("action.removing")
            : t("action.remove")}
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

      <AudioChoiceSheet
        onChooseVf={() => void handleAudioChoice("vf")}
        onChooseVo={() => void handleAudioChoice("vo")}
        onDismiss={() => setPendingChoice(undefined)}
        qualityName={pendingChoice?.qualityName ?? ""}
        visible={pendingChoice !== undefined}
      />

      <MediaQuickSheet {...quick.sheetProps} />
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
  seasonsSection: {},
  seasonHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  seasonHeader: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minWidth: 0,
  },
  seasonActions: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
  },
  episodeRow: {
    alignItems: "center",
    borderTopWidth: 1,
    flexDirection: "row",
  },
  episodeCopy: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    minWidth: 0,
  },
  episodeTitle: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  toast: {
    alignSelf: "center",
    position: "absolute",
  },
});
