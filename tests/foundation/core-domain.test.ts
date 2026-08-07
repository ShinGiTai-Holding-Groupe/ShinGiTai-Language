import { issueAssessmentDecision, type AssessmentDefinition } from "../../src/domains/assessment";
import { resolveAssessmentChannel } from "../../src/domains/accessibility";
import {
  LearningFoundationService,
  type Exercise,
  type LearnerAnswer,
} from "../../src/application";
import {
  recordLearningEvidence,
  transitionLearningEvidence,
  type LearningEvidenceRecord,
} from "../../src/domains/learning-evidence";
import {
  projectAuthorizedPedagogicalMemory,
  recordPedagogicalObservation,
  validatePedagogicalObservation,
  type PedagogicalMemoryAuthorization,
} from "../../src/domains/pedagogical-memory";
import { applyLearningTransition, evaluatePromotion } from "../../src/domains/promotion";
import { InMemoryFoundationRepository } from "../../src/persistence";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function rejects(run: () => unknown, message: string): void {
  let rejected = false;
  try {
    run();
  } catch {
    rejected = true;
  }
  assert(rejected, message);
}
async function rejectsAsync(run: () => Promise<unknown>, message: string): Promise<void> {
  let rejected = false;
  try {
    await run();
  } catch {
    rejected = true;
  }
  assert(rejected, message);
}
const tenant = {
  tenantPartition: "tenant-1",
  userId: "learner-1",
  organizationId: "school-1",
} as const;
const foreign = {
  tenantPartition: "tenant-2",
  userId: "learner-1",
  organizationId: "school-1",
} as const;
const provenance = {
  capabilityContractVersion: "v1",
  evaluationPolicyVersion: "policy-1",
  evaluatorRelease: "deterministic-1",
  requestId: "request-1",
};
const baseEvidence = (patch: Partial<Parameters<typeof recordLearningEvidence>[0]> = {}) =>
  recordLearningEvidence({
    ...tenant,
    evidenceId: "evidence-1",
    activityId: "activity-1",
    exerciseId: "exercise-1",
    answerId: "answer-1",
    skillId: "skill-1",
    score: 1,
    confidence: 0.9,
    evaluatorType: "DETERMINISTIC",
    measurementStatus: "ASSESSED",
    recordedAt: "2026-08-07T00:00:00Z",
    provenance,
    ...patch,
  });
const validated = (
  patch: Partial<Parameters<typeof recordLearningEvidence>[0]> = {},
): LearningEvidenceRecord =>
  transitionLearningEvidence(
    baseEvidence(patch),
    "VALIDATED",
    "validator-1",
    "2026-08-07T00:01:00Z",
    tenant,
  );
const definition: AssessmentDefinition = {
  assessmentDefinitionId: "assessment-1",
  rubricVersion: "rubric-1",
  policyVersion: "policy-1",
  requirements: [{ requirementId: "requirement-1", skillId: "skill-1", minimumScore: 0.8 }],
};
const decision = (evidence: readonly LearningEvidenceRecord[]) =>
  issueAssessmentDecision({
    ...tenant,
    assessmentDecisionId: "decision-1",
    definition,
    evidence,
    issuedAt: "2026-08-07T00:02:00Z",
    integritySignature: "signed:decision-1",
  });

assert(
  baseEvidence().status === "PENDING_VALIDATION",
  "Deterministic evidence starts pending validation.",
);
assert(
  validated().status === "VALIDATED" && validated().version === 2,
  "Evidence validation is executable and versioned.",
);
assert(
  Object.isFrozen(validated()) && Object.isFrozen(validated().provenance),
  "Evidence is deeply immutable.",
);
assert(
  transitionLearningEvidence(validated(), "DISPUTED", "reviewer", "2026-08-07T00:03:00Z", tenant)
    .status === "DISPUTED",
  "Validated evidence can be disputed.",
);
assert(
  transitionLearningEvidence(validated(), "SUPERSEDED", "reviewer", "2026-08-07T00:03:00Z", tenant)
    .status === "SUPERSEDED",
  "Validated evidence can be superseded.",
);
assert(
  transitionLearningEvidence(validated(), "REVOKED", "reviewer", "2026-08-07T00:03:00Z", tenant)
    .status === "REVOKED",
  "Validated evidence can be revoked.",
);
rejects(
  () =>
    transitionLearningEvidence(
      validated(),
      "PENDING_VALIDATION",
      "x",
      "2026-08-07T00:03:00Z",
      tenant,
    ),
  "Invalid evidence transitions fail closed.",
);
rejects(
  () => transitionLearningEvidence(validated(), "DISPUTED", "x", "2026-08-07T00:03:00Z", foreign),
  "Evidence cannot cross tenant boundaries.",
);
rejects(
  () => baseEvidence({ provider: "forbidden" } as never),
  "Provider fields cannot enter educational evidence.",
);
rejects(
  () => baseEvidence({ measurementStatus: "ACCOMMODATED", score: 1 }),
  "Accommodation cannot claim measured mastery.",
);

const pass = decision([validated()]);
assert(
  pass.outcome === "PASS" && pass.issuedBy === "assessment_engine",
  "Assessment Engine alone issues PASS.",
);
assert(
  decision([validated({ score: 0 })]).outcome === "FAIL",
  "Assessment Engine deterministically issues FAIL.",
);
assert(
  decision([validated({ measurementStatus: "NOT_ASSESSED", score: 0 })]).outcome === "INCOMPLETE",
  "Missing evidence yields INCOMPLETE.",
);
assert(
  decision([validated({ measurementStatus: "ACCOMMODATED", score: 0 })]).outcome ===
    "REVIEW_REQUIRED",
  "Accommodation not measured yields REVIEW_REQUIRED.",
);
rejects(() => decision([baseEvidence()]), "Unvalidated evidence cannot be assessed.");
rejects(
  () => decision([validated({ tenantPartition: foreign.tenantPartition })]),
  "Assessment cannot mix tenants.",
);
assert(
  Object.isFrozen(pass) && Object.isFrozen(pass.evidenceIds),
  "AssessmentDecision is deeply immutable.",
);

const rule = {
  ruleId: "promotion-1",
  version: "1",
  passTransition: "MODULE_UNLOCK" as const,
  targetId: "module-2",
  remediationTargetId: "review-1",
};
const promoted = evaluatePromotion({
  ...tenant,
  transitionId: "transition-1",
  decision: pass,
  rule,
  createdAt: "2026-08-07T00:03:00Z",
});
assert(
  promoted.type === "MODULE_UNLOCK" && promoted.assessmentOutcome === "PASS",
  "Promotion consumes PASS without changing it.",
);
assert(
  applyLearningTransition(promoted, tenant).status === "APPLIED",
  "Promotion transition has an auditable apply step.",
);
const remediation = evaluatePromotion({
  ...tenant,
  transitionId: "transition-2",
  decision: decision([validated({ score: 0 })]),
  rule,
  createdAt: "2026-08-07T00:03:00Z",
});
assert(
  remediation.type === "REMEDIATION_REQUIRED" && remediation.assessmentOutcome === "FAIL",
  "FAIL creates remediation, never unlock.",
);
rejects(
  () => evaluatePromotion({ ...foreign, transitionId: "x", decision: pass, rule, createdAt: "x" }),
  "Promotion rejects tenant mismatch.",
);

const capability: PedagogicalMemoryAuthorization = {
  ...tenant,
  capabilityId: "memory-1",
  subject: tenant.userId,
  scopes: ["learner"],
  issuedAt: "2026-08-01T00:00:00Z",
  expiresAt: "2026-09-01T00:00:00Z",
  integrity: "trusted",
};
const verifier = {
  verify: (value: PedagogicalMemoryAuthorization) => value.integrity === "trusted",
};
const memory = validatePedagogicalObservation(
  recordPedagogicalObservation(
    {
      ...tenant,
      observationId: "memory-entry-1",
      subject: tenant.userId,
      scope: "learner",
      kind: "REVIEW_NEED",
      value: "review skill-1",
      authorizationCapabilityId: capability.capabilityId,
      provenance: {
        sourceType: "assessment_decision",
        sourceIds: [pass.assessmentDecisionId],
        recordedAt: "2026-08-07T00:04:00Z",
        recordedBy: "language-policy",
      },
    },
    capability,
    "2026-08-07T00:04:00Z",
    verifier,
  ),
  tenant,
);
assert(
  projectAuthorizedPedagogicalMemory([memory], tenant, capability, "2026-08-07T00:05:00Z", verifier)
    .length === 1,
  "Authorized pedagogical memory projects.",
);
const { version: _memoryVersion, status: _memoryStatus, ...memoryInput } = memory;
rejects(
  () =>
    recordPedagogicalObservation(
      { ...memoryInput, observationId: "forged" },
      { ...capability, integrity: "forged" },
      "2026-08-07T00:04:00Z",
      verifier,
    ),
  "Forged memory capability fails closed.",
);
rejects(
  () =>
    projectAuthorizedPedagogicalMemory(
      [memory],
      foreign,
      capability,
      "2026-08-07T00:05:00Z",
      verifier,
    ),
  "Memory cannot cross tenants.",
);

const accommodated = resolveAssessmentChannel({
  tenantPartition: tenant.tenantPartition,
  userId: tenant.userId,
  channel: "speaking",
  status: "ACCOMMODATED",
  measurement: "ACCOMMODATED_NOT_MEASURED",
});
assert(!accommodated.masteryEligible, "Accommodated-not-measured never becomes mastery.");
assert(
  resolveAssessmentChannel({
    tenantPartition: tenant.tenantPartition,
    userId: tenant.userId,
    channel: "speaking",
    status: "ASSESSED",
    measurement: "MEASURED",
  }).masteryEligible,
  "Only assessed measured channels are mastery eligible.",
);

const repository = new InMemoryFoundationRepository();
let sequence = 0;
const service = new LearningFoundationService(
  repository,
  { next: (kind) => `${kind}-${++sequence}` },
  { now: () => "2026-08-07T00:10:00Z" },
);
const exercise: Exercise = {
  ...tenant,
  exerciseId: "exercise-1",
  activityId: "activity-1",
  skillId: "skill-1",
  expectedAnswer: "bonjour",
  assessmentDefinition: definition,
  promotionRule: rule,
};
const answer: LearnerAnswer = {
  ...tenant,
  answerId: "answer-vertical",
  exerciseId: exercise.exerciseId,
  value: "bonjour",
  submittedAt: "2026-08-07T00:09:00Z",
};
const vertical = await service.completeExercise({
  ...tenant,
  exercise,
  answer,
  requestId: "request-vertical",
  traceId: "trace-vertical",
});
assert(
  vertical.evidence.status === "VALIDATED" &&
    vertical.decision.outcome === "PASS" &&
    vertical.transition.status === "APPLIED",
  "Contract vertical persists evidence, decision, and promotion.",
);
assert(Object.isFrozen(vertical.answer), "Submitted answer is immutable.");
assert(
  (await repository.loadDecision(vertical.decision.assessmentDecisionId, tenant))?.outcome ===
    "PASS",
  "Canonical decision persists in tenant scope.",
);
assert(
  (await repository.loadDecision(vertical.decision.assessmentDecisionId, foreign)) === undefined,
  "Foreign tenant cannot load persisted decision.",
);
await rejectsAsync(
  () => service.completeExercise({ ...foreign, exercise, answer, requestId: "attack" }),
  "Vertical rejects tenant switching before state mutation.",
);

console.log("Foundation canonical domain tests passed (32 behavioral checks).");
