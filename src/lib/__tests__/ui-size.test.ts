import AsyncStorage from "@react-native-async-storage/async-storage";

import {
    DEFAULT_UI_SIZE,
    isUiSizeId,
    loadUiSize,
    resolveUiSizeScale,
    saveUiSize,
    scaledMinTouchTarget,
    scaleFontSize,
    scaleSpace,
    scaleStyleValues,
    UI_SIZE_SCALES,
} from "@/lib/ui-size";

describe("ui-size", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("maps presets to expected scales", () => {
    expect(UI_SIZE_SCALES.compact).toBe(0.9);
    expect(UI_SIZE_SCALES.normal).toBe(1);
    expect(UI_SIZE_SCALES.comfortable).toBe(1.15);
    expect(resolveUiSizeScale("normal")).toBe(1);
  });

  it("accepts only known ids", () => {
    expect(isUiSizeId("compact")).toBe(true);
    expect(isUiSizeId("huge")).toBe(false);
    expect(isUiSizeId(null)).toBe(false);
  });

  it("scales fonts and space", () => {
    expect(scaleFontSize(16, 0.9)).toBe(14.4);
    expect(scaleSpace(1.15).md).toBe(18);
  });

  it("keeps touch targets at least 44", () => {
    expect(scaledMinTouchTarget(0.9)).toBe(44);
    expect(scaledMinTouchTarget(1.15)).toBeGreaterThanOrEqual(44);
  });

  it("defaults to normal", () => {
    expect(DEFAULT_UI_SIZE).toBe("normal");
  });

  it("persists size and falls back for invalid values", async () => {
    expect(await loadUiSize()).toBe("normal");
    await saveUiSize("comfortable");
    expect(await loadUiSize()).toBe("comfortable");
    await AsyncStorage.setItem("arr.uiSize", "nope");
    expect(await loadUiSize()).toBe("normal");
  });

  it("scales typography and spacing style props only", () => {
    const actual = scaleStyleValues(
      {
        color: "#fff",
        fontSize: 16,
        lineHeight: 22,
        padding: 16,
        width: 108,
        height: "100%",
      },
      1.15,
    );
    expect(actual.fontSize).toBe(18.4);
    expect(actual.lineHeight).toBe(25.3);
    expect(actual.padding).toBe(18);
    expect(actual.width).toBe(108);
    expect(actual.height).toBe("100%");
    expect(actual.color).toBe("#fff");
  });

  it("returns same object reference when scale is 1", () => {
    const input = { fontSize: 16, padding: 8 };
    expect(scaleStyleValues(input, 1)).toBe(input);
  });
});
