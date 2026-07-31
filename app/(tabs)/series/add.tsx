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
import { getSeriesLookupLibraryStatus } from "@/features/library/lookup-library-status";
import { buildSeriesAddSelection } from "@/features/media-quick/build-add-candidate-selection";
import type { AudioPreference } from "@/features/releases/resolve-release-decision";
import {
  finishPendingAudioChoice,
  type PendingAudioChoice,
} from "@/features/releases/smart-grab";
import { startSeriesDownloadAfterAdd } from "@/features/releases/start-download-after-add";
import {
  getErrorMessage,
  useAddSeries,
  useGrabSeriesRelease,
  useSeriesDefaults,
  useSeriesLookup,
  type SeriesCandidate,
} from "@/features/series/use-series";
import { openSettingsServices } from "@/features/settings/open-settings";
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

export default function AddSeriesScreen() {
  const { t } = useI18n();
  const { space: scaledSpace, minTouchTarget, scale } = useUiSize();
  const reduceMotion = useReduceMotion();
  const posterWidth = Math.round(48 * scale);
  const posterHeight = Math.round(72 * scale);
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState<SeriesCandidate | undefined>();
  const [feedback, setFeedback] = useState<string | undefined>();
  const [searchBusy, setSearchBusy] = useState(false);
  const [pendingChoice, setPendingChoice] = useState<
    PendingAudioChoice | undefined
  >();
  const { sonarr } = useArrClients();

  const lookupQuery = useSeriesLookup(term);
  const defaultsQuery = useSeriesDefaults();
  const addMutation = useAddSeries();
  const grabMutation = useGrabSeriesRelease();

  useEffect(() => {
    if (!feedback || searchBusy) return;
    const timer = setTimeout(() => setFeedback(undefined), 4000);
    return () => clearTimeout(timer);
  }, [feedback, searchBusy]);

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
      !searchBusy &&
      !defaultsQuery.isLoading,
    [
      addMutation.isPending,
      defaultsQuery.isLoading,
      qualityProfileId,
      rootFolderPath,
      searchBusy,
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
      setSearchBusy(true);
      setFeedback(t("action.adding"));
      const created = await addMutation.mutateAsync({
        tvdbId: selected.tvdbId,
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
      await lookupQuery.refetch();
      if (createdId && sonarr) {
        setFeedback(t("action.searching"));
        await startSeriesDownloadAfterAdd({
          seriesId: createdId,
          seriesSearch: (seriesId) =>
            sonarr.command("SeriesSearch", { seriesId }),
        });
        setSelected(undefined);
        setFeedback(t("detail.downloadStarted"));
        return;
      }
      setSelected(undefined);
      setFeedback(t("detail.downloadStarted"));
    } catch (error) {
      setFeedback(getErrorMessage(error));
    } finally {
      setSearchBusy(false);
    }
  }, [
    addMutation,
    grabMutation,
    lookupQuery.refetch,
    qualityProfileId,
    rootFolderPath,
    selected,
    sonarr,
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
          {t("add.seriesTitle")}
        </Text>
        <View style={{ width: minTouchTarget }} />
      </View>

      <TextField
        accessibilityLabel={t("library.addSeriesA11y")}
        autoCapitalize="none"
        autoCorrect={false}
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
        extraData={selected?.tvdbId}
        keyExtractor={(item) => String(item.tvdbId)}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={listHeader}
        renderItem={({ item }) => {
          const isSelected = selected?.tvdbId === item.tvdbId;
          const status = getSeriesLookupLibraryStatus(item);
          const badgeLabel =
            status.badge === "alreadyDownloaded"
              ? t("add.alreadyDownloaded")
              : status.badge === "inLibrary"
                ? t("add.inLibrary")
                : undefined;
          const progressLabel = status.episodeProgress
            ? t("add.episodeProgress", {
                have: status.episodeProgress.have,
                total: status.episodeProgress.total,
              })
            : undefined;
          const statusParts = [badgeLabel, progressLabel].filter(Boolean);
          return (
            <Pressable
              accessibilityLabel={`${item.title} (${item.year})${statusParts.length > 0 ? `, ${statusParts.join(", ")}` : ""}`}
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
                  <View style={[styles.statusRow, { gap: scaledSpace.xs }]}>
                    {status.badge !== "none" ? (
                      <LookupStatusBadge badge={status.badge} />
                    ) : null}
                    {progressLabel ? (
                      <Text role="caption" tone="muted">
                        {progressLabel}
                      </Text>
                    ) : null}
                  </View>
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
          selected ? buildSeriesAddSelection(selected) : undefined
        }
        onDismiss={() => {
          if (searchBusy) return;
          setSelected(undefined);
        }}
        onOpenPrimary={() => {
          /* unused in add mode */
        }}
        addActions={
          selected
            ? {
                canAdd,
                loading: searchBusy,
                busyLabel: addMutation.isPending
                  ? t("action.adding")
                  : searchBusy
                    ? t("action.searching")
                    : undefined,
                onAdd: () => void handleAdd(),
                onSeeFiche: () => {
                  if (searchBusy) return;
                  const candidate = selected;
                  setSelected(undefined);
                  if (candidate.libraryId !== undefined) {
                    router.push({
                      pathname: "/(tabs)/series/[id]",
                      params: { id: String(candidate.libraryId) },
                    });
                    return;
                  }
                  router.push({
                    pathname: "/(tabs)/series/preview",
                    params: { tvdbId: String(candidate.tvdbId) },
                  });
                },
              }
            : undefined
        }
      />

      {feedback && !searchBusy ? (
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
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  toast: {
    alignSelf: "center",
    position: "absolute",
  },
});
