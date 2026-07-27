import { availabilityChipTone } from "@/features/library/availability-chip-tone";

it("maps availability to semantic chip tones", () => {
  expect(availabilityChipTone("dispo")).toBe("success");
  expect(availabilityChipTone("aTelecharger")).toBe("info");
  expect(availabilityChipTone("aVenir")).toBe("warning");
  expect(availabilityChipTone(undefined)).toBe("neutral");
});
