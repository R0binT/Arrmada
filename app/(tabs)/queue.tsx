import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { openSettingsServices } from "@/features/settings/open-settings";
import type { QueueItem } from "@/arr-client";
import {
    EmptyState,
    ErrorBanner,
    QueueRow,
    QueueSkeleton,
    Screen,
} from "@/components";
import {
    getQueueErrorMessage,
    useQueue,
    useQueueMutations,
} from "@/features/queue/use-queue";
import { colors, fonts, space } from "@/lib/theme";
import { useI18n } from "@/i18n";

export default function QueueScreen() {
  const { t } = useI18n();
  const [isFocused, setIsFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, []),
  );

  const queueQuery = useQueue({ enabled: true, poll: isFocused });
  const mutations = useQueueMutations();
  const [toast, setToast] = useState<string | undefined>();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(undefined), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const activeCount = queueQuery.items.filter(
    (item) => item.status === "downloading" || item.status === "queued",
  ).length;

  const handleOpenMovies = useCallback(() => {
    // Use the tab root — `movies/index` can match the `[id]` route as id="index".
    router.navigate("/(tabs)/movies");
  }, []);

  const handleOpenSettings = useCallback(() => {
    openSettingsServices();
  }, []);

  const runMutation = useCallback(async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (error) {
      setToast(getQueueErrorMessage(error));
    }
  }, []);

  const handleRemove = useCallback(
    (item: QueueItem) => {
      void runMutation(() => mutations.remove.mutateAsync(item));
    },
    [mutations.remove, runMutation],
  );

  const handlePause = useCallback(
    (item: QueueItem) => {
      void runMutation(() => mutations.pause.mutateAsync(item));
    },
    [mutations.pause, runMutation],
  );

  if (queueQuery.isError) {
    return (
      <Screen>
        <View style={styles.header}>
          <Text style={styles.title}>{t("queue.title")}</Text>
          <Text style={styles.subtitle}>
            {t("queue.activeCount", { count: 0 })}
          </Text>
        </View>
        {queueQuery.radarrError ? (
          <View style={styles.bannerWrap}>
            <ErrorBanner
              message={t("queue.moviesError", {
                message: getQueueErrorMessage(queueQuery.radarrError),
              })}
              onRetry={() => queueQuery.refetchRadarr()}
              onSettings={handleOpenSettings}
            />
          </View>
        ) : null}
        {queueQuery.sonarrError ? (
          <View style={styles.bannerWrap}>
            <ErrorBanner
              message={t("queue.seriesError", {
                message: getQueueErrorMessage(queueQuery.sonarrError),
              })}
              onRetry={() => queueQuery.refetchSonarr()}
              onSettings={handleOpenSettings}
            />
          </View>
        ) : null}
        {!queueQuery.radarrError && !queueQuery.sonarrError ? (
          <ErrorBanner
            message={getQueueErrorMessage(queueQuery.error)}
            onRetry={() => queueQuery.refetch()}
            onSettings={handleOpenSettings}
          />
        ) : null}
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t("queue.title")}</Text>
        <Text style={styles.subtitle}>
          {t("queue.activeCount", { count: activeCount })}
        </Text>
      </View>

      {queueQuery.radarrError ? (
        <View style={styles.bannerWrap}>
          <ErrorBanner
            message={t("queue.moviesError", {
              message: getQueueErrorMessage(queueQuery.radarrError),
            })}
            onRetry={() => queueQuery.refetchRadarr()}
            onSettings={handleOpenSettings}
          />
        </View>
      ) : null}
      {queueQuery.sonarrError ? (
        <View style={styles.bannerWrap}>
          <ErrorBanner
            message={t("queue.seriesError", {
              message: getQueueErrorMessage(queueQuery.sonarrError),
            })}
            onRetry={() => queueQuery.refetchSonarr()}
            onSettings={handleOpenSettings}
          />
        </View>
      ) : null}

      {queueQuery.isLoading ? (
        <QueueSkeleton />
      ) : queueQuery.items.length === 0 ? (
        <EmptyState
          actionLabel={t("queue.seeMovies")}
          message={t("queue.emptyBody")}
          onAction={handleOpenMovies}
          title={t("queue.emptyTitle")}
        />
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={queueQuery.items}
          keyExtractor={(item) => `${item.service}-${item.id}`}
          renderItem={({ item }) => (
            <QueueRow
              item={item}
              onPause={item.canPause ? () => handlePause(item) : undefined}
              onRemove={() => handleRemove(item)}
            />
          )}
          showsVerticalScrollIndicator={false}
          style={styles.listContainer}
        />
      )}

      {toast ? (
        <View accessibilityLiveRegion="polite" style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: space.md,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 32,
  },
  subtitle: {
    color: colors.secondary,
    fontFamily: fonts.ui,
    fontSize: 15,
    marginTop: space.xs,
  },
  bannerWrap: {
    marginBottom: space.md,
  },
  listContainer: {
    flex: 1,
  },
  list: {
    gap: space.sm,
    paddingBottom: space.xl,
  },
  toast: {
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
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
});
