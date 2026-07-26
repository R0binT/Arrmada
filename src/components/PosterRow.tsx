import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useI18n } from "@/i18n";
import { colors, fonts } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

type PosterRowProps = {
  readonly title: string;
  readonly children: ReactNode;
  readonly onSeeAll?: () => void;
};

export const PosterRow = ({ title, children, onSeeAll }: PosterRowProps) => {
  const { t } = useI18n();
  const { space, fontSize, minTouchTarget } = useUiSize();
  const headerContent = (
    <>
      <Text
        accessibilityRole="header"
        style={[styles.title, { fontSize: fontSize(12) }]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.chevron,
          { fontSize: fontSize(18), paddingLeft: space.sm },
        ]}
      >
        ›
      </Text>
    </>
  );

  return (
    <View style={{ gap: space.sm }}>
      {onSeeAll ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("home.seeAllA11y", { title })}
          onPress={onSeeAll}
          style={({ pressed }) => [
            {
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "space-between",
              minHeight: minTouchTarget,
              paddingHorizontal: space.md,
            },
            pressed ? styles.headerPressed : null,
          ]}
        >
          {headerContent}
        </Pressable>
      ) : (
        <View
          style={{
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "space-between",
            minHeight: minTouchTarget,
            paddingHorizontal: space.md,
          }}
        >
          {headerContent}
        </View>
      )}
      <ScrollView
        horizontal
        contentContainerStyle={{
          gap: space.md,
          paddingHorizontal: space.md,
        }}
        showsHorizontalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  headerPressed: {
    opacity: 0.7,
  },
  title: {
    color: colors.secondary,
    flex: 1,
    fontFamily: fonts.uiMedium,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  chevron: {
    color: colors.secondary,
    fontFamily: fonts.ui,
  },
});
