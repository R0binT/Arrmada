/**
 * Pure trim/empty → undefined for TMDB API key values.
 * Production uses Metro-inlined `process.env.EXPO_PUBLIC_TMDB_API_KEY` only —
 * static property access is required; dynamic `process.env[name]` is empty
 * in release APKs.
 */
export const resolveTmdbApiKey = (
  raw: string | undefined,
): string | undefined => {
  const trimmed = raw?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : undefined;
};

/** Build-time optional TMDB key from Expo public env (inlined into the bundle). */
export const readTmdbApiKeyFromProcessEnv = (): string | undefined =>
  resolveTmdbApiKey(process.env.EXPO_PUBLIC_TMDB_API_KEY);
