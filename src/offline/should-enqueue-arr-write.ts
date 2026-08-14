import { t } from "@/i18n";

import { isDeviceOffline } from "./connectivity/reduce-offline-status";
import type {
  ArrServiceName,
  OfflineStatus,
} from "./connectivity/types";

export { isDeviceOffline };

/**
 * TMDB search is allowed when the device has a network, even if Arr is down.
 */
export const assertCanUseTmdb = (status: OfflineStatus): boolean =>
  !isDeviceOffline(status);

/**
 * Refuses new Arr writes while the device has no network.
 * Do not call this from outbox flush — existing queued items may still run.
 */
export const assertCanMutateArr = (status: OfflineStatus): void => {
  if (isDeviceOffline(status)) {
    throw new Error(t("offline.deviceOffline"));
  }
};

/**
 * True when the device may reach the network but the Arr service is unreachable.
 * Device-offline is read-only: do not enqueue new writes.
 */
export const shouldEnqueueArrWrite = (
  status: OfflineStatus,
  service: ArrServiceName,
): boolean => {
  if (isDeviceOffline(status)) {
    return false;
  }
  return status[service] === "unreachable";
};
