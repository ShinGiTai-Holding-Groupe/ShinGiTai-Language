export type TextDirection = "ltr" | "rtl";

export type SupportedLocale = {
  locale: string;
  languageCode: string;
  regionCode?: string;
  scriptCode?: string;
  direction: TextDirection;
  fallbackLocale?: string;
};

export type LocalizationPreferences = {
  interfaceLocale: string;
  learningLocale: string;
  preferredScriptCode?: string;
  preferredRegionCode?: string;
  contentFallbackLocales: string[];
  useNativeDigits: boolean;
  useLocalizedDates: boolean;
  useLocalizedNumbers: boolean;
};

export type MotionPreference = "system" | "full" | "reduced" | "none";
export type ContrastPreference = "system" | "standard" | "high";
export type CaptionPreference = "system" | "on" | "off";
export type InputPreference = "pointer" | "keyboard" | "voice" | "switch" | "mixed";

export type AccessibilityProfile = {
  tenantPartition: string;
  userId: string;
  textScale: number;
  lineHeightScale: number;
  contrast: ContrastPreference;
  motion: MotionPreference;
  captions: CaptionPreference;
  screenReaderOptimized: boolean;
  dyslexiaFriendlyFont: boolean;
  simplifyLanguage: boolean;
  extendedTimeouts: boolean;
  inputPreference: InputPreference;
  pronunciationFeedbackVisualized: boolean;
};

export type ResolvedExperienceProfile = {
  locale: SupportedLocale;
  localization: LocalizationPreferences;
  accessibility: AccessibilityProfile;
  effectiveMotion: Exclude<MotionPreference, "system">;
  effectiveContrast: Exclude<ContrastPreference, "system">;
  effectiveCaptions: Exclude<CaptionPreference, "system">;
};

export type SystemAccessibilitySignals = {
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  captionsEnabled: boolean;
};

export type InclusiveInteractionRequirement = {
  featureKey: string;
  keyboardAccessible: boolean;
  screenReaderLabelRequired: boolean;
  captionsRequiredForAudio: boolean;
  transcriptRequiredForVideo: boolean;
  colorIndependentMeaning: boolean;
  timeoutExtensionSupported: boolean;
};
