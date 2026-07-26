import { useEffect, useMemo, useRef } from "react";
import {
    Animated,
    Modal,
    PanResponder,
    Pressable,
    StyleSheet,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MediaQuickPanel } from "@/components/MediaQuickPanel";
import { buildMediaQuickViewModel } from "@/features/media-quick/build-media-quick-view-model";
import type {
    MediaQuickSelection,
    PrimaryDestination,
} from "@/features/media-quick/types";
import { t } from "@/i18n";
import { colors, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

type MediaQuickSheetProps = {
  readonly selection: MediaQuickSelection | undefined;
  readonly onDismiss: () => void;
  readonly onOpenPrimary: (destination: PrimaryDestination) => void;
};

const DISMISS_THRESHOLD = 80;
const DISMISS_VELOCITY = 0.55;
const SHEET_OFFSCREEN = 400;

export const MediaQuickSheet = ({
  selection,
  onDismiss,
  onOpenPrimary,
}: MediaQuickSheetProps) => {
  const visible = selection !== undefined;
  const insets = useSafeAreaInsets();
  const { space, scale } = useUiSize();
  const translateY = useRef(new Animated.Value(SHEET_OFFSCREEN)).current;
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const viewModel = useMemo(
    () => (selection ? buildMediaQuickViewModel(selection) : undefined),
    [selection],
  );

  useEffect(() => {
    if (!visible) {
      translateY.setValue(SHEET_OFFSCREEN);
      return;
    }
    Animated.timing(translateY, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [translateY, visible]);

  const dismiss = () => {
    Animated.timing(translateY, {
      toValue: SHEET_OFFSCREEN,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onDismissRef.current();
      }
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_event, gestureState) =>
          gestureState.dy > 2 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_event, gestureState) => {
          if (gestureState.dy > 0) {
            translateY.setValue(gestureState.dy);
          }
        },
        onPanResponderRelease: (_event, gestureState) => {
          const shouldDismiss =
            gestureState.dy > DISMISS_THRESHOLD ||
            (gestureState.dy > 0 && gestureState.vy > DISMISS_VELOCITY);
          if (shouldDismiss) {
            Animated.timing(translateY, {
              toValue: SHEET_OFFSCREEN,
              duration: 180,
              useNativeDriver: true,
            }).start(({ finished }) => {
              if (finished) {
                onDismissRef.current();
              }
            });
            return;
          }
          Animated.timing(translateY, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }).start();
        },
      }),
    [translateY],
  );

  if (!visible || !viewModel) {
    return null;
  }

  return (
    <Modal
      animationType="none"
      onRequestClose={dismiss}
      transparent
      visible={visible}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityLabel={t("mediaQuick.dismiss")}
          accessibilityRole="button"
          onPress={dismiss}
          style={styles.scrim}
        />
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, space.sm) },
            { transform: [{ translateY }] },
          ]}
        >
          <View
            accessibilityHint={t("mediaQuick.handleHint")}
            accessibilityLabel={t("mediaQuick.handle")}
            accessibilityRole="adjustable"
            hitSlop={{ top: 12, bottom: 12, left: 24, right: 24 }}
            style={[
              styles.dragHandle,
              {
                paddingBottom: space.xs,
                paddingTop: space.sm,
              },
            ]}
            {...panResponder.panHandlers}
          >
            <View
              style={[
                styles.dragHandleBar,
                {
                  height: Math.max(4, Math.round(4 * scale)),
                  width: Math.round(40 * scale),
                },
              ]}
            />
          </View>
          <MediaQuickPanel
            onOpenPrimary={onOpenPrimary}
            viewModel={viewModel}
          />
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
    backgroundColor: "rgba(11, 11, 15, 0.55)",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    overflow: "hidden",
  },
  dragHandle: {
    alignItems: "center",
    justifyContent: "center",
  },
  dragHandleBar: {
    backgroundColor: "rgba(244, 240, 232, 0.35)",
    borderRadius: 2,
  },
});
