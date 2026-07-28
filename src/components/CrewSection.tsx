import { View } from "react-native";

import { formatCrewLine, type CrewMember } from "@/arr-client";
import { t } from "@/i18n";
import { useUiSize } from "@/lib/UiSizeProvider";
import { Text } from "@/ui/Text";

type CrewSectionProps = {
  readonly members: readonly CrewMember[];
};

export const CrewSection = ({ members }: CrewSectionProps) => {
  const { space } = useUiSize();
  const line = formatCrewLine(members);
  if (!line) return null;
  return (
    <View style={{ gap: space.xs }}>
      <Text role="headline">{t("detail.crew")}</Text>
      <Text role="body" tone="muted">
        {line}
      </Text>
    </View>
  );
};
