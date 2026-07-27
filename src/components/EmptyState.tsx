import { View } from "react-native";

import { useUiSize } from "@/lib/UiSizeProvider";
import { Button, Surface, Text } from "@/ui";

type EmptyStateProps = {
  readonly title: string;
  readonly message: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
};

export const EmptyState = ({
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) => {
  const { space } = useUiSize();

  return (
    <View
      style={{
        alignItems: "center",
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: space.xl,
        paddingVertical: space.xl,
      }}
    >
      <Surface
        padded
        radius="xl"
        style={{ alignItems: "center", gap: space.md, maxWidth: 320 }}
        tone="raised"
      >
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Text role="display" tone="faint">
            ⬇
          </Text>
        </View>
        <Text accessibilityRole="header" role="headline" style={{ textAlign: "center" }}>
          {title}
        </Text>
        <Text role="body" style={{ textAlign: "center" }} tone="muted">
          {message}
        </Text>
        {actionLabel && onAction ? (
          <Button onPress={onAction} variant="ghost">
            {actionLabel}
          </Button>
        ) : null}
      </Surface>
    </View>
  );
};
