import { Alert } from "react-native";

import { t } from "@/i18n";

/** User choice from the Retirer confirmation alert. */
export type RetirerAction = "listOnly" | "deleteFiles";

/**
 * Maps Retirer confirmation choice to Radarr/Sonarr `deleteFiles`.
 * List-only keeps files; delete-files removes them from disk.
 */
export const deleteFilesForRetirerAction = (action: RetirerAction): boolean =>
  action === "deleteFiles";

/** Shared Retirer confirmation used by Film and Série detail screens. */
export const confirmRetirer = (
  title: string,
  onAction: (action: RetirerAction) => void,
): void => {
  Alert.alert(t("retirer.title"), t("retirer.message", { title }), [
    { text: t("action.cancel"), style: "cancel" },
    {
      text: t("retirer.keepFiles"),
      onPress: () => onAction("listOnly"),
    },
    {
      text: t("retirer.deleteFiles"),
      style: "destructive",
      onPress: () => onAction("deleteFiles"),
    },
  ]);
};
