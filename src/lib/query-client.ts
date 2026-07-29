import { focusManager, QueryClient } from "@tanstack/react-query";
import { AppState, Platform, type AppStateStatus } from "react-native";

import { LIBRARY_STALE_TIME_MS } from "@/features/queue/queue-poll-policy";

export {
  LIBRARY_STALE_TIME_MS,
  QUEUE_BURST_MAX_MS,
  QUEUE_BURST_POLL_MS,
  QUEUE_POLL_MS,
  startQueueBurstPoll,
} from "@/features/queue/queue-poll-policy";

export const setupAppStateFocusManager = (): (() => void) => {
  if (Platform.OS === "web") {
    return () => undefined;
  }

  const onAppStateChange = (status: AppStateStatus): void => {
    focusManager.setFocused(status === "active");
  };

  focusManager.setFocused(AppState.currentState === "active");
  const subscription = AppState.addEventListener("change", onAppStateChange);
  return () => subscription.remove();
};

export const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: LIBRARY_STALE_TIME_MS,
      },
    },
  });

export const queryClient = createQueryClient();
