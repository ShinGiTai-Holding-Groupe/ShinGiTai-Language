import type { UsageLedgerEntry, UsageReservation } from "./types";

export class IdempotencyPayloadConflictError extends Error {
  readonly code = "IDEMPOTENCY_PAYLOAD_CONFLICT";
}

export type ReserveUsageInput = Omit<UsageReservation, "status">;

export type CommitUsageInput = {
  reservation: UsageReservation;
  entryId: string;
  committedAt: string;
};

function parseFiniteTimestamp(value: string, field: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${field} must be a valid timestamp.`);
  return parsed;
}

export function reserveUsage(input: ReserveUsageInput, existingReservations: UsageReservation[]): UsageReservation {
  if (!input.tenantPartition.trim()) throw new Error("tenantPartition is required.");
  if (!input.semanticPayloadHash.trim()) throw new Error("semanticPayloadHash is required.");
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Usage reservation amount must be greater than zero.");
  }

  const duplicate = existingReservations.find(
    (reservation) =>
      reservation.tenantPartition === input.tenantPartition &&
      reservation.idempotencyKey === input.idempotencyKey,
  );

  if (duplicate) {
    if (duplicate.semanticPayloadHash !== input.semanticPayloadHash) {
      throw new IdempotencyPayloadConflictError(
        "The idempotency key was already used with a different semantic payload.",
      );
    }
    return duplicate;
  }

  const createdAt = parseFiniteTimestamp(input.createdAt, "createdAt");
  const expiresAt = parseFiniteTimestamp(input.expiresAt, "expiresAt");
  if (expiresAt <= createdAt) throw new Error("Usage reservation expiry must be after creation.");

  return { ...input, status: "reserved" };
}

export function commitUsage(input: CommitUsageInput): {
  reservation: UsageReservation;
  ledgerEntry: UsageLedgerEntry;
} {
  if (input.reservation.status === "committed") throw new Error("Usage reservation is already committed.");
  if (input.reservation.status !== "reserved") {
    throw new Error(`Cannot commit reservation in ${input.reservation.status} state.`);
  }

  const committedAt = parseFiniteTimestamp(input.committedAt, "committedAt");
  const createdAt = parseFiniteTimestamp(input.reservation.createdAt, "createdAt");
  const expiresAt = parseFiniteTimestamp(input.reservation.expiresAt, "expiresAt");
  if (committedAt < createdAt) throw new Error("Commit timestamp cannot precede reservation creation.");
  if (committedAt > expiresAt) throw new Error("Cannot commit an expired usage reservation.");

  return {
    reservation: { ...input.reservation, status: "committed", committedAt: input.committedAt },
    ledgerEntry: {
      entryId: input.entryId,
      tenantPartition: input.reservation.tenantPartition,
      subjectId: input.reservation.subjectId,
      subjectType: input.reservation.subjectType,
      featureKey: input.reservation.featureKey,
      metric: input.reservation.metric,
      amount: input.reservation.amount,
      reservationId: input.reservation.reservationId,
      idempotencyKey: input.reservation.idempotencyKey,
      semanticPayloadHash: input.reservation.semanticPayloadHash,
      committedAt: input.committedAt,
    },
  };
}

export function releaseUsage(reservation: UsageReservation, releasedAt: string): UsageReservation {
  if (reservation.status === "released") return reservation;
  if (reservation.status !== "reserved") throw new Error(`Cannot release reservation in ${reservation.status} state.`);
  parseFiniteTimestamp(releasedAt, "releasedAt");
  return { ...reservation, status: "released", releasedAt };
}

export function expireUsageReservation(reservation: UsageReservation, now: string): UsageReservation {
  if (reservation.status !== "reserved") return reservation;
  if (parseFiniteTimestamp(now, "now") <= parseFiniteTimestamp(reservation.expiresAt, "expiresAt")) return reservation;
  return { ...reservation, status: "expired" };
}

export function calculateCommittedUsage(
  entries: UsageLedgerEntry[],
  tenantPartition: string,
  subjectId: string,
  featureKey: string,
  periodStart: string,
  periodEnd: string,
): number {
  const start = parseFiniteTimestamp(periodStart, "periodStart");
  const end = parseFiniteTimestamp(periodEnd, "periodEnd");
  if (end <= start) throw new Error("periodEnd must be after periodStart.");

  return entries.reduce((total, entry) => {
    const committedAt = parseFiniteTimestamp(entry.committedAt, "committedAt");
    const inScope =
      entry.tenantPartition === tenantPartition &&
      entry.subjectId === subjectId &&
      entry.featureKey === featureKey &&
      committedAt >= start &&
      committedAt < end;
    return inScope ? total + entry.amount : total;
  }, 0);
}
