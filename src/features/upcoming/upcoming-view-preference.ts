import * as SecureStore from "expo-secure-store";

export type UpcomingViewMode = "list" | "calendar";

const KEY = "ui.upcomingView";

export const loadUpcomingViewMode = async (): Promise<UpcomingViewMode> => {
  const value = await SecureStore.getItemAsync(KEY);
  return value === "calendar" ? "calendar" : "list";
};

export const saveUpcomingViewMode = async (
  mode: UpcomingViewMode,
): Promise<void> => {
  await SecureStore.setItemAsync(KEY, mode);
};
