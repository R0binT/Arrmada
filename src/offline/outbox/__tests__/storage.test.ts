import AsyncStorage from "@react-native-async-storage/async-storage";

import { OUTBOX_STORAGE_KEY } from "../../constants";
import {
  getOutboxSnapshot,
  loadOutbox,
  resetOutboxSnapshotForTests,
  saveOutbox,
  subscribeOutbox,
} from "../storage";
import type { ArrOutboxItem } from "../types";

describe("outbox storage", () => {
  beforeEach(async () => {
    resetOutboxSnapshotForTests();
    await AsyncStorage.clear();
  });

  it("round-trips items", async () => {
    const inputItems: readonly ArrOutboxItem[] = [
      {
        id: "op-1",
        service: "radarr",
        type: "addMovie",
        payload: {
          tmdbId: 42,
          qualityProfileId: 1,
          rootFolderPath: "/movies",
          title: "Test",
          year: 2020,
          posterUrl: undefined,
          overview: "",
        },
        status: "pending",
        attempts: 0,
        createdAt: "2026-08-07T00:00:00.000Z",
        updatedAt: "2026-08-07T00:00:00.000Z",
        optimisticKey: "movie:-42",
      },
    ];
    await saveOutbox(inputItems);
    const raw = await AsyncStorage.getItem(OUTBOX_STORAGE_KEY);
    expect(raw).toContain("addMovie");
    const actual = await loadOutbox();
    expect(actual).toEqual(inputItems);
  });

  it("returns empty array when missing or corrupt", async () => {
    expect(await loadOutbox()).toEqual([]);
    await AsyncStorage.setItem(OUTBOX_STORAGE_KEY, "{not-json");
    expect(await loadOutbox()).toEqual([]);
  });

  it("notifies subscribers when saveOutbox updates the snapshot", async () => {
    const listener = jest.fn();
    const unsubscribe = subscribeOutbox(listener);
    const items: readonly ArrOutboxItem[] = [
      {
        id: "op-2",
        service: "sonarr",
        type: "addSeries",
        payload: {},
        status: "failed",
        attempts: 1,
        createdAt: "2026-08-14T00:00:00.000Z",
        updatedAt: "2026-08-14T00:00:00.000Z",
        optimisticKey: "series:78804",
      },
    ];
    await saveOutbox(items);
    expect(getOutboxSnapshot()).toEqual(items);
    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });
});
