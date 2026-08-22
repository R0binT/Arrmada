import { t } from "@/i18n";

import {
  assertArrAddDefaults,
  isQueuedArrWrite,
} from "../use-arr-mutation";

describe("isQueuedArrWrite", () => {
  it("detects queued outbox results with a string id", () => {
    expect(isQueuedArrWrite({ queued: true, id: "outbox-1" })).toBe(true);
  });

  it("rejects live Arr add results with a numeric id", () => {
    expect(isQueuedArrWrite({ id: 12 })).toBe(false);
  });
});

describe("assertArrAddDefaults", () => {
  it("throws missingDefaults when the folder path is empty", () => {
    expect(() =>
      assertArrAddDefaults({ qualityProfileId: 1, rootFolderPath: "  " }),
    ).toThrow(t("offline.missingDefaults"));
  });

  it("allows finite profile id and a folder path", () => {
    expect(() =>
      assertArrAddDefaults({
        qualityProfileId: 1,
        rootFolderPath: "/movies",
      }),
    ).not.toThrow();
  });
});
