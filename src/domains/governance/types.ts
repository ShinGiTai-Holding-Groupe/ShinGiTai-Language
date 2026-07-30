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

export type ConsentRecord = {
  consentId: string;
  userId: string;
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
  scope?: string;
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
  occurredAt: string;
  actorType: AuditActorType;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  requestId: string;
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
    | "scope_mismatch";
  missing?: ConsentRequirement[];
};
