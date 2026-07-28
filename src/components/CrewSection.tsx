import { View } from "react-native";

import type { CrewMember } from "@/arr-client";
import { t } from "@/i18n";
import { useUiSize } from "@/lib/UiSizeProvider";
import { Text } from "@/ui/Text";

type CrewSectionProps = {
  readonly members: readonly CrewMember[];
};

export const CrewSection = ({ members }: CrewSectionProps) => {
  const { space } = useUiSize();
  if (members.length === 0) return null;
  return (
    <View style={{ gap: space.xs }}>
      <Text role="headline">{t("detail.crew")}</Text>
      {members.map((member) => (
        <Text key={`${member.job}-${member.name}`} role="body" tone="muted">
          {`${member.job}: ${member.name}`}
        </Text>
      ))}
    </View>
  );
};
