import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components";
import { t } from "@/i18n";
import { colors, fonts } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

export default function NotFoundScreen() {
  const { space, fontSize } = useUiSize();

  return (
    <>
      <Stack.Screen options={{ title: t("notFound.title") }} />
      <Screen>
        <View
          style={[
            styles.container,
            { padding: space.lg },
          ]}
        >
          <Text style={[styles.title, { fontSize: fontSize(22) }]}>
            {t("notFound.body")}
          </Text>
          <Link
            href="/"
            style={{ marginTop: space.md, paddingVertical: space.md }}
          >
            <Text style={[styles.linkText, { fontSize: fontSize(15) }]}>
              {t("notFound.homeLink")}
            </Text>
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
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    textAlign: "center",
  },
  linkText: {
    color: colors.accent,
    fontFamily: fonts.uiMedium,
  },
});
