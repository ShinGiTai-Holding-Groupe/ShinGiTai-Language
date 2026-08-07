import { assertTenant, freezeDomain, type TenantContext } from "../shared";
import type { LearningEvidenceRecord, LearningEvidenceStatus, RecordEvidenceInput } from "./types";

const transitions: Readonly<Record<LearningEvidenceStatus, readonly LearningEvidenceStatus[]>> = {
  PROPOSED: ["PENDING_VALIDATION"],
  PENDING_VALIDATION: ["VALIDATED", "REJECTED"],
  VALIDATED: ["DISPUTED", "SUPERSEDED", "REVOKED"],
  DISPUTED: ["VALIDATED", "REJECTED"],
  REJECTED: [],
  SUPERSEDED: [],
  REVOKED: [],
};
const forbidden = new Set(["provider", "physicalModel", "model", "node", "gpu", "endpoint"]);

function rejectExecutionPlane(value: object): void {
  for (const [key, item] of Object.entries(value)) {
    if (forbidden.has(key)) throw new Error(`Execution-plane field is forbidden: ${key}`);
    if (item && typeof item === "object") rejectExecutionPlane(item);
  }
}

export function recordLearningEvidence(input: RecordEvidenceInput): LearningEvidenceRecord {
  assertTenant(input);
  rejectExecutionPlane(input);
  if (!input.evidenceId.trim() || !input.answerId.trim() || !input.skillId.trim())
    throw new Error("Evidence identity is incomplete");
  if (
    !Number.isFinite(input.score) ||
    input.score < 0 ||
    input.score > 1 ||
    input.confidence < 0 ||
    input.confidence > 1
  )
    throw new Error("Evidence score and confidence must be bounded");
  if (input.measurementStatus === "ACCOMMODATED" && input.score !== 0)
    throw new Error("Accommodated-not-measured evidence cannot claim a score");
  return freezeDomain({
    ...input,
    version: 1,
    status:
      input.initialStatus ??
      (input.evaluatorType === "DETERMINISTIC" ? "PENDING_VALIDATION" : "PROPOSED"),
  });
}

export function transitionLearningEvidence(
  record: LearningEvidenceRecord,
  next: LearningEvidenceStatus,
  actor: string,
  at: string,
  tenant: TenantContext,
): LearningEvidenceRecord {
  assertTenant(tenant);
  if (
    record.tenantPartition !== tenant.tenantPartition ||
    record.userId !== tenant.userId ||
    record.organizationId !== tenant.organizationId
  )
    throw new Error("Cross-tenant evidence transition rejected");
  if (!transitions[record.status].includes(next))
    throw new Error(`Invalid evidence transition ${record.status} -> ${next}`);
  const provenance =
    next === "VALIDATED"
      ? { ...record.provenance, validatedAt: at, validatedBy: actor }
      : record.provenance;
  return freezeDomain({ ...record, version: record.version + 1, status: next, provenance });
}
