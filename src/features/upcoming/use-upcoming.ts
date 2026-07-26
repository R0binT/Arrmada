import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import {
    ArrHttpError,
    buildCalendarEvents,
    buildUpcomingItems,
    calendarRangeForMonth,
    defaultCalendarRange,
    type ArrService,
    type CalendarEvent,
    type UpcomingItem,
} from "@/arr-client";
import { getConnectionErrorMessage } from "@/features/settings/connection-messages";
import { useArrClients } from "@/hooks/use-arr-clients";
import { queryKeys } from "@/lib/query-keys";

export type UpcomingNetworkError = {
  readonly service: ArrService;
  readonly message: string;
};

type UseUpcomingOptions = {
  /** Start-of-month (local) for the calendar grid; widens the API range. */
  readonly visibleMonth?: Date;
};

const isNetworkError = (error: unknown): boolean =>
  error instanceof ArrHttpError && error.kind === "network";

const startOfMonth = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), 1);

export const useUpcoming = (options: UseUpcomingOptions = {}) => {
  const { radarr, sonarr } = useArrClients();
  const visibleMonth = options.visibleMonth
    ? startOfMonth(options.visibleMonth)
    : undefined;
  const monthKey = visibleMonth
    ? `${visibleMonth.getFullYear()}-${visibleMonth.getMonth()}`
    : "list";

  const range = useMemo(() => {
    // Liste: far horizon. Calendrier: only the visible month (± padding).
    if (!visibleMonth) return defaultCalendarRange();
    return calendarRangeForMonth(visibleMonth);
  }, [monthKey, visibleMonth]);

  const radarrQuery = useQuery({
    queryKey: queryKeys.upcoming.radarr(range.start, range.end),
    queryFn: () => {
      if (!radarr) throw new Error("Radarr is not configured.");
      return radarr.getCalendar(range);
    },
    enabled: Boolean(radarr),
  });

  const sonarrQuery = useQuery({
    queryKey: queryKeys.upcoming.sonarr(range.start, range.end),
    queryFn: () => {
      if (!sonarr) throw new Error("Sonarr is not configured.");
      return sonarr.getCalendar(range);
    },
    enabled: Boolean(sonarr),
  });

  const calendarEvents = useMemo(
    (): readonly CalendarEvent[] =>
      buildCalendarEvents({
        movies: radarrQuery.data ?? [],
        episodes: sonarrQuery.data ?? [],
      }),
    [radarrQuery.data, sonarrQuery.data],
  );

  const items = useMemo(
    (): readonly UpcomingItem[] =>
      buildUpcomingItems({
        movies: radarrQuery.data ?? [],
        episodes: sonarrQuery.data ?? [],
      }),
    [radarrQuery.data, sonarrQuery.data],
  );

  const networkErrors = useMemo((): readonly UpcomingNetworkError[] => {
    const errors: UpcomingNetworkError[] = [];
    if (radarr && isNetworkError(radarrQuery.error)) {
      errors.push({
        service: "radarr",
        message: getConnectionErrorMessage("radarr", radarrQuery.error),
      });
    }
    if (sonarr && isNetworkError(sonarrQuery.error)) {
      errors.push({
        service: "sonarr",
        message: getConnectionErrorMessage("sonarr", sonarrQuery.error),
      });
    }
    return errors;
  }, [radarr, radarrQuery.error, sonarr, sonarrQuery.error]);

  const isLoading =
    (Boolean(radarr) && radarrQuery.isLoading) ||
    (Boolean(sonarr) && sonarrQuery.isLoading);

  const isError =
    (Boolean(radarr) && radarrQuery.isError && !radarrQuery.data) ||
    (Boolean(sonarr) && sonarrQuery.isError && !sonarrQuery.data);

  return {
    items,
    calendarEvents,
    previewItems: items.slice(0, 8),
    networkErrors,
    isLoading,
    isError,
    radarrError: radarrQuery.error,
    sonarrError: sonarrQuery.error,
    refetch: () => {
      void radarrQuery.refetch();
      void sonarrQuery.refetch();
    },
    refetchService: (service: ArrService) => {
      if (service === "radarr") {
        void radarrQuery.refetch();
        return;
      }
      void sonarrQuery.refetch();
    },
  };
};
