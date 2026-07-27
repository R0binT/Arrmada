export { colors } from "@/lib/theme/colors";
export { space } from "@/lib/theme/space";
export { radii } from "@/lib/theme/radii";
export { fonts, typeRoles, type TypeRole, type TypeRoleName } from "@/lib/theme/typography";
export { elevation } from "@/lib/theme/elevation";
export { motion } from "@/lib/theme/motion";

export const minTouchTarget = 44;

import { colors } from "@/lib/theme/colors";
import { elevation } from "@/lib/theme/elevation";
import { fonts, typeRoles } from "@/lib/theme/typography";
import { motion } from "@/lib/theme/motion";
import { radii } from "@/lib/theme/radii";
import { space } from "@/lib/theme/space";

export const theme = {
  colors,
  space,
  radii,
  fonts,
  typeRoles,
  elevation,
  motion,
  minTouchTarget,
} as const;
