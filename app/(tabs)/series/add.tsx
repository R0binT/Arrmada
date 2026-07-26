import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { canOfferDownload } from "@/arr-client";
import {
    AudioChoiceSheet,
    EmptyState,
    ErrorBanner,
    IconButton,
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
    useSeriesDefaults,
    useSeriesLookup,
    type SeriesCandidate,
} from "@/features/series/use-series";
import { openSettingsServices } from "@/features/settings/open-settings";
import { useArrClients } from "@/hooks/use-arr-clients";
import { useI18n } from "@/i18n";
import { colors, fonts, minTouchTarget, radii, space } from "@/lib/theme";

export default function AddSeriesScreen() {
  const { t } = useI18n();
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState<SeriesCandidate | undefined>();
  const [feedback, setFeedback] = useState<string | undefined>();
  const [pendingChoice, setPendingChoice] = useState<
    PendingAudioChoice | undefined
  >();
  const { sonarr } = useArrClients();

  const lookupQuery = useSeriesLookup(term);
  const defaultsQuery = useSeriesDefaults();
  const addMutation = useAddSeries();
  const grabMutation = useGrabSeriesRelease();

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(undefined), 3000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const qualityProfileId = defaultsQuery.data?.defaultQualityProfileId;
  const rootFolderPath = defaultsQuery.data?.defaultRootFolderPath;

  const canAdd = useMemo(
    () =>
      Boolean(selected) &&
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
        setTimeout(() => router.back(), 600);
      } catch (error) {
        setFeedback(getErrorMessage(error));
      }
    },
    [grabMutation, pendingChoice],
  );

  const handleAdd = useCallback(async () => {
    if (!selected || qualityProfileId === undefined || !rootFolderPath) return;

    try {
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
      setFeedback(t("add.seriesAdded", { title: selected.title }));
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
            if (outcome.type === "grabbed") {
              setFeedback(t("detail.downloadStarted"));
            }
          }
        } catch {
          // Keep add success even if grab fails.
        }
      }
      setTimeout(() => router.back(), 600);
    } catch (error) {
      setFeedback(getErrorMessage(error));
    }
  }, [
    addMutation,
    grabMutation,
    qualityProfileId,
    rootFolderPath,
    selected,
    sonarr,
  ]);

  const listHeader = (
    <>
      <View style={styles.header}>
        <IconButton
          accessibilityLabel={t("action.back")}
          icon="←"
          onPress={handleBack}
        />
        <Text style={styles.title}>{t("add.seriesTitle")}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <TextInput
        accessibilityLabel={t("library.addSeriesA11y")}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={setTerm}
        placeholder={t("add.searchPlaceholder")}
        placeholderTextColor={colors.secondary}
        style={styles.searchInput}
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
        <View style={styles.loading}>
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
        contentContainerStyle={styles.results}
        data={lookupQuery.data ?? []}
        extraData={selected?.tvdbId}
        keyExtractor={(item) => String(item.tvdbId)}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={listHeader}
        renderItem={({ item }) => {
          const isSelected = selected?.tvdbId === item.tvdbId;
          return (
            <Pressable
              accessibilityLabel={`${item.title} (${item.year})`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() =>
                setSelected((current) =>
                  current?.tvdbId === item.tvdbId ? undefined : item,
                )
              }
              style={({ pressed }) => [
                styles.resultRow,
                isSelected ? styles.resultRowSelected : null,
                pressed ? styles.pressed : null,
              ]}
            >
              {item.posterUrl ? (
                <Image
                  accessibilityIgnoresInvertColors
                  contentFit="cover"
                  source={{ uri: item.posterUrl }}
                  style={styles.resultPoster}
                />
              ) : (
                <View
                  style={[styles.resultPoster, styles.resultPosterPlaceholder]}
                >
                  <Text style={styles.resultInitial}>
                    {item.title.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.resultCopy}>
                <Text style={styles.resultTitle}>{item.title}</Text>
                <Text style={styles.resultYear}>{item.year}</Text>
              </View>
            </Pressable>
          );
        }}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />

      {selected ? (
        <View style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>{selected.title}</Text>
          <Text style={styles.confirmHint}>{t("add.defaultsHint")}</Text>
          <Pressable
            accessibilityLabel={t("action.addNamedA11y", {
              title: selected.title,
            })}
            accessibilityRole="button"
            disabled={!canAdd}
            onPress={() => void handleAdd()}
            style={({ pressed }) => [
              styles.addButton,
              pressed ? styles.pressed : null,
              !canAdd ? styles.disabled : null,
            ]}
          >
            <Text style={styles.addButtonText}>
              {addMutation.isPending ? t("action.adding") : t("action.add")}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {feedback ? (
        <View accessibilityLiveRegion="polite" style={styles.toast}>
          <Text style={styles.toastText}>{feedback}</Text>
        </View>
      ) : null}

      <AudioChoiceSheet
        onChooseVf={() => void handleAudioChoice("vf")}
        onChooseVo={() => void handleAudioChoice("vo")}
        onDismiss={() => {
          setPendingChoice(undefined);
          setTimeout(() => router.back(), 300);
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
    marginBottom: space.md,
  },
  title: {
    color: colors.text,
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 24,
    textAlign: "center",
  },
  headerSpacer: {
    width: minTouchTarget,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderColor: "rgba(244, 240, 232, 0.08)",
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontFamily: fonts.ui,
    fontSize: 15,
    marginBottom: space.md,
    minHeight: minTouchTarget,
    paddingHorizontal: space.md,
  },
  loading: {
    alignItems: "center",
    marginBottom: space.sm,
  },
  results: {
    gap: space.sm,
    paddingBottom: space.md,
  },
  resultRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: "rgba(244, 240, 232, 0.08)",
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: space.md,
    minHeight: minTouchTarget,
    padding: space.sm,
  },
  resultRowSelected: {
    borderColor: colors.accent,
  },
  resultPoster: {
    borderRadius: radii.md,
    height: 72,
    width: 48,
  },
  resultPosterPlaceholder: {
    alignItems: "center",
    backgroundColor: colors.bg,
    justifyContent: "center",
  },
  resultInitial: {
    color: colors.secondary,
    fontFamily: fonts.display,
    fontSize: 20,
  },
  resultCopy: {
    flex: 1,
    gap: space.xs,
  },
  resultTitle: {
    color: colors.text,
    fontFamily: fonts.uiMedium,
    fontSize: 16,
  },
  resultYear: {
    color: colors.secondary,
    fontFamily: fonts.ui,
    fontSize: 14,
  },
  confirmCard: {
    backgroundColor: colors.surface,
    borderColor: "rgba(244, 240, 232, 0.08)",
    borderRadius: radii.md,
    borderWidth: 1,
    gap: space.sm,
    marginTop: space.md,
    padding: space.md,
  },
  confirmTitle: {
    color: colors.text,
    fontFamily: fonts.uiBold,
    fontSize: 16,
  },
  confirmHint: {
    color: colors.secondary,
    fontFamily: fonts.ui,
    fontSize: 13,
  },
  addButton: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    marginTop: space.sm,
    minHeight: minTouchTarget,
    justifyContent: "center",
  },
  addButtonText: {
    color: colors.bg,
    fontFamily: fonts.uiBold,
    fontSize: 16,
  },
  toast: {
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    bottom: space.lg,
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
