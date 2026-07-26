import {
  isConfigComplete,
  loadArrConfig,
  markEnvBootstrapped,
  saveArrConfig,
  wasEnvBootstrapped,
  type ArrConfig,
} from "@/lib/secure-config";

const ENV_KEYS = {
  radarrUrl: "EXPO_PUBLIC_RADARR_URL",
  radarrApiKey: "EXPO_PUBLIC_RADARR_API_KEY",
  sonarrUrl: "EXPO_PUBLIC_SONARR_URL",
  sonarrApiKey: "EXPO_PUBLIC_SONARR_API_KEY",
} as const;

const readOptionalEnv = (name: string): string | undefined => {
  // Dynamic key access so Expo/Metro does not inline EXPO_PUBLIC_* to undefined in tests.
  const value = process.env[name];
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

/** Build-time defaults from Expo public env (inlined into the bundle). */
export const readEnvArrConfig = (): Partial<ArrConfig> => {
  const config: Partial<ArrConfig> = {};
  const radarrUrl = readOptionalEnv(ENV_KEYS.radarrUrl);
  const radarrApiKey = readOptionalEnv(ENV_KEYS.radarrApiKey);
  const sonarrUrl = readOptionalEnv(ENV_KEYS.sonarrUrl);
  const sonarrApiKey = readOptionalEnv(ENV_KEYS.sonarrApiKey);
  if (radarrUrl) config.radarrUrl = radarrUrl;
  if (radarrApiKey) config.radarrApiKey = radarrApiKey;
  if (sonarrUrl) config.sonarrUrl = sonarrUrl;
  if (sonarrApiKey) config.sonarrApiKey = sonarrApiKey;
  return config;
};

/**
 * If Secure Store has no complete config but `.env` does, seed Secure Store once.
 * Never overwrites an existing complete store (Settings / prior onboarding win).
 * After a successful seed, never seeds again — even if the store is wiped later.
 */
export const ensureArrConfigBootstrapped = async (): Promise<
  ArrConfig | undefined
> => {
  const stored = await loadArrConfig();
  if (isConfigComplete(stored)) {
    return stored;
  }
  if (await wasEnvBootstrapped()) {
    return undefined;
  }
  const fromEnv = readEnvArrConfig();
  if (!isConfigComplete(fromEnv)) {
    return undefined;
  }
  await saveArrConfig(fromEnv);
  await markEnvBootstrapped();
  return fromEnv;
};
