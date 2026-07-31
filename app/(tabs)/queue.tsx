import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";

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
import { openSettingsServices } from "@/features/settings/open-settings";
import { useI18n } from "@/i18n";
import { queryKeys } from "@/lib/query-keys";
import { useUiSize } from "@/lib/UiSizeProvider";
import { createFadeSlideUp, Surface, Text, useReduceMotion } from "@/ui";
import { useQueryClient } from "@tanstack/react-query";

export default function QueueScreen() {
  const { t } = useI18n();
  const { space: scaledSpace } = useUiSize();
  const reduceMotion = useReduceMotion();
  const queryClient = useQueryClient();
  const [isFocused, setIsFocused] = useState(false);
  const queueQuery = useQueue({ enabled: true, poll: isFocused });
  const mutations = useQueueMutations();
  const [toast, setToast] = useState<string | undefined>();

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      void queryClient.invalidateQueries({ queryKey: queryKeys.queue.all });
      return () => setIsFocused(false);
    }, [queryClient]),
  );

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(undefined), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const activeCount = queueQuery.items.filter(
    (item) => item.status === "downloading" || item.status === "queued",
  ).length;

  const handleOpenMovies = useCallback(() => {
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

  const renderHeader = () => (
    <View style={{ marginBottom: scaledSpace.md }}>
      <Text role="title">{t("queue.title")}</Text>
      <Text role="body" style={{ marginTop: scaledSpace.xs }} tone="muted">
        {t("queue.activeCount", { count: activeCount })}
      </Text>
    </View>
  );

  if (queueQuery.isError) {
    return (
      <Screen>
        {renderHeader()}
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
      {renderHeader()}

      {queueQuery.radarrError ? (
        <View style={{ marginBottom: scaledSpace.md }}>
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
        <View style={{ marginBottom: scaledSpace.md }}>
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
          contentContainerStyle={[
            styles.list,
            { gap: scaledSpace.sm, paddingBottom: scaledSpace.xl },
          ]}
          data={queueQuery.items}
          keyExtractor={(item) => `${item.service}-${item.id}`}
          renderItem={({ item, index }) => (
            <Animated.View entering={createFadeSlideUp(reduceMotion, index)}>
              <QueueRow
                item={item}
                onPause={item.canPause ? () => handlePause(item) : undefined}
                onRemove={() => handleRemove(item)}
              />
            </Animated.View>
          )}
          showsVerticalScrollIndicator={false}
          style={styles.listContainer}
        />
      )}

      {toast ? (
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
            <Text role="label">{toast}</Text>
          </View>
        </Surface>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  bannerWrap: {},
  listContainer: {
    flex: 1,
  },
  list: {},
  toast: {
    alignSelf: "center",
    position: "absolute",
  },
});
