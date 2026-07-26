import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useI18n } from "@/i18n";
import { colors, fonts, minTouchTarget, space } from "@/lib/theme";

type PosterRowProps = {
  readonly title: string;
  readonly children: ReactNode;
  readonly onSeeAll?: () => void;
};

export const PosterRow = ({ title, children, onSeeAll }: PosterRowProps) => {
  const { t } = useI18n();
  const headerContent = (
    <>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Text style={styles.chevron}>›</Text>
    </>
  );

  return (
    <View style={styles.container}>
      {onSeeAll ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("home.seeAllA11y", { title })}
          onPress={onSeeAll}
          style={({ pressed }) => [
            styles.header,
            pressed ? styles.headerPressed : null,
          ]}
        >
          {headerContent}
        </Pressable>
      ) : (
        <View style={styles.header}>{headerContent}</View>
      )}
      <ScrollView
        horizontal
        contentContainerStyle={styles.scrollContent}
        showsHorizontalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: space.sm,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: minTouchTarget,
    paddingHorizontal: space.md,
  },
  headerPressed: {
    opacity: 0.7,
  },
  title: {
    color: colors.secondary,
    flex: 1,
    fontFamily: fonts.uiMedium,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  chevron: {
    color: colors.secondary,
    fontFamily: fonts.ui,
    fontSize: 18,
    paddingLeft: space.sm,
  },
  scrollContent: {
    gap: space.md,
    paddingHorizontal: space.md,
  },
});
