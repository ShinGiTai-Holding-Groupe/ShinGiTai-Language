export type DataClassification =
  | "public"
  | "internal"
  | "personal"
  | "sensitive"
  | "highly_restricted";

export type ConsentType =
  | "terms"
  | "privacy"
  | "voice_processing"
  | "voice_storage"
  | "conversation_memory"
  | "analytics"
  | "marketing"
  | "ai_training"
  | "social_discovery"
  | "session_recording";

export type ConsentSource = "onboarding" | "settings" | "admin" | "migration";
export type ConsentSubjectType = "user" | "organization";

export type ConsentRecord = {
  consentId: string;
  tenantPartition: string;
  subjectType: ConsentSubjectType;
  subjectId: string;
  userId?: string;
  organizationId?: string;
  consentType: ConsentType;
  version: string;
  scope: string;
  source: ConsentSource;
  grantedAt: string;
  withdrawnAt?: string;
};

export type ConsentRequirement = {
  consentType: ConsentType;
  minimumVersion?: string;
  acceptedScopes?: readonly string[];
};

export type RetentionPolicy = {
  dataType: string;
  classification: DataClassification;
  retainForDays: number | null;
  legalHoldAllowed: boolean;
  deleteOnAccountDeletion: boolean;
};

export type GovernedRecord = {
  recordId: string;
  tenantPartition: string;
  userId?: string;
  organizationId?: string;
  dataType: string;
  classification: DataClassification;
  createdAt: string;
  expiresAt?: string;
  legalHold?: boolean;
};

export type AuditActorType = "user" | "admin" | "service" | "system";

export type AuditLogEntry = {
  auditId: string;
  tenantPartition: string;
  occurredAt: string;
  actorType: AuditActorType;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  requestId: string;
  semanticPayloadHash: string;
  reason?: string;
  before?: unknown;
  after?: unknown;
  userId?: string;
  organizationId?: string;
};

export type ProcessingDecision = {
  allowed: boolean;
  reason:
    | "consent_satisfied"
    | "consent_missing"
    | "consent_withdrawn"
    | "version_outdated"
    | "scope_mismatch"
    | "subject_mismatch"
    | "tenant_mismatch";
  missing?: ConsentRequirement[];
};
