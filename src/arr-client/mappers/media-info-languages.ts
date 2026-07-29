export type MediaInfoLanguageCodes = {
  readonly audioLanguageCodes: readonly string[];
  readonly subtitleLanguageCodes: readonly string[];
};

const asRecord = (raw: unknown): Record<string, unknown> | null => {
  if (typeof raw !== "object" || raw === null) return null;
  return raw as Record<string, unknown>;
};

/** Common Arr / MediaInfo language names → short display codes. */
const NAME_TO_CODE: Readonly<Record<string, string>> = {
  english: "EN",
  french: "FR",
  francais: "FR",
  français: "FR",
  spanish: "ES",
  espanol: "ES",
  español: "ES",
  german: "DE",
  deutsch: "DE",
  italian: "IT",
  italiano: "IT",
  japanese: "JA",
  korean: "KO",
  chinese: "ZH",
  portuguese: "PT",
  russian: "RU",
  dutch: "NL",
  polish: "PL",
  swedish: "SV",
  norwegian: "NO",
  danish: "DA",
  finnish: "FI",
  arabic: "AR",
  hindi: "HI",
  turkish: "TR",
  thai: "TH",
  vietnamese: "VI",
  czech: "CS",
  hungarian: "HU",
  greek: "EL",
  hebrew: "HE",
  romanian: "RO",
  ukrainian: "UK",
  catalan: "CA",
  latin: "LA",
};

const IGNORED = new Set(["unknown", "und", "undefined", "null", "none", "n/a"]);

const splitLanguageTokens = (raw: string): string[] =>
  raw
    .split(/[/+,|;]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

const normalizeTokenToCode = (token: string): string | undefined => {
  const trimmed = token.trim();
  if (trimmed.length === 0) return undefined;
  const lower = trimmed.toLowerCase();
  if (IGNORED.has(lower)) return undefined;
  if (NAME_TO_CODE[lower]) return NAME_TO_CODE[lower];
  // Already a short code (en, FR, eng)
  if (/^[a-z]{2,3}$/i.test(trimmed)) {
    return trimmed.slice(0, 2).toUpperCase();
  }
  // "French (France)" → French
  const beforeParen = trimmed.split("(")[0]?.trim() ?? trimmed;
  const mapped = NAME_TO_CODE[beforeParen.toLowerCase()];
  if (mapped) return mapped;
  // Last resort: first 2–3 letters of a word-like token
  if (/^[A-Za-z]{3,}$/.test(beforeParen)) {
    return beforeParen.slice(0, 2).toUpperCase();
  }
  return undefined;
};

const collectCodes = (raw: unknown): string[] => {
  const codes: string[] = [];
  const seen = new Set<string>();
  const push = (code: string | undefined): void => {
    if (!code || seen.has(code)) return;
    seen.add(code);
    codes.push(code);
  };

  if (typeof raw === "string") {
    for (const token of splitLanguageTokens(raw)) {
      push(normalizeTokenToCode(token));
    }
    return codes;
  }

  if (!Array.isArray(raw)) return codes;
  for (const item of raw) {
    if (typeof item === "string") {
      push(normalizeTokenToCode(item));
      continue;
    }
    const obj = asRecord(item);
    if (!obj) continue;
    if (typeof obj.name === "string") {
      push(normalizeTokenToCode(obj.name));
      continue;
    }
    if (typeof obj.language === "string") {
      push(normalizeTokenToCode(obj.language));
    }
  }
  return codes;
};

/**
 * Map Radarr/Sonarr mediaInfo (+ optional file languages) to short codes.
 */
export const mapMediaInfoLanguageCodes = (
  mediaInfo: unknown,
  languages?: unknown,
): MediaInfoLanguageCodes => {
  const info = asRecord(mediaInfo);
  const audioFromInfo = collectCodes(info?.audioLanguages);
  const audio =
    audioFromInfo.length > 0 ? audioFromInfo : collectCodes(languages);
  const subtitles = collectCodes(info?.subtitles);
  return {
    audioLanguageCodes: audio,
    subtitleLanguageCodes: subtitles,
  };
};
