import { openSettingsServices } from "@/features/settings/open-settings";
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

import {
    AudioChoiceSheet,
    EmptyState,
    ErrorBanner,
    IconButton,
    LookupStatusBadge,
    Screen,
} from "@/components";
import { getMovieLookupLibraryStatus } from "@/features/library/lookup-library-status";
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
import { colors, fonts, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

export default function AddMovieScreen() {
  const { t } = useI18n();
  const { fontSize, space: scaledSpace, minTouchTarget, scale } = useUiSize();
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
        <Text style={[styles.title, { fontSize: fontSize(24) }]}>
          {t("add.movieTitle")}
        </Text>
        <View style={[styles.headerSpacer, { width: minTouchTarget }]} />
      </View>

      <TextInput
        accessibilityLabel={t("library.addMovieA11y")}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={setTerm}
        placeholder={t("add.searchPlaceholder")}
        placeholderTextColor={colors.secondary}
        style={[
          styles.searchInput,
          {
            fontSize: fontSize(15),
            marginBottom: scaledSpace.md,
            minHeight: minTouchTarget,
            paddingHorizontal: scaledSpace.md,
          },
        ]}
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
        contentContainerStyle={[styles.results, { gap: scaledSpace.sm, paddingBottom: scaledSpace.md }]}
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
              onPress={() =>
                setSelected((current) =>
                  current?.tmdbId === item.tmdbId ? undefined : item,
                )
              }
              style={({ pressed }) => [
                styles.resultRow,
                {
                  gap: scaledSpace.md,
                  minHeight: minTouchTarget,
                  padding: scaledSpace.sm,
                },
                isSelected ? styles.resultRowSelected : null,
                pressed ? styles.pressed : null,
              ]}
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
                  <Text style={[styles.resultInitial, { fontSize: fontSize(20) }]}>
                    {item.title.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={[styles.resultCopy, { gap: scaledSpace.xs }]}>
                <Text style={[styles.resultTitle, { fontSize: fontSize(16) }]}>
                  {item.title}
                </Text>
                <Text style={[styles.resultYear, { fontSize: fontSize(14) }]}>
                  {item.year}
                </Text>
                {status.badge !== "none" ? (
                  <LookupStatusBadge badge={status.badge} />
                ) : null}
              </View>
            </Pressable>
          );
        }}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />

      {selected ? (
        <View
          style={[
            styles.confirmCard,
            {
              gap: scaledSpace.sm,
              marginTop: scaledSpace.md,
              padding: scaledSpace.md,
            },
          ]}
        >
          <Text style={[styles.confirmTitle, { fontSize: fontSize(16) }]}>
            {selected.title}
          </Text>
          <Text style={[styles.confirmHint, { fontSize: fontSize(13) }]}>
            {selected.inLibrary
              ? t("add.alreadyInLibraryHint")
              : t("add.defaultsHint")}
          </Text>
          <Pressable
            accessibilityLabel={t("action.addNamedA11y", {
              title: selected.title,
            })}
            accessibilityRole="button"
            disabled={!canAdd}
            onPress={() => void handleAdd()}
            style={({ pressed }) => [
              styles.addButton,
              { marginTop: scaledSpace.sm, minHeight: minTouchTarget },
              pressed ? styles.pressed : null,
              !canAdd ? styles.disabled : null,
            ]}
          >
            <Text style={[styles.addButtonText, { fontSize: fontSize(16) }]}>
              {addMutation.isPending ? t("action.adding") : t("action.add")}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {feedback ? (
        <View
          accessibilityLiveRegion="polite"
          style={[
            styles.toast,
            {
              bottom: scaledSpace.lg,
              paddingHorizontal: scaledSpace.lg,
              paddingVertical: scaledSpace.md,
            },
          ]}
        >
          <Text style={[styles.toastText, { fontSize: fontSize(14) }]}>
            {feedback}
          </Text>
        </View>
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
  title: {
    color: colors.text,
    flex: 1,
    fontFamily: fonts.display,
    textAlign: "center",
  },
  headerSpacer: {},
  searchInput: {
    backgroundColor: colors.surface,
    borderColor: "rgba(244, 240, 232, 0.08)",
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontFamily: fonts.ui,
  },
  loading: {
    alignItems: "center",
  },
  results: {},
  resultRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: "rgba(244, 240, 232, 0.08)",
    borderRadius: radii.md,
    borderWidth: 1,
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
  resultInitial: {
    color: colors.secondary,
    fontFamily: fonts.display,
  },
  resultCopy: {
    flex: 1,
  },
  resultTitle: {
    color: colors.text,
    fontFamily: fonts.uiMedium,
  },
  resultYear: {
    color: colors.secondary,
    fontFamily: fonts.ui,
  },
  confirmCard: {
    backgroundColor: colors.surface,
    borderColor: "rgba(244, 240, 232, 0.08)",
    borderRadius: radii.md,
    borderWidth: 1,
  },
  confirmTitle: {
    color: colors.text,
    fontFamily: fonts.uiBold,
  },
  confirmHint: {
    color: colors.secondary,
    fontFamily: fonts.ui,
  },
  addButton: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    justifyContent: "center",
  },
  addButtonText: {
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
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});
