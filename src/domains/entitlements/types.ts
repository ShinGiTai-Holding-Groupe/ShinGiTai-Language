export type EntitlementSubjectType = "user" | "organization" | "class" | "school" | "enterprise";

export type EntitlementAccessLevel = "allowed" | "denied" | "limited" | "expired" | "grace_period";

export type EntitlementSource =
  | "direct_grant"
  | "plan"
  | "organization"
  | "promotion"
  | "trial"
  | "admin_grant"
  | "restriction";

export type EntitlementStatus = "active" | "inactive" | "revoked" | "expired";
export type FeatureKey = string;

export type EntitlementGrant = {
  entitlementId: string;
  tenantPartition: string;
  subjectId: string;
  subjectType: EntitlementSubjectType;
  featureKey: FeatureKey;
  accessLevel: Exclude<EntitlementAccessLevel, "expired" | "grace_period">;
  usageLimit?: number;
  validFrom?: string;
  validUntil?: string;
  graceUntil?: string;
  source: EntitlementSource;
  status: EntitlementStatus;
  priority?: number;
};

export type EntitlementResolutionInput = {
  tenantPartition: string;
  subjectId: string;
  subjectType: EntitlementSubjectType;
  featureKey: FeatureKey;
  now: string;
  grants: EntitlementGrant[];
};

export type EntitlementResolution = {
  allowed: boolean;
  accessLevel: EntitlementAccessLevel;
  usageLimit?: number;
  validUntil?: string;
  source?: EntitlementSource;
  entitlementId?: string;
  reason:
    | "active_grant"
    | "active_restriction"
    | "within_grace_period"
    | "grant_expired"
    | "invalid_grant"
    | "no_matching_grant";
};

export type UsageMetric =
  | "ai_chat_requests"
  | "speaking_minutes"
  | "writing_reviews"
  | "exam_attempts"
  | "generated_materials"
  | "storage_bytes"
  | "organization_seats";

export type UsageReservationStatus = "reserved" | "committed" | "released" | "expired";

export type UsageReservation = {
  reservationId: string;
  tenantPartition: string;
  subjectId: string;
  subjectType: EntitlementSubjectType;
  featureKey: FeatureKey;
  metric: UsageMetric;
  amount: number;
  idempotencyKey: string;
  semanticPayloadHash: string;
  status: UsageReservationStatus;
  createdAt: string;
  expiresAt: string;
  committedAt?: string;
  releasedAt?: string;
};

export type UsageLedgerEntry = {
  entryId: string;
  tenantPartition: string;
  subjectId: string;
  subjectType: EntitlementSubjectType;
  featureKey: FeatureKey;
  metric: UsageMetric;
  amount: number;
  reservationId: string;
  idempotencyKey: string;
  semanticPayloadHash: string;
  committedAt: string;
};
