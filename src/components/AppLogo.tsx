import { Image } from "expo-image";

/**
 * Local SVG brand mark. Rendered by expo-image — same approach as ArrServiceLogo.
 */
const LOGO = require("../../assets/icons/arrmada-logo.svg");

type AppLogoProps = {
  readonly size?: number;
};

export const AppLogo = ({ size = 36 }: AppLogoProps) => (
  <Image
    accessibilityIgnoresInvertColors
    accessibilityLabel="Arrmada"
    contentFit="contain"
    source={LOGO}
    style={{ height: size, width: size }}
  />
);
