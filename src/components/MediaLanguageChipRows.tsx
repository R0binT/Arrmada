import { StyleSheet, View } from "react-native";

import { t } from "@/i18n";
import { useUiSize } from "@/lib/UiSizeProvider";
import { Chip } from "@/ui/Chip";
import { Text } from "@/ui/Text";
import type { ChipTone } from "@/ui/variant-styles";

type MediaLanguageChipRowsProps = {
  readonly audioLanguageCodes: readonly string[];
  readonly subtitleLanguageCodes: readonly string[];
  /** Compact: single line of chips without section labels (episode list). */
  readonly compact?: boolean;
};

type LabeledRowProps = {
  readonly label: string;
  readonly codes: readonly string[];
  readonly tone: ChipTone;
  readonly gap: number;
};

const LabeledRow = ({ label, codes, tone, gap }: LabeledRowProps) => {
  if (codes.length === 0) return null;
  return (
    <View style={[styles.row, { gap }]}>
      <Text role="caption" tone="muted">
        {label}
      </Text>
      {codes.map((code) => (
        <Chip key={`${label}-${code}`} tone={tone}>
          {code}
        </Chip>
      ))}
    </View>
  );
};

/**
 * Short audio / subtitle language codes from Arr mediaInfo.
 */
export const MediaLanguageChipRows = ({
  audioLanguageCodes,
  subtitleLanguageCodes,
  compact = false,
}: MediaLanguageChipRowsProps) => {
  const { space } = useUiSize();
  if (audioLanguageCodes.length === 0 && subtitleLanguageCodes.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <View style={[styles.row, { gap: space.xs }]}>
        {audioLanguageCodes.map((code) => (
          <Chip key={`audio-${code}`} tone="info">
            {code}
          </Chip>
        ))}
        {subtitleLanguageCodes.map((code) => (
          <Chip key={`sub-${code}`} tone="neutral">
            {`ST ${code}`}
          </Chip>
        ))}
      </View>
    );
  }

  return (
    <View style={{ gap: space.xs }}>
      <LabeledRow
        codes={audioLanguageCodes}
        gap={space.xs}
        label={t("detail.audioLanguages")}
        tone="info"
      />
      <LabeledRow
        codes={subtitleLanguageCodes}
        gap={space.xs}
        label={t("detail.subtitleLanguages")}
        tone="neutral"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
