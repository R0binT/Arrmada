import type { ArrService, ServiceHealth } from "../types";
import { t } from "@/i18n";

const expectedAppName = (service: ArrService): string =>
  service === "radarr" ? "Radarr" : "Sonarr";

const readAppName = (obj: Record<string, unknown> | null): string | undefined => {
  if (!obj) return undefined;
  if (typeof obj.appName === "string" && obj.appName.trim().length > 0) {
    return obj.appName.trim();
  }
  return undefined;
};

/**
 * Map Arr `/api/v3/system/status` to ServiceHealth.
 * Requires `version` and `appName` matching the expected Radarr/Sonarr product
 * so swapped hosts/keys cannot report as online.
 */
export const mapHealth = (
  service: ArrService,
  raw: unknown,
): ServiceHealth => {
  const obj =
    typeof raw === "object" && raw !== null
      ? (raw as Record<string, unknown>)
      : null;

  const version =
    obj && typeof obj.version === "string" ? obj.version : undefined;
  const expected = expectedAppName(service);
  const appName = readAppName(obj);

  if (version === undefined) {
    return {
      service,
      online: false,
      version: undefined,
      message: undefined,
    };
  }

  if (
    appName === undefined ||
    appName.toLocaleLowerCase() !== expected.toLocaleLowerCase()
  ) {
    return {
      service,
      online: false,
      version,
      message: t("connection.wrongService", {
        expected,
        actual: appName ?? t("connection.unknownApp"),
      }),
    };
  }

  return {
    service,
    online: true,
    version,
    message: undefined,
  };
};
