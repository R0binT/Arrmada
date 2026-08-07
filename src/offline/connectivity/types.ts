export type DeviceNetworkState = "online" | "offline" | "unknown";

export type ArrServiceReachability = "online" | "unreachable" | "unknown";

export type ArrServiceName = "radarr" | "sonarr";

export type OfflineStatus = {
  readonly device: DeviceNetworkState;
  readonly radarr: ArrServiceReachability;
  readonly sonarr: ArrServiceReachability;
};

export type ConnectivityMachineState = OfflineStatus & {
  readonly radarrFailStreak: number;
  readonly sonarrFailStreak: number;
};

export type OfflineNetInfoEvent = {
  readonly type: "netinfo";
  readonly state: DeviceNetworkState;
};

export type OfflineHealthEvent = {
  readonly type: "health";
  readonly service: ArrServiceName;
  readonly ok: boolean;
};

export type OfflineConnectivityEvent = OfflineNetInfoEvent | OfflineHealthEvent;
