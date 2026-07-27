import { pressScaleStyle } from "@/ui/motion/presets";

describe("motion presets", () => {
  it("scales down when pressed unless reduce motion", () => {
    expect(pressScaleStyle(true, false)).toEqual({
      opacity: 0.92,
      transform: [{ scale: 0.97 }],
    });
    expect(pressScaleStyle(true, true)).toEqual({ opacity: 0.92 });
    expect(pressScaleStyle(false, false)).toEqual({});
  });
});
