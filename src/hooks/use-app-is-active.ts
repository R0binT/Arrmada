import { useEffect, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

export const useAppIsActive = (): boolean => {
  const [isActive, setIsActive] = useState(
    () => AppState.currentState === "active",
  );

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        setIsActive(nextState === "active");
      },
    );
    return () => subscription.remove();
  }, []);

  return isActive;
};
