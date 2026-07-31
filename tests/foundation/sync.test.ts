import {
  assertDeviceCanSync,
  buildSyncResult,
  classifyRetry,
  enqueueCommand,
  recommendedConflictStrategy,
  resolveConflict,
  resolveOfflineCapability,
  scheduleRetry,
  selectDelta,
  selectReadyCommands,
  transitionCommand,
  validateResumeToken,
  validateSyncBatch,
  type CanonicalEntity,
  type DeviceRecord,
  type PendingCommand,
} from "../../src/domains/sync";

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

function command(overrides: Partial<PendingCommand> = {}): PendingCommand {
  return {
    commandId: "command-1",
    userId: "user-1",
    deviceId: "device-1",
    entityType: "lesson_progress",
    entityId: "lesson-1",
    operation: "update",
    payload: { completed: true },
    createdAt: "2026-07-31T10:00:00.000Z",
    retryCount: 0,
    status: "pending",
    idempotencyKey: "idem-1",
    ...overrides,
  };
}

function device(overrides: Partial<DeviceRecord> = {}): DeviceRecord {
  return {
    deviceId: "device-1",
    userId: "user-1",
    deviceName: "Test device",
    platform: "test",
    appVersion: "1.0.0",
    lastSeenAt: "2026-07-31T10:00:00.000Z",
    trustStatus: "trusted",
    ...overrides,
  };
}

function testCommandQueue(): void {
  const first = command();
  const ledger = enqueueCommand([], first);
  assert(ledger.length === 1, "A new command must be enqueued.");
  assert(ledger[0]?.status === "pending", "Enqueued commands must start pending.");

  const duplicate = enqueueCommand(ledger, command({ commandId: "command-2" }));
  assert(duplicate.length === 1, "Duplicate idempotency keys must not be enqueued twice.");

  expectThrow(
    () => enqueueCommand([], command({ commandId: "" })),
    "Incomplete command identity must be rejected.",
  );

  const later = command({
    commandId: "command-2",
    idempotencyKey: "idem-2",
    createdAt: "2026-07-31T10:01:00.000Z",
  });
  const waiting = command({
    commandId: "command-3",
    idempotencyKey: "idem-3",
    status: "retry_wait",
    nextAttemptAt: "2026-07-31T10:05:00.000Z",
  });
  const ready = selectReadyCommands(
    [later, waiting, first],
    new Date("2026-07-31T10:02:00.000Z"),
    2,
  );
  assert(
    ready.map((item) => item.commandId).join(",") === "command-1,command-2",
    "Ready commands must be ordered deterministically and respect retry time.",
  );
  assert(selectReadyCommands([first], new Date(), 0).length === 0, "Invalid limits must return no commands.");

  const committed = transitionCommand(first, "committed");
  assert(committed.status === "committed", "Command transition must update status.");
  expectThrow(
    () => transitionCommand(committed, "pending"),
    "Terminal commands must not transition back to non-terminal states.",
  );
}

function testRetryPolicy(): void {
  assert(classifyRetry("401") === "authentication", "401 must be authentication retry class.");
  assert(classifyRetry("409") === "conflict", "409 must be conflict retry class.");
  assert(classifyRetry("SCHEMA_INVALID") === "validation", "Schema errors must be validation class.");
  assert(classifyRetry("503") === "temporary", "5xx errors must be temporary.");
  assert(classifyRetry("UNKNOWN_FATAL") === "permanent", "Unknown errors must be permanent.");

  const base = command();
  const temporary = scheduleRetry(base, "503", new Date("2026-07-31T10:00:00.000Z"));
  assert(temporary.status === "retry_wait", "Temporary errors must schedule retry.");
  assert(
    temporary.nextAttemptAt === "2026-07-31T10:00:01.000Z",
    "First temporary retry must use deterministic one-second delay.",
  );

  const authentication = scheduleRetry(base, "401", new Date("2026-07-31T10:00:00.000Z"));
  assert(
    authentication.nextAttemptAt === "2026-07-31T10:00:05.000Z",
    "Authentication retry must use the longer base delay.",
  );

  assert(scheduleRetry(base, "422", new Date()).status === "quarantined", "Validation errors must quarantine.");
  assert(scheduleRetry(base, "409", new Date()).status === "conflict", "Conflicts must enter conflict state.");
  assert(scheduleRetry(base, "FATAL", new Date()).status === "failed", "Permanent errors must fail.");
  assert(
    scheduleRetry(command({ retryCount: 8 }), "503", new Date(), 8).status === "failed",
    "Retry limit must be enforced.",
  );
}

function testConflictResolution(): void {
  const local = {
    entityId: "note-1",
    entityType: "note",
    value: { title: "Local", localOnly: true },
    localRevision: 2,
    serverRevision: 4,
    updatedAt: "2026-07-31T11:00:00.000Z",
    updatedByDevice: "device-1",
  };
  const server = {
    entityId: "note-1",
    entityType: "note",
    value: { title: "Server", serverOnly: true },
    serverRevision: 4,
    updatedAt: "2026-07-31T10:00:00.000Z",
  };

  const serverWins = resolveConflict({ strategy: "server_wins", local, server });
  assert(serverWins.source === "server", "Server-wins must select canonical state.");
  assert(serverWins.nextServerRevision === 4, "Server-wins must not create a new revision.");

  const clientWins = resolveConflict({ strategy: "client_wins", local, server });
  assert(clientWins.source === "local", "Client-wins must select local state.");
  assert(clientWins.nextServerRevision === 5, "Client-wins must advance server revision.");

  const latest = resolveConflict({ strategy: "last_write_wins", local, server });
  assert(latest.source === "local", "Newer local timestamp must win last-write policy.");

  const merged = resolveConflict({ strategy: "merge", local, server });
  assert(
    JSON.stringify(merged.value) === JSON.stringify({ title: "Local", serverOnly: true, localOnly: true }),
    "Merge must preserve server fields while local fields take precedence.",
  );

  const appended = resolveConflict({
    strategy: "append_only",
    local: { ...local, value: [{ id: 2 }, { id: 3 }] },
    server: { ...server, value: [{ id: 1 }, { id: 2 }] },
  });
  assert(
    JSON.stringify(appended.value) === JSON.stringify([{ id: 1 }, { id: 2 }, { id: 3 }]),
    "Append-only merge must preserve order and remove exact duplicates.",
  );

  const invalidAppend = resolveConflict({ strategy: "append_only", local, server });
  assert(invalidAppend.status === "manual_required", "Append-only non-arrays must require manual resolution.");
  assert(
    resolveConflict({ strategy: "domain_specific", local, server }).status === "manual_required",
    "Domain-specific conflicts must not be guessed by generic sync code.",
  );

  assert(recommendedConflictStrategy("attempt") === "append_only", "Attempts must use append-only policy.");
  assert(recommendedConflictStrategy("note") === "merge", "Notes must use merge policy.");
  assert(recommendedConflictStrategy("mastery") === "server_wins", "Mastery must remain server canonical.");
  assert(
    recommendedConflictStrategy("lesson_progress") === "domain_specific",
    "Lesson progress requires a domain resolver.",
  );
  assert(recommendedConflictStrategy("unknown") === "manual_resolution", "Unknown entities must fail safely.");
}

function testSyncPolicy(): void {
  assert(resolveOfflineCapability("flashcards") === "offline_full", "Flashcards must work fully offline.");
  assert(resolveOfflineCapability("hikari") === "offline_limited", "Hikari must expose limited offline mode.");
  assert(resolveOfflineCapability("billing") === "online_required", "Billing must require connectivity.");
  assert(resolveOfflineCapability("search") === "online_preferred", "Unknown features default to online preferred.");

  const trustedDevice = device();
  assertDeviceCanSync(trustedDevice, "user-1");
  expectThrow(
    () => assertDeviceCanSync(trustedDevice, "user-2"),
    "Cross-user device access must be rejected.",
  );
  expectThrow(
    () => assertDeviceCanSync(device({ trustStatus: "revoked" }), "user-1"),
    "Revoked devices must not synchronize.",
  );

  validateSyncBatch(
    {
      userId: "user-1",
      deviceId: "device-1",
      commands: [command()],
    },
    trustedDevice,
  );

  expectThrow(
    () =>
      validateSyncBatch(
        {
          userId: "user-1",
          deviceId: "device-1",
          commands: [command(), command({ commandId: "command-2" })],
        },
        trustedDevice,
      ),
    "Duplicate idempotency keys in one batch must be rejected.",
  );

  expectThrow(
    () =>
      validateSyncBatch(
        {
          userId: "user-1",
          deviceId: "device-1",
          commands: [command({ userId: "user-2" })],
        },
        trustedDevice,
      ),
    "Commands crossing user boundaries must be rejected.",
  );

  const entities: CanonicalEntity[] = [
    {
      entityId: "b",
      entityType: "note",
      value: {},
      serverRevision: 3,
      updatedAt: "2026-07-31T10:00:00.000Z",
    },
    {
      entityId: "a",
      entityType: "note",
      value: {},
      serverRevision: 2,
      updatedAt: "2026-07-31T10:00:00.000Z",
    },
    {
      entityId: "c",
      entityType: "note",
      value: {},
      serverRevision: 3,
      updatedAt: "2026-07-31T10:00:00.000Z",
    },
  ];

  const delta = selectDelta(entities, 1);
  assert(
    delta.map((entity) => `${entity.serverRevision}:${entity.entityId}`).join(",") === "2:a,3:b,3:c",
    "Delta sync must be ordered by server revision and entity ID.",
  );

  const result = buildSyncResult({
    acceptedAt: new Date("2026-07-31T12:00:00.000Z"),
    commandResults: [],
    entities,
    sinceServerRevision: 2,
  });
  assert(result.latestServerRevision === 3, "Sync result must expose latest canonical revision.");
  assert(result.delta.length === 2, "Sync result must include only entities after requested revision.");

  const token = {
    token: "resume-1",
    userId: "user-1",
    deviceId: "device-1",
    activityId: "lesson-1",
    currentStep: "step-2",
    lastSavedState: { answer: "test" },
    issuedAt: "2026-07-31T10:00:00.000Z",
    expiresAt: "2026-07-31T12:00:00.000Z",
  };
  assert(
    validateResumeToken(token, {
      userId: "user-1",
      deviceId: "device-1",
      now: new Date("2026-07-31T11:00:00.000Z"),
    }),
    "Valid resume token must be accepted for its bound user and device.",
  );
  assert(
    !validateResumeToken(token, {
      userId: "user-1",
      deviceId: "device-2",
      now: new Date("2026-07-31T11:00:00.000Z"),
    }),
    "Resume token must be device-bound.",
  );
  assert(
    !validateResumeToken(token, {
      userId: "user-1",
      deviceId: "device-1",
      now: new Date("2026-07-31T12:00:00.000Z"),
    }),
    "Expired resume token must be rejected at the exact expiry boundary.",
  );
}

testCommandQueue();
testRetryPolicy();
testConflictResolution();
testSyncPolicy();
console.log("Foundation sync contract tests passed.");
