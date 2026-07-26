import * as Crypto from "expo-crypto";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

import { t } from "@/i18n";

const KEYS = {
  enabled: "arr.verrou.enabled",
  pinHash: "arr.verrou.pinHash",
  pinSalt: "arr.verrou.pinSalt",
} as const;

const PIN_PATTERN = /^\d{4,6}$/;

export const isValidPin = (pin: string): boolean => PIN_PATTERN.test(pin);

const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

const hashPin = async (pin: string, salt: string): Promise<string> =>
  Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${pin}`,
  );

const createSalt = async (): Promise<string> => {
  const bytes = await Crypto.getRandomBytesAsync(16);
  return bytesToHex(bytes);
};

export const isVerrouEnabled = async (): Promise<boolean> => {
  const value = await SecureStore.getItemAsync(KEYS.enabled);
  return value === "1";
};

export const enableVerrou = async (pin: string): Promise<void> => {
  if (!isValidPin(pin)) {
    throw new Error(t("verrou.pinInvalid"));
  }
  const salt = await createSalt();
  const pinHash = await hashPin(pin, salt);
  await Promise.all([
    SecureStore.setItemAsync(KEYS.pinSalt, salt),
    SecureStore.setItemAsync(KEYS.pinHash, pinHash),
    SecureStore.setItemAsync(KEYS.enabled, "1"),
  ]);
};

export const disableVerrou = async (pin: string): Promise<boolean> => {
  const ok = await verifyPin(pin);
  if (!ok) {
    return false;
  }
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.enabled),
    SecureStore.deleteItemAsync(KEYS.pinHash),
    SecureStore.deleteItemAsync(KEYS.pinSalt),
  ]);
  return true;
};

export const verifyPin = async (pin: string): Promise<boolean> => {
  if (!isValidPin(pin)) {
    return false;
  }
  const [salt, storedHash] = await Promise.all([
    SecureStore.getItemAsync(KEYS.pinSalt),
    SecureStore.getItemAsync(KEYS.pinHash),
  ]);
  if (!salt || !storedHash) {
    return false;
  }
  const candidate = await hashPin(pin, salt);
  return candidate === storedHash;
};

export const canUseBiometrics = async (): Promise<boolean> => {
  try {
    const [hasHardware, isEnrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hasHardware && isEnrolled;
  } catch {
    return false;
  }
};

export const authenticateWithBiometrics = async (): Promise<boolean> => {
  try {
    const available = await canUseBiometrics();
    if (!available) {
      return false;
    }
    const result = await LocalAuthentication.authenticateAsync({
      cancelLabel: t("verrou.usePin"),
      disableDeviceFallback: true,
      promptMessage: t("verrou.biometricPrompt"),
    });
    return result.success === true;
  } catch {
    return false;
  }
};
