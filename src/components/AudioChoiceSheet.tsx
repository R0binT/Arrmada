import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "@/i18n";
import { colors, fonts, minTouchTarget, radii, space } from "@/lib/theme";

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
            { paddingBottom: Math.max(insets.bottom, space.md) },
          ]}
        >
          <Text style={styles.title}>{t("audio.title")}</Text>
          <Text style={styles.message}>
            {t("audio.body", { quality: qualityName })}
          </Text>
          <Pressable
            accessibilityLabel={t("audio.vfA11y")}
            accessibilityRole="button"
            onPress={onChooseVf}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={styles.primaryButtonText}>VF</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={t("audio.voA11y")}
            accessibilityRole="button"
            onPress={onChooseVo}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={styles.secondaryButtonText}>VO</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={t("action.cancel")}
            accessibilityRole="button"
            onPress={onDismiss}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelText}>{t("action.cancel")}</Text>
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
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 22,
  },
  message: {
    color: colors.secondary,
    fontFamily: fonts.ui,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: space.sm,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    justifyContent: "center",
    minHeight: minTouchTarget,
  },
  primaryButtonText: {
    color: colors.bg,
    fontFamily: fonts.uiBold,
    fontSize: 16,
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: colors.accent,
    borderRadius: radii.md,
    borderWidth: 1.5,
    justifyContent: "center",
    minHeight: minTouchTarget,
  },
  secondaryButtonText: {
    color: colors.accent,
    fontFamily: fonts.uiBold,
    fontSize: 16,
  },
  cancelButton: {
    alignItems: "center",
    minHeight: minTouchTarget,
    justifyContent: "center",
  },
  cancelText: {
    color: colors.secondary,
    fontFamily: fonts.uiMedium,
    fontSize: 15,
  },
  pressed: {
    opacity: 0.85,
  },
});
