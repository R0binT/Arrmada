import { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "@/i18n";
import { colors, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";
import { Button } from "@/ui/Button";
import {
  sheetDismissDuration,
  sheetPresentDuration,
} from "@/ui/motion/presets";
import { useReduceMotion } from "@/ui/motion/use-reduce-motion";
import { Text } from "@/ui/Text";

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
  const { space } = useUiSize();
  const reduceMotion = useReduceMotion();
  const scrimOpacity = useRef(new Animated.Value(0)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      scrimOpacity.setValue(0);
      sheetOpacity.setValue(0);
      return;
    }

    const presentDuration = sheetPresentDuration(reduceMotion);
    Animated.parallel([
      Animated.timing(scrimOpacity, {
        toValue: 1,
        duration: presentDuration,
        useNativeDriver: true,
      }),
      Animated.timing(sheetOpacity, {
        toValue: 1,
        duration: presentDuration,
        useNativeDriver: true,
      }),
    ]).start();
  }, [reduceMotion, scrimOpacity, sheetOpacity, visible]);

  const handleDismiss = () => {
    const dismissDuration = sheetDismissDuration(reduceMotion);
    Animated.parallel([
      Animated.timing(scrimOpacity, {
        toValue: 0,
        duration: dismissDuration,
        useNativeDriver: true,
      }),
      Animated.timing(sheetOpacity, {
        toValue: 0,
        duration: dismissDuration,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onDismiss();
      }
    });
  };

  return (
    <Modal
      animationType="none"
      onRequestClose={handleDismiss}
      transparent
      visible={visible}
    >
      <View style={styles.root}>
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: scrimOpacity }]}
        >
          <Pressable
            accessibilityLabel={t("audio.closeA11y")}
            accessibilityRole="button"
            onPress={handleDismiss}
            style={styles.scrim}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            {
              gap: space.sm,
              opacity: sheetOpacity,
              paddingBottom: Math.max(insets.bottom, space.md),
              paddingHorizontal: space.lg,
              paddingTop: space.lg,
            },
          ]}
        >
          <Text role="title">{t("audio.title")}</Text>
          <Text role="body" style={{ marginBottom: space.sm }} tone="muted">
            {t("audio.body", { quality: qualityName })}
          </Text>
          <Button
            accessibilityLabel={t("audio.vfA11y")}
            onPress={onChooseVf}
            style={styles.fullWidth}
          >
            VF
          </Button>
          <Button
            accessibilityLabel={t("audio.voA11y")}
            onPress={onChooseVo}
            style={styles.fullWidth}
            variant="secondary"
          >
            VO
          </Button>
          <Button onPress={handleDismiss} style={styles.fullWidth} variant="ghost">
            {t("action.cancel")}
          </Button>
        </Animated.View>
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
    backgroundColor: colors.scrim,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
  },
  fullWidth: {
    alignSelf: "stretch",
  },
});
