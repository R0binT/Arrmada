import { Alert, Pressable, StyleSheet, View } from "react-native";

import { useI18n } from "@/i18n";
import { useUiSize } from "@/lib/UiSizeProvider";
import type { PendingSyncState } from "@/offline/optimistic/pending-sync-index";
import { getOutboxDispatcher } from "@/offline/outbox/get-dispatcher";
import { Chip } from "@/ui";

type PendingSyncBadgeProps = {
  readonly state: PendingSyncState;
  readonly outboxId: string | undefined;
};

export const presentFailedSyncAlert = (
  outboxId: string | undefined,
  labels: {
    readonly title: string;
    readonly retry: string;
    readonly cancel: string;
  },
): void => {
  Alert.alert(labels.title, undefined, [
    {
      text: labels.cancel,
      style: "destructive",
      onPress: () => {
        if (outboxId === undefined) {
          return;
        }
        void getOutboxDispatcher()?.cancel(outboxId);
      },
    },
    {
      text: labels.retry,
      onPress: () => {
        if (outboxId === undefined) {
          return;
        }
        void getOutboxDispatcher()?.retry(outboxId);
      },
    },
  ]);
};

/**
 * Compact poster overlay for queued or failed Arr sync.
 */
export const PendingSyncBadge = ({
  state,
  outboxId,
}: PendingSyncBadgeProps) => {
  const { t } = useI18n();
  const { space } = useUiSize();
  const label =
    state === "failed" ? t("offline.syncFailed") : t("offline.syncPending");
  const tone = state === "failed" ? "danger" : "warning";
  const handleFailedPress = (): void => {
    presentFailedSyncAlert(outboxId, {
      title: t("offline.syncFailed"),
      retry: t("action.retry"),
      cancel: t("action.cancel"),
    });
  };
  const chip = <Chip tone={tone}>{label}</Chip>;
  if (state !== "failed") {
    return (
      <View
        accessibilityLabel={label}
        pointerEvents="none"
        style={[styles.wrap, { right: space["2xs"], top: space["2xs"] }]}
      >
        {chip}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={8}
      onPress={handleFailedPress}
      style={[styles.wrap, { right: space["2xs"], top: space["2xs"] }]}
    >
      {chip}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    zIndex: 1,
  },
});
