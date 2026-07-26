import { useCallback } from "react";

import type { ArrService, ServiceHealth } from "@/arr-client";
import { useArrClients } from "@/hooks/use-arr-clients";
import type { ArrConfig } from "@/lib/secure-config";

import { getConnectionErrorMessage } from "./connection-messages";
import {
  testArrConnection,
  type ConnectionTestResult,
} from "./test-arr-connection";

export type { ConnectionTestResult };

const offlineHealth = (
  service: ArrService,
  message: string,
): ServiceHealth => ({
  service,
  online: false,
  version: undefined,
  message,
});

export const useConnectionTest = (): {
  testAll: (override?: ArrConfig) => Promise<ConnectionTestResult>;
} => {
  const { radarr, sonarr } = useArrClients();

  const testAll = useCallback(
    async (override?: ArrConfig): Promise<ConnectionTestResult> => {
      if (override) {
        return testArrConnection(override);
      }

      const [radarrHealth, sonarrHealth] = await Promise.all([
        radarr
          ? radarr.getHealth().catch((error) =>
              offlineHealth("radarr", getConnectionErrorMessage("radarr", error)),
            )
          : Promise.resolve(offlineHealth("radarr", "Not configured")),
        sonarr
          ? sonarr.getHealth().catch((error) =>
              offlineHealth("sonarr", getConnectionErrorMessage("sonarr", error)),
            )
          : Promise.resolve(offlineHealth("sonarr", "Not configured")),
      ]);

      return { radarr: radarrHealth, sonarr: sonarrHealth };
    },
    [radarr, sonarr],
  );

  return { testAll };
};
