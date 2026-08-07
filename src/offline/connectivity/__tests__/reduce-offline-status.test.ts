import { HEALTH_FAILURES_BEFORE_UNREACHABLE } from "../../constants";
import {
  createInitialOfflineStatus,
  reduceOfflineStatus,
} from "../reduce-offline-status";

describe("reduceOfflineStatus", () => {
  it("marks device offline from netinfo", () => {
    const next = reduceOfflineStatus(createInitialOfflineStatus(), {
      type: "netinfo",
      state: "offline",
    });
    expect(next.device).toBe("offline");
  });

  it("requires consecutive health failures before unreachable", () => {
    let state = createInitialOfflineStatus();
    state = reduceOfflineStatus(state, {
      type: "health",
      service: "radarr",
      ok: false,
    });
    expect(state.radarr).toBe("unknown"); // still counting
    for (let i = 1; i < HEALTH_FAILURES_BEFORE_UNREACHABLE; i += 1) {
      state = reduceOfflineStatus(state, {
        type: "health",
        service: "radarr",
        ok: false,
      });
    }
    expect(state.radarr).toBe("unreachable");
    state = reduceOfflineStatus(state, {
      type: "health",
      service: "radarr",
      ok: true,
    });
    expect(state.radarr).toBe("online");
  });
});
