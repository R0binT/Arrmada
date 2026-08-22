import { t } from "@/i18n";

import { isDeviceOffline as isDeviceOfflineFromReduce } from "../connectivity/reduce-offline-status";
import {
  assertCanMutateArr,
  assertCanUseTmdb,
  isDeviceOffline,
  shouldEnqueueArrWrite,
} from "../should-enqueue-arr-write";

describe("isDeviceOffline", () => {
  it("re-exports the connectivity helper", () => {
    expect(isDeviceOffline).toBe(isDeviceOfflineFromReduce);
  });
});

describe("shouldEnqueueArrWrite", () => {
  it("enqueues when device online and service unreachable", () => {
    expect(
      shouldEnqueueArrWrite(
        { device: "online", radarr: "unreachable", sonarr: "online" },
        "radarr",
      ),
    ).toBe(true);
  });

  it("does not enqueue when device is offline", () => {
    expect(
      shouldEnqueueArrWrite(
        { device: "offline", radarr: "unreachable", sonarr: "unreachable" },
        "radarr",
      ),
    ).toBe(false);
  });

  it("enqueues when device unknown and service unreachable", () => {
    expect(
      shouldEnqueueArrWrite(
        { device: "unknown", radarr: "online", sonarr: "unreachable" },
        "sonarr",
      ),
    ).toBe(true);
  });

  it("does not enqueue when service is online", () => {
    expect(
      shouldEnqueueArrWrite(
        { device: "online", radarr: "online", sonarr: "online" },
        "radarr",
      ),
    ).toBe(false);
  });

  it("does not enqueue when service is unknown", () => {
    expect(
      shouldEnqueueArrWrite(
        { device: "online", radarr: "unknown", sonarr: "online" },
        "radarr",
      ),
    ).toBe(false);
  });
});

describe("assertCanUseTmdb", () => {
  it("returns false when the device is offline", () => {
    expect(
      assertCanUseTmdb({
        device: "offline",
        radarr: "online",
        sonarr: "online",
      }),
    ).toBe(false);
  });

  it("returns true when the device is online even if Arr is unreachable", () => {
    expect(
      assertCanUseTmdb({
        device: "online",
        radarr: "unreachable",
        sonarr: "unreachable",
      }),
    ).toBe(true);
  });

  it("returns true when the device is unknown (not fail-closed)", () => {
    expect(
      assertCanUseTmdb({
        device: "unknown",
        radarr: "unreachable",
        sonarr: "unreachable",
      }),
    ).toBe(true);
  });
});

describe("assertCanMutateArr", () => {
  it("throws deviceOffline when the device is offline", () => {
    expect(() =>
      assertCanMutateArr({
        device: "offline",
        radarr: "online",
        sonarr: "online",
      }),
    ).toThrow(t("offline.deviceOffline"));
  });

  it("allows writes when the device is online", () => {
    expect(() =>
      assertCanMutateArr({
        device: "online",
        radarr: "unreachable",
        sonarr: "online",
      }),
    ).not.toThrow();
  });

  it("allows writes when the device is unknown", () => {
    expect(() =>
      assertCanMutateArr({
        device: "unknown",
        radarr: "unreachable",
        sonarr: "online",
      }),
    ).not.toThrow();
  });
});
