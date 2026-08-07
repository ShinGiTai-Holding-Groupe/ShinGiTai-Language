import {
  issueAssessmentDecision,
  type AssessmentDefinition,
  type AssessmentDecision,
} from "../domains/assessment";
import {
  recordLearningEvidence,
  transitionLearningEvidence,
  type LearningEvidenceRecord,
} from "../domains/learning-evidence";
import {
  applyLearningTransition,
  evaluatePromotion,
  type LearningTransition,
  type PromotionRule,
} from "../domains/promotion";
import {
  assertSameTenant,
  assertTenant,
  freezeDomain,
  type TenantContext,
} from "../domains/shared";
import type { FoundationPersistencePort } from "../persistence";

export interface Exercise extends TenantContext {
  readonly exerciseId: string;
  readonly activityId: string;
  readonly skillId: string;
  readonly expectedAnswer: string;
  readonly assessmentDefinition: AssessmentDefinition;
  readonly promotionRule: PromotionRule;
}
export interface LearnerAnswer extends TenantContext {
  readonly answerId: string;
  readonly exerciseId: string;
  readonly value: string;
  readonly submittedAt: string;
}
export interface CompleteExerciseInput extends TenantContext {
  readonly exercise: Exercise;
  readonly answer: LearnerAnswer;
  readonly requestId: string;
  readonly traceId?: string;
}
export interface LearningFoundationResult {
  readonly answer: Readonly<LearnerAnswer>;
  readonly evidence: LearningEvidenceRecord;
  readonly decision: AssessmentDecision;
  readonly transition: LearningTransition;
}
export interface FoundationIdPort {
  next(kind: "evidence" | "decision" | "transition"): string;
}
export interface FoundationClockPort {
  now(): string;
}

export class LearningFoundationService {
  constructor(
    private readonly persistence: FoundationPersistencePort,
    private readonly ids: FoundationIdPort,
    private readonly clock: FoundationClockPort,
  ) {}
  async completeExercise(input: CompleteExerciseInput): Promise<LearningFoundationResult> {
    assertTenant(input);
    assertSameTenant(input, input.exercise);
    assertSameTenant(input, input.answer);
    if (input.answer.exerciseId !== input.exercise.exerciseId)
      throw new Error("Answer does not belong to exercise");
    const answer = freezeDomain({ ...input.answer });
    const now = this.clock.now();
    const correct =
      answer.value.trim().toLocaleLowerCase() ===
      input.exercise.expectedAnswer.trim().toLocaleLowerCase();
    let evidence = recordLearningEvidence({
      tenantPartition: input.tenantPartition,
      userId: input.userId,
      ...(input.organizationId ? { organizationId: input.organizationId } : {}),
      evidenceId: this.ids.next("evidence"),
      activityId: input.exercise.activityId,
      exerciseId: input.exercise.exerciseId,
      answerId: answer.answerId,
      skillId: input.exercise.skillId,
      score: correct ? 1 : 0,
      confidence: 1,
      evaluatorType: "DETERMINISTIC",
      measurementStatus: "ASSESSED",
      recordedAt: now,
      provenance: {
        capabilityContractVersion: "language-foundation-v1",
        evaluationPolicyVersion: input.exercise.assessmentDefinition.policyVersion,
        evaluatorRelease: "deterministic-exact-match-v1",
        requestId: input.requestId,
        ...(input.traceId ? { traceId: input.traceId } : {}),
      },
    });
    evidence = transitionLearningEvidence(
      evidence,
      "VALIDATED",
      "deterministic-assessment-policy",
      now,
      input,
    );
    const decision = issueAssessmentDecision({
      ...input,
      assessmentDecisionId: this.ids.next("decision"),
      definition: input.exercise.assessmentDefinition,
      evidence: [evidence],
      issuedAt: now,
      integritySignature: `assessment:${input.requestId}:${evidence.evidenceId}`,
    });
    const transition = applyLearningTransition(
      evaluatePromotion({
        ...input,
        transitionId: this.ids.next("transition"),
        decision,
        rule: input.exercise.promotionRule,
        createdAt: now,
      }),
      input,
    );
    await this.persistence.saveEvidence(evidence, input);
    await this.persistence.saveDecision(decision, input);
    await this.persistence.saveTransition(transition, input);
    return freezeDomain({ answer, evidence, decision, transition });
  }
}
