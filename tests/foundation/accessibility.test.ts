import {
  buildLocaleFallbackChain,
  calculateEffectiveTimeoutMs,
  normalizeAccessibilityProfile,
  requiresVisualSpeechFeedback,
  resolveExperienceProfile,
  resolveLocale,
  resolveTextDirection,
  validateInclusiveInteraction,
  type AccessibilityProfile,
  type InclusiveInteractionRequirement,
  type SupportedLocale,
} from "../../src/domains/accessibility";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function expectThrow(operation: () => unknown, expectedMessage: string): void {
  try {
    operation();
  } catch (error) {
    assert(error instanceof Error, "Expected Error instance.");
    assert(
      error.message.includes(expectedMessage),
      `Expected error containing: ${expectedMessage}`,
    );
    return;
  }

  throw new Error(`Expected operation to throw: ${expectedMessage}`);
}

const locales: SupportedLocale[] = [
  {
    locale: "pl-PL",
    languageCode: "pl",
    regionCode: "PL",
    direction: "ltr",
    fallbackLocale: "en-US",
  },
  {
    locale: "en-US",
    languageCode: "en",
    regionCode: "US",
    direction: "ltr",
  },
  {
    locale: "ar-SA",
    languageCode: "ar",
    regionCode: "SA",
    direction: "rtl",
    fallbackLocale: "en-US",
  },
];

const baseProfile: AccessibilityProfile = {
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

function testLocaleResolution(): void {
  assert(
    resolveLocale("pl_PL", locales, "en-US").locale === "pl-PL",
    "Locale resolution must normalize underscores and match exact locale.",
  );
  assert(
    resolveLocale("PL-pl", locales, "en-US").locale === "pl-PL",
    "Locale resolution must be case-insensitive.",
  );
  assert(
    resolveLocale("ar-EG", locales, "en-US").locale === "ar-SA",
    "Locale resolution must fall back to a supported language variant.",
  );
  assert(
    resolveLocale("de-DE", locales, "en-US").locale === "en-US",
    "Unknown locale must resolve to configured default locale.",
  );
  assert(
    resolveLocale("de-DE", locales, "missing").locale === "pl-PL",
    "Missing default locale must fall back to the first supported locale.",
  );
  expectThrow(
    () => resolveLocale("pl-PL", [], "en-US"),
    "At least one supported locale is required",
  );

  assert(
    buildLocaleFallbackChain(locales[0], locales).join(",") === "pl-PL,en-US",
    "Fallback chain must follow configured locale links.",
  );

  const cyclicLocales: SupportedLocale[] = [
    {
      locale: "a-AA",
      languageCode: "a",
      direction: "ltr",
      fallbackLocale: "b-BB",
    },
    {
      locale: "b-BB",
      languageCode: "b",
      direction: "ltr",
      fallbackLocale: "a-AA",
    },
  ];
  assert(
    buildLocaleFallbackChain(cyclicLocales[0], cyclicLocales).join(",") ===
      "a-AA,b-BB",
    "Fallback chain must stop when a cycle is detected.",
  );
  assert(
    resolveTextDirection(locales[2]) === "rtl",
    "Text direction must be resolved from locale metadata.",
  );
}

function testExperienceResolution(): void {
  const normalized = normalizeAccessibilityProfile({
    ...baseProfile,
    textScale: 10,
    lineHeightScale: 0.2,
  });
  assert(normalized.textScale === 2, "Text scale must be clamped to 2x.");
  assert(
    normalized.lineHeightScale === 1,
    "Line-height scale must be clamped to the supported minimum.",
  );

  const resolved = resolveExperienceProfile({
    locale: locales[0],
    localization: {
      interfaceLocale: "pl-PL",
      learningLocale: "ja-JP",
      contentFallbackLocales: ["en-US"],
      useNativeDigits: false,
      useLocalizedDates: true,
      useLocalizedNumbers: true,
    },
    accessibility: baseProfile,
    systemSignals: {
      prefersReducedMotion: true,
      prefersHighContrast: true,
      captionsEnabled: true,
    },
  });

  assert(
    resolved.effectiveMotion === "reduced",
    "System reduced-motion signal must resolve the system preference.",
  );
  assert(
    resolved.effectiveContrast === "high",
    "System high-contrast signal must resolve the system preference.",
  );
  assert(
    resolved.effectiveCaptions === "on",
    "System caption signal must resolve the system preference.",
  );

  const explicit = resolveExperienceProfile({
    locale: locales[1],
    localization: resolved.localization,
    accessibility: {
      ...baseProfile,
      motion: "none",
      contrast: "standard",
      captions: "off",
    },
    systemSignals: {
      prefersReducedMotion: true,
      prefersHighContrast: true,
      captionsEnabled: true,
    },
  });
  assert(explicit.effectiveMotion === "none", "Explicit motion preference must win.");
  assert(
    explicit.effectiveContrast === "standard",
    "Explicit contrast preference must win.",
  );
  assert(explicit.effectiveCaptions === "off", "Explicit captions preference must win.");

  assert(
    calculateEffectiveTimeoutMs(5_000, baseProfile) === 5_000,
    "Base timeout must remain unchanged without an accommodation.",
  );
  assert(
    calculateEffectiveTimeoutMs(5_000, {
      ...baseProfile,
      extendedTimeouts: true,
    }) === 10_000,
    "Extended timeout accommodation must double the timeout.",
  );
  expectThrow(
    () => calculateEffectiveTimeoutMs(-1, baseProfile),
    "baseTimeoutMs must be a non-negative finite number",
  );

  assert(
    !requiresVisualSpeechFeedback(baseProfile),
    "Visual speech feedback must not be forced by default.",
  );
  assert(
    requiresVisualSpeechFeedback({
      ...baseProfile,
      pronunciationFeedbackVisualized: true,
    }),
    "Explicit visual pronunciation feedback must be respected.",
  );
  assert(
    requiresVisualSpeechFeedback({ ...baseProfile, captions: "on" }),
    "Enabled captions must require visual speech feedback.",
  );
}

function testInclusiveInteraction(): void {
  const requirement: InclusiveInteractionRequirement = {
    featureKey: "lesson.player",
    keyboardAccessible: true,
    screenReaderLabelRequired: true,
    captionsRequiredForAudio: true,
    transcriptRequiredForVideo: true,
    colorIndependentMeaning: true,
    timeoutExtensionSupported: true,
  };

  const compliant = validateInclusiveInteraction(requirement, {
    featureKey: "lesson.player",
    keyboardAccessible: true,
    hasScreenReaderLabel: true,
    hasCaptionsForAudio: true,
    hasTranscriptForVideo: true,
    meaningIndependentOfColor: true,
    timeoutExtensionSupported: true,
  });
  assert(compliant.compliant, "Complete interaction capability must pass.");
  assert(compliant.violations.length === 0, "Compliant capability must have no violations.");

  const mismatch = validateInclusiveInteraction(requirement, {
    featureKey: "lesson.quiz",
    keyboardAccessible: true,
    hasScreenReaderLabel: true,
    hasCaptionsForAudio: true,
    hasTranscriptForVideo: true,
    meaningIndependentOfColor: true,
    timeoutExtensionSupported: true,
  });
  assert(!mismatch.compliant, "Feature-key mismatch must fail validation.");
  assert(
    mismatch.violations.join(",") === "feature_key_mismatch",
    "Feature-key mismatch must return a deterministic violation.",
  );

  const incomplete = validateInclusiveInteraction(requirement, {
    featureKey: "lesson.player",
    keyboardAccessible: false,
    hasScreenReaderLabel: false,
    hasCaptionsForAudio: false,
    hasTranscriptForVideo: false,
    meaningIndependentOfColor: false,
    timeoutExtensionSupported: false,
  });
  assert(!incomplete.compliant, "Missing required capabilities must fail.");
  assert(
    incomplete.violations.join(",") ===
      "keyboard_access_missing,screen_reader_label_missing,audio_captions_missing,video_transcript_missing,color_only_meaning,timeout_extension_missing",
    "Accessibility violations must be complete and deterministically ordered.",
  );
}

testLocaleResolution();
testExperienceResolution();
testInclusiveInteraction();
console.log("Foundation accessibility contract tests passed.");
