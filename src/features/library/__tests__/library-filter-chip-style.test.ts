import { resolveLibraryFilterChipStyle } from "@/features/library/library-filter-chip-style";
import { colors } from "@/lib/theme";

it("tints inactive filters by meaning", () => {
  expect(resolveLibraryFilterChipStyle("dispo", false).labelColor).toBe(
    colors.success,
  );
  expect(resolveLibraryFilterChipStyle("aTelecharger", false).labelColor).toBe(
    colors.info,
  );
  expect(resolveLibraryFilterChipStyle("aVenir", false).labelColor).toBe(
    colors.warning,
  );
  expect(resolveLibraryFilterChipStyle("all", false).labelColor).toBe(
    colors.textMuted,
  );
});

it("uses solid fills when active", () => {
  expect(resolveLibraryFilterChipStyle("dispo", true).container).toEqual(
    expect.objectContaining({ backgroundColor: colors.success }),
  );
  expect(resolveLibraryFilterChipStyle("all", true).container).toEqual(
    expect.objectContaining({ backgroundColor: colors.accent }),
  );
  expect(resolveLibraryFilterChipStyle("aVenir", true).labelColor).toBe(
    colors.bg,
  );
});
