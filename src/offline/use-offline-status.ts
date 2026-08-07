import { useSyncExternalStore } from "react";

import {
  getOfflineStatus,
  subscribeOfflineStatus,
} from "./connectivity/offline-status-store";
import type { OfflineStatus } from "./connectivity/types";

export const useOfflineStatus = (): OfflineStatus =>
  useSyncExternalStore(subscribeOfflineStatus, getOfflineStatus, getOfflineStatus);
