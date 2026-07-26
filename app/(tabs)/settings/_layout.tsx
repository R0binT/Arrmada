import { Stack } from "expo-router";

import { colors } from "@/lib/theme";

export default function SettingsLayout() {
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        contentStyle: { backgroundColor: colors.bg },
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="services" />
      <Stack.Screen name="preferences" />
    </Stack>
  );
}
