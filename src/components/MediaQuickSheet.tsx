import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { formatCrewLine } from "@/arr-client";
import { MediaQuickPanel } from "@/components/MediaQuickPanel";
import { buildMediaQuickViewModel } from "@/features/media-quick/build-media-quick-view-model";
import type {
  MediaQuickAddActions,
  MediaQuickSelection,
  PrimaryDestination,
} from "@/features/media-quick/types";
import { useMovieCast } from "@/features/movies/use-movies";
import { useSeriesCast } from "@/features/series/use-series";
import { t } from "@/i18n";
import { colors, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";
import {
  sheetDismissDuration,
  sheetPresentDuration,
} from "@/ui/motion/presets";
import { useReduceMotion } from "@/ui/motion/use-reduce-motion";

type MediaQuickSheetProps = {
  readonly selection: MediaQuickSelection | undefined;
  readonly onDismiss: () => void;
  readonly onOpenPrimary: (destination: PrimaryDestination) => void;
  readonly addActions?: MediaQuickAddActions;
};

const DISMISS_THRESHOLD = 80;
const DISMISS_VELOCITY = 0.55;
const SHEET_OFFSCREEN = 400;

export const MediaQuickSheet = ({
  selection,
  onDismiss,
  onOpenPrimary,
  addActions,
}: MediaQuickSheetProps) => {
  const visible = selection !== undefined;
  const insets = useSafeAreaInsets();
  const { space, scale } = useUiSize();
  const reduceMotion = useReduceMotion();
  const translateY = useRef(new Animated.Value(SHEET_OFFSCREEN)).current;
  const scrimOpacity = useRef(new Animated.Value(0)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const movieId =
    selection?.kind === "movie" && selection.movieId !== undefined
      ? selection.movieId
      : 0;
  const seriesId =
    selection?.kind === "series" && selection.seriesId !== undefined
      ? selection.seriesId
      : 0;
  const movieCastQuery = useMovieCast(movieId);
  const seriesCastQuery = useSeriesCast(seriesId);

  const viewModel = useMemo(() => {
    if (!selection) return undefined;
    const credits =
      selection.kind === "movie"
        ? movieCastQuery.data
        : selection.kind === "series"
          ? seriesCastQuery.data
          : undefined;
    const fetchedNames = credits?.cast.map((member) => member.name);
    const castNames =
      selection.castNames && selection.castNames.length > 0
        ? selection.castNames
        : fetchedNames;
    const crewLine =
      selection.crewLine ??
      (credits?.crew.length ? formatCrewLine(credits.crew) : undefined);
    return buildMediaQuickViewModel({
      ...selection,
      castNames,
      crewLine,
    });
  }, [movieCastQuery.data, selection, seriesCastQuery.data]);

  useEffect(() => {
    if (!visible) {
      translateY.setValue(SHEET_OFFSCREEN);
      scrimOpacity.setValue(0);
      sheetOpacity.setValue(0);
      return;
    }

    const presentDuration = sheetPresentDuration(reduceMotion);
    if (reduceMotion) {
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
      return;
    }

    translateY.setValue(SHEET_OFFSCREEN);
    Animated.parallel([
      Animated.timing(scrimOpacity, {
        toValue: 1,
        duration: presentDuration,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: presentDuration,
        useNativeDriver: true,
      }),
    ]).start();
  }, [reduceMotion, scrimOpacity, sheetOpacity, translateY, visible]);

  const dismiss = useCallback(() => {
    const dismissDuration = sheetDismissDuration(reduceMotion);
    if (reduceMotion) {
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
          onDismissRef.current();
        }
      });
      return;
    }

    Animated.parallel([
      Animated.timing(scrimOpacity, {
        toValue: 0,
        duration: dismissDuration,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: SHEET_OFFSCREEN,
        duration: dismissDuration,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onDismissRef.current();
      }
    });
  }, [reduceMotion, scrimOpacity, sheetOpacity, translateY]);

  const panResponder = useMemo(
    () =>
      reduceMotion
        ? PanResponder.create({})
        : PanResponder.create({
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
                dismiss();
                return;
              }
              Animated.timing(translateY, {
                toValue: 0,
                duration: sheetDismissDuration(reduceMotion),
                useNativeDriver: true,
              }).start();
            },
          }),
    [dismiss, reduceMotion, translateY],
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
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: scrimOpacity }]}
        >
          <Pressable
            accessibilityLabel={t("mediaQuick.dismiss")}
            accessibilityRole="button"
            onPress={dismiss}
            style={styles.scrim}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, space.sm) },
            reduceMotion
              ? { opacity: sheetOpacity }
              : { transform: [{ translateY }] },
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
            addActions={addActions}
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
    backgroundColor: colors.scrim,
  },
  sheet: {
    backgroundColor: colors.surfaceRaised,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    overflow: "hidden",
  },
  dragHandle: {
    alignItems: "center",
    justifyContent: "center",
  },
  dragHandleBar: {
    backgroundColor: colors.handle,
    borderRadius: 2,
  },
});
