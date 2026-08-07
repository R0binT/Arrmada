import AsyncStorage from "@react-native-async-storage/async-storage";

import { OUTBOX_STORAGE_KEY } from "../../constants";
import { loadOutbox, saveOutbox } from "../storage";
import type { ArrOutboxItem } from "../types";

describe("outbox storage", () => {
  beforeEach(async () => {
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
});
