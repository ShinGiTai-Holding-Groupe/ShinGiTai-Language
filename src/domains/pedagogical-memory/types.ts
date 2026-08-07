import type { TenantContext } from "../shared";
export type PedagogicalMemoryScope = "learner" | "course" | "session" | "competency";
export type PedagogicalObservationKind =
  | "RECURRING_ERROR"
  | "LEARNING_PREFERENCE"
  | "REVIEW_NEED"
  | "SUCCESSFUL_INTERVENTION"
  | "CONFIDENCE_TREND"
  | "RECENT_COMPETENCY_DIFFICULTY";
export type PedagogicalObservationStatus =
  | "PROPOSED"
  | "VALIDATED"
  | "REJECTED"
  | "EXPIRED"
  | "REVOKED";
export interface PedagogicalMemoryAuthorization extends TenantContext {
  readonly capabilityId: string;
  readonly subject: string;
  readonly scopes: readonly PedagogicalMemoryScope[];
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly integrity: string;
}
export interface PedagogicalProvenance {
  readonly sourceType: "learning_evidence" | "assessment_decision" | "human_teacher" | "learner";
  readonly sourceIds: readonly string[];
  readonly recordedAt: string;
  readonly recordedBy: string;
}
export interface PedagogicalObservation extends TenantContext {
  readonly observationId: string;
  readonly version: number;
  readonly subject: string;
  readonly scope: PedagogicalMemoryScope;
  readonly kind: PedagogicalObservationKind;
  readonly value: string;
  readonly status: PedagogicalObservationStatus;
  readonly authorizationCapabilityId: string;
  readonly provenance: PedagogicalProvenance;
  readonly expiresAt?: string;
}
export interface MemoryIntegrityVerifier {
  verify(capability: PedagogicalMemoryAuthorization): boolean;
}
