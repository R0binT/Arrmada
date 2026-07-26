import type { ArrService, QueueStatus } from "@/arr-client";
import {
    diffQueueNotificationEvents,
    queueItemKey,
    type QueueSnapshotItem,
} from "../queue-notification-events";

const item = (input: {
  readonly id?: number;
  readonly service?: ArrService;
  readonly title: string;
  readonly status: QueueStatus;
  readonly downloadId?: string;
}): QueueSnapshotItem => {
  const service = input.service ?? "radarr";
  const id = input.id ?? 1;
  return {
    key: queueItemKey({
      id,
      service,
      title: input.title,
      downloadId: input.downloadId,
    }),
    title: input.title,
    status: input.status,
    service,
  };
};

describe("diffQueueNotificationEvents", () => {
  it("emits started when the queue was empty and a download appears", () => {
    const next = [
      item({ title: "Dune", status: "downloading", downloadId: "a" }),
    ];
    expect(diffQueueNotificationEvents([], next)).toEqual([
      {
        kind: "started",
        key: "radarr:dl:a",
        title: "Dune",
        service: "radarr",
      },
    ]);
  });

  it("emits started when a new Téléchargement appears", () => {
    const previous = [
      item({ title: "Dune", status: "downloading", downloadId: "a" }),
    ];
    const next = [
      ...previous,
      item({
        id: 2,
        title: "Arrival",
        status: "queued",
        downloadId: "b",
      }),
    ];
    expect(diffQueueNotificationEvents(previous, next)).toEqual([
      {
        kind: "started",
        key: "radarr:dl:b",
        title: "Arrival",
        service: "radarr",
      },
    ]);
  });

  it("emits failed when status becomes failed", () => {
    const previous = [
      item({ title: "Dune", status: "downloading", downloadId: "a" }),
    ];
    const next = [item({ title: "Dune", status: "failed", downloadId: "a" })];
    expect(diffQueueNotificationEvents(previous, next)).toEqual([
      {
        kind: "failed",
        key: "radarr:dl:a",
        title: "Dune",
        service: "radarr",
      },
    ]);
  });

  it("emits Dispo when an item leaves the queue without failing", () => {
    const previous = [
      item({ title: "Dune", status: "downloading", downloadId: "a" }),
    ];
    expect(diffQueueNotificationEvents(previous, [])).toEqual([
      {
        kind: "dispo",
        key: "radarr:dl:a",
        title: "Dune",
        service: "radarr",
      },
    ]);
  });

  it("does not emit Dispo when a failed item disappears", () => {
    const previous = [
      item({ title: "Dune", status: "failed", downloadId: "a" }),
    ];
    expect(diffQueueNotificationEvents(previous, [])).toEqual([]);
  });

  it("dedupes by downloadId across service+id churn", () => {
    const previous = [
      item({
        id: 10,
        title: "Dune",
        status: "downloading",
        downloadId: "same",
      }),
    ];
    const next = [
      item({
        id: 99,
        title: "Dune",
        status: "downloading",
        downloadId: "same",
      }),
    ];
    expect(diffQueueNotificationEvents(previous, next)).toEqual([]);
  });

  it("falls back to title key when downloadId and id are missing", () => {
    const previous = [item({ id: 0, title: "Mystery", status: "downloading" })];
    const next: QueueSnapshotItem[] = [];
    expect(diffQueueNotificationEvents(previous, next)).toEqual([
      {
        kind: "dispo",
        key: "radarr:title:Mystery",
        title: "Mystery",
        service: "radarr",
      },
    ]);
  });

  it("never invents sortie bientôt / À venir events", () => {
    const previous = [
      item({ title: "Dune", status: "paused", downloadId: "a" }),
    ];
    const next = [
      item({ title: "Dune", status: "downloading", downloadId: "a" }),
    ];
    const kinds = diffQueueNotificationEvents(previous, next).map(
      (e) => e.kind,
    );
    expect(kinds).toEqual([]);
    expect(kinds).not.toContain("sortie");
  });

  it("emits at most one event per kind+key in a single diff", () => {
    const previous = [
      item({ title: "Dune", status: "downloading", downloadId: "a" }),
      item({
        id: 2,
        title: "Dune",
        status: "downloading",
        downloadId: "a",
      }),
    ];
    const next: QueueSnapshotItem[] = [];
    const events = diffQueueNotificationEvents(previous, next);
    expect(events).toHaveLength(1);
    expect(events[0]?.kind).toBe("dispo");
  });
});

describe("queueItemKey", () => {
  it("prefers downloadId over queue id", () => {
    expect(
      queueItemKey({
        id: 1,
        service: "sonarr",
        title: "X",
        downloadId: "dl-1",
      }),
    ).toBe("sonarr:dl:dl-1");
  });
});
