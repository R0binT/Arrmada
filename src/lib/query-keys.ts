export const queryKeys = {
  movies: {
    all: ["movies"] as const,
    detail: (id: number) => ["movies", id] as const,
    lookup: (term: string) => ["movies", "lookup", term] as const,
    preview: (tmdbId: number) =>
      [...queryKeys.movies.all, "preview", tmdbId] as const,
    defaults: ["movies", "defaults"] as const,
    releases: (id: number) => ["movies", id, "releases"] as const,
  },
  series: {
    all: ["series"] as const,
    detail: (id: number) => ["series", id] as const,
    seasons: (id: number) => ["series", id, "seasons"] as const,
    lookup: (term: string) => ["series", "lookup", term] as const,
    preview: (tvdbId: number) =>
      [...queryKeys.series.all, "preview", tvdbId] as const,
    defaults: ["series", "defaults"] as const,
    releases: (id: number) => ["series", id, "releases"] as const,
  },
  queue: {
    all: ["queue"] as const,
    radarr: ["queue", "radarr"] as const,
    sonarr: ["queue", "sonarr"] as const,
  },
  health: {
    radarr: ["health", "radarr"] as const,
    sonarr: ["health", "sonarr"] as const,
  },
  upcoming: {
    radarr: (start: string, end: string) =>
      ["upcoming", "radarr", start, end] as const,
    sonarr: (start: string, end: string) =>
      ["upcoming", "sonarr", start, end] as const,
  },
} as const;
