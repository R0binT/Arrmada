import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import {
    classifySeries,
    type ArrAddDefaults,
    type Episode,
    type QualityProfileOption,
    type ReleaseOffer,
    type RootFolderOption,
    type Season,
    type Series,
    type SeriesCandidate,
} from "@/arr-client";
import { getArrErrorMessage } from "@/features/library/arr-error-message";
import {
  filterLibraryItems,
  type LibraryFilter,
} from "@/features/library/filter-library-items";
import { startQueueBurstFromCache } from "@/features/queue/start-queue-burst";
import { useArrClients } from "@/hooks/use-arr-clients";
import { t } from "@/i18n";
import { queryKeys } from "@/lib/query-keys";

export type SeriesFilter = LibraryFilter;

export type { QualityProfileOption, RootFolderOption, SeriesCandidate };
export type SeriesDefaults = ArrAddDefaults;

export const getErrorMessage = (error: unknown): string =>
  getArrErrorMessage(error, {
    serviceLabel: "Sonarr",
    entityLabel: t("detail.thisSeries"),
  });

export const filterSeries = (
  seriesList: readonly Series[],
  filter: SeriesFilter,
  search: string,
): Series[] => filterLibraryItems(seriesList, filter, search, classifySeries);

export const useSeriesList = () => {
  const { sonarr, config } = useArrClients();

  return useQuery({
    queryKey: queryKeys.series.all,
    queryFn: () => {
      if (!sonarr) throw new Error("Sonarr is not configured.");
      return sonarr.getSeries();
    },
    enabled: Boolean(sonarr),
    meta: { baseUrl: config?.sonarrUrl },
  });
};

export const useSeries = (id: number) => {
  const { sonarr } = useArrClients();

  return useQuery({
    queryKey: queryKeys.series.detail(id),
    queryFn: () => {
      if (!sonarr) throw new Error("Sonarr is not configured.");
      return sonarr.getSeriesById(id);
    },
    enabled: Boolean(sonarr) && Number.isFinite(id) && id > 0,
  });
};

export const useSeriesCast = (id: number) => {
  const { sonarr } = useArrClients();

  return useQuery({
    queryKey: queryKeys.series.cast(id),
    queryFn: () => {
      if (!sonarr) throw new Error("Sonarr is not configured.");
      return sonarr.getSeriesCredits(id);
    },
    enabled: Boolean(sonarr) && Number.isFinite(id) && id > 0,
  });
};

export const useEpisodeGuestStars = (
  seriesId: number,
  episode: { readonly id: number; readonly seasonNumber: number; readonly episodeNumber: number } | undefined,
) => {
  const { sonarr } = useArrClients();
  const enabled =
    Boolean(sonarr) &&
    episode !== undefined &&
    Number.isFinite(seriesId) &&
    seriesId > 0;

  return useQuery({
    queryKey: queryKeys.series.guestStars(seriesId, episode?.id ?? 0),
    queryFn: () => {
      if (!sonarr || !episode) throw new Error("Sonarr is not configured.");
      return sonarr.getEpisodeGuestStars(
        seriesId,
        episode.seasonNumber,
        episode.episodeNumber,
      );
    },
    enabled,
  });
};

export const useSeriesSeasons = (id: number) => {
  const { sonarr } = useArrClients();

  return useQuery({
    queryKey: queryKeys.series.seasons(id),
    queryFn: (): Promise<Season[]> => {
      if (!sonarr) throw new Error("Sonarr is not configured.");
      return sonarr.getSeasons(id);
    },
    enabled: Boolean(sonarr) && Number.isFinite(id) && id > 0,
  });
};

export const useSeriesLookup = (term: string) => {
  const { sonarr } = useArrClients();
  const trimmed = term.trim();

  return useQuery({
    queryKey: queryKeys.series.lookup(trimmed),
    queryFn: async () => {
      if (!sonarr) throw new Error("Sonarr is not configured.");
      return sonarr.lookupCandidates(trimmed);
    },
    enabled: Boolean(sonarr) && trimmed.length >= 2,
  });
};

export const useSeriesCandidatePreview = (tvdbId: number) => {
  const { sonarr } = useArrClients();
  return useQuery({
    queryKey: queryKeys.series.preview(tvdbId),
    queryFn: async () => {
      if (!sonarr) throw new Error("Sonarr is not configured.");
      return sonarr.lookupCandidateByTvdbId(tvdbId);
    },
    enabled: Boolean(sonarr) && Number.isFinite(tvdbId) && tvdbId > 0,
  });
};

export const useSeriesDefaults = () => {
  const { sonarr } = useArrClients();

  return useQuery({
    queryKey: queryKeys.series.defaults,
    queryFn: async (): Promise<SeriesDefaults> => {
      if (!sonarr) throw new Error("Sonarr is not configured.");
      return sonarr.getAddDefaults();
    },
    enabled: Boolean(sonarr),
  });
};

export const useAddSeries = () => {
  const { sonarr } = useArrClients();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      tvdbId: number;
      qualityProfileId: number;
      rootFolderPath: string;
    }) => {
      if (!sonarr) throw new Error("Sonarr is not configured.");
      return sonarr.addSeries(input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.series.all });
    },
  });
};

export const useSeriesSearch = () => {
  const { sonarr } = useArrClients();

  return useMutation({
    mutationFn: async (seriesId: number) => {
      if (!sonarr) throw new Error("Sonarr is not configured.");
      return sonarr.command("SeriesSearch", { seriesId });
    },
  });
};

export const useSeasonSearch = () => {
  const { sonarr } = useArrClients();

  return useMutation({
    mutationFn: async (input: { seriesId: number; seasonNumber: number }) => {
      if (!sonarr) throw new Error("Sonarr is not configured.");
      return sonarr.command("SeasonSearch", {
        seriesId: input.seriesId,
        seasonNumber: input.seasonNumber,
      });
    },
  });
};

export const useEpisodeSearch = () => {
  const { sonarr } = useArrClients();

  return useMutation({
    mutationFn: async (episodeId: number) => {
      if (!sonarr) throw new Error("Sonarr is not configured.");
      return sonarr.command("EpisodeSearch", { episodeIds: [episodeId] });
    },
  });
};

export const useSeriesReleases = (seriesId: number, enabled: boolean) => {
  const { sonarr } = useArrClients();

  return useQuery({
    queryKey: queryKeys.series.releases(seriesId),
    queryFn: (): Promise<ReleaseOffer[]> => {
      if (!sonarr) throw new Error("Sonarr is not configured.");
      return sonarr.getSeriesReleases(seriesId);
    },
    enabled:
      enabled && Boolean(sonarr) && Number.isFinite(seriesId) && seriesId > 0,
  });
};

export const useGrabSeriesRelease = () => {
  const { sonarr } = useArrClients();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (release: Pick<ReleaseOffer, "guid" | "indexerId">) => {
      if (!sonarr) throw new Error("Sonarr is not configured.");
      return sonarr.grabRelease(release);
    },
    onSuccess: async () => {
      startQueueBurstFromCache(queryClient);
    },
  });
};

export const useUpdateSeriesMonitored = () => {
  const { sonarr } = useArrClients();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      seriesId: number;
      monitored: boolean;
    }): Promise<Series> => {
      if (!sonarr) throw new Error("Sonarr is not configured.");
      return sonarr.updateSeries(input.seriesId, {
        monitored: input.monitored,
      });
    },
    onSuccess: async (series) => {
      queryClient.setQueryData(queryKeys.series.detail(series.id), series);
      await queryClient.invalidateQueries({ queryKey: queryKeys.series.all });
    },
  });
};

export const useUpdateEpisodeMonitored = () => {
  const { sonarr } = useArrClients();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      seriesId: number;
      episodeId: number;
      monitored: boolean;
    }): Promise<Episode> => {
      if (!sonarr) throw new Error("Sonarr is not configured.");
      return sonarr.updateEpisode(input.episodeId, {
        monitored: input.monitored,
      });
    },
    onSuccess: async (_episode, input) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.series.seasons(input.seriesId),
      });
    },
  });
};

export const useDeleteEpisodeFile = () => {
  const { sonarr } = useArrClients();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      seriesId: number;
      episodeFileId: number;
    }): Promise<void> => {
      if (!sonarr) throw new Error("Sonarr is not configured.");
      return sonarr.deleteEpisodeFile(input.episodeFileId);
    },
    onSuccess: async (_void, input) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.series.seasons(input.seriesId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.series.detail(input.seriesId),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.series.all }),
      ]);
    },
  });
};

export const useDeleteSeries = () => {
  const { sonarr } = useArrClients();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      seriesId: number;
      deleteFiles: boolean;
    }): Promise<void> => {
      if (!sonarr) throw new Error("Sonarr is not configured.");
      return sonarr.deleteSeries(input.seriesId, {
        deleteFiles: input.deleteFiles,
      });
    },
    onSuccess: async (_void, input) => {
      queryClient.removeQueries({
        queryKey: queryKeys.series.detail(input.seriesId),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.series.seasons(input.seriesId),
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.series.all });
    },
  });
};

export const useFilteredSeries = (
  filter: SeriesFilter,
  search: string,
): {
  series: Series[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
} => {
  const query = useSeriesList();

  const series = useMemo(() => {
    if (!query.data) return [];
    return filterSeries(query.data, filter, search);
  }, [filter, query.data, search]);

  return {
    series,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
  };
};
