import type { ProductEvent } from "./types";

const EVENT_PROPERTY_ALLOWLIST: Record<string, ReadonlySet<string>> = {
  "learning.lesson_completed@1": new Set(["lessonId", "durationMs", "completionStatus"]),
  "learning.plan_completed@1": new Set(["planId", "durationMs", "activityCount"]),
  "system.error@1": new Set(["errorCode", "component", "retryable"]),
  "notification.delivered@1": new Set(["notificationType", "channel", "deliveryStatus"]),
};

export type EventValidationResult =
  | { accepted: true; event: ProductEvent }
  | { accepted: false; reason: string };

function validatePrimitive(value: unknown): boolean {
  return value === null || ["string", "number", "boolean"].includes(typeof value);
}

export function validateProductEvent(event: ProductEvent): EventValidationResult {
  if (!event.eventId.trim()) return { accepted: false, reason: "event_id_missing" };
  if (!event.tenantPartition.trim()) return { accepted: false, reason: "tenant_partition_missing" };
  if (!event.eventName.includes(".")) return { accepted: false, reason: "event_name_invalid" };
  if (!Number.isInteger(event.eventVersion) || event.eventVersion < 1) {
    return { accepted: false, reason: "event_version_invalid" };
  }
  if (!Number.isInteger(event.schemaVersion) || event.schemaVersion < 1) {
    return { accepted: false, reason: "schema_version_invalid" };
  }
  if (!Number.isFinite(Date.parse(event.occurredAt))) {
    return { accepted: false, reason: "occurred_at_invalid" };
  }

  const schemaKey = `${event.eventName}@${event.schemaVersion}`;
  const allowedKeys = EVENT_PROPERTY_ALLOWLIST[schemaKey];
  if (!allowedKeys) return { accepted: false, reason: "unknown_event_schema" };

  for (const [key, value] of Object.entries(event.properties)) {
    if (!allowedKeys.has(key)) return { accepted: false, reason: `property_not_allowlisted:${key}` };
    if (!validatePrimitive(value)) return { accepted: false, reason: `property_value_invalid:${key}` };
  }

  if (event.idempotencyKey && !event.semanticPayloadHash?.trim()) {
    return { accepted: false, reason: "semantic_payload_hash_missing" };
  }

  return { accepted: true, event };
}

export function appendEventIdempotently(
  ledger: readonly ProductEvent[],
  event: ProductEvent,
): ProductEvent[] {
  const byId = ledger.find(
    (existing) =>
      existing.tenantPartition === event.tenantPartition && existing.eventId === event.eventId,
  );
  if (byId) {
    if (byId.semanticPayloadHash !== event.semanticPayloadHash) {
      throw new Error(`IDEMPOTENCY_PAYLOAD_CONFLICT:${event.eventId}`);
    }
    return [...ledger];
  }

  if (event.idempotencyKey) {
    const duplicate = ledger.find(
      (existing) =>
        existing.tenantPartition === event.tenantPartition &&
        existing.idempotencyKey === event.idempotencyKey,
    );
    if (duplicate) {
      if (duplicate.semanticPayloadHash !== event.semanticPayloadHash) {
        throw new Error(`IDEMPOTENCY_PAYLOAD_CONFLICT:${event.idempotencyKey}`);
      }
      return [...ledger];
    }
  }

  return [...ledger, event];
}
