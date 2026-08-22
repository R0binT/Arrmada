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
let snapshot: OfflineStatus = toOfflineStatus(machineState);
const listeners = new Set<Listener>();

const notifyListeners = (): void => {
  for (const listener of listeners) {
    listener();
  }
};

export const getOfflineStatus = (): OfflineStatus => snapshot;

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
  snapshot = toOfflineStatus(machineState);
  notifyListeners();
  return snapshot;
};
