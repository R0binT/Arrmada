import { isRunningInExpoGo } from "expo";
import { Platform } from "react-native";

import { t } from "@/i18n";

const ANDROID_CHANNEL_ID = "telechargements";

/**
 * Expo Go on Android (SDK 53+) throws if `expo-notifications` is imported,
 * because remote push was removed. Skip the native module there so the rest
 * of the app stays testable in Expo Go. Use a development build for real Notifications.
 */
const areNotificationsUnavailable =
  Platform.OS === "android" && isRunningInExpoGo();

type NotificationsModule = typeof import("expo-notifications");

let notificationsModule: NotificationsModule | undefined;
let handlerConfigured = false;

const loadNotifications = async (): Promise<NotificationsModule | undefined> => {
  if (areNotificationsUnavailable) return undefined;
  if (notificationsModule) return notificationsModule;
  try {
    notificationsModule = await import("expo-notifications");
    return notificationsModule;
  } catch {
    return undefined;
  }
};

export const configureNotificationHandler = (): void => {
  if (handlerConfigured || areNotificationsUnavailable) return;
  handlerConfigured = true;
  void loadNotifications().then((Notifications) => {
    if (!Notifications) return;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  });
};

/**
 * Polite one-shot permission request. Never throws; denial degrades quietly.
 * Does not register for cloud push tokens.
 */
export const ensureNotificationPermission = async (): Promise<boolean> => {
  try {
    const Notifications = await loadNotifications();
    if (!Notifications) return false;

    configureNotificationHandler();

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: t("notif.channelName"),
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const current = await Notifications.getPermissionsAsync();
    if (
      current.granted ||
      current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    ) {
      return true;
    }

    if (!current.canAskAgain) {
      return false;
    }

    const requested = await Notifications.requestPermissionsAsync();
    return (
      requested.granted ||
      requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
};

export const presentLocalNotification = async (input: {
  readonly title: string;
  readonly body: string;
  readonly dedupeKey: string;
}): Promise<void> => {
  try {
    const Notifications = await loadNotifications();
    if (!Notifications) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: input.title,
        body: input.body,
        data: { dedupeKey: input.dedupeKey },
        ...(Platform.OS === "android"
          ? { channelId: ANDROID_CHANNEL_ID }
          : {}),
      },
      trigger: null,
      identifier: input.dedupeKey,
    });
  } catch {
    // Off-LAN / denied / Expo Go limits: fail quietly.
  }
};
