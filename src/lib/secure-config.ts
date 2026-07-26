import * as SecureStore from "expo-secure-store";

export type ArrConfig = {
  radarrUrl: string;
  radarrApiKey: string;
  sonarrUrl: string;
  sonarrApiKey: string;
};

const KEYS = {
  radarrUrl: "arr.radarrUrl",
  radarrApiKey: "arr.radarrApiKey",
  sonarrUrl: "arr.sonarrUrl",
  sonarrApiKey: "arr.sonarrApiKey",
} as const;

/** One-shot marker: env may seed credentials once; wipe does not re-seed. */
const ENV_BOOTSTRAPPED_KEY = "arr.envBootstrapped";

const CREDENTIAL_KEYS = [
  KEYS.radarrUrl,
  KEYS.radarrApiKey,
  KEYS.sonarrUrl,
  KEYS.sonarrApiKey,
] as const;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const trimUrl = (url: string): string => url.trim().replace(/\/+$/, "");

export const isConfigComplete = (
  config: Partial<ArrConfig>,
): config is ArrConfig =>
  isNonEmptyString(config.radarrUrl) &&
  isNonEmptyString(config.radarrApiKey) &&
  isNonEmptyString(config.sonarrUrl) &&
  isNonEmptyString(config.sonarrApiKey);

export const loadArrConfig = async (): Promise<Partial<ArrConfig>> => {
  const [radarrUrl, radarrApiKey, sonarrUrl, sonarrApiKey] = await Promise.all([
    SecureStore.getItemAsync(KEYS.radarrUrl),
    SecureStore.getItemAsync(KEYS.radarrApiKey),
    SecureStore.getItemAsync(KEYS.sonarrUrl),
    SecureStore.getItemAsync(KEYS.sonarrApiKey),
  ]);

  const config: Partial<ArrConfig> = {};
  if (radarrUrl) config.radarrUrl = radarrUrl;
  if (radarrApiKey) config.radarrApiKey = radarrApiKey;
  if (sonarrUrl) config.sonarrUrl = sonarrUrl;
  if (sonarrApiKey) config.sonarrApiKey = sonarrApiKey;
  return config;
};

export const saveArrConfig = async (config: ArrConfig): Promise<void> => {
  const trimmed: ArrConfig = {
    radarrUrl: trimUrl(config.radarrUrl),
    radarrApiKey: config.radarrApiKey.trim(),
    sonarrUrl: trimUrl(config.sonarrUrl),
    sonarrApiKey: config.sonarrApiKey.trim(),
  };

  await Promise.all([
    SecureStore.setItemAsync(KEYS.radarrUrl, trimmed.radarrUrl),
    SecureStore.setItemAsync(KEYS.radarrApiKey, trimmed.radarrApiKey),
    SecureStore.setItemAsync(KEYS.sonarrUrl, trimmed.sonarrUrl),
    SecureStore.setItemAsync(KEYS.sonarrApiKey, trimmed.sonarrApiKey),
  ]);
};

export const clearArrConfig = async (): Promise<void> => {
  // Intentionally does not clear arr.envBootstrapped — see markEnvBootstrapped.
  await Promise.all(
    CREDENTIAL_KEYS.map((key) => SecureStore.deleteItemAsync(key)),
  );
};

/** Whether optional EXPO_PUBLIC_* bootstrap already ran on this install. */
export const wasEnvBootstrapped = async (): Promise<boolean> => {
  const value = await SecureStore.getItemAsync(ENV_BOOTSTRAPPED_KEY);
  return value === "1";
};

/** Persist one-shot env bootstrap marker (survives clearArrConfig). */
export const markEnvBootstrapped = async (): Promise<void> => {
  await SecureStore.setItemAsync(ENV_BOOTSTRAPPED_KEY, "1");
};
