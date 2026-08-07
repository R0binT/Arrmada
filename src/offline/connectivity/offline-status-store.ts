import {
  createInitialOfflineStatus,
  reduceOfflineStatus,
  toOfflineStatus,
} from "./reduce-offline-status";
import type {
  ConnectivityMachineState,
  OfflineConnectivityEvent,
  OfflineStatus,
} from "./types";

type Listener = () => void;

let machineState: ConnectivityMachineState = createInitialOfflineStatus();
const listeners = new Set<Listener>();

const notifyListeners = (): void => {
  for (const listener of listeners) {
    listener();
  }
};

export const getOfflineStatus = (): OfflineStatus =>
  toOfflineStatus(machineState);

export const subscribeOfflineStatus = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const dispatchOfflineEvent = (
  event: OfflineConnectivityEvent,
): OfflineStatus => {
  machineState = reduceOfflineStatus(machineState, event);
  notifyListeners();
  return toOfflineStatus(machineState);
};
