import {
  buildLocaleFallbackChain,
  calculateEffectiveTimeoutMs,
  normalizeAccessibilityProfile,
  requiresVisualSpeechFeedback,
  resolveExperienceProfile,
  resolveLocale,
  type AccessibilityProfile,
  type SupportedLocale,
} from "../../src/domains/accessibility";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function expectThrow(operation: () => unknown, expectedMessage: string): void {
  try {
    operation();
  } catch (error) {
    assert(error instanceof Error && error.message.includes(expectedMessage), expectedMessage);
    return;
  }
  throw new Error(`Expected operation to throw: ${expectedMessage}`);
}

const locales: SupportedLocale[] = [
  { locale: "zh-Hans-CN", languageCode: "zh", scriptCode: "Hans", regionCode: "CN", direction: "ltr" },
  { locale: "zh-Hant-TW", languageCode: "zh", scriptCode: "Hant", regionCode: "TW", direction: "ltr" },
  { locale: "en-US", languageCode: "en", regionCode: "US", direction: "ltr" },
];

const profile: AccessibilityProfile = {
  tenantPartition: "tenant-1",
  userId: "user-1",
  textScale: 1,
  lineHeightScale: 1.4,
  contrast: "system",
  motion: "system",
  captions: "system",
  screenReaderOptimized: false,
  dyslexiaFriendlyFont: false,
  simplifyLanguage: false,
  extendedTimeouts: false,
  inputPreference: "mixed",
  pronunciationFeedbackVisualized: false,
};

assert(
  resolveLocale("zh-Hant-HK", locales, "en-US", { preferredScriptCode: "Hant" }).locale === "zh-Hant-TW",
  "Locale resolution must prefer the requested script.",
);
expectThrow(() => resolveLocale("not_a_locale", locales, "en-US"), "Invalid BCP 47 locale");
assert(buildLocaleFallbackChain(locales[2], locales).join(",") === "en-US", "Fallback chain must be deterministic.");

const normalized = normalizeAccessibilityProfile({ ...profile, textScale: 10, lineHeightScale: 0.2 });
assert(normalized.textScale === 2 && normalized.lineHeightScale === 1, "Accessibility scales must be bounded.");
expectThrow(
  () => normalizeAccessibilityProfile({ ...profile, textScale: Number.NaN }),
  "textScale must be a finite number",
);

const resolved = resolveExperienceProfile({
  tenantPartition: "tenant-1",
  locale: locales[2],
  localization: {
    interfaceLocale: "en-US",
    learningLocale: "ja-JP",
    contentFallbackLocales: [],
    useNativeDigits: false,
    useLocalizedDates: true,
    useLocalizedNumbers: true,
  },
  accessibility: profile,
  systemSignals: {
    prefersReducedMotion: true,
    prefersHighContrast: true,
    captionsEnabled: true,
  },
});
assert(resolved.effectiveCaptions === "on", "System captions must be resolved.");
assert(requiresVisualSpeechFeedback(profile, resolved.effectiveCaptions), "Resolved captions must enable visual feedback.");
assert(calculateEffectiveTimeoutMs(5_000, { ...profile, extendedTimeouts: true }) === 10_000, "Timeout accommodation must apply.");

expectThrow(
  () =>
    resolveExperienceProfile({
      tenantPartition: "tenant-2",
      locale: locales[2],
      localization: resolved.localization,
      accessibility: profile,
      systemSignals: { prefersReducedMotion: false, prefersHighContrast: false, captionsEnabled: false },
    }),
  "Cross-tenant accessibility resolution",
);

console.log("Foundation accessibility contract tests passed.");
