import {
  ensureArrConfigBootstrapped,
  readEnvArrConfigFrom,
} from "@/lib/env-arr-config";
import {
  isConfigComplete,
  loadArrConfig,
  markEnvBootstrapped,
  saveArrConfig,
  wasEnvBootstrapped,
} from "@/lib/secure-config";

jest.mock("@/lib/secure-config", () => ({
  isConfigComplete: jest.requireActual("@/lib/secure-config").isConfigComplete,
  loadArrConfig: jest.fn(),
  saveArrConfig: jest.fn(),
  wasEnvBootstrapped: jest.fn(),
  markEnvBootstrapped: jest.fn(),
}));

const mockLoad = loadArrConfig as jest.MockedFunction<typeof loadArrConfig>;
const mockSave = saveArrConfig as jest.MockedFunction<typeof saveArrConfig>;
const mockWasBootstrapped = wasEnvBootstrapped as jest.MockedFunction<
  typeof wasEnvBootstrapped
>;
const mockMarkBootstrapped = markEnvBootstrapped as jest.MockedFunction<
  typeof markEnvBootstrapped
>;

const completeEnv = {
  EXPO_PUBLIC_RADARR_URL: "http://192.168.1.10:7878",
  EXPO_PUBLIC_RADARR_API_KEY: "radarr-key",
  EXPO_PUBLIC_SONARR_URL: "http://192.168.1.10:8989",
  EXPO_PUBLIC_SONARR_API_KEY: "sonarr-key",
} as const;

describe("readEnvArrConfigFrom", () => {
  it("returns empty when env vars are missing", () => {
    expect(readEnvArrConfigFrom({})).toEqual({});
  });

  it("trims and ignores blank values", () => {
    expect(
      readEnvArrConfigFrom({
        EXPO_PUBLIC_RADARR_URL: "  http://192.168.1.10:7878  ",
        EXPO_PUBLIC_RADARR_API_KEY: "   ",
      }),
    ).toEqual({
      radarrUrl: "http://192.168.1.10:7878",
    });
  });

  it("reads all four EXPO_PUBLIC keys", () => {
    expect(readEnvArrConfigFrom(completeEnv)).toEqual({
      radarrUrl: "http://192.168.1.10:7878",
      radarrApiKey: "radarr-key",
      sonarrUrl: "http://192.168.1.10:8989",
      sonarrApiKey: "sonarr-key",
    });
  });
});

describe("ensureArrConfigBootstrapped", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWasBootstrapped.mockResolvedValue(false);
    mockMarkBootstrapped.mockResolvedValue(undefined);
  });

  it("keeps an existing complete Secure Store config", async () => {
    const stored = {
      radarrUrl: "http://stored:7878",
      radarrApiKey: "stored-r",
      sonarrUrl: "http://stored:8989",
      sonarrApiKey: "stored-s",
    };
    mockLoad.mockResolvedValue(stored);
    const actual = await ensureArrConfigBootstrapped(() =>
      readEnvArrConfigFrom(completeEnv),
    );
    expect(actual).toEqual(stored);
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("seeds Secure Store from env when store is empty", async () => {
    mockLoad.mockResolvedValue({});
    mockSave.mockResolvedValue(undefined);
    const actual = await ensureArrConfigBootstrapped(() =>
      readEnvArrConfigFrom(completeEnv),
    );
    expect(isConfigComplete(actual ?? {})).toBe(true);
    expect(mockSave).toHaveBeenCalledWith({
      radarrUrl: "http://192.168.1.10:7878",
      radarrApiKey: "radarr-key",
      sonarrUrl: "http://192.168.1.10:8989",
      sonarrApiKey: "sonarr-key",
    });
    expect(mockMarkBootstrapped).toHaveBeenCalled();
  });

  it("does not re-seed after a prior bootstrap when store was wiped", async () => {
    mockLoad.mockResolvedValue({});
    mockWasBootstrapped.mockResolvedValue(true);
    const actual = await ensureArrConfigBootstrapped(() =>
      readEnvArrConfigFrom(completeEnv),
    );
    expect(actual).toBeUndefined();
    expect(mockSave).not.toHaveBeenCalled();
    expect(mockMarkBootstrapped).not.toHaveBeenCalled();
  });

  it("returns undefined when neither store nor env is complete", async () => {
    mockLoad.mockResolvedValue({});
    const actual = await ensureArrConfigBootstrapped(() =>
      readEnvArrConfigFrom({
        ...completeEnv,
        EXPO_PUBLIC_SONARR_API_KEY: "",
      }),
    );
    expect(actual).toBeUndefined();
    expect(mockSave).not.toHaveBeenCalled();
  });
});
