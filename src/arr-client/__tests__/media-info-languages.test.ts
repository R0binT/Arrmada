import { mapMediaInfoLanguageCodes } from "../mappers/media-info-languages";

describe("mapMediaInfoLanguageCodes", () => {
  it("returns empty arrays when mediaInfo missing", () => {
    expect(mapMediaInfoLanguageCodes(undefined)).toEqual({
      audioLanguageCodes: [],
      subtitleLanguageCodes: [],
    });
  });

  it("parses slash-separated audioLanguages and subtitles", () => {
    expect(
      mapMediaInfoLanguageCodes({
        audioLanguages: "English / French",
        subtitles: "English / Spanish / French",
      }),
    ).toEqual({
      audioLanguageCodes: ["EN", "FR"],
      subtitleLanguageCodes: ["EN", "ES", "FR"],
    });
  });

  it("accepts already-short codes and dedupes", () => {
    expect(
      mapMediaInfoLanguageCodes({
        audioLanguages: "FR / fr / French",
        subtitles: "EN+FR",
      }),
    ).toEqual({
      audioLanguageCodes: ["FR"],
      subtitleLanguageCodes: ["EN", "FR"],
    });
  });

  it("falls back to languages array for audio when mediaInfo audio empty", () => {
    expect(
      mapMediaInfoLanguageCodes(
        { audioLanguages: "", subtitles: "German" },
        [{ name: "French" }, { name: "English" }],
      ),
    ).toEqual({
      audioLanguageCodes: ["FR", "EN"],
      subtitleLanguageCodes: ["DE"],
    });
  });

  it("ignores Unknown and empty tokens", () => {
    expect(
      mapMediaInfoLanguageCodes({
        audioLanguages: "Unknown / / French",
        subtitles: "Unknown",
      }),
    ).toEqual({
      audioLanguageCodes: ["FR"],
      subtitleLanguageCodes: [],
    });
  });
});
