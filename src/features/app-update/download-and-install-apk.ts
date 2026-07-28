import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";

import type { DownloadAndInstallResult } from "./types";

export const downloadAndInstallApk = async (input: {
  readonly apkUrl: string;
  readonly version: string;
}): Promise<DownloadAndInstallResult> => {
  const cacheDirectory = FileSystem.cacheDirectory;
  if (!cacheDirectory) {
    return { ok: false, kind: "download" };
  }
  const fileUri = `${cacheDirectory}Arrmada-${input.version}.apk`;
  try {
    const download = await FileSystem.downloadAsync(input.apkUrl, fileUri);
    if (download.status !== 200) {
      return { ok: false, kind: "download" };
    }
  } catch {
    return { ok: false, kind: "download" };
  }
  try {
    const contentUri = await FileSystem.getContentUriAsync(fileUri);
    await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
      data: contentUri,
      flags: 1,
      type: "application/vnd.android.package-archive",
    });
    return { ok: true };
  } catch {
    return { ok: false, kind: "install" };
  }
};
