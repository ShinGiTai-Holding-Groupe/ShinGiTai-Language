import type {
  AccessibilityProfile,
  LocalizationPreferences,
  ResolvedExperienceProfile,
  SupportedLocale,
  SystemAccessibilitySignals,
} from "./types";

function clampFinite(value: number, min: number, max: number, field: string): number {
  if (!Number.isFinite(value)) throw new Error(`${field} must be a finite number`);
  return Math.min(max, Math.max(min, value));
}

export function normalizeAccessibilityProfile(profile: AccessibilityProfile): AccessibilityProfile {
  if (!profile.tenantPartition.trim() || !profile.userId.trim()) {
    throw new Error("Accessibility profile requires tenantPartition and userId");
  }
  return {
    ...profile,
    textScale: clampFinite(profile.textScale, 0.8, 2, "textScale"),
    lineHeightScale: clampFinite(profile.lineHeightScale, 1, 2, "lineHeightScale"),
  };
}

export function resolveExperienceProfile(input: {
  tenantPartition: string;
  locale: SupportedLocale;
  localization: LocalizationPreferences;
  accessibility: AccessibilityProfile;
  systemSignals: SystemAccessibilitySignals;
}): ResolvedExperienceProfile {
  if (input.accessibility.tenantPartition !== input.tenantPartition) {
    throw new Error("Cross-tenant accessibility resolution is forbidden");
  }
  const accessibility = normalizeAccessibilityProfile(input.accessibility);
  const effectiveCaptions =
    accessibility.captions === "system"
      ? input.systemSignals.captionsEnabled
        ? "on"
        : "off"
      : accessibility.captions;

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
    effectiveCaptions,
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

export function requiresVisualSpeechFeedback(
  profile: AccessibilityProfile,
  resolvedCaptions?: "on" | "off",
): boolean {
  return profile.pronunciationFeedbackVisualized || resolvedCaptions === "on";
}
