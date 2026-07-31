import { ArrHttpError } from "@/arr-client";
import { t } from "@/i18n";

export type ArrErrorLabels = {
  readonly serviceLabel: string;
  readonly entityLabel: string;
};

/** User-facing error copy for Radarr/Sonarr HTTP failures. */
export const getArrErrorMessage = (
  error: unknown,
  labels: ArrErrorLabels,
): string => {
  if (error instanceof ArrHttpError) {
    if (error.kind === "timeout") {
      return labels.serviceLabel === "Radarr"
        ? t("connection.timeoutRadarr")
        : t("connection.timeoutSonarr");
    }
    if (error.kind === "network") {
      return labels.serviceLabel === "Radarr"
        ? t("connection.lanRadarr")
        : t("connection.lanSonarr");
    }
    if (error.kind === "unauthorized") {
      return t("connection.unauthorizedService", {
        service: labels.serviceLabel,
      });
    }
    if (error.kind === "not_found") {
      return t("connection.notFoundService", {
        service: labels.serviceLabel,
        detail: error.message,
        entity: labels.entityLabel,
      });
    }
    return error.message || t("error.generic");
  }
  if (error instanceof Error) {
    const message = error.message;
    if (message === "Radarr is not configured.") {
      return t("detail.radarrMissing");
    }
    if (message === "Sonarr is not configured.") {
      return t("detail.sonarrMissing");
    }
    if (
      message === "Movie not found." ||
      message === "Movie not found in Radarr lookup."
    ) {
      return t("detail.movieMissing");
    }
    if (
      message === "Series not found." ||
      message === "Series not found in Sonarr lookup."
    ) {
      return t("detail.seriesMissing");
    }
    return message;
  }
  return t("error.generic");
};
