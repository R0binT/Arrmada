import {
  colors,
  elevation,
  fonts,
  minTouchTarget,
  motion,
  radii,
  space,
  theme,
  typeRoles,
} from "@/lib/theme";

describe("theme tokens", () => {
  it("keeps dark-cinema DNA anchors", () => {
    expect(colors.bg).toBe("#0B0B0F");
    expect(colors.text).toBe("#F4F0E8");
    expect(colors.accent).toBe("#F5A524");
    expect(colors.danger).toBe("#C45C4A");
    expect(colors.success).toBe("#6FBF7A");
  });

  it("exposes layered surfaces and borders", () => {
    expect(colors.bgElevated).toBeTruthy();
    expect(colors.surface).toBeTruthy();
    expect(colors.surfaceRaised).toBeTruthy();
    expect(colors.overlay).toBeTruthy();
    expect(colors.textMuted).toBeTruthy();
    expect(colors.textFaint).toBeTruthy();
    expect(colors.accentMuted).toBeTruthy();
    expect(colors.accentGlow).toBeTruthy();
    expect(colors.warning).toBeTruthy();
    expect(colors.info).toBe("#8B9BB4");
    expect(colors.infoMuted).toBeTruthy();
    expect(colors.scrim).toBeTruthy();
    expect(colors.overlaySolid).toBeTruthy();
    expect(colors.borderSubtle).toBeTruthy();
    expect(colors.borderInput).toBeTruthy();
    expect(colors.borderMuted).toBeTruthy();
    expect(colors.borderStrong).toBeTruthy();
    expect(colors.handle).toBeTruthy();
    expect(colors.neutralMuted).toBeTruthy();
    expect(colors.secondaryBorder).toBeTruthy();
  });

  it("exposes expanded space and radii", () => {
    expect(space["2xs"]).toBe(2);
    expect(space.xs).toBe(4);
    expect(space.sm).toBe(8);
    expect(space.md).toBe(16);
    expect(space.lg).toBe(24);
    expect(space.xl).toBe(32);
    expect(space["2xl"]).toBe(48);
    expect(radii.sm).toBeLessThan(radii.md);
    expect(radii.md).toBe(12);
    expect(radii.lg).toBe(16);
    expect(radii.xl).toBeGreaterThan(radii.lg);
    expect(radii.full).toBe(9999);
  });

  it("exposes fonts, type roles, elevation, motion, theme bag", () => {
    expect(fonts.display).toBe("Fraunces_600SemiBold");
    expect(fonts.ui).toBe("Figtree_400Regular");
    expect(typeRoles.display.fontFamily).toBe(fonts.display);
    expect(typeRoles.body.fontFamily).toBe(fonts.ui);
    expect(elevation.none).toEqual({});
    expect(motion.duration.fast).toBeLessThan(motion.duration.normal);
    expect(motion.duration.normal).toBeLessThan(motion.duration.slow);
    expect(minTouchTarget).toBe(44);
    expect(theme.colors).toBe(colors);
    expect(theme.space).toBe(space);
  });

  it("keeps legacy secondary alias for gradual migration", () => {
    expect(colors.secondary).toBe(colors.textMuted);
  });
});
