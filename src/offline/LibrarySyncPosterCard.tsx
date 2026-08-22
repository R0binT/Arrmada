import { type ComponentProps } from "react";
import { View } from "react-native";

import { PosterCard } from "@/components/PosterCard";
import { useI18n } from "@/i18n";
import {
  PendingSyncBadge,
  presentFailedSyncAlert,
} from "@/offline/PendingSyncBadge";
import { useLibrarySyncBadge } from "@/offline/use-outbox-items";

type LibrarySyncPosterCardProps = ComponentProps<typeof PosterCard> & {
  readonly optimisticKey: string | undefined;
};

/**
 * Poster card with an optional pending/failed sync overlay.
 */
export const LibrarySyncPosterCard = ({
  optimisticKey,
  onPress,
  onLongPress,
  ...posterProps
}: LibrarySyncPosterCardProps) => {
  const { t } = useI18n();
  const badge = useLibrarySyncBadge(optimisticKey);
  const presentFailed = (): void => {
    presentFailedSyncAlert(badge?.outboxId, {
      title: t("offline.syncFailed"),
      retry: t("action.retry"),
      cancel: t("action.cancel"),
    });
  };
  const handlePress = (): void => {
    if (badge?.state === "failed") {
      presentFailed();
      return;
    }
    onPress();
  };
  const handleLongPress = (): void => {
    if (badge?.state === "failed") {
      presentFailed();
      return;
    }
    onLongPress?.();
  };
  return (
    <View>
      <PosterCard
        {...posterProps}
        onLongPress={onLongPress === undefined ? undefined : handleLongPress}
        onPress={handlePress}
      />
      {badge !== undefined ? (
        <PendingSyncBadge outboxId={badge.outboxId} state={badge.state} />
      ) : null}
    </View>
  );
};
