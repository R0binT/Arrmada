import NetInfo from "@react-native-community/netinfo";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { useArrClients } from "@/hooks/use-arr-clients";
import {
  flushOnlineServices,
  mapNetInfoConnected,
  probeAndDispatchArrHealth,
} from "@/offline/connectivity/arr-health-probe";
import {
  dispatchOfflineEvent,
  getOfflineStatus,
} from "@/offline/connectivity/offline-status-store";
import { HEALTH_PROBE_INTERVAL_MS } from "@/offline/constants";
import { ensureOutboxDispatcher } from "@/offline/outbox/get-dispatcher";
import { loadOutbox } from "@/offline/outbox/storage";

/**
 * Subscribes to NetInfo and Arr health probes; flushes the outbox on reconnect.
 */
export const OfflineBootstrap = (): null => {
  const queryClient = useQueryClient();
  const { radarr, sonarr } = useArrClients();

  useEffect(() => {
    void loadOutbox();
    const dispatcher = ensureOutboxDispatcher({
      queryClient,
      radarr,
      sonarr,
    });
    const flush = (service: "radarr" | "sonarr"): Promise<void> =>
      dispatcher.flush(service);
    const runProbes = (): Promise<void> =>
      probeAndDispatchArrHealth({
        radarr,
        sonarr,
        getStatus: getOfflineStatus,
        dispatch: dispatchOfflineEvent,
        flush,
      });
    const runForeground = async (): Promise<void> => {
      await runProbes();
      await flushOnlineServices(getOfflineStatus(), flush);
    };

    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const nextDevice = mapNetInfoConnected(state.isConnected);
      const previousDevice = getOfflineStatus().device;
      dispatchOfflineEvent({ type: "netinfo", state: nextDevice });
      if (nextDevice === "online" && previousDevice !== "online") {
        void runProbes();
      }
    });

    const onAppStateChange = (status: AppStateStatus): void => {
      if (status !== "active") {
        return;
      }
      void runForeground();
    };

    const appSubscription = AppState.addEventListener(
      "change",
      onAppStateChange,
    );
    if (AppState.currentState === "active") {
      void runForeground();
    }
    const intervalId = setInterval(() => {
      if (AppState.currentState !== "active") {
        return;
      }
      void runProbes();
    }, HEALTH_PROBE_INTERVAL_MS);

    return () => {
      unsubscribeNetInfo();
      appSubscription.remove();
      clearInterval(intervalId);
    };
  }, [queryClient, radarr, sonarr]);

  return null;
};
