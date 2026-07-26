import { router } from "expo-router";

/** Open Settings hub (resets nested stack — do not use push). */
export const openSettingsHub = (): void => {
  router.dismissTo("/(tabs)/settings");
};

/** Open Services for connection / credential fixes. */
export const openSettingsServices = (): void => {
  router.dismissTo("/(tabs)/settings/services");
};
