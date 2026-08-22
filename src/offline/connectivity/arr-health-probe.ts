import type {
  ArrServiceName,
  DeviceNetworkState,
  OfflineConnectivityEvent,
  OfflineHealthEvent,
  OfflineStatus,
} from "./types";

export type ArrHealthProbeClient = {
  readonly getHealth: () => Promise<{ readonly online: boolean }>;
};

export type ProbeAndDispatchArrHealthInput = {
  readonly radarr?: ArrHealthProbeClient;
  readonly sonarr?: ArrHealthProbeClient;
  readonly getStatus: () => OfflineStatus;
  readonly dispatch: (event: OfflineConnectivityEvent) => OfflineStatus;
  readonly flush: (service: ArrServiceName) => Promise<void>;
};

const ARR_SERVICES: readonly ArrServiceName[] = ["radarr", "sonarr"];

/**
 * Maps NetInfo `isConnected` to a device network state.
 */
export const mapNetInfoConnected = (
  isConnected: boolean | null,
): DeviceNetworkState => {
  if (isConnected === false) {
    return "offline";
  }
  if (isConnected === true) {
    return "online";
  }
  return "unknown";
};

/**
 * Probes one Arr service. Missing client → no event. Errors → ok: false.
 */
export const probeArrHealth = async (
  service: ArrServiceName,
  client: ArrHealthProbeClient | undefined,
): Promise<OfflineHealthEvent | undefined> => {
  if (client === undefined) {
    return undefined;
  }
  try {
    const health = await client.getHealth();
    return { type: "health", service, ok: health.online };
  } catch {
    return { type: "health", service, ok: false };
  }
};

/**
 * Probes Arr health unless the device is offline, then flushes each service
 * that is currently online (including already-online, so due retries run).
 */
export const probeAndDispatchArrHealth = async (
  input: ProbeAndDispatchArrHealthInput,
): Promise<void> => {
  if (input.getStatus().device === "offline") {
    return;
  }
  for (const service of ARR_SERVICES) {
    const event = await probeArrHealth(service, input[service]);
    if (event === undefined) {
      continue;
    }
    const next = input.dispatch(event);
    if (next[service] === "online") {
      await input.flush(service);
    }
  }
};

/**
 * Flushes each Arr service that is currently online (foreground reconnect).
 */
export const flushOnlineServices = async (
  status: OfflineStatus,
  flush: (service: ArrServiceName) => Promise<void>,
): Promise<void> => {
  for (const service of ARR_SERVICES) {
    if (status[service] === "online") {
      await flush(service);
    }
  }
};
