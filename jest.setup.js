import { setI18nLocale } from "@/i18n/t";

// Keep existing French assertions stable unless a test sets another locale.
setI18nLocale("fr");

jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "fr", languageTag: "fr-FR" }],
}));

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("react-native-worklets", () => ({
  runOnUI: (fn) => fn(),
  runOnJS: (fn) => fn(),
}));

jest.mock("react-native-reanimated", () => {
  const { View } = require("react-native");
  const animationBuilder = {
    duration: jest.fn(function duration() {
      return animationBuilder;
    }),
    delay: jest.fn(function delay() {
      return animationBuilder;
    }),
  };

  return {
    __esModule: true,
    default: {
      View,
      call: jest.fn(),
    },
    FadeIn: animationBuilder,
    FadeInDown: animationBuilder,
    useSharedValue: (initial) => ({ value: initial }),
    useAnimatedStyle: (factory) => factory(),
    withRepeat: (value) => value,
    withTiming: (value) => value,
  };
});
