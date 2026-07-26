import { StyleSheet, Text, View } from "react-native";

import {
  formatAddedDate,
  formatRuntimeMinutes,
  formatSizeBytes,
} from "@/features/media-quick/format-media-meta";
import { t } from "@/i18n";
import { colors, fonts, space } from "@/lib/theme";

type MediaMetaBlockProps = {
  readonly genres: readonly string[];
  readonly runtimeMinutes: number | undefined;
  readonly networkOrStudio: string | undefined;
  readonly added: string | undefined;
  readonly fileQuality?: string | undefined;
  readonly sizeOnDisk?: number | undefined;
};

export const MediaMetaBlock = ({
  genres,
  runtimeMinutes,
  networkOrStudio,
  added,
  fileQuality,
  sizeOnDisk,
}: MediaMetaBlockProps) => {
  const lines: string[] = [];
  if (genres.length > 0) {
    lines.push(genres.join(" · "));
  }
  if (runtimeMinutes !== undefined && runtimeMinutes > 0) {
    lines.push(formatRuntimeMinutes(runtimeMinutes));
  }
  if (networkOrStudio && networkOrStudio.trim().length > 0) {
    lines.push(networkOrStudio.trim());
  }
  const addedLabel = formatAddedDate(added);
  if (addedLabel) {
    lines.push(t("mediaQuick.addedOn", { date: addedLabel }));
  }
  if (fileQuality && fileQuality.trim().length > 0) {
    lines.push(fileQuality.trim());
  }
  if (sizeOnDisk !== undefined && sizeOnDisk > 0) {
    lines.push(formatSizeBytes(sizeOnDisk));
  }
  if (lines.length === 0) {
    return null;
  }
  return (
    <View style={styles.container}>
      {lines.map((line) => (
        <Text key={line} style={styles.line}>
          {line}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: space.xs,
    marginBottom: space.md,
  },
  line: {
    color: colors.secondary,
    fontFamily: fonts.ui,
    fontSize: 14,
  },
});
