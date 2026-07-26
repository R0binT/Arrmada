import type {
  QueueNotificationEvent,
  QueueNotificationKind,
} from "./queue-notification-events";

import { t } from "@/i18n";

type NotificationCopy = {
  readonly title: string;
  readonly body: string;
};

const COPY_BY_KIND: Record<
  QueueNotificationKind,
  (title: string) => NotificationCopy
> = {
  started: (title) => ({
    title: t("notif.startedTitle"),
    body: t("notif.startedBody", { title }),
  }),
  dispo: (title) => ({
    title: t("notif.dispoTitle"),
    body: t("notif.dispoBody", { title }),
  }),
  failed: (title) => ({
    title: t("notif.failedTitle"),
    body: t("notif.failedBody", { title }),
  }),
};

/** Localized Notification titles/bodies for queue lifecycle events. */
export const formatQueueNotificationCopy = (
  event: QueueNotificationEvent,
): NotificationCopy => COPY_BY_KIND[event.kind](event.title);
