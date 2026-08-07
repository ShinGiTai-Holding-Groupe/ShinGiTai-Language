import { assertSameTenant, assertTenant, freezeDomain } from "../shared";
import type { EvaluatePromotionInput, LearningTransition } from "./types";

export function evaluatePromotion(input: EvaluatePromotionInput): LearningTransition {
  assertTenant(input);
  assertSameTenant(input, input.decision);
  if (input.decision.issuedBy !== "assessment_engine" || !input.decision.integritySignature)
    throw new Error("Promotion requires an authoritative AssessmentDecision");
  const passed = input.decision.outcome === "PASS";
  return freezeDomain({
    tenantPartition: input.tenantPartition,
    userId: input.userId,
    ...(input.organizationId ? { organizationId: input.organizationId } : {}),
    transitionId: input.transitionId,
    assessmentDecisionId: input.decision.assessmentDecisionId,
    assessmentOutcome: input.decision.outcome,
    type: passed ? input.rule.passTransition : "REMEDIATION_REQUIRED",
    targetId: passed ? input.rule.targetId : input.rule.remediationTargetId,
    ruleId: input.rule.ruleId,
    ruleVersion: input.rule.version,
    status: "PROPOSED",
    createdAt: input.createdAt,
  });
}

export function applyLearningTransition(
  transition: LearningTransition,
  tenant: Pick<LearningTransition, "tenantPartition" | "userId" | "organizationId">,
): LearningTransition {
  assertSameTenant(tenant, transition);
  if (transition.status !== "PROPOSED") throw new Error("Only proposed transitions may be applied");
  return freezeDomain({ ...transition, status: "APPLIED" as const });
}
