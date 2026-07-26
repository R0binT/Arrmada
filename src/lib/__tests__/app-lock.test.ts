import * as Crypto from "expo-crypto";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

import {
  authenticateWithBiometrics,
  canUseBiometrics,
  disableVerrou,
  enableVerrou,
  isValidPin,
  isVerrouEnabled,
  verifyPin,
} from "../app-lock";

jest.mock("expo-secure-store", () => ({
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

jest.mock("expo-crypto", () => ({
  CryptoDigestAlgorithm: { SHA256: "SHA-256" },
  digestStringAsync: jest.fn(),
  getRandomBytesAsync: jest.fn(),
}));

jest.mock("expo-local-authentication", () => ({
  authenticateAsync: jest.fn(),
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
}));

const mockStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockCrypto = Crypto as jest.Mocked<typeof Crypto>;
const mockLocalAuth = LocalAuthentication as jest.Mocked<
  typeof LocalAuthentication
>;

describe("isValidPin", () => {
  it("accepts 4 to 6 digits", () => {
    expect(isValidPin("1234")).toBe(true);
    expect(isValidPin("12345")).toBe(true);
    expect(isValidPin("123456")).toBe(true);
  });

  it("rejects other lengths or non-digits", () => {
    expect(isValidPin("123")).toBe(false);
    expect(isValidPin("1234567")).toBe(false);
    expect(isValidPin("12ab")).toBe(false);
    expect(isValidPin("")).toBe(false);
  });
});

describe("verrou storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const memory = new Map<string, string>();
    mockStore.getItemAsync.mockImplementation(async (key) =>
      memory.has(key) ? (memory.get(key) ?? null) : null,
    );
    mockStore.setItemAsync.mockImplementation(async (key, value) => {
      memory.set(key, value);
    });
    mockStore.deleteItemAsync.mockImplementation(async (key) => {
      memory.delete(key);
    });
    mockCrypto.getRandomBytesAsync.mockResolvedValue(
      Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
    );
    mockCrypto.digestStringAsync.mockImplementation(async (_algo, value) =>
      Promise.resolve(`hash:${value}`),
    );
  });

  it("defaults to off", async () => {
    await expect(isVerrouEnabled()).resolves.toBe(false);
  });

  it("enables with PIN and verifies", async () => {
    await enableVerrou("2468");
    await expect(isVerrouEnabled()).resolves.toBe(true);
    await expect(verifyPin("2468")).resolves.toBe(true);
    await expect(verifyPin("0000")).resolves.toBe(false);
  });

  it("disables only with correct PIN", async () => {
    await enableVerrou("1357");
    await expect(disableVerrou("0000")).resolves.toBe(false);
    await expect(isVerrouEnabled()).resolves.toBe(true);
    await expect(disableVerrou("1357")).resolves.toBe(true);
    await expect(isVerrouEnabled()).resolves.toBe(false);
  });
});

describe("biometrics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reports unavailable when hardware or enrollment missing", async () => {
    mockLocalAuth.hasHardwareAsync.mockResolvedValue(true);
    mockLocalAuth.isEnrolledAsync.mockResolvedValue(false);
    await expect(canUseBiometrics()).resolves.toBe(false);
  });

  it("returns false when biometrics fail without throwing", async () => {
    mockLocalAuth.hasHardwareAsync.mockResolvedValue(true);
    mockLocalAuth.isEnrolledAsync.mockResolvedValue(true);
    mockLocalAuth.authenticateAsync.mockRejectedValue(new Error("denied"));
    await expect(authenticateWithBiometrics()).resolves.toBe(false);
  });

  it("returns true on successful biometric auth", async () => {
    mockLocalAuth.hasHardwareAsync.mockResolvedValue(true);
    mockLocalAuth.isEnrolledAsync.mockResolvedValue(true);
    mockLocalAuth.authenticateAsync.mockResolvedValue({
      success: true,
    } as LocalAuthentication.LocalAuthenticationResult);
    await expect(authenticateWithBiometrics()).resolves.toBe(true);
  });
});
