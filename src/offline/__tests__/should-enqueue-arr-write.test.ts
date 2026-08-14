import { isDeviceOffline as isDeviceOfflineFromReduce } from "../connectivity/reduce-offline-status";
import {
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
