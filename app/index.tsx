import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { ensureArrConfigBootstrapped } from "@/lib/env-arr-config";
import { colors } from "@/lib/theme";

export default function Index() {
  const [target, setTarget] = useState<"/(tabs)" | "/onboarding" | null>(null);

  useEffect(() => {
    const resolveRoute = async () => {
      const config = await ensureArrConfigBootstrapped();
      setTarget(config ? "/(tabs)" : "/onboarding");
    };
    void resolveRoute();
  }, []);

  if (!target) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return <Redirect href={target} />;
}

const styles = StyleSheet.create({
  loading: {
    alignItems: "center",
    backgroundColor: colors.bg,
    flex: 1,
    justifyContent: "center",
  },
});
