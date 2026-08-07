import type { TenantContext } from "../shared";
import type { AssessmentChannelStatus } from "../accessibility";

export type LearningEvidenceStatus =
  | "PROPOSED"
  | "PENDING_VALIDATION"
  | "VALIDATED"
  | "REJECTED"
  | "DISPUTED"
  | "SUPERSEDED"
  | "REVOKED";
export type EvidenceEvaluatorType = "DETERMINISTIC" | "AI_ASSISTED" | "HUMAN_REVIEWED";
export interface EvidenceProvenance {
  readonly capabilityContractVersion: string;
  readonly evaluationPolicyVersion: string;
  readonly evaluatorRelease: string;
  readonly executionReceiptId?: string;
  readonly requestId: string;
  readonly traceId?: string;
  readonly supersedesEvidenceId?: string;
  readonly validatedAt?: string;
  readonly validatedBy?: string;
}
export interface LearningEvidenceRecord extends TenantContext {
  readonly evidenceId: string;
  readonly version: number;
  readonly activityId: string;
  readonly exerciseId: string;
  readonly answerId: string;
  readonly skillId: string;
  readonly score: number;
  readonly confidence: number;
  readonly evaluatorType: EvidenceEvaluatorType;
  readonly measurementStatus: AssessmentChannelStatus;
  readonly status: LearningEvidenceStatus;
  readonly recordedAt: string;
  readonly provenance: EvidenceProvenance;
}
export type RecordEvidenceInput = Omit<LearningEvidenceRecord, "version" | "status"> & {
  readonly initialStatus?: "PROPOSED" | "PENDING_VALIDATION";
};
