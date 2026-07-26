import type { QueueStatus } from "@/arr-client";
import { t } from "@/i18n";

export const queueStatusLabel = (status: QueueStatus): string => {
  switch (status) {
    case "downloading":
      return t("queue.status.downloading");
    case "paused":
      return t("queue.status.paused");
    case "queued":
      return t("queue.status.queued");
    case "completed":
      return t("queue.status.completed");
    case "failed":
      return t("queue.status.failed");
    case "stalled":
      return t("queue.status.stalled");
    case "unknown":
      return t("queue.status.unknown");
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
};
