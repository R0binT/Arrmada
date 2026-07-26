import type { ArrService, ServiceHealth } from "../types";

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

  return {
    service,
    online: version !== undefined,
    version,
    message: undefined,
  };
};
