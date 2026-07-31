import { router, type Href } from "expo-router";

import type { PrimaryDestination } from "@/features/media-quick/types";

export const navigatePrimaryDestination = (
  destination: PrimaryDestination,
): void => {
  if (typeof destination.href === "string") {
    router.push(destination.href as Href);
    return;
  }
  router.push(destination.href as Href);
};
