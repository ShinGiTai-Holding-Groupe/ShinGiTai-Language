import { assertSameTenant, assertTenant, assertValidDate, freezeDomain } from "../shared";
import type { AssessmentDecision, IssueAssessmentInput } from "./types";

const issuedDecisions = new WeakSet<AssessmentDecision>();

export function isIssuedAssessmentDecision(decision: AssessmentDecision): boolean {
  return issuedDecisions.has(decision);
}

export function issueAssessmentDecision(input: IssueAssessmentInput): AssessmentDecision {
  assertTenant(input);
  assertValidDate(input.issuedAt, "issuedAt");
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
  for (const requirement of input.definition.requirements) {
    if (
      !requirement.requirementId.trim() ||
      !requirement.skillId.trim() ||
      !Number.isFinite(requirement.minimumScore) ||
      requirement.minimumScore < 0 ||
      requirement.minimumScore > 1
    )
      throw new Error("Assessment requirement is invalid");
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
  const outcome: AssessmentDecision["outcome"] = incomplete
    ? "INCOMPLETE"
    : review
      ? "REVIEW_REQUIRED"
      : unsatisfied.length
        ? "FAIL"
        : "PASS";
  const decision = freezeDomain({
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
  issuedDecisions.add(decision);
  return decision;
}
