import {
  createRadarrClient,
  createSonarrClient,
  type ArrService,
  type ServiceHealth,
} from "@/arr-client";
import type { ArrConfig } from "@/lib/secure-config";

import { getConnectionErrorMessage } from "./connection-messages";

export type ConnectionTestResult = {
  readonly radarr: ServiceHealth;
  readonly sonarr: ServiceHealth;
};

const offlineHealth = (
  service: ArrService,
  message: string,
): ServiceHealth => ({
  service,
  online: false,
  version: undefined,
  message,
});

export const testServiceConnection = async (
  service: ArrService,
  url: string,
  apiKey: string,
): Promise<ServiceHealth> => {
  try {
    const client =
      service === "radarr"
        ? createRadarrClient(url, apiKey)
        : createSonarrClient(url, apiKey);
    return await client.getHealth();
  } catch (error) {
    return offlineHealth(service, getConnectionErrorMessage(service, error));
  }
};

export const testArrConnection = async (
  config: ArrConfig,
): Promise<ConnectionTestResult> => {
  const [radarr, sonarr] = await Promise.all([
    testServiceConnection("radarr", config.radarrUrl, config.radarrApiKey),
    testServiceConnection("sonarr", config.sonarrUrl, config.sonarrApiKey),
  ]);
  return { radarr, sonarr };
};
