export type ReleaseAudioKind = "multi" | "vf" | "vo" | "unknown";

export type ReleaseAudioInput = {
  readonly title: string;
  readonly languageNames: readonly string[];
};

const normalize = (value: string): string => value.trim().toLowerCase();

const titleHas = (title: string, pattern: RegExp): boolean =>
  pattern.test(title);

const languagesInclude = (
  languages: readonly string[],
  matcher: (name: string) => boolean,
): boolean => languages.some((name) => matcher(normalize(name)));

/**
 * Classify release audio for French-scene VO / VF / MULTI selection.
 * VOSTFR is treated as VO (original audio + French subs).
 */
export const classifyReleaseAudio = (
  input: ReleaseAudioInput,
): ReleaseAudioKind => {
  const title = input.title;
  const languages = input.languageNames;

  const titleMulti = titleHas(title, /\bmulti\b/i);
  const langFrench = languagesInclude(
    languages,
    (name) =>
      name.includes("french") || name.includes("français") || name === "fr",
  );
  const langEnglish = languagesInclude(
    languages,
    (name) =>
      name.includes("english") || name.includes("anglais") || name === "en",
  );
  const langCount = new Set(
    languages.map(normalize).filter((name) => name.length > 0),
  ).size;

  if (titleMulti || langCount >= 2 || (langFrench && langEnglish)) {
    return "multi";
  }

  const titleVf = titleHas(title, /\b(truefrench|vff|vfq|vfi|french)\b/i);
  const titleVo = titleHas(title, /\b(vostfr|vo\b|english)\b/i) && !titleVf;

  if (langFrench || titleVf) return "vf";
  if (langEnglish || titleVo) return "vo";
  return "unknown";
};
