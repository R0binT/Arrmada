import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "@/i18n";
import { colors, fonts, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

export type AudioChoiceSheetProps = {
  readonly visible: boolean;
  readonly qualityName: string;
  readonly onChooseVf: () => void;
  readonly onChooseVo: () => void;
  readonly onDismiss: () => void;
};

export const AudioChoiceSheet = ({
  visible,
  qualityName,
  onChooseVf,
  onChooseVo,
  onDismiss,
}: AudioChoiceSheetProps) => {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { space, fontSize, minTouchTarget } = useUiSize();

  return (
    <Modal
      animationType="slide"
      onRequestClose={onDismiss}
      transparent
      visible={visible}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityLabel={t("audio.closeA11y")}
          accessibilityRole="button"
          onPress={onDismiss}
          style={styles.scrim}
        />
        <View
          style={[
            styles.sheet,
            {
              gap: space.sm,
              paddingBottom: Math.max(insets.bottom, space.md),
              paddingHorizontal: space.lg,
              paddingTop: space.lg,
            },
          ]}
        >
          <Text style={[styles.title, { fontSize: fontSize(22) }]}>
            {t("audio.title")}
          </Text>
          <Text
            style={[
              styles.message,
              {
                fontSize: fontSize(14),
                lineHeight: fontSize(20),
                marginBottom: space.sm,
              },
            ]}
          >
            {t("audio.body", { quality: qualityName })}
          </Text>
          <Pressable
            accessibilityLabel={t("audio.vfA11y")}
            accessibilityRole="button"
            onPress={onChooseVf}
            style={({ pressed }) => [
              styles.primaryButton,
              { minHeight: minTouchTarget },
              pressed ? styles.pressed : null,
            ]}
          >
            <Text
              style={[styles.primaryButtonText, { fontSize: fontSize(16) }]}
            >
              VF
            </Text>
          </Pressable>
          <Pressable
            accessibilityLabel={t("audio.voA11y")}
            accessibilityRole="button"
            onPress={onChooseVo}
            style={({ pressed }) => [
              styles.secondaryButton,
              { minHeight: minTouchTarget },
              pressed ? styles.pressed : null,
            ]}
          >
            <Text
              style={[styles.secondaryButtonText, { fontSize: fontSize(16) }]}
            >
              VO
            </Text>
          </Pressable>
          <Pressable
            accessibilityLabel={t("action.cancel")}
            accessibilityRole="button"
            onPress={onDismiss}
            style={[styles.cancelButton, { minHeight: minTouchTarget }]}
          >
            <Text style={[styles.cancelText, { fontSize: fontSize(15) }]}>
              {t("action.cancel")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(11, 11, 15, 0.55)",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
  },
  message: {
    color: colors.secondary,
    fontFamily: fonts.ui,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    justifyContent: "center",
  },
  primaryButtonText: {
    color: colors.bg,
    fontFamily: fonts.uiBold,
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: colors.accent,
    borderRadius: radii.md,
    borderWidth: 1.5,
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: colors.accent,
    fontFamily: fonts.uiBold,
  },
  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    color: colors.secondary,
    fontFamily: fonts.uiMedium,
  },
  pressed: {
    opacity: 0.85,
  },
});
