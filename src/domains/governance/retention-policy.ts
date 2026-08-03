import type { GovernedRecord, RetentionPolicy } from "./types";

export type RetentionDecision =
  | { action: "retain"; reason: "legal_hold" | "within_window" | "indefinite" }
  | { action: "delete"; reason: "expired" | "account_deleted" }
  | { action: "anonymize"; reason: "account_deleted_legal_record" };

const DAY_MS = 86_400_000;

function parseTime(value: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid timestamp: ${value}`);
  return parsed;
}

function validateCompatibility(record: GovernedRecord, policy: RetentionPolicy): void {
  if (record.dataType !== policy.dataType) throw new Error("Retention policy dataType mismatch");
  if (record.classification !== policy.classification) {
    throw new Error("Retention policy classification mismatch");
  }
  if (
    policy.retainForDays !== null &&
    (!Number.isInteger(policy.retainForDays) || policy.retainForDays < 0)
  ) {
    throw new Error("retainForDays must be null or a non-negative integer");
  }
  if (record.legalHold && !policy.legalHoldAllowed) {
    throw new Error("Record declares legal hold under a policy that forbids it");
  }
}

export function calculateExpiry(createdAt: string, policy: RetentionPolicy): string | undefined {
  if (policy.retainForDays === null) return undefined;
  if (!Number.isInteger(policy.retainForDays) || policy.retainForDays < 0) {
    throw new Error("retainForDays must be null or a non-negative integer");
  }
  return new Date(parseTime(createdAt) + policy.retainForDays * DAY_MS).toISOString();
}

export function decideRetention(input: {
  record: GovernedRecord;
  policy: RetentionPolicy;
  tenantPartition: string;
  now: string;
  accountDeleted?: boolean;
  legalRecordRequired?: boolean;
}): RetentionDecision {
  const { record, policy, accountDeleted = false, legalRecordRequired = false } = input;
  if (record.tenantPartition !== input.tenantPartition) {
    throw new Error("Cross-tenant retention decision is forbidden");
  }
  validateCompatibility(record, policy);

  if (record.legalHold) return { action: "retain", reason: "legal_hold" };

  if (accountDeleted && policy.deleteOnAccountDeletion) {
    return legalRecordRequired
      ? { action: "anonymize", reason: "account_deleted_legal_record" }
      : { action: "delete", reason: "account_deleted" };
  }

  const expiresAt = record.expiresAt ?? calculateExpiry(record.createdAt, policy);
  if (!expiresAt) return { action: "retain", reason: "indefinite" };
  return parseTime(input.now) >= parseTime(expiresAt)
    ? { action: "delete", reason: "expired" }
    : { action: "retain", reason: "within_window" };
}
