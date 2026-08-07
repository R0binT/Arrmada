import {
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
} from "@expo-google-fonts/figtree";
import { Fraunces_600SemiBold } from "@expo-google-fonts/fraunces";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useFonts } from "expo-font";
import { DarkTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import { UnlockOverlay } from "@/features/verrou/UnlockOverlay";
import { VerrouProvider } from "@/features/verrou/VerrouProvider";
import { I18nProvider } from "@/i18n";
import { queryClient, setupAppStateFocusManager } from "@/lib/query-client";
import { colors, fonts } from "@/lib/theme";
import { UiSizeProvider } from "@/lib/UiSizeProvider";
import { configureNotificationHandler } from "@/notifications/present";
import { useQueueNotifications } from "@/notifications/use-queue-notifications";
import { arrPersistOptions } from "@/offline/query-persister";

export const unstable_settings = {
  initialRouteName: "index",
};

const ArrDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
  },
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    [fonts.display]: Fraunces_600SemiBold,
    [fonts.ui]: Figtree_400Regular,
    [fonts.uiMedium]: Figtree_500Medium,
    [fonts.uiBold]: Figtree_600SemiBold,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => setupAppStateFocusManager(), []);

  if (!loaded) {
    return null;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={arrPersistOptions}
    >
      <I18nProvider>
        <UiSizeProvider>
          <VerrouProvider>
            <RootLayoutNav />
          </VerrouProvider>
        </UiSizeProvider>
      </I18nProvider>
    </PersistQueryClientProvider>
  );
}

function RootLayoutNav() {
  useEffect(() => {
    configureNotificationHandler();
  }, []);
  useQueueNotifications();

  return (
    <ThemeProvider value={ArrDarkTheme}>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <UnlockOverlay />
    </ThemeProvider>
  );
}
