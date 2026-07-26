import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createRadarrClient,
  createSonarrClient,
  type RadarrClient,
  type SonarrClient,
} from "@/arr-client";
import {
  isConfigComplete,
  loadArrConfig,
  type ArrConfig,
} from "@/lib/secure-config";

type UseArrClientsResult = {
  radarr?: RadarrClient;
  sonarr?: SonarrClient;
  config?: ArrConfig;
  refreshConfig: () => Promise<void>;
};

export const useArrClients = (): UseArrClientsResult => {
  const [config, setConfig] = useState<ArrConfig | undefined>();

  const refreshConfig = useCallback(async () => {
    const loaded = await loadArrConfig();
    setConfig(isConfigComplete(loaded) ? loaded : undefined);
  }, []);

  useEffect(() => {
    void refreshConfig();
  }, [refreshConfig]);

  const radarr = useMemo(
    () =>
      config
        ? createRadarrClient(config.radarrUrl, config.radarrApiKey)
        : undefined,
    [config?.radarrApiKey, config?.radarrUrl],
  );

  const sonarr = useMemo(
    () =>
      config
        ? createSonarrClient(config.sonarrUrl, config.sonarrApiKey)
        : undefined,
    [config?.sonarrApiKey, config?.sonarrUrl],
  );

  return { radarr, sonarr, config, refreshConfig };
};
