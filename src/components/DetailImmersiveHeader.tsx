import { Image } from "expo-image";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { IconButton } from "@/components/IconButton";
import { colors } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";
import { Skeleton, Text } from "@/ui";

type DetailImmersiveHeaderProps = {
  readonly title: string;
  readonly posterUrl: string | undefined;
  readonly backLabel: string;
  readonly onBack: () => void;
  readonly meta: ReactNode;
  readonly subtitle?: ReactNode;
};

const DetailGradientOverlay = () => (
  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <View
      style={[styles.overlayStep, { height: "35%", opacity: 0.15, top: 0 }]}
    />
    <View
      style={[styles.overlayStep, { height: "50%", opacity: 0.5, top: "25%" }]}
    />
    <View
      style={[
        styles.overlayStep,
        { backgroundColor: colors.bg, height: "40%", opacity: 0.65, top: "60%" },
      ]}
    />
  </View>
);

export const DetailImmersiveHeader = ({
  title,
  posterUrl,
  backLabel,
  onBack,
  meta,
  subtitle,
}: DetailImmersiveHeaderProps) => {
  const { space, scale } = useUiSize();
  const heroHeight = Math.round(248 * scale);

  return (
    <View
      style={{
        marginBottom: space.lg,
        marginHorizontal: -space.md,
        marginTop: -space.md,
      }}
    >
      <View style={{ height: heroHeight, overflow: "hidden" }}>
        {posterUrl ? (
          <Image
            accessibilityIgnoresInvertColors
            contentFit="cover"
            source={{ uri: posterUrl }}
            style={StyleSheet.absoluteFill}
            transition={200}
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              { alignItems: "center", backgroundColor: colors.surface, justifyContent: "center" },
            ]}
          >
            <Text role="display" tone="faint">
              {title.slice(0, 1).toUpperCase()}
            </Text>
          </View>
        )}
        <DetailGradientOverlay />
        <View
          style={{
            left: space.md,
            position: "absolute",
            top: space.sm,
            zIndex: 2,
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
            gap: space.sm,
            left: 0,
            padding: space.md,
            position: "absolute",
            right: 0,
            zIndex: 1,
          }}
        >
          <Text role="display">{title}</Text>
          {subtitle}
          {meta}
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
  const { space, scale } = useUiSize();
  const heroHeight = Math.round(248 * scale);

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
        height={heroHeight}
        style={{
          marginBottom: space.lg,
          marginHorizontal: -space.md,
          marginTop: -space.md,
        }}
      />
      <View style={{ gap: space.md }}>
        <Skeleton height={20} width="70%" />
        <Skeleton height={16} width="50%" />
        <Skeleton height={120} />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  overlayStep: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
    left: 0,
    right: 0,
  },
});
