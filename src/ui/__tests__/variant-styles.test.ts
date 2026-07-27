import { colors } from "@/lib/theme";
import {
  resolveButtonVariantStyle,
  resolveChipToneStyle,
  resolveIconButtonVariantStyle,
} from "@/ui/variant-styles";

describe("ui variant styles", () => {
  describe("resolveButtonVariantStyle", () => {
    it("maps primary to accent fill with bg label", () => {
      expect(resolveButtonVariantStyle("primary")).toEqual({
        backgroundColor: colors.accent,
        borderColor: "transparent",
        borderWidth: 0,
        labelColor: colors.bg,
      });
    });

    it("maps secondary to surface with border", () => {
      expect(resolveButtonVariantStyle("secondary")).toEqual({
        backgroundColor: colors.surface,
        borderColor: colors.borderSubtle,
        borderWidth: 1,
        labelColor: colors.text,
      });
    });

    it("maps ghost to transparent", () => {
      expect(resolveButtonVariantStyle("ghost")).toEqual({
        backgroundColor: "transparent",
        borderColor: "transparent",
        borderWidth: 0,
        labelColor: colors.text,
      });
    });

    it("maps danger to danger fill", () => {
      expect(resolveButtonVariantStyle("danger")).toEqual({
        backgroundColor: colors.danger,
        borderColor: "transparent",
        borderWidth: 0,
        labelColor: colors.text,
      });
    });
  });

  describe("resolveChipToneStyle", () => {
    it("maps neutral to surface and muted text", () => {
      expect(resolveChipToneStyle("neutral")).toEqual({
        backgroundColor: colors.surface,
        labelColor: colors.textMuted,
      });
    });

    it("maps accent to muted accent background", () => {
      expect(resolveChipToneStyle("accent")).toEqual({
        backgroundColor: colors.accentMuted,
        labelColor: colors.accent,
      });
    });

    it("maps success danger and warning tones", () => {
      expect(resolveChipToneStyle("success")).toEqual({
        backgroundColor: colors.successMuted,
        labelColor: colors.success,
      });
      expect(resolveChipToneStyle("danger")).toEqual({
        backgroundColor: colors.dangerMuted,
        labelColor: colors.danger,
      });
      expect(resolveChipToneStyle("warning")).toEqual({
        backgroundColor: colors.warningMuted,
        labelColor: colors.warning,
      });
    });
  });

  describe("resolveIconButtonVariantStyle", () => {
    it("maps default accent and outline variants", () => {
      expect(resolveIconButtonVariantStyle("default")).toEqual({
        backgroundColor: colors.surface,
        borderColor: "transparent",
        borderWidth: 0,
        iconColor: colors.text,
      });
      expect(resolveIconButtonVariantStyle("accent")).toEqual({
        backgroundColor: colors.accent,
        borderColor: "transparent",
        borderWidth: 0,
        iconColor: colors.bg,
      });
      expect(resolveIconButtonVariantStyle("outline")).toEqual({
        backgroundColor: "transparent",
        borderColor: colors.accent,
        borderWidth: 1.5,
        iconColor: colors.accent,
      });
    });
  });
});
