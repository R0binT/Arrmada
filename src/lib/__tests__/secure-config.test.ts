import { isConfigComplete } from "../secure-config";

describe("isConfigComplete", () => {
  it("returns false when any field missing", () => {
    expect(
      isConfigComplete({
        radarrUrl: "http://a:7878",
        radarrApiKey: "k",
        sonarrUrl: "http://b:8989",
      }),
    ).toBe(false);
  });

  it("returns true when all fields present", () => {
    expect(
      isConfigComplete({
        radarrUrl: "http://a:7878",
        radarrApiKey: "k",
        sonarrUrl: "http://b:8989",
        sonarrApiKey: "s",
      }),
    ).toBe(true);
  });
});
