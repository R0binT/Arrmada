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
        borderColor: colors.borderMuted,
        borderWidth: 1,
        labelColor: colors.text,
      });
    });

    it("maps ghost to muted text", () => {
      expect(resolveButtonVariantStyle("ghost")).toEqual({
        backgroundColor: "transparent",
        borderColor: "transparent",
        borderWidth: 0,
        labelColor: colors.textMuted,
      });
    });

    it("maps ghostAccent to accent outline", () => {
      expect(resolveButtonVariantStyle("ghostAccent")).toEqual({
        backgroundColor: colors.accentMuted,
        borderColor: colors.accent,
        borderWidth: 1,
        labelColor: colors.accent,
      });
    });

    it("maps danger to danger tint outline", () => {
      expect(resolveButtonVariantStyle("danger")).toEqual({
        backgroundColor: colors.dangerMuted,
        borderColor: colors.danger,
        borderWidth: 1,
        labelColor: colors.danger,
      });
    });
  });

  describe("resolveChipToneStyle", () => {
    it("maps neutral to raised surface and muted text", () => {
      expect(resolveChipToneStyle("neutral")).toEqual({
        backgroundColor: colors.surfaceRaised,
        borderColor: colors.borderMuted,
        labelColor: colors.textMuted,
      });
    });

    it("maps accent to soft tint with accent label", () => {
      expect(resolveChipToneStyle("accent")).toEqual({
        backgroundColor: colors.accentMuted,
        borderColor: colors.accent,
        labelColor: colors.accent,
      });
    });

    it("maps success danger warning and info to soft tints", () => {
      expect(resolveChipToneStyle("success")).toEqual({
        backgroundColor: colors.successMuted,
        borderColor: colors.success,
        labelColor: colors.success,
      });
      expect(resolveChipToneStyle("danger")).toEqual({
        backgroundColor: colors.dangerMuted,
        borderColor: colors.danger,
        labelColor: colors.danger,
      });
      expect(resolveChipToneStyle("warning")).toEqual({
        backgroundColor: colors.warningMuted,
        borderColor: colors.warning,
        labelColor: colors.warning,
      });
      expect(resolveChipToneStyle("info")).toEqual({
        backgroundColor: colors.infoMuted,
        borderColor: colors.info,
        labelColor: colors.info,
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
