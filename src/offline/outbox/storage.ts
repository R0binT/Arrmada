import AsyncStorage from "@react-native-async-storage/async-storage";

import { OUTBOX_STORAGE_KEY } from "../constants";
import type { ArrOutboxItem } from "./types";

type Listener = () => void;

let snapshot: readonly ArrOutboxItem[] = [];
const listeners = new Set<Listener>();

const notifyListeners = (): void => {
  for (const listener of listeners) {
    listener();
  }
};

const setSnapshot = (items: readonly ArrOutboxItem[]): void => {
  snapshot = items;
  notifyListeners();
};

const isArrOutboxItemArray = (value: unknown): value is ArrOutboxItem[] =>
  Array.isArray(value);

export const getOutboxSnapshot = (): readonly ArrOutboxItem[] => snapshot;

export const subscribeOutbox = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/**
 * Loads the durable mutation outbox from AsyncStorage.
 * Returns an empty array when missing or corrupt.
 */
export const loadOutbox = async (): Promise<readonly ArrOutboxItem[]> => {
  const raw = await AsyncStorage.getItem(OUTBOX_STORAGE_KEY);
  if (raw === null) {
    setSnapshot([]);
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isArrOutboxItemArray(parsed)) {
      setSnapshot([]);
      return [];
    }
    setSnapshot(parsed);
    return parsed;
  } catch {
    setSnapshot([]);
    return [];
  }
};

/**
 * Persists the mutation outbox to AsyncStorage as JSON.
 */
export const saveOutbox = async (
  items: readonly ArrOutboxItem[],
): Promise<void> => {
  await AsyncStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(items));
  setSnapshot(items);
};

/** Test helper — clears the in-memory outbox snapshot and listeners. */
export const resetOutboxSnapshotForTests = (): void => {
  snapshot = [];
  listeners.clear();
};
