import type { AuditLogEntry, DataClassification } from "./types";

const FORBIDDEN_KEYS = new Set([
  "prompt",
  "answer",
  "access_token",
  "refresh_token",
  "password",
  "payment_method",
  "card_number",
  "recording",
  "audio",
]);

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      FORBIDDEN_KEYS.has(key.toLowerCase()) ? "[REDACTED]" : sanitize(entry),
    ]),
  );
}

export function createAuditLogEntry(
  entry: AuditLogEntry,
  classification: DataClassification,
): AuditLogEntry {
  if (!entry.requestId.trim()) throw new Error("Audit requestId is required");
  if (!entry.action.trim()) throw new Error("Audit action is required");
  if (!entry.resourceId.trim()) throw new Error("Audit resourceId is required");

  const includeState = classification !== "highly_restricted";

  return {
    ...entry,
    before: includeState ? sanitize(entry.before) : undefined,
    after: includeState ? sanitize(entry.after) : undefined,
  };
}

export function appendAuditEntry(
  ledger: readonly AuditLogEntry[],
  entry: AuditLogEntry,
): AuditLogEntry[] {
  if (ledger.some((existing) => existing.auditId === entry.auditId)) {
    return [...ledger];
  }
  return [...ledger, entry];
}
