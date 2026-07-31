import { router, useLocalSearchParams } from "expo-router";
import { openSettingsServices } from "@/features/settings/open-settings";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";

import {
  AudioChoiceSheet,
  DetailImmersiveHeader,
  EmptyState,
  ErrorBanner,
  IconButton,
  MediaMetaBlock,
  Screen,
} from "@/components";
import {
  getErrorMessage,
  useAddMovie,
  useGrabMovieRelease,
  useMovieCandidatePreview,
  useMovieDefaults,
} from "@/features/movies/use-movies";
import type { AudioPreference } from "@/features/releases/resolve-release-decision";
import {
  finishPendingAudioChoice,
  type PendingAudioChoice,
} from "@/features/releases/smart-grab";
import { startMovieDownloadAfterAdd } from "@/features/releases/start-download-after-add";
import { useArrClients } from "@/hooks/use-arr-clients";
import { useI18n } from "@/i18n";
import { colors } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";
import {
  Button,
  createFadeIn,
  Surface,
  Text,
  useReduceMotion,
} from "@/ui";

const parseTmdbId = (value: string | string[] | undefined): number => {
  const raw = Array.isArray(value) ? value[0] : value;
  return Number(raw);
};

export default function MoviePreviewScreen() {
  const { t } = useI18n();
  const { space: scaledSpace } = useUiSize();
  const reduceMotion = useReduceMotion();
  const { tmdbId: tmdbIdParam } = useLocalSearchParams<{ tmdbId: string }>();
  const tmdbId = parseTmdbId(tmdbIdParam);
  const { radarr } = useArrClients();
  const previewQuery = useMovieCandidatePreview(tmdbId);
  const defaultsQuery = useMovieDefaults();
  const addMutation = useAddMovie();
  const grabMutation = useGrabMovieRelease();
  const [feedback, setFeedback] = useState<string | undefined>();
  const [searchBusy, setSearchBusy] = useState(false);
  const [pendingChoice, setPendingChoice] = useState<
    PendingAudioChoice | undefined
  >();

  useEffect(() => {
    if (!feedback || searchBusy) return;
    const timer = setTimeout(() => setFeedback(undefined), 4000);
    return () => clearTimeout(timer);
  }, [feedback, searchBusy]);

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
      !searchBusy &&
      !defaultsQuery.isLoading,
    [
      addMutation.isPending,
      candidate,
      defaultsQuery.isLoading,
      qualityProfileId,
      rootFolderPath,
      searchBusy,
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
      pathname: "/(tabs)/movies/[id]",
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
      setSearchBusy(true);
      setFeedback(t("action.adding"));
      const created = await addMutation.mutateAsync({
        tmdbId: candidate.tmdbId,
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
      if (createdId && radarr) {
        setFeedback(t("action.searching"));
        const outcome = await startMovieDownloadAfterAdd({
          movieId: createdId,
          getMovieReleases: (movieId) => radarr.getMovieReleases(movieId),
          moviesSearch: (movieId) =>
            radarr.command("MoviesSearch", { movieIds: [movieId] }),
          grab: (release) => grabMutation.mutateAsync(release),
        });
        if (outcome.type === "choose") {
          setPendingChoice(outcome.pending);
          setFeedback(undefined);
          return;
        }
        setFeedback(t("detail.downloadStarted"));
        setTimeout(() => router.back(), 1500);
        return;
      }
      router.back();
    } catch (error) {
      setFeedback(getErrorMessage(error));
    } finally {
      setSearchBusy(false);
    }
  }, [
    addMutation,
    candidate,
    grabMutation,
    qualityProfileId,
    radarr,
    rootFolderPath,
    t,
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
      <DetailImmersiveHeader
        actions={
          isInLibrary ? (
            <Button
              accessibilityLabel={t("add.seeFiche")}
              onPress={handleOpenLibrary}
              style={styles.fullWidthButton}
            >
              {t("add.seeFiche")}
            </Button>
          ) : (
            <Button
              accessibilityLabel={t("action.addNamedA11y", {
                title: candidate.title,
              })}
              disabled={!canAdd}
              loading={searchBusy}
              onPress={() => void handleAdd()}
              style={styles.fullWidthButton}
            >
              {addMutation.isPending
                ? t("action.adding")
                : searchBusy
                  ? t("action.searching")
                  : t("action.add")}
            </Button>
          )
        }
        backLabel={t("action.back")}
        meta={
          <Text role="label" tone="muted">
            {candidate.year}
          </Text>
        }
        onBack={handleBack}
        posterUrl={candidate.posterUrl}
        title={candidate.title}
      />

      <Animated.View
        entering={createFadeIn(reduceMotion)}
        style={{ gap: scaledSpace.md, marginBottom: scaledSpace.lg }}
      >
        <MediaMetaBlock
          added={undefined}
          genres={candidate.genres}
          networkOrStudio={undefined}
          runtimeMinutes={candidate.runtimeMinutes}
        />
        {candidate.overview.trim().length > 0 ? (
          <Text role="body" tone="muted">
            {candidate.overview}
          </Text>
        ) : null}
        {isInLibrary ? (
          <Text role="body" tone="muted">
            {t("add.alreadyInLibraryHint")}
          </Text>
        ) : null}
      </Animated.View>

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

      {feedback && !searchBusy ? (
        <Surface
          radius="md"
          style={[
            styles.toast,
            {
              bottom: scaledSpace.lg,
              paddingHorizontal: scaledSpace.md,
              paddingVertical: scaledSpace.sm,
            },
          ]}
          tone="elevated"
        >
          <View accessibilityLiveRegion="polite">
            <Text role="label">{feedback}</Text>
          </View>
        </Surface>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    alignItems: "center",
    flexDirection: "row",
  },
  loading: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  fullWidthButton: {
    alignSelf: "stretch",
  },
  toast: {
    alignSelf: "center",
    position: "absolute",
  },
});
