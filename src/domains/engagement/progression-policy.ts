import type {
  ExperienceGrantRequest,
  ExperienceLedgerEntry,
  LearningActivityEvidence,
} from "./types";

const MAX_CONSISTENCY_SCORE = 100;

export function calculateConsistencyScore(evidence: LearningActivityEvidence): number {
  const plannedDays = Math.max(0, evidence.plannedLearningDays);
  const meaningfulDays = Math.max(0, evidence.meaningfulLearningDays);
  const recoverySessions = Math.max(0, evidence.completedRecoverySessions);
  if (plannedDays === 0) return 0;
  const completionRatio = Math.min(1, meaningfulDays / plannedDays);
  const recoveryCredit = Math.min(0.15, (recoverySessions / plannedDays) * 0.15);
  return Math.round(Math.min(1, completionRatio + recoveryCredit) * MAX_CONSISTENCY_SCORE);
}

export function grantExperience(
  request: ExperienceGrantRequest,
  existingEntries: readonly ExperienceLedgerEntry[],
  createEntryId: () => string,
): ExperienceLedgerEntry | null {
  if (!request.tenantPartition.trim() || !request.userId.trim()) {
    throw new Error("Experience grant requires tenantPartition and userId");
  }
  if (!request.idempotencyKey.trim() || !request.semanticPayloadHash.trim()) {
    throw new Error("Experience grant requires idempotencyKey and semanticPayloadHash");
  }
  if (!Number.isFinite(request.baseAmount) || request.baseAmount <= 0) return null;

  const duplicate = existingEntries.find(
    (entry) =>
      entry.tenantPartition === request.tenantPartition &&
      entry.userId === request.userId &&
      entry.idempotencyKey === request.idempotencyKey,
  );
  if (duplicate) {
    if (duplicate.semanticPayloadHash !== request.semanticPayloadHash) {
      throw new Error(`IDEMPOTENCY_PAYLOAD_CONFLICT:${request.idempotencyKey}`);
    }
    return null;
  }

  return {
    ...request,
    entryId: createEntryId(),
    grantedAmount: Math.floor(request.baseAmount),
  };
}
