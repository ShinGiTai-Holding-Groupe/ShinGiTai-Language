import type { InclusiveInteractionRequirement } from "./types";

export type InteractionCapability = {
  featureKey: string;
  keyboardAccessible: boolean;
  hasScreenReaderLabel: boolean;
  hasCaptionsForAudio: boolean;
  hasTranscriptForVideo: boolean;
  meaningIndependentOfColor: boolean;
  timeoutExtensionSupported: boolean;
};

export type InclusiveInteractionDecision = {
  compliant: boolean;
  violations: string[];
};

export function validateInclusiveInteraction(
  requirement: InclusiveInteractionRequirement,
  capability: InteractionCapability,
): InclusiveInteractionDecision {
  if (requirement.featureKey !== capability.featureKey) {
    return { compliant: false, violations: ["feature_key_mismatch"] };
  }

  const violations: string[] = [];
  if (requirement.keyboardAccessible && !capability.keyboardAccessible) {
    violations.push("keyboard_access_missing");
  }
  if (requirement.screenReaderLabelRequired && !capability.hasScreenReaderLabel) {
    violations.push("screen_reader_label_missing");
  }
  if (requirement.captionsRequiredForAudio && !capability.hasCaptionsForAudio) {
    violations.push("audio_captions_missing");
  }
  if (requirement.transcriptRequiredForVideo && !capability.hasTranscriptForVideo) {
    violations.push("video_transcript_missing");
  }
  if (requirement.colorIndependentMeaning && !capability.meaningIndependentOfColor) {
    violations.push("color_only_meaning");
  }
  if (requirement.timeoutExtensionSupported && !capability.timeoutExtensionSupported) {
    violations.push("timeout_extension_missing");
  }

  return { compliant: violations.length === 0, violations };
}
