import { Stack } from "expo-router";

import { colors } from "@/lib/theme";

export default function MoviesLayout() {
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        contentStyle: { backgroundColor: colors.bg },
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="add" />
      <Stack.Screen name="preview" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
