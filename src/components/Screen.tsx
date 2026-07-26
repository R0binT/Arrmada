import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, space } from "@/lib/theme";

type ScreenProps = {
  readonly children: ReactNode;
  readonly scroll?: boolean;
};

export const Screen = ({ children, scroll = false }: ScreenProps) => {
  if (scroll) {
    return (
      <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
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
      <View style={styles.content}>{children}</View>
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
    paddingHorizontal: space.md,
    paddingVertical: space.md,
  },
  scroll: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
  },
});
