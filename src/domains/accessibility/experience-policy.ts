import type {
  AccessibilityProfile,
  LocalizationPreferences,
  ResolvedExperienceProfile,
  SupportedLocale,
  SystemAccessibilitySignals,
} from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeAccessibilityProfile(profile: AccessibilityProfile): AccessibilityProfile {
  return {
    ...profile,
    textScale: clamp(profile.textScale, 0.8, 2),
    lineHeightScale: clamp(profile.lineHeightScale, 1, 2),
  };
}

export function resolveExperienceProfile(input: {
  locale: SupportedLocale;
  localization: LocalizationPreferences;
  accessibility: AccessibilityProfile;
  systemSignals: SystemAccessibilitySignals;
}): ResolvedExperienceProfile {
  const accessibility = normalizeAccessibilityProfile(input.accessibility);

  return {
    locale: input.locale,
    localization: input.localization,
    accessibility,
    effectiveMotion:
      accessibility.motion === "system"
        ? input.systemSignals.prefersReducedMotion
          ? "reduced"
          : "full"
        : accessibility.motion,
    effectiveContrast:
      accessibility.contrast === "system"
        ? input.systemSignals.prefersHighContrast
          ? "high"
          : "standard"
        : accessibility.contrast,
    effectiveCaptions:
      accessibility.captions === "system"
        ? input.systemSignals.captionsEnabled
          ? "on"
          : "off"
        : accessibility.captions,
  };
}

export function calculateEffectiveTimeoutMs(
  baseTimeoutMs: number,
  profile: AccessibilityProfile,
): number {
  if (!Number.isFinite(baseTimeoutMs) || baseTimeoutMs < 0) {
    throw new Error("baseTimeoutMs must be a non-negative finite number");
  }
  return profile.extendedTimeouts ? Math.round(baseTimeoutMs * 2) : baseTimeoutMs;
}

export function requiresVisualSpeechFeedback(profile: AccessibilityProfile): boolean {
  return profile.pronunciationFeedbackVisualized || profile.captions === "on";
}
