import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { openSettingsServices } from "@/features/settings/open-settings";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { canOfferDownload } from "@/arr-client";
import {
  AudioChoiceSheet,
  EmptyState,
  ErrorBanner,
  IconButton,
  MediaMetaBlock,
  Screen,
} from "@/components";
import type { AudioPreference } from "@/features/releases/resolve-release-decision";
import {
  finishPendingAudioChoice,
  smartGrabReleaseBatches,
  type PendingAudioChoice,
} from "@/features/releases/smart-grab";
import {
  getErrorMessage,
  useAddSeries,
  useGrabSeriesRelease,
  useSeriesCandidatePreview,
  useSeriesDefaults,
} from "@/features/series/use-series";
import { useArrClients } from "@/hooks/use-arr-clients";
import { useI18n } from "@/i18n";
import { colors, fonts, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

const parseTvdbId = (value: string | string[] | undefined): number => {
  const raw = Array.isArray(value) ? value[0] : value;
  return Number(raw);
};

export default function SeriesPreviewScreen() {
  const { t } = useI18n();
  const { fontSize, space: scaledSpace, minTouchTarget, scale } = useUiSize();
  const posterWidth = Math.round(120 * scale);
  const posterHeight = Math.round(180 * scale);
  const { tvdbId: tvdbIdParam } = useLocalSearchParams<{ tvdbId: string }>();
  const tvdbId = parseTvdbId(tvdbIdParam);
  const { sonarr } = useArrClients();
  const previewQuery = useSeriesCandidatePreview(tvdbId);
  const defaultsQuery = useSeriesDefaults();
  const addMutation = useAddSeries();
  const grabMutation = useGrabSeriesRelease();
  const [feedback, setFeedback] = useState<string | undefined>();
  const [pendingChoice, setPendingChoice] = useState<
    PendingAudioChoice | undefined
  >();

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(undefined), 3000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const candidate = previewQuery.data ?? undefined;
  const qualityProfileId = defaultsQuery.data?.defaultQualityProfileId;
  const rootFolderPath = defaultsQuery.data?.defaultRootFolderPath;

  const canAdd = useMemo(
    () =>
      Boolean(candidate) &&
      !candidate?.inLibrary &&
      qualityProfileId !== undefined &&
      rootFolderPath !== undefined &&
      !addMutation.isPending &&
      !defaultsQuery.isLoading,
    [
      addMutation.isPending,
      candidate,
      defaultsQuery.isLoading,
      qualityProfileId,
      rootFolderPath,
    ],
  );

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleOpenSettings = useCallback(() => {
    openSettingsServices();
  }, []);

  const handleOpenLibrary = useCallback(() => {
    if (candidate?.libraryId === undefined) return;
    router.push({
      pathname: "/(tabs)/series/[id]",
      params: { id: String(candidate.libraryId) },
    });
  }, [candidate]);

  const handleAudioChoice = useCallback(
    async (preference: AudioPreference) => {
      if (!pendingChoice) return;
      const pending = pendingChoice;
      setPendingChoice(undefined);
      try {
        await finishPendingAudioChoice(pending, preference, (release) =>
          grabMutation.mutateAsync(release),
        );
      } catch {
        // Add already succeeded; leave preview after dismiss.
      }
      router.back();
    },
    [grabMutation, pendingChoice],
  );

  const handleAdd = useCallback(async () => {
    if (
      !candidate ||
      candidate.inLibrary ||
      qualityProfileId === undefined ||
      !rootFolderPath
    ) {
      return;
    }

    try {
      const created = await addMutation.mutateAsync({
        tvdbId: candidate.tvdbId,
        qualityProfileId,
        rootFolderPath,
      });
      const createdId =
        typeof created === "object" &&
        created !== null &&
        "id" in created &&
        typeof (created as { id: unknown }).id === "number"
          ? (created as { id: number }).id
          : undefined;
      if (createdId && sonarr) {
        try {
          const seasons = await sonarr.getSeasons(createdId);
          const episodes = seasons.flatMap((season) =>
            season.episodes.filter((episode) =>
              canOfferDownload(episode.availability),
            ),
          );
          if (episodes.length > 0) {
            const batches = await Promise.all(
              episodes.map((episode) => sonarr.getEpisodeReleases(episode.id)),
            );
            const outcome = await smartGrabReleaseBatches(batches, (release) =>
              grabMutation.mutateAsync(release),
            );
            if (outcome.type === "choose") {
              setPendingChoice(outcome.pending);
              return;
            }
          }
        } catch {
          // Keep add success even if grab fails.
        }
      }
      router.back();
    } catch (error) {
      setFeedback(getErrorMessage(error));
    }
  }, [
    addMutation,
    candidate,
    grabMutation,
    qualityProfileId,
    rootFolderPath,
    sonarr,
  ]);

  if (previewQuery.isLoading) {
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

  if (previewQuery.isError) {
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
          message={getErrorMessage(previewQuery.error)}
          onRetry={() => void previewQuery.refetch()}
          onSettings={handleOpenSettings}
        />
      </Screen>
    );
  }

  if (!candidate) {
    return (
      <Screen>
        <View style={[styles.topBar, { marginBottom: scaledSpace.md }]}>
          <IconButton
            accessibilityLabel={t("action.back")}
            icon="←"
            onPress={handleBack}
          />
        </View>
        <EmptyState
          message={t("add.tryAnotherTitle")}
          title={t("add.noResults")}
        />
      </Screen>
    );
  }

  const isInLibrary =
    candidate.inLibrary && candidate.libraryId !== undefined;

  return (
    <Screen scroll>
      <View style={[styles.topBar, { marginBottom: scaledSpace.md }]}>
        <IconButton
          accessibilityLabel={t("action.back")}
          icon="←"
          onPress={handleBack}
        />
        <Text
          style={[
            styles.screenTitle,
            { fontSize: fontSize(18), marginHorizontal: scaledSpace.sm },
          ]}
        >
          {t("add.previewSeriesTitle")}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View
        style={[
          styles.hero,
          { gap: scaledSpace.md, marginBottom: scaledSpace.lg },
        ]}
      >
        {candidate.posterUrl ? (
          <Image
            accessibilityIgnoresInvertColors
            contentFit="cover"
            source={{ uri: candidate.posterUrl }}
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
              {candidate.title.slice(0, 1).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={[styles.heroCopy, { gap: scaledSpace.sm }]}>
          <Text style={[styles.movieTitle, { fontSize: fontSize(28) }]}>
            {candidate.title}
          </Text>
          <Text style={[styles.movieMeta, { fontSize: fontSize(15) }]}>
            {candidate.year}
          </Text>
        </View>
      </View>

      {candidate.overview.trim().length > 0 ? (
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
          {candidate.overview}
        </Text>
      ) : null}

      <MediaMetaBlock
        added={undefined}
        genres={candidate.genres}
        networkOrStudio={undefined}
        runtimeMinutes={candidate.runtimeMinutes}
      />

      {isInLibrary ? (
        <View style={{ gap: scaledSpace.sm, marginBottom: scaledSpace.lg }}>
          <Text style={[styles.hint, { fontSize: fontSize(14) }]}>
            {t("add.alreadyInLibraryHint")}
          </Text>
          <Pressable
            accessibilityLabel={t("add.seeFiche")}
            accessibilityRole="button"
            onPress={handleOpenLibrary}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                minHeight: minTouchTarget,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[styles.primaryButtonText, { fontSize: fontSize(16) }]}>
              {t("add.seeFiche")}
            </Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityLabel={t("action.addNamedA11y", {
            title: candidate.title,
          })}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canAdd }}
          disabled={!canAdd}
          onPress={() => void handleAdd()}
          style={({ pressed }) => [
            styles.primaryButton,
            {
              minHeight: minTouchTarget,
              marginBottom: scaledSpace.lg,
              opacity: !canAdd ? 0.5 : pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={[styles.primaryButtonText, { fontSize: fontSize(16) }]}>
            {addMutation.isPending ? t("action.adding") : t("action.add")}
          </Text>
        </Pressable>
      )}

      <AudioChoiceSheet
        onChooseVf={() => void handleAudioChoice("vf")}
        onChooseVo={() => void handleAudioChoice("vo")}
        onDismiss={() => {
          setPendingChoice(undefined);
          router.back();
        }}
        qualityName={pendingChoice?.qualityName ?? ""}
        visible={pendingChoice !== undefined}
      />

      {feedback ? (
        <View
          accessibilityLiveRegion="polite"
          style={[
            styles.toast,
            {
              bottom: scaledSpace.lg,
              paddingHorizontal: scaledSpace.md,
              paddingVertical: scaledSpace.sm,
            },
          ]}
        >
          <Text style={[styles.toastText, { fontSize: fontSize(14) }]}>
            {feedback}
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    alignItems: "center",
    flexDirection: "row",
  },
  screenTitle: {
    color: colors.text,
    flex: 1,
    fontFamily: fonts.display,
    textAlign: "center",
  },
  headerSpacer: {
    width: 44,
  },
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
  hint: {
    color: colors.secondary,
    fontFamily: fonts.ui,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    justifyContent: "center",
  },
  primaryButtonText: {
    color: colors.bg,
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
});
