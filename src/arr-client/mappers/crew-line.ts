import { t } from "@/i18n";

import type { CrewMember } from "../types";

const DEFAULT_MAX = 3;

const shortJob = (job: string): string => {
  const key = job.trim().toLowerCase();
  if (key === "director") return t("detail.crewJobDirector");
  if (key === "creator") return t("detail.crewJobCreator");
  if (key === "writer" || key === "writers") return t("detail.crewJobWriter");
  if (key === "executive producer") return t("detail.crewJobExecProducer");
  if (key === "showrunner") return t("detail.crewJobShowrunner");
  return job.trim();
};

/**
 * Formats key crew as one compact line: `Dir. Name · Writer Name`.
 */
export const formatCrewLine = (
  members: readonly CrewMember[],
  options?: { readonly max?: number },
): string | undefined => {
  const max = options?.max ?? DEFAULT_MAX;
  const parts = members
    .slice(0, max)
    .map((member) => {
      const name = member.name.trim();
      if (name.length === 0) return undefined;
      return `${shortJob(member.job)} ${name}`;
    })
    .filter((part): part is string => part !== undefined);
  if (parts.length === 0) return undefined;
  return parts.join(" · ");
};
