import { Stack, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { Screen } from "@/components";
import { t } from "@/i18n";
import { useUiSize } from "@/lib/UiSizeProvider";
import { Button } from "@/ui/Button";
import { Text } from "@/ui/Text";

export default function NotFoundScreen() {
  const { space } = useUiSize();
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: t("notFound.title") }} />
      <Screen>
        <View style={[styles.container, { gap: space.md, padding: space.lg }]}>
          <Text role="title" style={styles.title}>
            {t("notFound.body")}
          </Text>
          <Button onPress={() => router.replace("/")}>
            {t("notFound.homeLink")}
          </Button>
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
  },
});
