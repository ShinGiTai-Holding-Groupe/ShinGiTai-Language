import {
  appendEventIdempotently,
  assignExperimentVariant,
  evaluateObjective,
  sliRatio,
  validateProductEvent,
  type ExperimentDefinition,
  type ProductEvent,
} from "../../src/domains/observability";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const event: ProductEvent = {
  eventId: "evt-1",
  tenantPartition: "tenant-1",
  eventName: "learning.lesson_completed",
  eventVersion: 1,
  schemaVersion: 1,
  occurredAt: "2026-07-31T18:00:00.000Z",
  source: "backend",
  idempotencyKey: "idem-1",
  semanticPayloadHash: "hash-1",
  properties: { lessonId: "lesson-1", durationMs: 1_200 },
};
assert(validateProductEvent(event).accepted, "Known schema must pass.");
assert(
  !validateProductEvent({ ...event, properties: { message: "raw personal content" } }).accepted,
  "Non-allowlisted property must be rejected.",
);
let conflict = false;
try {
  appendEventIdempotently([event], { ...event, semanticPayloadHash: "different" });
} catch {
  conflict = true;
}
assert(conflict, "Telemetry idempotency mismatch must conflict.");

assert(
  sliRatio({
    key: "success",
    successful: 95,
    total: 100,
    windowStartedAt: "2026-07-01T00:00:00.000Z",
    windowEndedAt: "2026-08-01T00:00:00.000Z",
  }) === 0.95,
  "SLI ratio must be exact.",
);
let invalidSli = false;
try {
  sliRatio({
    key: "invalid",
    successful: 2,
    total: 1,
    windowStartedAt: "2026-07-01T00:00:00.000Z",
    windowEndedAt: "2026-08-01T00:00:00.000Z",
  });
} catch {
  invalidSli = true;
}
assert(invalidSli, "successful > total must be rejected.");
assert(
  evaluateObjective(
    {
      key: "success",
      successful: 99,
      total: 100,
      windowStartedAt: "2026-07-01T00:00:00.000Z",
      windowEndedAt: "2026-08-01T00:00:00.000Z",
    },
    { key: "success", targetRatio: 0.99, windowDays: 30 },
  ).met,
  "SLO boundary must pass.",
);

const definition: ExperimentDefinition = {
  experimentId: "experiment-1",
  tenantPartition: "tenant-1",
  status: "running",
  hypothesis: "Test",
  variants: [
    { key: "control", weight: 1 },
    { key: "variant", weight: 1 },
  ],
  audienceKey: "learners",
  primaryMetric: "learning.plan_completed",
  guardrailMetrics: [],
  allocationPercent: 100,
  salt: "v1",
};
const assignment = assignExperimentVariant(definition, "user-1", "2026-08-03T10:00:00.000Z");
assert(assignment?.tenantPartition === "tenant-1", "Assignment must preserve tenant scope.");
let duplicateVariant = false;
try {
  assignExperimentVariant(
    { ...definition, variants: [{ key: "same", weight: 1 }, { key: "same", weight: 1 }] },
    "user-1",
    "2026-08-03T10:00:00.000Z",
  );
} catch {
  duplicateVariant = true;
}
assert(duplicateVariant, "Duplicate variant keys must be rejected.");

console.log("Foundation observability contract tests passed.");
