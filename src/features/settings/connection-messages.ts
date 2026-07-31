import type { ArrService } from "@/arr-client";
import { ArrHttpError } from "@/arr-client";
import { t } from "@/i18n";

export const UNAUTHORIZED_MESSAGE = (): string => t("connection.unauthorized");

export const getConnectionErrorMessage = (
  service: ArrService,
  error: unknown,
): string => {
  if (error instanceof ArrHttpError && error.kind === "unauthorized") {
    return UNAUTHORIZED_MESSAGE();
  }
  if (error instanceof ArrHttpError && error.kind === "timeout") {
    return service === "radarr"
      ? t("connection.timeoutRadarr")
      : t("connection.timeoutSonarr");
  }
  return service === "radarr"
    ? t("connection.lanRadarr")
    : t("connection.lanSonarr");
};
