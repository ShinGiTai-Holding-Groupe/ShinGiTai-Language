import {
  calculateCommittedUsage,
  commitUsage,
  reserveUsage,
  resolveEntitlement,
  type EntitlementGrant,
  type UsageLedgerEntry,
} from "../../src/domains/entitlements";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function expectThrow(operation: () => unknown, expected: string): void {
  try {
    operation();
  } catch (error) {
    assert(error instanceof Error && (error.message.includes(expected) || (error as { code?: string }).code === expected), expected);
    return;
  }
  throw new Error(`Expected: ${expected}`);
}

const baseGrant: EntitlementGrant = {
  entitlementId: "plan-1",
  tenantPartition: "tenant-1",
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

const active = resolveEntitlement({
  tenantPartition: "tenant-1",
  subjectId: "user-1",
  subjectType: "user",
  featureKey: "hikari.tutor.text",
  now: "2026-07-31T12:00:00.000Z",
  grants: [baseGrant],
});
assert(active.allowed, "Active matching grant must allow access.");

const restricted = resolveEntitlement({
  tenantPartition: "tenant-1",
  subjectId: "user-1",
  subjectType: "user",
  featureKey: "hikari.tutor.text",
  now: "2026-07-31T12:00:00.000Z",
  grants: [
    { ...baseGrant, priority: 999 },
    { ...baseGrant, entitlementId: "restriction", source: "restriction", accessLevel: "denied", priority: -999 },
  ],
});
assert(!restricted.allowed && restricted.reason === "active_restriction", "Restriction must always win.");

const expiredStatus = resolveEntitlement({
  tenantPartition: "tenant-1",
  subjectId: "user-1",
  subjectType: "user",
  featureKey: "hikari.tutor.text",
  now: "2026-07-31T12:00:00.000Z",
  grants: [{ ...baseGrant, status: "expired" }],
});
assert(!expiredStatus.allowed, "Expired status must fail closed.");

const created = reserveUsage(
  {
    reservationId: "reservation-1",
    tenantPartition: "tenant-1",
    subjectId: "user-1",
    subjectType: "user",
    featureKey: "hikari.tutor.voice",
    metric: "speaking_minutes",
    amount: 5,
    idempotencyKey: "request-1",
    semanticPayloadHash: "hash-5",
    createdAt: "2026-07-31T10:00:00.000Z",
    expiresAt: "2026-07-31T10:10:00.000Z",
  },
  [],
);

expectThrow(
  () =>
    reserveUsage(
      {
        ...created,
        reservationId: "reservation-2",
        amount: 99,
        semanticPayloadHash: "hash-99",
      },
      [created],
    ),
  "IDEMPOTENCY_PAYLOAD_CONFLICT",
);

const committed = commitUsage({
  reservation: created,
  entryId: "entry-1",
  committedAt: "2026-07-31T10:05:00.000Z",
});
assert(committed.ledgerEntry.tenantPartition === "tenant-1", "Ledger must preserve tenant scope.");

const entries: UsageLedgerEntry[] = [
  committed.ledgerEntry,
  { ...committed.ledgerEntry, entryId: "entry-2", tenantPartition: "tenant-2", amount: 50 },
];
assert(
  calculateCommittedUsage(
    entries,
    "tenant-1",
    "user-1",
    "hikari.tutor.voice",
    "2026-07-31T00:00:00.000Z",
    "2026-08-01T00:00:00.000Z",
  ) === 5,
  "Usage must remain tenant isolated.",
);

console.log("Foundation entitlement contract tests passed.");
