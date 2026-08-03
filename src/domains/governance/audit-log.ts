import type { AuditLogEntry, DataClassification } from "./types";

const ALLOWED_AUDIT_KEYS = new Set([
  "status",
  "state",
  "reason_code",
  "policy_version",
  "decision",
  "result",
  "count",
  "duration_ms",
  "feature_key",
  "scope",
  "version",
]);

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (!value || typeof value !== "object") {
    return typeof value === "string" && value.length > 256 ? `${value.slice(0, 256)}…` : value;
  }

  const output: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (ALLOWED_AUDIT_KEYS.has(key.toLowerCase())) output[key] = sanitize(entry);
  }
  return output;
}

export function createAuditLogEntry(
  entry: AuditLogEntry,
  classification: DataClassification,
): AuditLogEntry {
  if (!entry.tenantPartition.trim()) throw new Error("Audit tenantPartition is required");
  if (!entry.requestId.trim()) throw new Error("Audit requestId is required");
  if (!entry.semanticPayloadHash.trim()) throw new Error("Audit semanticPayloadHash is required");
  if (!entry.action.trim()) throw new Error("Audit action is required");
  if (!entry.resourceId.trim()) throw new Error("Audit resourceId is required");
  if (!Number.isFinite(Date.parse(entry.occurredAt))) throw new Error("Audit occurredAt is invalid");

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
  const duplicate = ledger.find(
    (existing) =>
      existing.tenantPartition === entry.tenantPartition && existing.auditId === entry.auditId,
  );
  if (duplicate) {
    if (duplicate.semanticPayloadHash !== entry.semanticPayloadHash) {
      throw new Error(`IDEMPOTENCY_PAYLOAD_CONFLICT:${entry.auditId}`);
    }
    return [...ledger];
  }
  return [...ledger, entry];
}
