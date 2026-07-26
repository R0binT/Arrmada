import {
  ensureArrConfigBootstrapped,
  readEnvArrConfig,
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

describe("readEnvArrConfig", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    delete process.env.EXPO_PUBLIC_RADARR_URL;
    delete process.env.EXPO_PUBLIC_RADARR_API_KEY;
    delete process.env.EXPO_PUBLIC_SONARR_URL;
    delete process.env.EXPO_PUBLIC_SONARR_API_KEY;
  });

  afterAll(() => {
    process.env = env;
  });

  it("returns empty when env vars are missing", () => {
    expect(readEnvArrConfig()).toEqual({});
  });

  it("trims and ignores blank values", () => {
    process.env.EXPO_PUBLIC_RADARR_URL = "  http://192.168.1.10:7878  ";
    process.env.EXPO_PUBLIC_RADARR_API_KEY = "   ";
    expect(readEnvArrConfig()).toEqual({
      radarrUrl: "http://192.168.1.10:7878",
    });
  });
});

describe("ensureArrConfigBootstrapped", () => {
  const env = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...env };
    process.env.EXPO_PUBLIC_RADARR_URL = "http://192.168.1.10:7878";
    process.env.EXPO_PUBLIC_RADARR_API_KEY = "radarr-key";
    process.env.EXPO_PUBLIC_SONARR_URL = "http://192.168.1.10:8989";
    process.env.EXPO_PUBLIC_SONARR_API_KEY = "sonarr-key";
    mockWasBootstrapped.mockResolvedValue(false);
    mockMarkBootstrapped.mockResolvedValue(undefined);
  });

  afterAll(() => {
    process.env = env;
  });

  it("keeps an existing complete Secure Store config", async () => {
    const stored = {
      radarrUrl: "http://stored:7878",
      radarrApiKey: "stored-r",
      sonarrUrl: "http://stored:8989",
      sonarrApiKey: "stored-s",
    };
    mockLoad.mockResolvedValue(stored);
    const actual = await ensureArrConfigBootstrapped();
    expect(actual).toEqual(stored);
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("seeds Secure Store from env when store is empty", async () => {
    mockLoad.mockResolvedValue({});
    mockSave.mockResolvedValue(undefined);
    const actual = await ensureArrConfigBootstrapped();
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
    const actual = await ensureArrConfigBootstrapped();
    expect(actual).toBeUndefined();
    expect(mockSave).not.toHaveBeenCalled();
    expect(mockMarkBootstrapped).not.toHaveBeenCalled();
  });

  it("returns undefined when neither store nor env is complete", async () => {
    mockLoad.mockResolvedValue({});
    process.env.EXPO_PUBLIC_SONARR_API_KEY = "";
    const actual = await ensureArrConfigBootstrapped();
    expect(actual).toBeUndefined();
    expect(mockSave).not.toHaveBeenCalled();
  });
});
