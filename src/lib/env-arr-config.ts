import {
  isConfigComplete,
  loadArrConfig,
  markEnvBootstrapped,
  saveArrConfig,
  wasEnvBootstrapped,
  type ArrConfig,
} from "@/lib/secure-config";

type PublicArrEnv = {
  readonly EXPO_PUBLIC_RADARR_URL?: string;
  readonly EXPO_PUBLIC_RADARR_API_KEY?: string;
  readonly EXPO_PUBLIC_SONARR_URL?: string;
  readonly EXPO_PUBLIC_SONARR_API_KEY?: string;
};

const trimEnv = (value: string | undefined): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

/** Pure reader — used by tests; production passes Metro-inlined env. */
export const readEnvArrConfigFrom = (
  env: PublicArrEnv,
): Partial<ArrConfig> => {
  const config: Partial<ArrConfig> = {};
  const radarrUrl = trimEnv(env.EXPO_PUBLIC_RADARR_URL);
  const radarrApiKey = trimEnv(env.EXPO_PUBLIC_RADARR_API_KEY);
  const sonarrUrl = trimEnv(env.EXPO_PUBLIC_SONARR_URL);
  const sonarrApiKey = trimEnv(env.EXPO_PUBLIC_SONARR_API_KEY);
  if (radarrUrl) config.radarrUrl = radarrUrl;
  if (radarrApiKey) config.radarrApiKey = radarrApiKey;
  if (sonarrUrl) config.sonarrUrl = sonarrUrl;
  if (sonarrApiKey) config.sonarrApiKey = sonarrApiKey;
  return config;
};

/**
 * Build-time defaults from Expo public env (inlined into the bundle).
 * Static `process.env.EXPO_PUBLIC_*` access is required — Metro only inlines
 * those; dynamic `process.env[name]` is empty in release APKs.
 */
export const readEnvArrConfig = (): Partial<ArrConfig> =>
  readEnvArrConfigFrom({
    EXPO_PUBLIC_RADARR_URL: process.env.EXPO_PUBLIC_RADARR_URL,
    EXPO_PUBLIC_RADARR_API_KEY: process.env.EXPO_PUBLIC_RADARR_API_KEY,
    EXPO_PUBLIC_SONARR_URL: process.env.EXPO_PUBLIC_SONARR_URL,
    EXPO_PUBLIC_SONARR_API_KEY: process.env.EXPO_PUBLIC_SONARR_API_KEY,
  });

/**
 * If Secure Store has no complete config but `.env` does, seed Secure Store once.
 * Never overwrites an existing complete store (Settings / prior onboarding win).
 * After a successful seed, never seeds again — even if the store is wiped later.
 */
export const ensureArrConfigBootstrapped = async (
  readEnv: () => Partial<ArrConfig> = readEnvArrConfig,
): Promise<ArrConfig | undefined> => {
  const stored = await loadArrConfig();
  if (isConfigComplete(stored)) {
    return stored;
  }
  if (await wasEnvBootstrapped()) {
    return undefined;
  }
  const fromEnv = readEnv();
  if (!isConfigComplete(fromEnv)) {
    return undefined;
  }
  await saveArrConfig(fromEnv);
  await markEnvBootstrapped();
  return fromEnv;
};
