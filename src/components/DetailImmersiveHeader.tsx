import { Image } from "expo-image";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconButton } from "@/components/IconButton";
import { colors, elevation, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";
import { Skeleton, Text } from "@/ui";

type DetailImmersiveHeaderProps = {
  readonly title: string;
  readonly posterUrl: string | undefined;
  readonly backLabel: string;
  readonly onBack: () => void;
  readonly meta: ReactNode;
  readonly subtitle?: ReactNode;
  readonly actions?: ReactNode;
};

const DetailGradientOverlay = () => (
  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <View style={[styles.overlayStep, styles.overlayTop]} />
    <View style={[styles.overlayStep, styles.overlayMid]} />
    <View style={[styles.overlayStep, styles.overlayLow]} />
    <View style={[styles.overlayStep, styles.overlayFloor]} />
  </View>
);

export const DetailImmersiveHeader = ({
  title,
  posterUrl,
  backLabel,
  onBack,
  meta,
  subtitle,
  actions,
}: DetailImmersiveHeaderProps) => {
  const insets = useSafeAreaInsets();
  const { space, scale } = useUiSize();
  const heroHeight = Math.round(440 * scale);
  const posterWidth = Math.round(112 * scale);
  const posterHeight = Math.round(168 * scale);

  return (
    <View
      style={{
        marginBottom: space.lg,
        marginHorizontal: -space.md,
        marginTop: -space.md - insets.top,
      }}
    >
      <View style={{ height: heroHeight + insets.top, overflow: "hidden" }}>
        {posterUrl ? (
          <Image
            accessibilityIgnoresInvertColors
            contentFit="cover"
            source={{ uri: posterUrl }}
            style={[StyleSheet.absoluteFill, styles.backdrop]}
            transition={220}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.placeholder]} />
        )}
        <DetailGradientOverlay />
        <View
          style={{
            left: space.md,
            position: "absolute",
            top: insets.top + space.sm,
            zIndex: 3,
          }}
        >
          <IconButton
            accessibilityLabel={backLabel}
            icon="←"
            onPress={onBack}
            variant="default"
          />
        </View>
        <View
          style={{
            bottom: 0,
            gap: space.md,
            left: 0,
            paddingBottom: space.lg,
            paddingHorizontal: space.md,
            position: "absolute",
            right: 0,
            zIndex: 2,
          }}
        >
          <View
            style={{
              alignItems: "flex-end",
              flexDirection: "row",
              gap: space.md,
            }}
          >
            {posterUrl ? (
              <View
                style={[
                  styles.posterFrame,
                  elevation.mid,
                  { height: posterHeight, width: posterWidth },
                ]}
              >
                <Image
                  accessibilityIgnoresInvertColors
                  contentFit="cover"
                  source={{ uri: posterUrl }}
                  style={StyleSheet.absoluteFill}
                  transition={220}
                />
              </View>
            ) : null}
            <View style={{ flex: 1, gap: space.xs, paddingBottom: space.xs }}>
              <Text numberOfLines={2} role="title" style={styles.title}>
                {title}
              </Text>
              {subtitle}
              {meta}
            </View>
          </View>
          {actions ? (
            <View style={{ gap: space.sm }}>{actions}</View>
          ) : null}
        </View>
      </View>
    </View>
  );
};

type DetailLoadingSkeletonProps = {
  readonly backLabel: string;
  readonly onBack: () => void;
};

export const DetailLoadingSkeleton = ({
  backLabel,
  onBack,
}: DetailLoadingSkeletonProps) => {
  const insets = useSafeAreaInsets();
  const { space, scale } = useUiSize();
  const heroHeight = Math.round(440 * scale);

  return (
    <>
      <View style={{ marginBottom: space.md }}>
        <IconButton
          accessibilityLabel={backLabel}
          icon="←"
          onPress={onBack}
        />
      </View>
      <Skeleton
        height={heroHeight + insets.top}
        style={{
          marginBottom: space.lg,
          marginHorizontal: -space.md,
          marginTop: -space.md - insets.top,
        }}
      />
      <View style={{ gap: space.md }}>
        <Skeleton height={28} width="75%" />
        <Skeleton height={16} width="45%" />
        <Skeleton height={140} />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  overlayStep: {
    ...StyleSheet.absoluteFill,
    left: 0,
    right: 0,
  },
  overlayTop: {
    backgroundColor: colors.bg,
    height: "32%",
    opacity: 0.45,
    top: 0,
  },
  overlayMid: {
    backgroundColor: colors.overlay,
    height: "40%",
    opacity: 0.45,
    top: "28%",
  },
  overlayLow: {
    backgroundColor: colors.bg,
    height: "48%",
    opacity: 0.82,
    top: "48%",
  },
  overlayFloor: {
    backgroundColor: colors.bg,
    height: "28%",
    opacity: 0.96,
    top: "78%",
  },
  backdrop: {
    transform: [{ scale: 1.1 }],
  },
  placeholder: {
    backgroundColor: colors.surfaceRaised,
  },
  posterFrame: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  title: {
    letterSpacing: -0.5,
    textShadowColor: colors.bg,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
});
