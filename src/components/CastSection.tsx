import { Image } from "expo-image";
import { ScrollView, StyleSheet, View } from "react-native";

import type { CastMember } from "@/arr-client";
import { t } from "@/i18n";
import { colors, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";
import { Text } from "@/ui/Text";

type CastSectionProps = {
  readonly members: readonly CastMember[];
  /** Section heading; defaults to detail.cast. */
  readonly title?: string;
};

const initialForName = (name: string): string => {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "?";
  return trimmed.charAt(0).toLocaleUpperCase();
};

/**
 * Renders up to six cast members as a horizontal rail of circular portraits.
 * Returns null when the list is empty.
 */
export const CastSection = ({ members, title }: CastSectionProps) => {
  const { space, scale } = useUiSize();
  if (members.length === 0) return null;

  const avatarSize = Math.round(64 * scale);
  const heading = title ?? t("detail.cast");

  return (
    <View style={{ gap: space.sm }}>
      <Text role="headline">{heading}</Text>
      <ScrollView
        contentContainerStyle={[styles.row, { gap: space.sm }]}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {members.map((member) => (
          <View
            key={member.name}
            style={[styles.item, { gap: space["2xs"], width: avatarSize + 8 }]}
          >
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                  height: avatarSize,
                  width: avatarSize,
                },
              ]}
            >
              {member.photoUrl ? (
                <Image
                  accessibilityIgnoresInvertColors
                  contentFit="cover"
                  source={{ uri: member.photoUrl }}
                  style={StyleSheet.absoluteFill}
                  transition={180}
                />
              ) : (
                <Text role="label" tone="muted">
                  {initialForName(member.name)}
                </Text>
              )}
            </View>
            <Text
              numberOfLines={2}
              role="caption"
              style={styles.name}
              tone="muted"
            >
              {member.name}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  item: {
    alignItems: "center",
  },
  avatar: {
    alignItems: "center",
    borderRadius: radii.full,
    borderWidth: 1,
    justifyContent: "center",
    overflow: "hidden",
  },
  name: {
    textAlign: "center",
    width: "100%",
  },
});
