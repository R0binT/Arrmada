import { HEALTH_FAILURES_BEFORE_UNREACHABLE } from "../constants";
import type {
  ArrServiceName,
  ArrServiceReachability,
  ConnectivityMachineState,
  OfflineConnectivityEvent,
  OfflineStatus,
} from "./types";

export const createInitialOfflineStatus = (): ConnectivityMachineState => ({
  device: "unknown",
  radarr: "unknown",
  sonarr: "unknown",
  radarrFailStreak: 0,
  sonarrFailStreak: 0,
});

export const toOfflineStatus = (
  state: ConnectivityMachineState,
): OfflineStatus => ({
  device: state.device,
  radarr: state.radarr,
  sonarr: state.sonarr,
});

const reachabilityAfterFailure = (
  failStreak: number,
): ArrServiceReachability =>
  failStreak >= HEALTH_FAILURES_BEFORE_UNREACHABLE
    ? "unreachable"
    : "unknown";

const reduceHealth = (
  prev: ConnectivityMachineState,
  service: ArrServiceName,
  ok: boolean,
): ConnectivityMachineState => {
  if (ok) {
    if (service === "radarr") {
      return { ...prev, radarr: "online", radarrFailStreak: 0 };
    }
    return { ...prev, sonarr: "online", sonarrFailStreak: 0 };
  }
  if (service === "radarr") {
    const radarrFailStreak = prev.radarrFailStreak + 1;
    return {
      ...prev,
      radarrFailStreak,
      radarr: reachabilityAfterFailure(radarrFailStreak),
    };
  }
  const sonarrFailStreak = prev.sonarrFailStreak + 1;
  return {
    ...prev,
    sonarrFailStreak,
    sonarr: reachabilityAfterFailure(sonarrFailStreak),
  };
};

export const reduceOfflineStatus = (
  prev: ConnectivityMachineState,
  event: OfflineConnectivityEvent,
): ConnectivityMachineState => {
  if (event.type === "netinfo") {
    return { ...prev, device: event.state };
  }
  return reduceHealth(prev, event.service, event.ok);
};

export const isArrServiceOnline = (
  status: OfflineStatus,
  service: ArrServiceName,
): boolean => status[service] === "online";

export const isDeviceOffline = (status: OfflineStatus): boolean =>
  status.device === "offline";
