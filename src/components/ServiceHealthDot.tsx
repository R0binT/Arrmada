import { StyleSheet, Text, View } from "react-native";

import type { ServiceHealth } from "@/arr-client";
import { ArrServiceLogo } from "@/components/ArrServiceLogo";
import { t } from "@/i18n";
import { colors, fonts, space } from "@/lib/theme";

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
  const statusLabel = health.online ? t("health.online") : t("health.offline");
  const serviceLabel = SERVICE_LABELS[health.service];
  const dotColor = health.online ? colors.success : colors.secondary;

  return (
    <View
      accessibilityLabel={`${serviceLabel} ${statusLabel}`}
      style={styles.container}
    >
      {useLogo ? <ArrServiceLogo service={health.service} size={18} /> : null}
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      {showLabel ? (
        useLogo ? (
          <Text
            style={[
              styles.status,
              health.online ? styles.online : styles.offline,
            ]}
          >
            {statusLabel}
          </Text>
        ) : (
          <View style={styles.textBlock}>
            <Text style={styles.service}>{serviceLabel}</Text>
            <Text
              style={[
                styles.status,
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
    gap: space.xs,
  },
  dot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  textBlock: {
    gap: 2,
  },
  service: {
    color: colors.text,
    fontFamily: fonts.uiMedium,
    fontSize: 14,
  },
  status: {
    fontFamily: fonts.ui,
    fontSize: 12,
  },
  online: {
    color: colors.accent,
  },
  offline: {
    color: colors.secondary,
  },
});
