import Constants from "expo-constants";

export const getLocalAppVersion = (): string | null => {
  const native = Constants.nativeApplicationVersion?.trim();
  if (native) return native;
  const expo = Constants.expoConfig?.version?.trim();
  if (expo) return expo;
  return null;
};
