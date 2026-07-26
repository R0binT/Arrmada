import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

import {
    DEFAULT_UI_SIZE,
    loadUiSize,
    resolveUiSizeScale,
    saveUiSize,
    scaledMinTouchTarget,
    scaleFontSize,
    scaleSpace,
    type ScaledSpace,
    type UiSizeId,
} from "@/lib/ui-size";

type UiSizeContextValue = {
  readonly size: UiSizeId;
  readonly scale: number;
  readonly isReady: boolean;
  readonly space: ScaledSpace;
  readonly minTouchTarget: number;
  readonly fontSize: (base: number) => number;
  readonly setSize: (size: UiSizeId) => Promise<void>;
};

const UiSizeContext = createContext<UiSizeContextValue | null>(null);

type UiSizeProviderProps = {
  readonly children: ReactNode;
};

export const UiSizeProvider = ({ children }: UiSizeProviderProps) => {
  const [size, setSizeState] = useState<UiSizeId>(DEFAULT_UI_SIZE);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadUiSize().then((stored) => {
      if (cancelled) {
        return;
      }
      setSizeState(stored);
      setIsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const scale = resolveUiSizeScale(size);

  const setSize = useCallback(async (next: UiSizeId) => {
    setSizeState(next);
    await saveUiSize(next);
  }, []);

  const value = useMemo<UiSizeContextValue>(
    () => ({
      size,
      scale,
      isReady,
      space: scaleSpace(scale),
      minTouchTarget: scaledMinTouchTarget(scale),
      fontSize: (base: number) => scaleFontSize(base, scale),
      setSize,
    }),
    [size, scale, isReady, setSize],
  );

  return (
    <UiSizeContext.Provider value={value}>
      {isReady ? children : null}
    </UiSizeContext.Provider>
  );
};

export const useUiSize = (): UiSizeContextValue => {
  const value = useContext(UiSizeContext);
  if (!value) {
    throw new Error("useUiSize must be used within UiSizeProvider");
  }
  return value;
};
