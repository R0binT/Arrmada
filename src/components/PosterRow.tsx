import type { ReactNode } from "react";
import { Children, isValidElement } from "react";
import { Pressable, ScrollView, View } from "react-native";
import Animated from "react-native-reanimated";

import { useI18n } from "@/i18n";
import { useUiSize } from "@/lib/UiSizeProvider";
import { createFadeSlideUp, pressScaleStyle, Text, useReduceMotion } from "@/ui";

type PosterRowProps = {
  readonly title: string;
  readonly children: ReactNode;
  readonly onSeeAll?: () => void;
};

export const PosterRow = ({ title, children, onSeeAll }: PosterRowProps) => {
  const { t } = useI18n();
  const { space, minTouchTarget } = useUiSize();
  const reduceMotion = useReduceMotion();

  const animatedChildren = Children.toArray(children).map((child, index) => {
    if (!isValidElement(child)) {
      return child;
    }
    return (
      <Animated.View
        key={child.key ?? `poster-row-item-${index}`}
        entering={createFadeSlideUp(reduceMotion, index)}
      >
        {child}
      </Animated.View>
    );
  });

  const headerContent = (
    <>
      <Text accessibilityRole="header" role="headline" style={{ flex: 1 }}>
        {title}
      </Text>
      {onSeeAll ? (
        <Text role="label" tone="accent">
          {t("action.seeAll")}
        </Text>
      ) : null}
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
            pressScaleStyle(pressed, reduceMotion),
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
          gap: space.sm,
          paddingHorizontal: space.md,
        }}
        showsHorizontalScrollIndicator={false}
      >
        {animatedChildren}
      </ScrollView>
    </View>
  );
};
