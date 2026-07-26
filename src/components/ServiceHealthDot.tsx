import { StyleSheet, Text, View } from "react-native";

import type { ServiceHealth } from "@/arr-client";
import { ArrServiceLogo } from "@/components/ArrServiceLogo";
import { t } from "@/i18n";
import { colors, fonts } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

type ServiceHealthDotProps = {
  readonly health: ServiceHealth;
  /** False = status only (settings). True = name or logo + status. */
  readonly showLabel?: boolean;
  /** Home header: logo instead of “Radarr” / “Sonarr” text. */
  readonly useLogo?: boolean;
};

const SERVICE_LABELS: Record<ServiceHealth["service"], string> = {
  radarr: "Radarr",
  sonarr: "Sonarr",
};

export const ServiceHealthDot = ({
  health,
  showLabel = true,
  useLogo = false,
}: ServiceHealthDotProps) => {
  const { space, fontSize, scale } = useUiSize();
  const statusLabel = health.online ? t("health.online") : t("health.offline");
  const serviceLabel = SERVICE_LABELS[health.service];
  const dotColor = health.online ? colors.success : colors.secondary;
  const logoSize = Math.round(18 * scale);
  const dotSize = Math.max(8, Math.round(8 * scale));

  return (
    <View
      accessibilityLabel={`${serviceLabel} ${statusLabel}`}
      style={[styles.container, { gap: space.xs }]}
    >
      {useLogo ? (
        <ArrServiceLogo service={health.service} size={logoSize} />
      ) : null}
      <View
        style={[
          styles.dot,
          {
            backgroundColor: dotColor,
            borderRadius: dotSize / 2,
            height: dotSize,
            width: dotSize,
          },
        ]}
      />
      {showLabel ? (
        useLogo ? (
          <Text
            style={[
              styles.status,
              { fontSize: fontSize(12) },
              health.online ? styles.online : styles.offline,
            ]}
          >
            {statusLabel}
          </Text>
        ) : (
          <View style={styles.textBlock}>
            <Text style={[styles.service, { fontSize: fontSize(14) }]}>
              {serviceLabel}
            </Text>
            <Text
              style={[
                styles.status,
                { fontSize: fontSize(12) },
                health.online ? styles.online : styles.offline,
              ]}
            >
              {statusLabel}
            </Text>
          </View>
        )
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
  },
  dot: {},
  textBlock: {
    gap: 2,
  },
  service: {
    color: colors.text,
    fontFamily: fonts.uiMedium,
  },
  status: {
    fontFamily: fonts.ui,
  },
  online: {
    color: colors.accent,
  },
  offline: {
    color: colors.secondary,
  },
});
