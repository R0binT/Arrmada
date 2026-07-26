import { Image } from "expo-image";

import type { ArrService } from "@/arr-client";

/**
 * Local SVG marks (selfhst/icons). Rendered by expo-image — no react-native-svg.
 */
const SERVICE_LOGOS: Record<ArrService, number> = {
  radarr: require("../../assets/icons/radarr.svg"),
  sonarr: require("../../assets/icons/sonarr.svg"),
};

type ArrServiceLogoProps = {
  readonly service: ArrService;
  readonly size?: number;
};

export const ArrServiceLogo = ({
  service,
  size = 20,
}: ArrServiceLogoProps) => (
  <Image
    accessibilityIgnoresInvertColors
    contentFit="contain"
    source={SERVICE_LOGOS[service]}
    style={{ height: size, width: size }}
  />
);
