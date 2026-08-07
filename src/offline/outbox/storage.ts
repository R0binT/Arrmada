import AsyncStorage from "@react-native-async-storage/async-storage";

import { OUTBOX_STORAGE_KEY } from "../constants";
import type { ArrOutboxItem } from "./types";

const isArrOutboxItemArray = (value: unknown): value is ArrOutboxItem[] =>
  Array.isArray(value);

/**
 * Loads the durable mutation outbox from AsyncStorage.
 * Returns an empty array when missing or corrupt.
 */
export const loadOutbox = async (): Promise<readonly ArrOutboxItem[]> => {
  const raw = await AsyncStorage.getItem(OUTBOX_STORAGE_KEY);
  if (raw === null) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isArrOutboxItemArray(parsed)) {
      return [];
    }
    return parsed;
  } catch {
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
};
