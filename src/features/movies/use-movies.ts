import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import {
    classifyMovie,
    type ArrAddDefaults,
    type Movie,
    type MovieCandidate,
    type QualityProfileOption,
    type ReleaseOffer,
    type RootFolderOption,
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

export type MovieFilter = LibraryFilter;

export type { MovieCandidate, QualityProfileOption, RootFolderOption };
export type MovieDefaults = ArrAddDefaults;

export const getErrorMessage = (error: unknown): string =>
  getArrErrorMessage(error, {
    serviceLabel: "Radarr",
    entityLabel: t("detail.thisMovie"),
  });

export const filterMovies = (
  movies: readonly Movie[],
  filter: MovieFilter,
  search: string,
): Movie[] => filterLibraryItems(movies, filter, search, classifyMovie);

export const useMovies = () => {
  const { radarr, config } = useArrClients();

  return useQuery({
    queryKey: queryKeys.movies.all,
    queryFn: () => {
      if (!radarr) throw new Error("Radarr is not configured.");
      return radarr.getMovies();
    },
    enabled: Boolean(radarr),
    meta: { baseUrl: config?.radarrUrl },
  });
};

export const useMovie = (id: number) => {
  const { radarr } = useArrClients();

  return useQuery({
    queryKey: queryKeys.movies.detail(id),
    queryFn: () => {
      if (!radarr) throw new Error("Radarr is not configured.");
      return radarr.getMovie(id);
    },
    enabled: Boolean(radarr) && Number.isFinite(id) && id > 0,
  });
};

export const useMovieCast = (id: number) => {
  const { radarr } = useArrClients();

  return useQuery({
    queryKey: queryKeys.movies.cast(id),
    queryFn: () => {
      if (!radarr) throw new Error("Radarr is not configured.");
      return radarr.getMovieCredits(id);
    },
    enabled: Boolean(radarr) && Number.isFinite(id) && id > 0,
  });
};

export const useMovieLookup = (term: string) => {
  const { radarr } = useArrClients();
  const trimmed = term.trim();

  return useQuery({
    queryKey: queryKeys.movies.lookup(trimmed),
    queryFn: async () => {
      if (!radarr) throw new Error("Radarr is not configured.");
      return radarr.lookupCandidates(trimmed);
    },
    enabled: Boolean(radarr) && trimmed.length >= 2,
  });
};

export const useMovieCandidatePreview = (tmdbId: number) => {
  const { radarr } = useArrClients();
  return useQuery({
    queryKey: queryKeys.movies.preview(tmdbId),
    queryFn: async () => {
      if (!radarr) throw new Error("Radarr is not configured.");
      return radarr.lookupCandidateByTmdbId(tmdbId);
    },
    enabled: Boolean(radarr) && Number.isFinite(tmdbId) && tmdbId > 0,
  });
};

export const useMovieDefaults = () => {
  const { radarr } = useArrClients();

  return useQuery({
    queryKey: queryKeys.movies.defaults,
    queryFn: async (): Promise<MovieDefaults> => {
      if (!radarr) throw new Error("Radarr is not configured.");
      return radarr.getAddDefaults();
    },
    enabled: Boolean(radarr),
  });
};

export const useAddMovie = () => {
  const { radarr } = useArrClients();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      tmdbId: number;
      qualityProfileId: number;
      rootFolderPath: string;
    }) => {
      if (!radarr) throw new Error("Radarr is not configured.");
      return radarr.addMovie(input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.movies.all });
    },
  });
};

export const useMovieSearch = () => {
  const { radarr } = useArrClients();

  return useMutation({
    mutationFn: async (movieId: number) => {
      if (!radarr) throw new Error("Radarr is not configured.");
      return radarr.command("MoviesSearch", { movieIds: [movieId] });
    },
  });
};

export const useMovieReleases = (movieId: number, enabled: boolean) => {
  const { radarr } = useArrClients();

  return useQuery({
    queryKey: queryKeys.movies.releases(movieId),
    queryFn: (): Promise<ReleaseOffer[]> => {
      if (!radarr) throw new Error("Radarr is not configured.");
      return radarr.getMovieReleases(movieId);
    },
    enabled:
      enabled && Boolean(radarr) && Number.isFinite(movieId) && movieId > 0,
  });
};

export const useGrabMovieRelease = () => {
  const { radarr } = useArrClients();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (release: Pick<ReleaseOffer, "guid" | "indexerId">) => {
      if (!radarr) throw new Error("Radarr is not configured.");
      return radarr.grabRelease(release);
    },
    onSuccess: async () => {
      startQueueBurstFromCache(queryClient);
    },
  });
};

export const useUpdateMovieMonitored = () => {
  const { radarr } = useArrClients();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      movieId: number;
      monitored: boolean;
    }): Promise<Movie> => {
      if (!radarr) throw new Error("Radarr is not configured.");
      return radarr.updateMovie(input.movieId, {
        monitored: input.monitored,
      });
    },
    onSuccess: async (movie) => {
      queryClient.setQueryData(queryKeys.movies.detail(movie.id), movie);
      await queryClient.invalidateQueries({ queryKey: queryKeys.movies.all });
    },
  });
};

export const useDeleteMovie = () => {
  const { radarr } = useArrClients();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      movieId: number;
      deleteFiles: boolean;
    }): Promise<void> => {
      if (!radarr) throw new Error("Radarr is not configured.");
      return radarr.deleteMovie(input.movieId, {
        deleteFiles: input.deleteFiles,
      });
    },
    onSuccess: async (_void, input) => {
      queryClient.removeQueries({
        queryKey: queryKeys.movies.detail(input.movieId),
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.movies.all });
    },
  });
};

export const useFilteredMovies = (
  filter: MovieFilter,
  search: string,
): {
  movies: Movie[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
} => {
  const query = useMovies();

  const movies = useMemo(() => {
    if (!query.data) return [];
    return filterMovies(query.data, filter, search);
  }, [filter, query.data, search]);

  return {
    movies,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
  };
};
