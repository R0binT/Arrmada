import { setI18nLocale, t } from "@/i18n/t";
import type { OfflineStatus } from "@/offline/connectivity/types";
import {
  countOutboxPending,
  resolveMovieOptimisticKey,
  resolveSeriesOptimisticKey,
  selectLibrarySyncBadge,
  selectOfflineBanner,
} from "@/offline/offline-ui-selectors";
import type { ArrOutboxItem } from "@/offline/outbox/types";

const onlineStatus = (): OfflineStatus => ({
  device: "online",
  radarr: "online",
  sonarr: "online",
});

const outboxItem = (
  overrides: Partial<ArrOutboxItem> & Pick<ArrOutboxItem, "id" | "status">,
): ArrOutboxItem => ({
  service: "radarr",
  type: "addMovie",
  payload: {},
  attempts: 0,
  createdAt: "2026-08-14T00:00:00.000Z",
  updatedAt: "2026-08-14T00:00:00.000Z",
  ...overrides,
});

describe("countOutboxPending", () => {
  it("counts pending, running, and failed items, not only add optimistic rows", () => {
    const items: readonly ArrOutboxItem[] = [
      outboxItem({ id: "a", status: "pending", type: "movieSearch" }),
      outboxItem({ id: "b", status: "running", type: "deleteMovie" }),
      outboxItem({ id: "c", status: "failed", type: "addSeries", service: "sonarr" }),
    ];
    expect(countOutboxPending(items)).toBe(3);
  });

  it("returns 0 for an empty outbox", () => {
    expect(countOutboxPending([])).toBe(0);
  });
});

describe("selectOfflineBanner", () => {
  it("hides when online with an empty outbox", () => {
    expect(selectOfflineBanner(onlineStatus(), 0)).toEqual({ visible: false });
  });

  it("uses deviceOffline when the device is offline", () => {
    expect(
      selectOfflineBanner({ ...onlineStatus(), device: "offline" }, 2),
    ).toEqual({
      visible: true,
      lines: [{ key: "offline.deviceOffline" }],
    });
  });

  it("uses arrUnreachable and appends pendingCount when Arr is down", () => {
    expect(
      selectOfflineBanner({ ...onlineStatus(), radarr: "unreachable" }, 2),
    ).toEqual({
      visible: true,
      lines: [
        { key: "offline.arrUnreachable" },
        { key: "offline.pendingCount", count: 2 },
      ],
    });
  });

  it("uses arrUnreachable without pendingCount when the outbox is empty", () => {
    expect(
      selectOfflineBanner({ ...onlineStatus(), sonarr: "unreachable" }, 0),
    ).toEqual({
      visible: true,
      lines: [{ key: "offline.arrUnreachable" }],
    });
  });

  it("uses pendingCount when only the outbox has work", () => {
    expect(selectOfflineBanner(onlineStatus(), 1)).toEqual({
      visible: true,
      lines: [{ key: "offline.pendingCount", count: 1 }],
    });
  });
});

describe("selectLibrarySyncBadge", () => {
  it("maps running outbox items to a pending badge with the outbox id", () => {
    const items = [
      outboxItem({
        id: "op-run",
        status: "running",
        optimisticKey: "movie:550",
      }),
    ];
    expect(selectLibrarySyncBadge(items, "movie:550", undefined)).toEqual({
      state: "pending",
      outboxId: "op-run",
    });
  });

  it("maps failed outbox items to a failed badge", () => {
    const items = [
      outboxItem({
        id: "op-fail",
        status: "failed",
        optimisticKey: "series:78804",
      }),
    ];
    expect(selectLibrarySyncBadge(items, "series:78804", undefined)).toEqual({
      state: "failed",
      outboxId: "op-fail",
    });
  });

  it("falls back to pending-sync index state when the outbox has no matching key", () => {
    expect(selectLibrarySyncBadge([], "movie:550", "pending")).toEqual({
      state: "pending",
      outboxId: undefined,
    });
  });

  it("returns undefined when neither outbox nor index has the key", () => {
    expect(selectLibrarySyncBadge([], "movie:550", undefined)).toBeUndefined();
  });
});

describe("resolve optimistic keys", () => {
  it("prefers tmdbId and falls back to a negative movie id", () => {
    expect(
      resolveMovieOptimisticKey({
        id: 12,
        externalIds: { tmdbId: 550 },
      }),
    ).toBe("movie:550");
    expect(
      resolveMovieOptimisticKey({
        id: -550,
        externalIds: { tmdbId: undefined },
      }),
    ).toBe("movie:550");
    expect(
      resolveMovieOptimisticKey({
        id: 12,
        externalIds: { tmdbId: undefined },
      }),
    ).toBeUndefined();
  });

  it("prefers tvdbId and falls back to a negative series id", () => {
    expect(
      resolveSeriesOptimisticKey({
        id: 9,
        externalIds: { tvdbId: 78804 },
      }),
    ).toBe("series:78804");
    expect(
      resolveSeriesOptimisticKey({
        id: -78804,
        externalIds: { tvdbId: undefined },
      }),
    ).toBe("series:78804");
  });
});

describe("offline copy", () => {
  afterEach(() => {
    setI18nLocale("en");
  });

  it("keeps French banner and badge strings", () => {
    setI18nLocale("fr");
    expect(t("offline.arrUnreachable")).toBe("Serveur Arr injoignable");
    expect(t("offline.pendingCount", { count: 2 })).toBe(
      "2 action(s) en attente",
    );
    expect(t("offline.deviceOffline")).toBe("Hors ligne — cache uniquement");
    expect(t("offline.syncPending")).toBe("Sync");
    expect(t("offline.syncFailed")).toBe("Échec sync");
  });
});
