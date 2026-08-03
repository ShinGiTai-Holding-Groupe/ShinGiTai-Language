import {
  decideNotification,
  grantExperience,
  type ExperienceLedgerEntry,
  type NotificationCandidate,
  type NotificationPreferences,
} from "../../src/domains/engagement";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const preferences: NotificationPreferences = {
  tenantPartition: "tenant-1",
  userId: "user-1",
  enabledChannels: new Set(["push"]),
  disabledTypes: new Set(),
  quietHours: { enabled: true, startMinute: 22 * 60, endMinute: 7 * 60 },
  dailyLimit: 1,
  timezone: "Europe/Oslo",
};

const quietCandidate: NotificationCandidate = {
  notificationId: "notification-1",
  tenantPartition: "tenant-1",
  userId: "user-1",
  type: "learning",
  priority: "normal",
  requestedChannels: ["push"],
  scheduledAt: new Date("2026-08-03T21:30:00.000Z"),
};

assert(
  decideNotification(quietCandidate, preferences, []).reason === "quiet_hours",
  "Quiet hours must use the learner timezone.",
);

const history = [
  {
    notificationId: "notification-old",
    tenantPartition: "tenant-1",
    userId: "user-1",
    sentAt: new Date("2026-08-03T10:00:00.000Z"),
    channel: "push" as const,
    type: "learning" as const,
  },
  {
    notificationId: "notification-old",
    tenantPartition: "tenant-1",
    userId: "user-1",
    sentAt: new Date("2026-08-03T10:00:00.000Z"),
    channel: "email" as const,
    type: "learning" as const,
  },
];
const daytimeCandidate = { ...quietCandidate, scheduledAt: new Date("2026-08-03T12:00:00.000Z") };
assert(
  decideNotification(daytimeCandidate, preferences, history).reason === "daily_limit_reached",
  "Daily cap must count unique notifications rather than delivery channels.",
);

const entries: ExperienceLedgerEntry[] = [];
const first = grantExperience(
  {
    tenantPartition: "tenant-1",
    userId: "user-1",
    source: "lesson",
    sourceId: "lesson-1",
    baseAmount: 10,
    idempotencyKey: "xp-1",
    semanticPayloadHash: "hash-10",
    occurredAt: new Date("2026-08-03T12:00:00.000Z"),
  },
  entries,
  () => "entry-1",
);
assert(first?.grantedAmount === 10, "First experience grant must be recorded.");

let conflict = false;
try {
  grantExperience(
    {
      ...first!,
      baseAmount: 99,
      semanticPayloadHash: "hash-99",
    },
    [first!],
    () => "entry-2",
  );
} catch (error) {
  conflict = error instanceof Error && error.message.includes("IDEMPOTENCY_PAYLOAD_CONFLICT");
}
assert(conflict, "Same idempotency key with a different payload must conflict.");

console.log("Foundation engagement contract tests passed.");
