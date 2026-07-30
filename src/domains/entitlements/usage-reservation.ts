import type { UsageLedgerEntry, UsageReservation } from "./types";

export type ReserveUsageInput = Omit<UsageReservation, "status">;

export type CommitUsageInput = {
  reservation: UsageReservation;
  entryId: string;
  committedAt: string;
};

export function reserveUsage(
  input: ReserveUsageInput,
  existingReservations: UsageReservation[],
): UsageReservation {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Usage reservation amount must be greater than zero.");
  }

  const duplicate = existingReservations.find(
    (reservation) => reservation.idempotencyKey === input.idempotencyKey,
  );

  if (duplicate) return duplicate;

  if (Date.parse(input.expiresAt) <= Date.parse(input.createdAt)) {
    throw new Error("Usage reservation expiry must be after creation.");
  }

  return { ...input, status: "reserved" };
}

export function commitUsage(input: CommitUsageInput): {
  reservation: UsageReservation;
  ledgerEntry: UsageLedgerEntry;
} {
  if (input.reservation.status === "committed") {
    throw new Error("Usage reservation is already committed.");
  }

  if (input.reservation.status !== "reserved") {
    throw new Error(`Cannot commit reservation in ${input.reservation.status} state.`);
  }

  if (Date.parse(input.committedAt) > Date.parse(input.reservation.expiresAt)) {
    throw new Error("Cannot commit an expired usage reservation.");
  }

  return {
    reservation: {
      ...input.reservation,
      status: "committed",
      committedAt: input.committedAt,
    },
    ledgerEntry: {
      entryId: input.entryId,
      subjectId: input.reservation.subjectId,
      featureKey: input.reservation.featureKey,
      metric: input.reservation.metric,
      amount: input.reservation.amount,
      reservationId: input.reservation.reservationId,
      idempotencyKey: input.reservation.idempotencyKey,
      committedAt: input.committedAt,
    },
  };
}

export function releaseUsage(
  reservation: UsageReservation,
  releasedAt: string,
): UsageReservation {
  if (reservation.status === "released") return reservation;

  if (reservation.status !== "reserved") {
    throw new Error(`Cannot release reservation in ${reservation.status} state.`);
  }

  return {
    ...reservation,
    status: "released",
    releasedAt,
  };
}

export function expireUsageReservation(
  reservation: UsageReservation,
  now: string,
): UsageReservation {
  if (reservation.status !== "reserved") return reservation;

  if (Date.parse(now) <= Date.parse(reservation.expiresAt)) return reservation;

  return {
    ...reservation,
    status: "expired",
  };
}

export function calculateCommittedUsage(
  entries: UsageLedgerEntry[],
  subjectId: string,
  featureKey: string,
  periodStart: string,
  periodEnd: string,
): number {
  const start = Date.parse(periodStart);
  const end = Date.parse(periodEnd);

  return entries.reduce((total, entry) => {
    const committedAt = Date.parse(entry.committedAt);
    const inScope =
      entry.subjectId === subjectId &&
      entry.featureKey === featureKey &&
      committedAt >= start &&
      committedAt < end;

    return inScope ? total + entry.amount : total;
  }, 0);
}
