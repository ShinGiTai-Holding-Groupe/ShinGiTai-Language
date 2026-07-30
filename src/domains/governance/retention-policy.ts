import type { GovernedRecord, RetentionPolicy } from "./types";

export type RetentionDecision =
  | { action: "retain"; reason: "legal_hold" | "within_window" | "indefinite" }
  | { action: "delete"; reason: "expired" | "account_deleted" }
  | { action: "anonymize"; reason: "account_deleted_legal_record" };

const DAY_MS = 86_400_000;

function parseTime(value: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid ISO timestamp: ${value}`);
  }
  return parsed;
}

export function calculateExpiry(
  createdAt: string,
  policy: RetentionPolicy,
): string | undefined {
  if (policy.retainForDays === null) return undefined;
  return new Date(parseTime(createdAt) + policy.retainForDays * DAY_MS).toISOString();
}

export function decideRetention(input: {
  record: GovernedRecord;
  policy: RetentionPolicy;
  now: string;
  accountDeleted?: boolean;
  legalRecordRequired?: boolean;
}): RetentionDecision {
  const { record, policy, accountDeleted = false, legalRecordRequired = false } = input;

  if (record.legalHold && policy.legalHoldAllowed) {
    return { action: "retain", reason: "legal_hold" };
  }

  if (accountDeleted && policy.deleteOnAccountDeletion) {
    if (legalRecordRequired) {
      return { action: "anonymize", reason: "account_deleted_legal_record" };
    }
    return { action: "delete", reason: "account_deleted" };
  }

  const expiresAt = record.expiresAt ?? calculateExpiry(record.createdAt, policy);
  if (!expiresAt) {
    return { action: "retain", reason: "indefinite" };
  }

  if (parseTime(input.now) >= parseTime(expiresAt)) {
    return { action: "delete", reason: "expired" };
  }

  return { action: "retain", reason: "within_window" };
}
