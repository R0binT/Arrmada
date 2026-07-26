import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";

import type { Episode, Season } from "@/arr-client";
import {
    canOfferDownload,
    classifySeries,
    seasonNeedsDownload,
} from "@/arr-client";
import {
    AudioChoiceSheet,
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
import { availabilityLabel, t } from "@/i18n";
import { colors, fonts, minTouchTarget, radii, space } from "@/lib/theme";

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

  if (seriesQuery.isError || !seriesQuery.data) {
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
      <View style={styles.topBar}>
        <IconButton
          accessibilityLabel={t("action.back")}
          icon="←"
          onPress={handleBack}
        />
      </View>

      <View style={styles.hero}>
        {series.posterUrl ? (
          <Image
            accessibilityIgnoresInvertColors
            contentFit="cover"
            source={{ uri: series.posterUrl }}
            style={styles.poster}
            transition={200}
          />
        ) : (
          <View style={[styles.poster, styles.posterPlaceholder]}>
            <Text style={styles.posterInitial}>
              {series.title.slice(0, 1).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.heroCopy}>
          <Text style={styles.seriesTitle}>{series.title}</Text>
          <Text style={styles.seriesMeta}>
            {series.year} · {statusLabel}
          </Text>
          <Text style={styles.episodeSummary}>{episodeSummary}</Text>
          {profileLabel ? (
            <Text style={styles.profileLabel}>{profileLabel}</Text>
          ) : null}
        </View>
      </View>

      <MediaMetaBlock
        added={series.added}
        genres={series.genres}
        networkOrStudio={series.network}
        runtimeMinutes={series.runtimeMinutes}
      />

      {series.overview.trim().length > 0 ? (
        <Text style={styles.overview}>{series.overview}</Text>
      ) : null}

      <View style={styles.suiviRow}>
        <Text style={styles.suiviLabel}>{t("detail.suivi")}</Text>
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

      <View style={styles.actions}>
        {showSeriesDownload ? (
          <Pressable
            accessibilityLabel={t("detail.downloadSeriesA11y")}
            accessibilityRole="button"
            disabled={actionsBusy}
            onPress={() => void handleDownloadSeries()}
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
          accessibilityLabel={t("detail.removeSeriesA11y")}
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
            {deleteMutation.isPending
              ? t("action.removing")
              : t("action.remove")}
          </Text>
        </Pressable>
      </View>

      <View style={styles.seasonsSection}>
        <Text style={styles.seasonsTitle}>{t("detail.seasons")}</Text>
        {seasonsQuery.isLoading ? (
          <ActivityIndicator color={colors.accent} />
        ) : seasonsQuery.isError ? (
          <ErrorBanner
            message={getErrorMessage(seasonsQuery.error)}
            onRetry={() => void seasonsQuery.refetch()}
            onSettings={handleOpenSettings}
          />
        ) : (seasonsQuery.data?.length ?? 0) === 0 ? (
          <Text style={styles.emptySeasons}>{t("detail.noEpisodesYet")}</Text>
        ) : (
          seasonsQuery.data?.map((season: Season) => {
            const isExpanded = expandedSeasons.has(season.seasonNumber);
            const heading = seasonHeading(season.seasonNumber);
            const showSeasonDownload = seasonNeedsDownload(season);
            const seasonBusy = downloadBusy;
            return (
              <View key={season.seasonNumber} style={styles.seasonBlock}>
                <View style={styles.seasonHeaderRow}>
                  <Pressable
                    accessibilityLabel={t("detail.seeDetailsA11y", {
                      title: heading,
                    })}
                    accessibilityRole="button"
                    onPress={() =>
                      quick.toggle(selectionFromSeason(series, season))
                    }
                    style={({ pressed }) => [
                      styles.seasonHeader,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Text style={styles.seasonHeaderTitle}>{heading}</Text>
                    <Text style={styles.seasonHeaderMeta}>
                      {season.episodes.length === 1
                        ? t("detail.episodeCount", {
                            count: season.episodes.length,
                          })
                        : t("detail.episodeCountPlural", {
                            count: season.episodes.length,
                          })}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={
                      isExpanded
                        ? t("detail.collapseA11y", { title: heading })
                        : t("detail.expandA11y", { title: heading })
                    }
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isExpanded }}
                    onPress={() => handleToggleSeason(season.seasonNumber)}
                    style={({ pressed }) => [
                      styles.seasonExpand,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Text style={styles.seasonHeaderMeta}>
                      {isExpanded ? "▼" : "▶"}
                    </Text>
                  </Pressable>
                  {showSeasonDownload ? (
                    <Pressable
                      accessibilityLabel={t("detail.downloadNamedA11y", {
                        title: heading,
                      })}
                      accessibilityRole="button"
                      disabled={actionsBusy}
                      onPress={() =>
                        void handleDownloadSeason(season.seasonNumber)
                      }
                      style={({ pressed }) => [
                        styles.inlineDownload,
                        pressed ? styles.pressed : null,
                        actionsBusy ? styles.disabled : null,
                      ]}
                    >
                      <Text style={styles.inlineDownloadText}>
                        {seasonBusy ? "…" : t("action.download")}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
                {isExpanded
                  ? season.episodes.map((episode) => {
                      const episodeBusy = downloadBusy;
                      const showEpisodeDownload = canOfferDownload(
                        episode.availability,
                      );
                      return (
                        <View key={episode.id} style={styles.episodeRow}>
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
                              pressed ? styles.pressed : null,
                            ]}
                          >
                            <Text style={styles.episodeTitle}>
                              {episodeHeading(episode)}
                            </Text>
                            <Text style={styles.episodeAvailability}>
                              {availabilityLabel(episode.availability)}
                            </Text>
                          </Pressable>
                          {showEpisodeDownload ? (
                            <Pressable
                              accessibilityLabel={t(
                                "detail.downloadNamedA11y",
                                {
                                  title: episodeHeading(episode),
                                },
                              )}
                              accessibilityRole="button"
                              disabled={actionsBusy}
                              onPress={() =>
                                void handleDownloadEpisode(episode.id)
                              }
                              style={({ pressed }) => [
                                styles.inlineDownload,
                                pressed ? styles.pressed : null,
                                actionsBusy ? styles.disabled : null,
                              ]}
                            >
                              <Text style={styles.inlineDownloadText}>
                                {episodeBusy ? "…" : t("action.download")}
                              </Text>
                            </Pressable>
                          ) : null}
                        </View>
                      );
                    })
                  : null}
              </View>
            );
          })
        )}
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

      <MediaQuickSheet {...quick.sheetProps} />
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
  seriesTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 28,
  },
  seriesMeta: {
    color: colors.secondary,
    fontFamily: fonts.uiMedium,
    fontSize: 15,
  },
  episodeSummary: {
    color: colors.text,
    fontFamily: fonts.ui,
    fontSize: 14,
  },
  profileLabel: {
    color: colors.text,
    fontFamily: fonts.uiMedium,
    fontSize: 14,
  },
  statusSummary: {
    color: colors.text,
    fontFamily: fonts.ui,
    fontSize: 14,
    textTransform: "capitalize",
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
    marginBottom: space.xl,
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
  seasonsSection: {
    gap: space.md,
    marginBottom: space.xl,
  },
  seasonsTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 22,
  },
  emptySeasons: {
    color: colors.secondary,
    fontFamily: fonts.ui,
    fontSize: 15,
  },
  seasonBlock: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  seasonHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.sm,
    paddingRight: space.sm,
  },
  seasonHeader: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: space.md,
    justifyContent: "space-between",
    minHeight: minTouchTarget,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  seasonExpand: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: minTouchTarget,
    minWidth: minTouchTarget,
  },
  seasonHeaderTitle: {
    color: colors.text,
    flex: 1,
    fontFamily: fonts.uiBold,
    fontSize: 16,
  },
  seasonHeaderMeta: {
    color: colors.secondary,
    fontFamily: fonts.ui,
    fontSize: 13,
  },
  episodeRow: {
    alignItems: "center",
    borderTopColor: colors.bg,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  episodeCopy: {
    flex: 1,
    gap: space.xs,
  },
  episodeTitle: {
    color: colors.text,
    fontFamily: fonts.uiMedium,
    fontSize: 14,
  },
  episodeAvailability: {
    color: colors.secondary,
    fontFamily: fonts.ui,
    fontSize: 13,
  },
  inlineDownload: {
    alignItems: "center",
    backgroundColor: colors.bg,
    borderRadius: radii.md,
    justifyContent: "center",
    minHeight: minTouchTarget,
    paddingHorizontal: space.sm,
  },
  inlineDownloadText: {
    color: colors.accent,
    fontFamily: fonts.uiBold,
    fontSize: 13,
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
