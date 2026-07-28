import type { ArrService, Availability, QueueStatus } from "@/arr-client";
import type { ChipTone } from "@/ui/variant-styles";

export type MediaQuickKind =
  | "movie"
  | "series"
  | "season"
  | "episode"
  | "download";

/**
 * Selection payload for the bottom quick sheet.
 * Call sites pass whatever glanceable facts they have; the view-model formats lines.
 */
export type MediaQuickSelection = {
  readonly kind: MediaQuickKind;
  readonly key: string;
  readonly title: string;
  readonly year: number | undefined;
  readonly posterUrl: string | undefined;
  readonly movieId?: number;
  readonly seriesId?: number;
  readonly availability?: Availability;
  readonly fileQuality?: string;
  readonly progress?: number;
  readonly queueStatus?: QueueStatus;
  /** Secondary headline (e.g. series name under an episode). */
  readonly subtitle?: string;
  readonly genres?: readonly string[];
  readonly runtimeMinutes?: number;
  readonly networkOrStudio?: string;
  readonly added?: string;
  readonly airDate?: string;
  readonly seasonNumber?: number;
  readonly episodeNumber?: number;
  readonly episodeCount?: number;
  readonly episodeFileCount?: number;
  readonly sizeOnDisk?: number;
  readonly sizeLeft?: number;
  readonly size?: number;
  readonly etaSeconds?: number;
  readonly service?: ArrService;
  readonly glanceStatusLine?: string;
  readonly glanceStatusTone?: MediaQuickStatusTone;
  /** Actor names for compact quick info (no photos). */
  readonly castNames?: readonly string[];
};

export type MediaQuickAddActions = {
  readonly canAdd: boolean;
  readonly onAdd: () => void;
  readonly onSeeFiche: () => void;
};

export type PrimaryDestination =
  | {
      readonly href: {
        readonly pathname: "/(tabs)/movies/[id]";
        readonly params: { readonly id: string };
      };
      readonly ctaKey: "mediaQuick.seeDetail";
    }
  | {
      readonly href: {
        readonly pathname: "/(tabs)/series/[id]";
        readonly params: { readonly id: string };
      };
      readonly ctaKey: "mediaQuick.seeDetail";
    }
  | {
      readonly href: "/(tabs)/queue";
      readonly ctaKey: "mediaQuick.seeDownloads";
    };

export type MediaQuickStatusTone =
  | "success"
  | "accent"
  | "warning"
  | "info"
  | "muted"
  | "danger";

export type MediaQuickChip = {
  readonly label: string;
  readonly tone: ChipTone;
};

export type MediaQuickViewModel = {
  readonly title: string;
  readonly subtitle: string | undefined;
  readonly posterUrl: string | undefined;
  /** Short glanceable facts rendered as chips. */
  readonly chips: readonly MediaQuickChip[];
  /** Secondary facts on one compact line (added, quality, size…). */
  readonly detailLine: string | undefined;
  readonly statusLine: string;
  readonly statusTone: MediaQuickStatusTone;
  readonly progress: number | undefined;
  readonly destination: PrimaryDestination;
};
