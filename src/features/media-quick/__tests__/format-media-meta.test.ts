import {
    formatPosterDate,
    formatRuntimeMinutes,
    formatSizeBytes,
} from "../format-media-meta";

it("formats bytes in French-ish Mo/Go", () => {
  expect(formatSizeBytes(1_500_000_000)).toMatch(/Go|Mo/);
});

it("formats runtime", () => {
  expect(formatRuntimeMinutes(118)).toBe("1 h 58 min");
  expect(formatRuntimeMinutes(45)).toBe("45 min");
});

it("formats compact poster dates", () => {
  const now = new Date("2026-07-26T12:00:00Z");
  expect(formatPosterDate("2026-07-28T20:00:00Z", now)).toMatch(/28/);
  expect(formatPosterDate("2027-01-05T20:00:00Z", now)).toMatch(/27/);
});
