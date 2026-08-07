import type { AssessmentDecision, AssessmentOutcome } from "../assessment";
import type { TenantContext } from "../shared";
export type PromotionTransitionType = "MODULE_UNLOCK" | "LEVEL_UNLOCK" | "REMEDIATION_REQUIRED";
export type PromotionTransitionStatus = "PROPOSED" | "APPLIED" | "REJECTED" | "REVERSED";
export interface PromotionRule {
  readonly ruleId: string;
  readonly version: string;
  readonly passTransition: Exclude<PromotionTransitionType, "REMEDIATION_REQUIRED">;
  readonly targetId: string;
  readonly remediationTargetId: string;
}
export interface LearningTransition extends TenantContext {
  readonly transitionId: string;
  readonly assessmentDecisionId: string;
  readonly assessmentOutcome: AssessmentOutcome;
  readonly type: PromotionTransitionType;
  readonly targetId: string;
  readonly ruleId: string;
  readonly ruleVersion: string;
  readonly status: PromotionTransitionStatus;
  readonly createdAt: string;
}
export interface EvaluatePromotionInput extends TenantContext {
  readonly transitionId: string;
  readonly decision: AssessmentDecision;
  readonly rule: PromotionRule;
  readonly createdAt: string;
}
