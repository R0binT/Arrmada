import { useCallback, useState } from "react";
import { Alert } from "react-native";

import { useI18n } from "@/i18n";

import { checkAppUpdate } from "./check-app-update";
import { downloadAndInstallApk } from "./download-and-install-apk";

export type AppUpdateBusyPhase = "idle" | "checking" | "downloading";

export type UseAppUpdateResult = {
  readonly isBusy: boolean;
  readonly busyPhase: AppUpdateBusyPhase;
  readonly checkForUpdate: () => void;
};

export const useAppUpdate = (): UseAppUpdateResult => {
  const { t } = useI18n();
  const [busyPhase, setBusyPhase] = useState<AppUpdateBusyPhase>("idle");

  const checkForUpdate = useCallback(() => {
    if (busyPhase !== "idle") return;
    void (async () => {
      setBusyPhase("checking");
      try {
        const result = await checkAppUpdate();
        if (result.status === "upToDate") {
          Alert.alert(
            t("settings.updateTitle"),
            t("settings.updateUpToDate", { version: result.currentVersion }),
          );
          return;
        }
        if (result.status === "error") {
          Alert.alert(
            t("settings.updateTitle"),
            t("settings.updateErrorGeneric"),
          );
          return;
        }
        setBusyPhase("idle");
        Alert.alert(
          t("settings.updateTitle"),
          t("settings.updateAvailable", {
            latest: result.release.version,
            current: result.currentVersion,
          }),
          [
            { text: t("settings.updateCancel"), style: "cancel" },
            {
              text: t("settings.updateInstall"),
              onPress: () => {
                void (async () => {
                  setBusyPhase("downloading");
                  try {
                    const install = await downloadAndInstallApk({
                      apkUrl: result.release.apkUrl,
                      version: result.release.version,
                    });
                    if (install.ok) return;
                    Alert.alert(
                      t("settings.updateTitle"),
                      install.kind === "download"
                        ? t("settings.updateErrorDownload")
                        : t("settings.updateErrorInstall"),
                    );
                  } finally {
                    setBusyPhase("idle");
                  }
                })();
              },
            },
          ],
        );
      } finally {
        setBusyPhase((current) =>
          current === "checking" ? "idle" : current,
        );
      }
    })();
  }, [busyPhase, t]);

  return {
    isBusy: busyPhase !== "idle",
    busyPhase,
    checkForUpdate,
  };
};
