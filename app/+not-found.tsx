import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components";
import { t } from "@/i18n";
import { colors, fonts, space } from "@/lib/theme";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: t("notFound.title") }} />
      <Screen>
        <View style={styles.container}>
          <Text style={styles.title}>{t("notFound.body")}</Text>
          <Link href="/" style={styles.link}>
            <Text style={styles.linkText}>{t("notFound.homeLink")}</Text>
          </Link>
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
    padding: space.lg,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 22,
    textAlign: "center",
  },
  link: {
    marginTop: space.md,
    paddingVertical: space.md,
  },
  linkText: {
    color: colors.accent,
    fontFamily: fonts.uiMedium,
    fontSize: 15,
  },
});
