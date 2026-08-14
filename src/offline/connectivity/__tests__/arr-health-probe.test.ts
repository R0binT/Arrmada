import {
  flushOnlineServices,
  mapNetInfoConnected,
  probeAndDispatchArrHealth,
  probeArrHealth,
} from "../arr-health-probe";
import type { OfflineStatus } from "../types";

describe("probeArrHealth", () => {
  it("maps getHealth online true to a health ok event", async () => {
    const actual = await probeArrHealth("radarr", {
      getHealth: async () => ({ online: true }),
    });
    expect(actual).toEqual({
      type: "health",
      service: "radarr",
      ok: true,
    });
  });

  it("maps getHealth online false to a health not-ok event", async () => {
    const actual = await probeArrHealth("sonarr", {
      getHealth: async () => ({ online: false }),
    });
    expect(actual).toEqual({
      type: "health",
      service: "sonarr",
      ok: false,
    });
  });

  it("maps getHealth errors to ok false", async () => {
    const actual = await probeArrHealth("radarr", {
      getHealth: async () => {
        throw new Error("timeout");
      },
    });
    expect(actual).toEqual({
      type: "health",
      service: "radarr",
      ok: false,
    });
  });

  it("skips a missing client without emitting", async () => {
    const actual = await probeArrHealth("radarr", undefined);
    expect(actual).toBeUndefined();
  });
});

describe("mapNetInfoConnected", () => {
  it("maps false to offline, true to online, null to unknown", () => {
    expect(mapNetInfoConnected(false)).toBe("offline");
    expect(mapNetInfoConnected(true)).toBe("online");
    expect(mapNetInfoConnected(null)).toBe("unknown");
  });
});

const unreachableStatus = (): OfflineStatus => ({
  device: "online",
  radarr: "unreachable",
  sonarr: "unknown",
});

describe("probeAndDispatchArrHealth", () => {
  it("does not probe when the device is offline", async () => {
    const getHealth = jest.fn(async () => ({ online: true }));
    const dispatch = jest.fn();
    const flush = jest.fn(async () => undefined);
    await probeAndDispatchArrHealth({
      radarr: { getHealth },
      getStatus: () => ({
        device: "offline",
        radarr: "unknown",
        sonarr: "unknown",
      }),
      dispatch,
      flush,
    });
    expect(getHealth).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
    expect(flush).not.toHaveBeenCalled();
  });

  it("flushes when a service becomes online", async () => {
    let status = unreachableStatus();
    const flush = jest.fn(async () => undefined);
    await probeAndDispatchArrHealth({
      radarr: { getHealth: async () => ({ online: true }) },
      getStatus: () => status,
      dispatch: (event) => {
        if (event.type === "health" && event.ok) {
          status = { ...status, [event.service]: "online" };
        }
        return status;
      },
      flush,
    });
    expect(flush).toHaveBeenCalledWith("radarr");
  });

  it("does not flush when the service was already online", async () => {
    const flush = jest.fn(async () => undefined);
    const status: OfflineStatus = {
      device: "online",
      radarr: "online",
      sonarr: "online",
    };
    await probeAndDispatchArrHealth({
      radarr: { getHealth: async () => ({ online: true }) },
      getStatus: () => status,
      dispatch: () => status,
      flush,
    });
    expect(flush).not.toHaveBeenCalled();
  });
});

describe("flushOnlineServices", () => {
  it("flushes each service that is already online", async () => {
    const flush = jest.fn(async () => undefined);
    await flushOnlineServices(
      { device: "online", radarr: "online", sonarr: "unreachable" },
      flush,
    );
    expect(flush).toHaveBeenCalledTimes(1);
    expect(flush).toHaveBeenCalledWith("radarr");
  });
});
