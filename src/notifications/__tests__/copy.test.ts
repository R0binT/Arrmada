import { formatQueueNotificationCopy } from "../copy";

describe("formatQueueNotificationCopy", () => {
  it("uses French CONTEXT vocabulary for started / Téléchargé / failed", () => {
    expect(
      formatQueueNotificationCopy({
        kind: "started",
        key: "k",
        title: "Dune",
        service: "radarr",
      }),
    ).toEqual({
      title: "Téléchargement",
      body: "Dune a démarré.",
    });

    expect(
      formatQueueNotificationCopy({
        kind: "dispo",
        key: "k",
        title: "Dune",
        service: "radarr",
      }),
    ).toEqual({
      title: "Téléchargé",
      body: "Dune est téléchargé.",
    });

    expect(
      formatQueueNotificationCopy({
        kind: "failed",
        key: "k",
        title: "Dune",
        service: "radarr",
      }),
    ).toEqual({
      title: "Échec",
      body: "Le Téléchargement de Dune a échoué.",
    });
  });
});
