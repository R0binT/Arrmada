import { isDeviceOffline } from "./connectivity/reduce-offline-status";
import type {
  ArrServiceName,
  OfflineStatus,
} from "./connectivity/types";

export { isDeviceOffline };

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
