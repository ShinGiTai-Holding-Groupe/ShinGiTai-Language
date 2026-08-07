import { assertSameTenant, assertTenant, freezeDomain } from "../shared";
import type { AssessmentDecision, IssueAssessmentInput } from "./types";

export function issueAssessmentDecision(input: IssueAssessmentInput): AssessmentDecision {
  assertTenant(input);
  if (
    !input.assessmentDecisionId.trim() ||
    !input.integritySignature.trim() ||
    !input.definition.requirements.length
  )
    throw new Error("Assessment definition and integrity are required");
  for (const evidence of input.evidence) {
    assertSameTenant(input, evidence);
    if (evidence.status !== "VALIDATED")
      throw new Error("Assessment accepts only validated evidence");
  }
  const satisfied: string[] = [];
  const unsatisfied: string[] = [];
  let incomplete = false;
  let review = false;
  for (const requirement of input.definition.requirements) {
    const candidates = input.evidence.filter((item) => item.skillId === requirement.skillId);
    if (
      !candidates.length ||
      candidates.every((item) =>
        ["NOT_ASSESSED", "NOT_APPLICABLE", "INSUFFICIENT_EVIDENCE"].includes(
          item.measurementStatus,
        ),
      )
    ) {
      incomplete = true;
      unsatisfied.push(requirement.requirementId);
      continue;
    }
    if (candidates.some((item) => item.measurementStatus === "ACCOMMODATED")) {
      review = true;
      unsatisfied.push(requirement.requirementId);
      continue;
    }
    (Math.max(...candidates.map((item) => item.score)) >= requirement.minimumScore
      ? satisfied
      : unsatisfied
    ).push(requirement.requirementId);
  }
  const outcome = incomplete
    ? "INCOMPLETE"
    : review
      ? "REVIEW_REQUIRED"
      : unsatisfied.length
        ? "FAIL"
        : "PASS";
  return freezeDomain({
    tenantPartition: input.tenantPartition,
    userId: input.userId,
    ...(input.organizationId ? { organizationId: input.organizationId } : {}),
    assessmentDecisionId: input.assessmentDecisionId,
    assessmentDefinitionId: input.definition.assessmentDefinitionId,
    version: 1,
    outcome,
    evidenceIds: input.evidence.map((item) => item.evidenceId),
    satisfiedRequirementIds: satisfied,
    unsatisfiedRequirementIds: unsatisfied,
    rubricVersion: input.definition.rubricVersion,
    policyVersion: input.definition.policyVersion,
    issuedAt: input.issuedAt,
    issuedBy: "assessment_engine" as const,
    integritySignature: input.integritySignature,
  });
}
