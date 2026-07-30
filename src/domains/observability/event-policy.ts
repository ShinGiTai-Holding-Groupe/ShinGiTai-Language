import type { ProductEvent } from "./types";

const FORBIDDEN_PROPERTY_KEYS = [
  "prompt",
  "answer",
  "token",
  "access_token",
  "refresh_token",
  "password",
  "payment",
  "card",
  "recording",
  "audio",
];

export type EventValidationResult =
  | { accepted: true; event: ProductEvent }
  | { accepted: false; reason: string };

function containsForbiddenKey(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;

  for (const [key, nested] of Object.entries(value)) {
    if (FORBIDDEN_PROPERTY_KEYS.some((blocked) => key.toLowerCase().includes(blocked))) {
      return true;
    }

    if (containsForbiddenKey(nested)) return true;
  }

  return false;
}

export function validateProductEvent(event: ProductEvent): EventValidationResult {
  if (!event.eventId.trim()) return { accepted: false, reason: "event_id_missing" };
  if (!event.eventName.includes(".")) return { accepted: false, reason: "event_name_invalid" };
  if (event.eventVersion < 1 || event.schemaVersion < 1) {
    return { accepted: false, reason: "event_version_invalid" };
  }
  if (Number.isNaN(Date.parse(event.occurredAt))) {
    return { accepted: false, reason: "occurred_at_invalid" };
  }
  if (containsForbiddenKey(event.properties)) {
    return { accepted: false, reason: "forbidden_sensitive_property" };
  }

  return { accepted: true, event };
}

export function appendEventIdempotently(
  ledger: readonly ProductEvent[],
  event: ProductEvent,
): ProductEvent[] {
  const duplicate = ledger.some(
    (existing) =>
      existing.eventId === event.eventId ||
      (event.idempotencyKey && existing.idempotencyKey === event.idempotencyKey),
  );

  return duplicate ? [...ledger] : [...ledger, event];
}
