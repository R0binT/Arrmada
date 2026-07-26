import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AppState, type AppStateStatus } from "react-native";

import {
  authenticateWithBiometrics,
  canUseBiometrics,
  disableVerrou,
  enableVerrou,
  isVerrouEnabled,
  verifyPin,
} from "@/lib/app-lock";

type VerrouContextValue = {
  readonly isReady: boolean;
  readonly isEnabled: boolean;
  readonly isUnlocked: boolean;
  readonly biometricsAvailable: boolean;
  readonly refresh: () => Promise<void>;
  readonly enable: (pin: string) => Promise<void>;
  readonly disable: (pin: string) => Promise<boolean>;
  readonly unlockWithPin: (pin: string) => Promise<boolean>;
  readonly unlockWithBiometrics: () => Promise<boolean>;
  readonly requireUnlock: () => Promise<boolean>;
};

const VerrouContext = createContext<VerrouContextValue | null>(null);

type VerrouProviderProps = {
  readonly children: ReactNode;
};

export const VerrouProvider = ({ children }: VerrouProviderProps) => {
  const [isReady, setIsReady] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);

  const refresh = useCallback(async () => {
    const [enabled, biometrics] = await Promise.all([
      isVerrouEnabled(),
      canUseBiometrics(),
    ]);
    setIsEnabled(enabled);
    setBiometricsAvailable(biometrics);
    setIsUnlocked(!enabled);
    setIsReady(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onChange = (nextState: AppStateStatus) => {
      if (!isEnabled) {
        return;
      }
      if (nextState === "background") {
        setIsUnlocked(false);
      }
    };
    const subscription = AppState.addEventListener("change", onChange);
    return () => subscription.remove();
  }, [isEnabled]);

  const enable = useCallback(async (pin: string) => {
    await enableVerrou(pin);
    setIsEnabled(true);
    setIsUnlocked(true);
  }, []);

  const disable = useCallback(async (pin: string) => {
    const ok = await disableVerrou(pin);
    if (ok) {
      setIsEnabled(false);
      setIsUnlocked(true);
    }
    return ok;
  }, []);

  const unlockWithPin = useCallback(async (pin: string) => {
    const ok = await verifyPin(pin);
    if (ok) {
      setIsUnlocked(true);
    }
    return ok;
  }, []);

  const unlockWithBiometrics = useCallback(async () => {
    const ok = await authenticateWithBiometrics();
    if (ok) {
      setIsUnlocked(true);
    }
    return ok;
  }, []);

  const requireUnlock = useCallback(async () => {
    if (!isEnabled || isUnlocked) {
      return true;
    }
    return false;
  }, [isEnabled, isUnlocked]);

  const value = useMemo<VerrouContextValue>(
    () => ({
      isReady,
      isEnabled,
      isUnlocked,
      biometricsAvailable,
      refresh,
      enable,
      disable,
      unlockWithPin,
      unlockWithBiometrics,
      requireUnlock,
    }),
    [
      isReady,
      isEnabled,
      isUnlocked,
      biometricsAvailable,
      refresh,
      enable,
      disable,
      unlockWithPin,
      unlockWithBiometrics,
      requireUnlock,
    ],
  );

  return (
    <VerrouContext.Provider value={value}>{children}</VerrouContext.Provider>
  );
};

export const useVerrou = (): VerrouContextValue => {
  const value = useContext(VerrouContext);
  if (!value) {
    throw new Error("useVerrou must be used within VerrouProvider");
  }
  return value;
};
