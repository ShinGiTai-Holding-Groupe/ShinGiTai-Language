import {
  calculateCommittedUsage,
  commitUsage,
  expireUsageReservation,
  releaseUsage,
  reserveUsage,
  resolveEntitlement,
  type EntitlementGrant,
  type UsageLedgerEntry,
  type UsageReservation,
} from "../../src/domains/entitlements";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function expectThrow(operation: () => unknown, message: string): void {
  try {
    operation();
  } catch {
    return;
  }

  throw new Error(message);
}

const baseGrant: EntitlementGrant = {
  entitlementId: "plan-1",
  subjectId: "user-1",
  subjectType: "user",
  featureKey: "hikari.tutor.text",
  accessLevel: "allowed",
  source: "plan",
  status: "active",
  validFrom: "2026-07-01T00:00:00.000Z",
  validUntil: "2026-08-01T00:00:00.000Z",
  graceUntil: "2026-08-08T00:00:00.000Z",
};

function testEntitlementResolver(): void {
  const active = resolveEntitlement({
    subjectId: "user-1",
    featureKey: "hikari.tutor.text",
    now: "2026-07-31T12:00:00.000Z",
    grants: [baseGrant],
  });
  assert(active.allowed, "Active matching grant must allow access.");
  assert(active.reason === "active_grant", "Active grant reason must be explicit.");

  const restricted = resolveEntitlement({
    subjectId: "user-1",
    featureKey: "hikari.tutor.text",
    now: "2026-07-31T12:00:00.000Z",
    grants: [
      baseGrant,
      {
        ...baseGrant,
        entitlementId: "restriction-1",
        source: "restriction",
        accessLevel: "denied",
      },
    ],
  });
  assert(!restricted.allowed, "Active restriction must override an active plan grant.");
  assert(
    restricted.reason === "active_restriction",
    "Restriction precedence must be visible in the resolution.",
  );

  const grace = resolveEntitlement({
    subjectId: "user-1",
    featureKey: "hikari.tutor.text",
    now: "2026-08-04T12:00:00.000Z",
    grants: [baseGrant],
  });
  assert(grace.allowed, "Grant within grace period must remain available.");
  assert(grace.accessLevel === "grace_period", "Grace access level must be explicit.");

  const missing = resolveEntitlement({
    subjectId: "another-user",
    featureKey: "hikari.tutor.text",
    now: "2026-07-31T12:00:00.000Z",
    grants: [baseGrant],
  });
  assert(!missing.allowed, "Grant must not cross the subject boundary.");
  assert(missing.reason === "no_matching_grant", "Missing grant must be explicit.");
}

function reservation(overrides: Partial<UsageReservation> = {}): UsageReservation {
  return {
    reservationId: "reservation-1",
    subjectId: "user-1",
    featureKey: "hikari.tutor.voice",
    metric: "speaking_minutes",
    amount: 5,
    idempotencyKey: "request-1",
    status: "reserved",
    createdAt: "2026-07-31T10:00:00.000Z",
    expiresAt: "2026-07-31T10:10:00.000Z",
    ...overrides,
  };
}

function testUsageReservation(): void {
  const created = reserveUsage(
    {
      reservationId: "reservation-1",
      subjectId: "user-1",
      featureKey: "hikari.tutor.voice",
      metric: "speaking_minutes",
      amount: 5,
      idempotencyKey: "request-1",
      createdAt: "2026-07-31T10:00:00.000Z",
      expiresAt: "2026-07-31T10:10:00.000Z",
    },
    [],
  );
  assert(created.status === "reserved", "Valid usage request must create a reservation.");

  const reused = reserveUsage(
    {
      reservationId: "reservation-2",
      subjectId: "user-1",
      featureKey: "hikari.tutor.voice",
      metric: "speaking_minutes",
      amount: 99,
      idempotencyKey: "request-1",
      createdAt: "2026-07-31T10:01:00.000Z",
      expiresAt: "2026-07-31T10:11:00.000Z",
    },
    [created],
  );
  assert(
    reused.reservationId === created.reservationId && reused.amount === 5,
    "Duplicate idempotency key must reuse the original reservation.",
  );

  const committed = commitUsage({
    reservation: created,
    entryId: "entry-1",
    committedAt: "2026-07-31T10:05:00.000Z",
  });
  assert(committed.reservation.status === "committed", "Reserved usage must commit once.");
  assert(committed.ledgerEntry.amount === 5, "Ledger amount must match reservation amount.");

  expectThrow(
    () =>
      commitUsage({
        reservation: committed.reservation,
        entryId: "entry-2",
        committedAt: "2026-07-31T10:06:00.000Z",
      }),
    "Committed usage must not commit twice.",
  );

  const released = releaseUsage(reservation(), "2026-07-31T10:03:00.000Z");
  assert(released.status === "released", "Reserved usage must be releasable.");
  assert(
    releaseUsage(released, "2026-07-31T10:04:00.000Z") === released,
    "Release must be idempotent.",
  );

  const expired = expireUsageReservation(
    reservation(),
    "2026-07-31T10:11:00.000Z",
  );
  assert(expired.status === "expired", "Expired reservation must transition to expired.");

  expectThrow(
    () =>
      reserveUsage(
        {
          reservationId: "invalid",
          subjectId: "user-1",
          featureKey: "hikari.tutor.voice",
          metric: "speaking_minutes",
          amount: 0,
          idempotencyKey: "invalid-request",
          createdAt: "2026-07-31T10:00:00.000Z",
          expiresAt: "2026-07-31T10:10:00.000Z",
        },
        [],
      ),
    "Zero usage amount must be rejected.",
  );
}

function testUsageLedger(): void {
  const entries: UsageLedgerEntry[] = [
    {
      entryId: "entry-1",
      subjectId: "user-1",
      featureKey: "hikari.tutor.voice",
      metric: "speaking_minutes",
      amount: 5,
      reservationId: "reservation-1",
      idempotencyKey: "request-1",
      committedAt: "2026-07-31T10:05:00.000Z",
    },
    {
      entryId: "entry-2",
      subjectId: "user-2",
      featureKey: "hikari.tutor.voice",
      metric: "speaking_minutes",
      amount: 50,
      reservationId: "reservation-2",
      idempotencyKey: "request-2",
      committedAt: "2026-07-31T10:06:00.000Z",
    },
  ];

  const total = calculateCommittedUsage(
    entries,
    "user-1",
    "hikari.tutor.voice",
    "2026-07-31T00:00:00.000Z",
    "2026-08-01T00:00:00.000Z",
  );
  assert(total === 5, "Usage total must remain isolated by subject and feature.");
}

testEntitlementResolver();
testUsageReservation();
testUsageLedger();
console.log("Foundation entitlement contract tests passed.");
