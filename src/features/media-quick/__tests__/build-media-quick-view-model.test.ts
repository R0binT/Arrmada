import {
  buildMediaQuickViewModel,
  resolvePrimaryDestination,
} from "../build-media-quick-view-model";

const chipLabels = (
  chips: readonly { readonly label: string }[],
): string[] => chips.map((chip) => chip.label);

it("download with movieId opens film fiche", () => {
  const selection = {
    kind: "download" as const,
    key: "radarr-9",
    title: "Night Harbor",
    year: undefined,
    posterUrl: undefined,
    movieId: 42,
    seriesId: undefined,
    progress: 0.4,
    queueStatus: "downloading" as const,
    service: "radarr" as const,
    size: 2_000_000_000,
    sizeLeft: 1_200_000_000,
    etaSeconds: 3600,
  };
  const dest = resolvePrimaryDestination(selection);
  expect(dest).toEqual({
    href: { pathname: "/(tabs)/movies/[id]", params: { id: "42" } },
    ctaKey: "mediaQuick.seeDetail",
  });
  const vm = buildMediaQuickViewModel(selection);
  expect(vm.statusLine).toMatch(/en cours/i);
  expect(vm.subtitle).toBeUndefined();
  expect(chipLabels(vm.chips).some((chip) => /Radarr/i.test(chip))).toBe(true);
  expect(vm.chips.some((chip) => chip.label === "Radarr" && chip.tone === "accent")).toBe(
    true,
  );
  expect(chipLabels(vm.chips).some((chip) => /ETA/i.test(chip))).toBe(true);
});

it("queue-only download opens Téléchargements", () => {
  const selection = {
    kind: "download" as const,
    key: "sonarr-1",
    title: "Ep",
    year: undefined,
    posterUrl: undefined,
    movieId: undefined,
    seriesId: undefined,
    progress: 0.1,
    queueStatus: "paused" as const,
  };
  expect(resolvePrimaryDestination(selection).ctaKey).toBe(
    "mediaQuick.seeDownloads",
  );
});

it("dispo film shows glanceable chips and detail", () => {
  const vm = buildMediaQuickViewModel({
    kind: "movie",
    key: "movie-1",
    title: "Night Harbor",
    year: 2024,
    posterUrl: undefined,
    movieId: 1,
    availability: "dispo",
    fileQuality: "Bluray-1080p",
    genres: ["Thriller", "Drama"],
    runtimeMinutes: 118,
    networkOrStudio: "A24",
    sizeOnDisk: 8_000_000_000,
    added: "2026-04-07T12:00:00Z",
  });
  expect(vm.statusLine).toBe("Téléchargé");
  expect(vm.statusTone).toBe("success");
  expect(vm.subtitle).toBe("2024");
  expect(chipLabels(vm.chips)).toEqual(
    expect.arrayContaining(["Thriller", "Drama", "1 h 58 min", "A24"]),
  );
  expect(vm.detailLine).toMatch(/Bluray-1080p/);
  expect(vm.detailLine).toMatch(/Ajouté le/);
});

it("episode shows series, code and air date", () => {
  const vm = buildMediaQuickViewModel({
    kind: "episode",
    key: "ep-1",
    title: "Pilot",
    year: undefined,
    posterUrl: undefined,
    seriesId: 9,
    subtitle: "Night Harbor",
    seasonNumber: 1,
    episodeNumber: 1,
    airDate: "2026-07-26T20:00:00Z",
    availability: "aVenir",
    genres: ["Crime"],
    networkOrStudio: "HBO",
    runtimeMinutes: 45,
  });
  expect(vm.title).toBe("Pilot");
  expect(vm.subtitle).toBe("Night Harbor");
  expect(vm.statusLine).toBe("À venir");
  expect(vm.statusTone).toBe("warning");
  expect(chipLabels(vm.chips)[0]).toMatch(/S01E01/);
  expect(chipLabels(vm.chips)).toEqual(
    expect.arrayContaining(["Crime", "HBO", "45 min"]),
  );
  expect(
    vm.chips.some((chip) => chip.label === "Crime" && chip.tone === "accent"),
  ).toBe(true);
  expect(
    vm.chips.some((chip) => chip.label === "45 min" && chip.tone === "neutral"),
  ).toBe(true);
  expect(
    vm.chips.some((chip) => chip.label === "HBO" && chip.tone === "neutral"),
  ).toBe(true);
});

it("season shows series and episode progress", () => {
  const vm = buildMediaQuickViewModel({
    kind: "season",
    key: "season-1",
    title: "Saison 1",
    year: 2024,
    posterUrl: undefined,
    seriesId: 3,
    subtitle: "Night Harbor",
    seasonNumber: 1,
    episodeCount: 10,
    episodeFileCount: 4,
    availability: "aTelecharger",
    genres: ["Crime"],
    networkOrStudio: "HBO",
  });
  expect(vm.title).toBe("Saison 1");
  expect(vm.subtitle).toBe("Night Harbor");
  expect(chipLabels(vm.chips)).toContain("4/10 épisodes");
  expect(chipLabels(vm.chips)).toEqual(
    expect.arrayContaining(["Crime", "HBO"]),
  );
  expect(vm.statusLine).toBe("À télécharger");
  expect(vm.statusTone).toBe("info");
});

it("series shows episode progress and network", () => {
  const vm = buildMediaQuickViewModel({
    kind: "series",
    key: "series-1",
    title: "Night Harbor",
    year: 2022,
    posterUrl: undefined,
    seriesId: 3,
    availability: "dispo",
    episodeCount: 20,
    episodeFileCount: 20,
    networkOrStudio: "HBO",
    genres: ["Crime"],
  });
  expect(vm.subtitle).toBe("2022");
  expect(chipLabels(vm.chips)).toEqual(
    expect.arrayContaining(["20/20 épisodes", "Crime", "HBO"]),
  );
});
