import {
  appendEventIdempotently,
  assignExperimentVariant,
  completeSpan,
  evaluateObjective,
  sliRatio,
  spanDurationMs,
  validateProductEvent,
  type ExperimentDefinition,
  type ProductEvent,
  type TraceSpan,
} from "../../src/domains/observability";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function expectThrow(operation: () => unknown, expectedMessage: string): void {
  try {
    operation();
  } catch (error) {
    assert(error instanceof Error, "Expected Error instance.");
    assert(
      error.message.includes(expectedMessage),
      `Expected error containing '${expectedMessage}', received '${error.message}'.`,
    );
    return;
  }

  throw new Error(`Expected operation to throw '${expectedMessage}'.`);
}

function baseEvent(overrides: Partial<ProductEvent> = {}): ProductEvent {
  return {
    eventId: "evt-1",
    eventName: "learning.lesson_completed",
    eventVersion: 1,
    schemaVersion: 1,
    occurredAt: "2026-07-31T18:00:00.000Z",
    source: "backend",
    userIdHash: "user-hash",
    organizationId: "org-1",
    consentScope: "product_analytics",
    idempotencyKey: "idem-1",
    properties: { lessonId: "lesson-1", durationMs: 1_200 },
    ...overrides,
  };
}

function testProductEvents(): void {
  const accepted = validateProductEvent(baseEvent());
  assert(accepted.accepted, "Valid product event must be accepted.");

  assert(
    !validateProductEvent(baseEvent({ eventId: "" })).accepted,
    "Missing event ID must be rejected.",
  );
  assert(
    !validateProductEvent(
      baseEvent({ eventName: "learning" as ProductEvent["eventName"] }),
    ).accepted,
    "Event name without domain separator must be rejected.",
  );
  assert(
    !validateProductEvent(baseEvent({ eventVersion: 0 })).accepted,
    "Non-positive event version must be rejected.",
  );
  assert(
    !validateProductEvent(baseEvent({ occurredAt: "invalid" })).accepted,
    "Invalid timestamp must be rejected.",
  );
  assert(
    !validateProductEvent(
      baseEvent({ properties: { nested: { access_token: "secret" } } }),
    ).accepted,
    "Nested credentials must be rejected by the privacy filter.",
  );
  assert(
    !validateProductEvent(
      baseEvent({ properties: { audioRecordingReference: "blob" } }),
    ).accepted,
    "Sensitive property names containing blocked fragments must be rejected.",
  );

  const first = baseEvent();
  const byEventId = appendEventIdempotently([first], {
    ...baseEvent(),
    idempotencyKey: "different-key",
  });
  assert(byEventId.length === 1, "Duplicate event IDs must not be appended.");

  const byIdempotencyKey = appendEventIdempotently([first], {
    ...baseEvent({ eventId: "evt-2" }),
    idempotencyKey: first.idempotencyKey,
  });
  assert(
    byIdempotencyKey.length === 1,
    "Duplicate idempotency keys must not be appended.",
  );

  const distinct = appendEventIdempotently([first],
    baseEvent({ eventId: "evt-2", idempotencyKey: "idem-2" }),
  );
  assert(distinct.length === 2, "Distinct event must be appended once.");
}

function testTracingAndSlo(): void {
  const span: TraceSpan = {
    requestId: "req-1",
    traceId: "trace-1",
    spanId: "span-1",
    name: "odynai.request",
    component: "odynai",
    startedAt: "2026-07-31T18:00:00.000Z",
    status: "in_progress",
    attributes: { modelClass: "language" },
  };

  assert(spanDurationMs(span) === null, "Open span must not have a duration.");

  const completed = completeSpan(span, {
    endedAt: "2026-07-31T18:00:01.250Z",
    status: "ok",
    attributes: { fallbackUsed: false },
  });
  assert(completed.status === "ok", "Span must transition to completed state.");
  assert(spanDurationMs(completed) === 1_250, "Span duration must be deterministic.");
  assert(
    completed.attributes.modelClass === "language" &&
      completed.attributes.fallbackUsed === false,
    "Span completion must merge attributes.",
  );
  assert(
    completeSpan(completed, {
      endedAt: "2026-07-31T18:00:02.000Z",
      status: "error",
    }) === completed,
    "Completed span must be immutable through repeated completion.",
  );
  assert(
    spanDurationMs({ ...completed, endedAt: "2026-07-31T17:59:59.000Z" }) === null,
    "Negative span duration must be rejected.",
  );

  assert(
    sliRatio({
      key: "lesson_load_success",
      successful: 95,
      total: 100,
      windowStartedAt: "2026-07-01T00:00:00.000Z",
      windowEndedAt: "2026-08-01T00:00:00.000Z",
    }) === 0.95,
    "SLI ratio must reflect successful operations.",
  );
  assert(
    sliRatio({
      key: "empty_window",
      successful: 0,
      total: 0,
      windowStartedAt: "2026-07-01T00:00:00.000Z",
      windowEndedAt: "2026-08-01T00:00:00.000Z",
    }) === 1,
    "Empty SLI windows must be treated as healthy.",
  );

  const evaluation = evaluateObjective(
    {
      key: "lesson_load_success",
      successful: 999,
      total: 1_000,
      windowStartedAt: "2026-07-01T00:00:00.000Z",
      windowEndedAt: "2026-08-01T00:00:00.000Z",
    },
    { key: "lesson_load_success", targetRatio: 0.999, windowDays: 30 },
  );
  assert(evaluation.met, "SLO target at exact boundary must be met.");
  assert(
    evaluation.errorBudgetRemaining === 0,
    "Exact consumption of the failure allowance must exhaust the error budget.",
  );

  expectThrow(
    () =>
      evaluateObjective(
        {
          key: "one",
          successful: 1,
          total: 1,
          windowStartedAt: "2026-07-01T00:00:00.000Z",
          windowEndedAt: "2026-08-01T00:00:00.000Z",
        },
        { key: "two", targetRatio: 0.99, windowDays: 30 },
      ),
    "keys must match",
  );
}

function testExperimentAssignment(): void {
  const definition: ExperimentDefinition = {
    experimentId: "daily-plan-density",
    status: "running",
    hypothesis: "A shorter plan increases meaningful completion.",
    variants: [
      { key: "control", weight: 1 },
      { key: "short", weight: 3 },
      { key: "ignored", weight: 0 },
    ],
    audienceKey: "active_learners",
    primaryMetric: "learning.plan_completed",
    guardrailMetrics: ["system.error_rate", "notification.opt_out"],
    allocationPercent: 100,
    salt: "v1",
  };

  const first = assignExperimentVariant(
    definition,
    "user-123",
    "2026-07-31T18:00:00.000Z",
  );
  const second = assignExperimentVariant(
    definition,
    "user-123",
    "2026-08-01T18:00:00.000Z",
  );

  assert(first !== null && second !== null, "Full allocation must assign a variant.");
  assert(
    first.variantKey === second.variantKey,
    "Variant assignment must be stable for the same subject and experiment.",
  );
  assert(
    first.variantKey === "control" || first.variantKey === "short",
    "Zero-weight variant must never be selected.",
  );
  assert(
    assignExperimentVariant({ ...definition, status: "paused" }, "user-123", first.assignedAt) === null,
    "Paused experiment must not assign users.",
  );
  assert(
    assignExperimentVariant({ ...definition, allocationPercent: 0 }, "user-123", first.assignedAt) === null,
    "Zero allocation experiment must not assign users.",
  );
  assert(
    assignExperimentVariant(
      { ...definition, variants: [{ key: "invalid", weight: 0 }] },
      "user-123",
      first.assignedAt,
    ) === null,
    "Experiment without positive-weight variants must not assign users.",
  );
}

testProductEvents();
testTracingAndSlo();
testExperimentAssignment();
console.log("Foundation observability contract tests passed.");
