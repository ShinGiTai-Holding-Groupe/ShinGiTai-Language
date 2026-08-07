import type { LearningEvidenceRecord } from "../learning-evidence";
import type { TenantContext } from "../shared";
export type AssessmentOutcome = "PASS" | "FAIL" | "INCOMPLETE" | "REVIEW_REQUIRED";
export interface RubricRequirement {
  readonly requirementId: string;
  readonly skillId: string;
  readonly minimumScore: number;
}
export interface AssessmentDefinition {
  readonly assessmentDefinitionId: string;
  readonly rubricVersion: string;
  readonly policyVersion: string;
  readonly requirements: readonly RubricRequirement[];
}
export interface AssessmentDecision extends TenantContext {
  readonly assessmentDecisionId: string;
  readonly assessmentDefinitionId: string;
  readonly version: number;
  readonly outcome: AssessmentOutcome;
  readonly evidenceIds: readonly string[];
  readonly satisfiedRequirementIds: readonly string[];
  readonly unsatisfiedRequirementIds: readonly string[];
  readonly rubricVersion: string;
  readonly policyVersion: string;
  readonly issuedAt: string;
  readonly issuedBy: "assessment_engine";
  readonly integritySignature: string;
}
export interface IssueAssessmentInput extends TenantContext {
  readonly assessmentDecisionId: string;
  readonly definition: AssessmentDefinition;
  readonly evidence: readonly LearningEvidenceRecord[];
  readonly issuedAt: string;
  readonly integritySignature: string;
}
