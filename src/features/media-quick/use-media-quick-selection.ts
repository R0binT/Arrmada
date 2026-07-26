import { useCallback, useState } from "react";

import type { MediaQuickSelection } from "@/features/media-quick/types";

export const useMediaQuickSelection = () => {
  const [selected, setSelected] = useState<MediaQuickSelection | undefined>();
  const toggle = useCallback((next: MediaQuickSelection) => {
    setSelected((current) => (current?.key === next.key ? undefined : next));
  }, []);
  const clear = useCallback(() => setSelected(undefined), []);
  return { selected, toggle, clear };
};
