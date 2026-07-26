import { useCallback } from "react";

import { resolvePrimaryDestination } from "@/features/media-quick/build-media-quick-view-model";
import { navigatePrimaryDestination } from "@/features/media-quick/navigate-primary";
import type {
    MediaQuickSelection,
    PrimaryDestination,
} from "@/features/media-quick/types";
import { useMediaQuickSelection } from "@/features/media-quick/use-media-quick-selection";

type UseMediaQuickControllerOptions = {
  /**
   * Return false to dismiss the sheet without navigating
   * (e.g. primary CTA would open the same Série detail already on screen).
   */
  readonly shouldNavigate?: (destination: PrimaryDestination) => boolean;
};

export const useMediaQuickController = (
  options?: UseMediaQuickControllerOptions,
) => {
  const quick = useMediaQuickSelection();
  const shouldNavigate = options?.shouldNavigate;

  const openPrimary = useCallback(
    (destination: PrimaryDestination) => {
      if (shouldNavigate?.(destination) === false) {
        quick.clear();
        return;
      }
      navigatePrimaryDestination(destination);
      quick.clear();
    },
    [quick.clear, shouldNavigate],
  );

  const openPrimaryFromSelection = useCallback(
    (selection: MediaQuickSelection) => {
      openPrimary(resolvePrimaryDestination(selection));
    },
    [openPrimary],
  );

  return {
    selected: quick.selected,
    toggle: quick.toggle,
    clear: quick.clear,
    openPrimary,
    openPrimaryFromSelection,
    sheetProps: {
      onDismiss: quick.clear,
      onOpenPrimary: openPrimary,
      selection: quick.selected,
    },
  };
};
