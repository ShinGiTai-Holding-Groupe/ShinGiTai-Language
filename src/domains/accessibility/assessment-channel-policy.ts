import type { AssessmentChannelResult } from "./types";
export function resolveAssessmentChannel(
  input: Omit<AssessmentChannelResult, "masteryEligible">,
): AssessmentChannelResult {
  if (input.status === "ACCOMMODATED" && input.measurement !== "ACCOMMODATED_NOT_MEASURED")
    throw new Error("Accommodation must preserve what was not measured");
  return Object.freeze({
    ...input,
    masteryEligible: input.status === "ASSESSED" && input.measurement === "MEASURED",
  });
}
