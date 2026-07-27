import { openSettingsServices } from "@/features/settings/open-settings";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import {
  AudioChoiceSheet,
  EmptyState,
  ErrorBanner,
  IconButton,
  LookupStatusBadge,
  MediaQuickSheet,
  Screen,
} from "@/components";
import { getMovieLookupLibraryStatus } from "@/features/library/lookup-library-status";
import { buildMovieAddSelection } from "@/features/media-quick/build-add-candidate-selection";
import {
  getErrorMessage,
  useAddMovie,
  useGrabMovieRelease,
  useMovieDefaults,
  useMovieLookup,
  type MovieCandidate,
} from "@/features/movies/use-movies";
import type { AudioPreference } from "@/features/releases/resolve-release-decision";
import {
  finishPendingAudioChoice,
  smartGrabReleases,
  type PendingAudioChoice,
} from "@/features/releases/smart-grab";
import { useArrClients } from "@/hooks/use-arr-clients";
import { useI18n } from "@/i18n";
import { colors, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";
import {
  pressScaleStyle,
  Surface,
  Text,
  TextField,
  useReduceMotion,
} from "@/ui";

export default function AddMovieScreen() {
  const { t } = useI18n();
  const { space: scaledSpace, minTouchTarget, scale } = useUiSize();
  const reduceMotion = useReduceMotion();
  const posterWidth = Math.round(48 * scale);
  const posterHeight = Math.round(72 * scale);
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState<MovieCandidate | undefined>();
  const [feedback, setFeedback] = useState<string | undefined>();
  const [pendingChoice, setPendingChoice] = useState<
    PendingAudioChoice | undefined
  >();
  const { radarr } = useArrClients();

  const lookupQuery = useMovieLookup(term);
  const defaultsQuery = useMovieDefaults();
  const addMutation = useAddMovie();
  const grabMutation = useGrabMovieRelease();

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(undefined), 3000);
    return () => clearTimeout(timer);
  }, [feedback]);

  useFocusEffect(
    useCallback(() => {
      if (term.trim().length === 0) {
        return;
      }
      void lookupQuery.refetch();
    }, [lookupQuery.refetch, term]),
  );

  const qualityProfileId = defaultsQuery.data?.defaultQualityProfileId;
  const rootFolderPath = defaultsQuery.data?.defaultRootFolderPath;

  const canAdd = useMemo(
    () =>
      Boolean(selected) &&
      !selected?.inLibrary &&
      qualityProfileId !== undefined &&
      rootFolderPath !== undefined &&
      !addMutation.isPending &&
      !defaultsQuery.isLoading,
    [
      addMutation.isPending,
      defaultsQuery.isLoading,
      qualityProfileId,
      rootFolderPath,
      selected,
    ],
  );

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleOpenSettings = useCallback(() => {
    openSettingsServices();
  }, []);

  const handleAudioChoice = useCallback(
    async (preference: AudioPreference) => {
      if (!pendingChoice) return;
      const pending = pendingChoice;
      setPendingChoice(undefined);
      try {
        await finishPendingAudioChoice(pending, preference, (release) =>
          grabMutation.mutateAsync(release),
        );
        setFeedback(t("detail.downloadStarted"));
      } catch (error) {
        setFeedback(getErrorMessage(error));
      }
    },
    [grabMutation, pendingChoice, t],
  );

  const handleAdd = useCallback(async () => {
    if (
      !selected ||
      selected.inLibrary ||
      qualityProfileId === undefined ||
      !rootFolderPath
    ) {
      return;
    }

    try {
      const created = await addMutation.mutateAsync({
        tmdbId: selected.tmdbId,
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
      setFeedback(t("add.movieAdded", { title: selected.title }));
      setSelected(undefined);
      await lookupQuery.refetch();
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
          if (outcome.type === "grabbed") {
            setFeedback(t("detail.downloadStarted"));
          }
        } catch {
          // Keep add success even if grab fails.
        }
      }
    } catch (error) {
      setFeedback(getErrorMessage(error));
    }
  }, [
    addMutation,
    grabMutation,
    lookupQuery.refetch,
    qualityProfileId,
    radarr,
    rootFolderPath,
    selected,
    t,
  ]);

  const listHeader = (
    <>
      <View style={[styles.header, { marginBottom: scaledSpace.md }]}>
        <IconButton
          accessibilityLabel={t("action.back")}
          icon="←"
          onPress={handleBack}
        />
        <Text role="title" style={styles.headerTitle}>
          {t("add.movieTitle")}
        </Text>
        <View style={{ width: minTouchTarget }} />
      </View>

      <TextField
        accessibilityLabel={t("library.addMovieA11y")}
        autoCapitalize="none"
        onChangeText={setTerm}
        placeholder={t("add.searchPlaceholder")}
        style={{ marginBottom: scaledSpace.md }}
        value={term}
      />

      {defaultsQuery.isError ? (
        <ErrorBanner
          message={getErrorMessage(defaultsQuery.error)}
          onRetry={() => void defaultsQuery.refetch()}
          onSettings={handleOpenSettings}
        />
      ) : null}

      {defaultsQuery.isSuccess &&
      (qualityProfileId === undefined || rootFolderPath === undefined) ? (
        <ErrorBanner
          message={t("add.defaultsIncomplete")}
          onSettings={handleOpenSettings}
        />
      ) : null}

      {lookupQuery.isFetching ? (
        <View style={[styles.loading, { marginBottom: scaledSpace.sm }]}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : null}

      {term.trim().length >= 2 &&
      !lookupQuery.isFetching &&
      lookupQuery.data?.length === 0 ? (
        <EmptyState
          message={t("add.tryAnotherTitle")}
          title={t("add.noResults")}
        />
      ) : null}
    </>
  );

  return (
    <Screen>
      <FlatList
        contentContainerStyle={[
          styles.results,
          { gap: scaledSpace.sm, paddingBottom: scaledSpace.md },
        ]}
        data={lookupQuery.data ?? []}
        extraData={selected?.tmdbId}
        keyExtractor={(item) => String(item.tmdbId)}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={listHeader}
        renderItem={({ item }) => {
          const isSelected = selected?.tmdbId === item.tmdbId;
          const status = getMovieLookupLibraryStatus(item);
          const badgeLabel =
            status.badge === "alreadyDownloaded"
              ? t("add.alreadyDownloaded")
              : status.badge === "inLibrary"
                ? t("add.inLibrary")
                : undefined;
          return (
            <Pressable
              accessibilityLabel={`${item.title} (${item.year})${badgeLabel ? `, ${badgeLabel}` : ""}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => setSelected(item)}
              style={({ pressed }) => [
                pressScaleStyle(pressed, reduceMotion),
                styles.rowPressable,
              ]}
            >
              <Surface
                radius="md"
                style={[
                  styles.resultRow,
                  {
                    gap: scaledSpace.md,
                    minHeight: minTouchTarget,
                    padding: scaledSpace.sm,
                  },
                  isSelected ? styles.resultRowSelected : null,
                ]}
                tone="raised"
              >
                {item.posterUrl ? (
                  <Image
                    accessibilityIgnoresInvertColors
                    contentFit="cover"
                    source={{ uri: item.posterUrl }}
                    style={[
                      styles.resultPoster,
                      { height: posterHeight, width: posterWidth },
                    ]}
                  />
                ) : (
                  <View
                    style={[
                      styles.resultPoster,
                      styles.resultPosterPlaceholder,
                      { height: posterHeight, width: posterWidth },
                    ]}
                  >
                    <Text role="headline" tone="faint">
                      {item.title.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={[styles.resultCopy, { gap: scaledSpace.xs }]}>
                  <View style={styles.titleRow}>
                    <Text
                      numberOfLines={2}
                      role="headline"
                      style={styles.resultTitle}
                    >
                      {item.title}
                    </Text>
                    <Text role="caption" tone="muted">
                      {item.year}
                    </Text>
                  </View>
                  {status.badge !== "none" ? (
                    <LookupStatusBadge badge={status.badge} />
                  ) : null}
                </View>
              </Surface>
            </Pressable>
          );
        }}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />

      <MediaQuickSheet
        selection={
          selected ? buildMovieAddSelection(selected) : undefined
        }
        onDismiss={() => setSelected(undefined)}
        onOpenPrimary={() => {
          /* unused in add mode */
        }}
        addActions={
          selected
            ? {
                canAdd,
                onAdd: () => void handleAdd(),
                onSeeFiche: () => {
                  const candidate = selected;
                  setSelected(undefined);
                  if (candidate.libraryId !== undefined) {
                    router.push({
                      pathname: "/(tabs)/movies/[id]",
                      params: { id: String(candidate.libraryId) },
                    });
                    return;
                  }
                  router.push({
                    pathname: "/(tabs)/movies/preview",
                    params: { tmdbId: String(candidate.tmdbId) },
                  });
                },
              }
            : undefined
        }
      />

      {feedback ? (
        <Surface
          radius="md"
          style={[
            styles.toast,
            {
              bottom: scaledSpace.lg,
              paddingHorizontal: scaledSpace.lg,
              paddingVertical: scaledSpace.md,
            },
          ]}
          tone="elevated"
        >
          <View accessibilityLiveRegion="polite">
            <Text role="label">{feedback}</Text>
          </View>
        </Surface>
      ) : null}

      <AudioChoiceSheet
        onChooseVf={() => void handleAudioChoice("vf")}
        onChooseVo={() => void handleAudioChoice("vo")}
        onDismiss={() => {
          setPendingChoice(undefined);
        }}
        qualityName={pendingChoice?.qualityName ?? ""}
        visible={pendingChoice !== undefined}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  loading: {
    alignItems: "center",
  },
  results: {},
  rowPressable: {
    alignSelf: "stretch",
  },
  resultRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  resultRowSelected: {
    borderColor: colors.accent,
  },
  resultPoster: {
    borderRadius: radii.md,
  },
  resultPosterPlaceholder: {
    alignItems: "center",
    backgroundColor: colors.bg,
    justifyContent: "center",
  },
  resultCopy: {
    flex: 1,
  },
  titleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  resultTitle: {
    flex: 1,
  },
  toast: {
    alignSelf: "center",
    position: "absolute",
  },
});
