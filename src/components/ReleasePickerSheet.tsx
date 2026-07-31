import { useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { ReleaseOffer } from "@/arr-client";
import { formatBytes } from "@/components/format";
import { sortReleaseOffers } from "@/features/releases/filter-season-releases";
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

export type ReleasePickerSheetProps = {
  readonly visible: boolean;
  readonly loading: boolean;
  readonly errorMessage?: string;
  readonly releases: readonly ReleaseOffer[];
  readonly grabbingGuid?: string;
  readonly onSelect: (release: ReleaseOffer) => void;
  readonly onDismiss: () => void;
  readonly onRetry?: () => void;
};

export const ReleasePickerSheet = ({
  visible,
  loading,
  errorMessage,
  releases,
  grabbingGuid,
  onSelect,
  onDismiss,
  onRetry,
}: ReleasePickerSheetProps) => {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { space } = useUiSize();
  const reduceMotion = useReduceMotion();
  const scrimOpacity = useRef(new Animated.Value(0)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;
  const sortedReleases = useMemo(
    () => sortReleaseOffers(releases),
    [releases],
  );
  const isGrabbing = grabbingGuid !== undefined;

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

  const renderReleaseRow = ({ item }: { readonly item: ReleaseOffer }) => {
    const metaParts = [
      item.qualityName,
      formatBytes(item.size),
      item.seeders !== undefined
        ? t("release.seeders", { count: item.seeders })
        : undefined,
      item.indexer || undefined,
      item.languageNames.length > 0
        ? item.languageNames.join(", ")
        : undefined,
    ].filter((part): part is string => part !== undefined && part.length > 0);
    const meta = metaParts.join(" · ");
    const firstRejectionReason = item.rejectionReasons[0];
    const isThisGrabbing = grabbingGuid === item.guid;

    if (item.rejected) {
      return (
        <View style={[styles.row, { paddingVertical: space.sm }]}>
          <Text numberOfLines={2} role="body" tone="muted">
            {item.title}
          </Text>
          {meta.length > 0 ? (
            <Text role="caption" tone="muted">
              {meta}
            </Text>
          ) : null}
          <Text role="caption" tone="muted">
            {t("release.rejected")}
            {firstRejectionReason !== undefined
              ? `: ${firstRejectionReason}`
              : ""}
          </Text>
        </View>
      );
    }

    return (
      <Pressable
        accessibilityLabel={meta.length > 0 ? `${item.title}. ${meta}` : item.title}
        accessibilityRole="button"
        disabled={isGrabbing}
        onPress={() => {
          onSelect(item);
        }}
        style={({ pressed }) => [
          styles.row,
          {
            opacity: isGrabbing && !isThisGrabbing ? 0.5 : pressed ? 0.7 : 1,
            paddingVertical: space.sm,
          },
        ]}
      >
        <View style={styles.rowHeader}>
          <Text numberOfLines={2} role="body" style={styles.rowTitle}>
            {item.title}
          </Text>
          {isThisGrabbing ? (
            <ActivityIndicator color={colors.accent} size="small" />
          ) : null}
        </View>
        {meta.length > 0 ? (
          <Text role="caption" tone="muted">
            {meta}
          </Text>
        ) : null}
      </Pressable>
    );
  };

  const renderBody = () => {
    if (loading) {
      return (
        <View style={[styles.centered, { gap: space.sm, paddingVertical: space.lg }]}>
          <ActivityIndicator color={colors.accent} />
          <Text role="body" tone="muted">
            {t("release.loading")}
          </Text>
        </View>
      );
    }
    if (errorMessage !== undefined && errorMessage.length > 0) {
      return (
        <View style={{ gap: space.sm, paddingVertical: space.md }}>
          <Text role="body" tone="danger">
            {errorMessage}
          </Text>
          {onRetry !== undefined ? (
            <Button onPress={onRetry} variant="secondary">
              {t("action.retry")}
            </Button>
          ) : null}
        </View>
      );
    }
    if (sortedReleases.length === 0) {
      return (
        <View style={{ paddingVertical: space.md }}>
          <Text role="body" tone="muted">
            {t("release.noOffers")}
          </Text>
        </View>
      );
    }
    return (
      <FlatList
        data={sortedReleases}
        keyExtractor={(item) => `${item.indexerId}-${item.guid}`}
        renderItem={renderReleaseRow}
        style={styles.list}
      />
    );
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
            accessibilityLabel={t("action.cancel")}
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
          <Text role="title">{t("release.pickerTitle")}</Text>
          {renderBody()}
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
    maxHeight: "80%",
  },
  list: {
    flexGrow: 0,
    flexShrink: 1,
  },
  centered: {
    alignItems: "center",
  },
  row: {
    borderBottomColor: colors.borderMuted,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  rowTitle: {
    flex: 1,
  },
  fullWidth: {
    alignSelf: "stretch",
  },
});
