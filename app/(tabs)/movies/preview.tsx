import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { openSettingsServices } from "@/features/settings/open-settings";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";

import {
  AudioChoiceSheet,
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
  smartGrabReleases,
  type PendingAudioChoice,
} from "@/features/releases/smart-grab";
import { useArrClients } from "@/hooks/use-arr-clients";
import { useI18n } from "@/i18n";
import { colors, elevation, radii } from "@/lib/theme";
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
  const { space: scaledSpace, minTouchTarget, scale } = useUiSize();
  const reduceMotion = useReduceMotion();
  const posterWidth = Math.round(160 * scale);
  const posterHeight = Math.round(240 * scale);
  const { tmdbId: tmdbIdParam } = useLocalSearchParams<{ tmdbId: string }>();
  const tmdbId = parseTmdbId(tmdbIdParam);
  const { radarr } = useArrClients();
  const previewQuery = useMovieCandidatePreview(tmdbId);
  const defaultsQuery = useMovieDefaults();
  const addMutation = useAddMovie();
  const grabMutation = useGrabMovieRelease();
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
        try {
          const releases = await radarr.getMovieReleases(createdId);
          const outcome = await smartGrabReleases(releases, (release) =>
            grabMutation.mutateAsync(release),
          );
          if (outcome.type === "choose") {
            setPendingChoice(outcome.pending);
            return;
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
    radarr,
    rootFolderPath,
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
        <Text role="title" style={styles.screenTitle}>
          {t("add.previewMovieTitle")}
        </Text>
        <View style={{ width: minTouchTarget }} />
      </View>

      <Animated.View
        entering={createFadeIn(reduceMotion)}
        style={{ gap: scaledSpace.lg, marginBottom: scaledSpace.lg }}
      >
        <View style={[styles.posterHero, { gap: scaledSpace.md }]}>
          {candidate.posterUrl ? (
            <View
              style={[
                styles.posterFrame,
                elevation.mid,
                { height: posterHeight, width: posterWidth },
              ]}
            >
              <Image
                accessibilityIgnoresInvertColors
                contentFit="cover"
                source={{ uri: candidate.posterUrl }}
                style={styles.posterImage}
                transition={200}
              />
            </View>
          ) : (
            <View
              style={[
                styles.posterFrame,
                styles.posterPlaceholder,
                elevation.mid,
                { height: posterHeight, width: posterWidth },
              ]}
            >
              <Text role="display" tone="faint">
                {candidate.title.slice(0, 1).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={[styles.heroCopy, { gap: scaledSpace.xs }]}>
            <Text role="display" style={styles.heroTitle}>
              {candidate.title}
            </Text>
            <Text role="label" tone="muted">
              {candidate.year}
            </Text>
          </View>
        </View>

        <Surface padded tone="raised">
          {candidate.overview.trim().length > 0 ? (
            <Text
              role="body"
              tone="muted"
              style={{ marginBottom: scaledSpace.md }}
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
        </Surface>

        {isInLibrary ? (
          <View style={{ gap: scaledSpace.sm }}>
            <Text role="body" tone="muted">
              {t("add.alreadyInLibraryHint")}
            </Text>
            <Button
              accessibilityLabel={t("add.seeFiche")}
              onPress={handleOpenLibrary}
              style={styles.fullWidthButton}
            >
              {t("add.seeFiche")}
            </Button>
          </View>
        ) : (
          <Button
            accessibilityLabel={t("action.addNamedA11y", {
              title: candidate.title,
            })}
            disabled={!canAdd}
            loading={addMutation.isPending}
            onPress={() => void handleAdd()}
            style={styles.fullWidthButton}
          >
            {addMutation.isPending ? t("action.adding") : t("action.add")}
          </Button>
        )}
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

      {feedback ? (
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
  screenTitle: {
    flex: 1,
    textAlign: "center",
  },
  loading: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  posterHero: {
    alignItems: "center",
  },
  posterFrame: {
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  posterImage: {
    height: "100%",
    width: "100%",
  },
  posterPlaceholder: {
    alignItems: "center",
    backgroundColor: colors.surface,
    justifyContent: "center",
  },
  heroCopy: {
    alignItems: "center",
  },
  heroTitle: {
    textAlign: "center",
  },
  fullWidthButton: {
    alignSelf: "stretch",
  },
  toast: {
    alignSelf: "center",
    position: "absolute",
  },
});
