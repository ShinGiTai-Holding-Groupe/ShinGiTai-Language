import {
  assertDeviceCanSync,
  buildSyncResult,
  enqueueCommand,
  resolveConflict,
  selectDelta,
  validateResumeToken,
  validateSyncBatch,
  type CanonicalEntity,
  type DeviceRecord,
  type PendingCommand,
} from "../../src/domains/sync";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const command = (overrides: Partial<PendingCommand> = {}): PendingCommand => ({
  commandId: "command-1",
  tenantPartition: "tenant-1",
  userId: "user-1",
  deviceId: "device-1",
  entityType: "lesson_progress",
  entityId: "lesson-1",
  operation: "update",
  payload: { completed: true },
  semanticPayloadHash: "hash-1",
  createdAt: "2026-07-31T10:00:00.000Z",
  retryCount: 0,
  status: "local_pending",
  idempotencyKey: "idem-1",
  ...overrides,
});

const device: DeviceRecord = {
  tenantPartition: "tenant-1",
  deviceId: "device-1",
  userId: "user-1",
  deviceName: "Test",
  platform: "test",
  appVersion: "1.0.0",
  lastSeenAt: "2026-07-31T10:00:00.000Z",
  trustStatus: "trusted",
};

assert(enqueueCommand([], command()).length === 1, "Command must enqueue.");
let idempotencyConflict = false;
try {
  enqueueCommand(
    [command()],
    command({ commandId: "command-2", semanticPayloadHash: "different" }),
  );
} catch {
  idempotencyConflict = true;
}
assert(idempotencyConflict, "Queue idempotency mismatch must conflict.");

assertDeviceCanSync(device, { tenantPartition: "tenant-1", userId: "user-1" });
validateSyncBatch(
  {
    tenantPartition: "tenant-1",
    userId: "user-1",
    deviceId: "device-1",
    commands: [command()],
  },
  device,
);

const server: CanonicalEntity<{ completed: boolean }> = {
  tenantPartition: "tenant-1",
  entityId: "lesson-1",
  entityType: "lesson_progress",
  value: { completed: false },
  serverRevision: 5,
  updatedAt: "2026-07-31T10:00:00.000Z",
};
const local = {
  tenantPartition: "tenant-1",
  entityId: "lesson-1",
  entityType: "lesson_progress",
  value: { completed: true },
  localRevision: 9,
  serverRevision: 4,
  updatedAt: "2099-01-01T00:00:00.000Z",
  updatedByDevice: "device-1",
};
const resolution = resolveConflict({
  strategy: "server_wins",
  dataClass: "canonical_learning",
  local,
  server,
});
assert(
  resolution.source === "server",
  "Client clock must never override canonical learning state.",
);

const entities: CanonicalEntity[] = [
  server,
  { ...server, tenantPartition: "tenant-2", entityId: "foreign", serverRevision: 6 },
  { ...server, entityId: "lesson-2", serverRevision: 7 },
];
assert(
  selectDelta(entities, "tenant-1", 5)
    .map((item) => item.entityId)
    .join(",") === "lesson-2",
  "Delta must be tenant scoped.",
);
const result = buildSyncResult({
  tenantPartition: "tenant-1",
  acceptedAt: new Date("2026-07-31T12:00:00.000Z"),
  commandResults: [],
  entities,
  sinceServerRevision: 5,
});
assert(
  result.latestServerRevision === 7 && result.delta.length === 1,
  "Sync result must use tenant canonical revisions.",
);

const token = {
  token: "opaque-token",
  tokenVersion: 1,
  tenantPartition: "tenant-1",
  userId: "user-1",
  deviceId: "device-1",
  activityId: "lesson-1",
  currentStep: "step-2",
  lastSavedState: {},
  nonce: "1234567890abcdef",
  signature: "1234567890abcdef1234567890abcdef",
  issuedAt: "2026-07-31T10:00:00.000Z",
  expiresAt: "2026-07-31T12:00:00.000Z",
};
assert(
  validateResumeToken(token, {
    tenantPartition: "tenant-1",
    userId: "user-1",
    deviceId: "device-1",
    activityId: "lesson-1",
    now: new Date("2026-07-31T11:00:00.000Z"),
    verifySignature: () => true,
  }),
  "Valid signed token must pass.",
);
assert(
  !validateResumeToken(token, {
    tenantPartition: "tenant-2",
    userId: "user-1",
    deviceId: "device-1",
    activityId: "lesson-1",
    now: new Date("2026-07-31T11:00:00.000Z"),
    verifySignature: () => true,
  }),
  "Token must not cross tenants.",
);

console.log("Foundation sync contract tests passed.");
