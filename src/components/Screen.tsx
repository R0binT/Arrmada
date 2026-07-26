import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

type ScreenProps = {
  readonly children: ReactNode;
  readonly scroll?: boolean;
};

export const Screen = ({ children, scroll = false }: ScreenProps) => {
  const { space } = useUiSize();
  const contentPadding = {
    paddingHorizontal: space.md,
    paddingVertical: space.md,
  };

  if (scroll) {
    return (
      <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, contentPadding]}
          keyboardShouldPersistTaps="handled"
          style={styles.scroll}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
      <View style={[styles.content, contentPadding]}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  content: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  scroll: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
