import { getI18nLocale, localeToBcp47, t } from "@/i18n";

const BYTES_PER_GB = 1_000_000_000;
const BYTES_PER_MB = 1_000_000;

const dateLocale = (): string => localeToBcp47(getI18nLocale());

export const formatSizeBytes = (bytes: number): string => {
  if (bytes <= 0) {
    return t("units.mb", { n: 0 });
  }
  if (bytes >= BYTES_PER_GB) {
    const gb = bytes / BYTES_PER_GB;
    return t("units.gb", { n: gb.toFixed(1) });
  }
  const mb = bytes / BYTES_PER_MB;
  return t("units.mb", { n: Math.round(mb) });
};

export const formatRuntimeMinutes = (minutes: number): string => {
  if (minutes < 60) {
    return t("units.min", { n: minutes });
  }
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return t("units.hoursMinutes", { h: hours, m: remainder });
};

export const formatAddedDate = (
  iso: string | undefined,
): string | undefined => {
  if (!iso) return undefined;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return undefined;
  return new Intl.DateTimeFormat(dateLocale(), { dateStyle: "short" }).format(
    new Date(ms),
  );
};

export const formatAirDate = (iso: string | undefined): string | undefined => {
  if (!iso) return undefined;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return undefined;
  return new Intl.DateTimeFormat(dateLocale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(ms));
};

/** Compact date for poster corner badges. */
export const formatPosterDate = (
  iso: string | undefined,
  now: Date = new Date(),
): string | undefined => {
  if (!iso) return undefined;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return undefined;
  const date = new Date(ms);
  if (date.getFullYear() === now.getFullYear()) {
    return new Intl.DateTimeFormat(dateLocale(), {
      day: "numeric",
      month: "short",
    }).format(date);
  }
  return new Intl.DateTimeFormat(dateLocale(), {
    day: "numeric",
    month: "short",
    year: "2-digit",
  }).format(date);
};

export const formatEpisodeCode = (
  seasonNumber: number | undefined,
  episodeNumber: number | undefined,
): string | undefined => {
  if (seasonNumber === undefined || episodeNumber === undefined) {
    return undefined;
  }
  if (!Number.isFinite(seasonNumber) || !Number.isFinite(episodeNumber)) {
    return undefined;
  }
  return `S${String(seasonNumber).padStart(2, "0")}E${String(
    episodeNumber,
  ).padStart(2, "0")}`;
};

export const formatEpisodeProgress = (
  fileCount: number | undefined,
  totalCount: number | undefined,
): string | undefined => {
  if (totalCount === undefined || totalCount <= 0) return undefined;
  const files = fileCount ?? 0;
  return t("mediaQuick.episodeCount", { have: files, total: totalCount });
};

export const formatEtaShort = (
  seconds: number | undefined,
): string | undefined => {
  if (seconds === undefined || seconds <= 0) return undefined;
  if (seconds < 60) return t("units.seconds", { n: seconds });
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t("units.min", { n: minutes });
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0
    ? t("units.hoursMinutes", { h: hours, m: remainingMinutes })
    : t("units.hours", { n: hours });
};
