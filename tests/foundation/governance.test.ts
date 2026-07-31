import {
  appendAuditEntry,
  calculateExpiry,
  createAuditLogEntry,
  decideRetention,
  evaluateConsentRequirements,
  withdrawConsent,
  type AuditLogEntry,
  type ConsentRecord,
  type RetentionPolicy,
} from "../../src/domains/governance";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function baseConsent(overrides: Partial<ConsentRecord> = {}): ConsentRecord {
  return {
    consentId: "consent-1",
    userId: "user-1",
    consentType: "voice_processing",
    version: "v2",
    scope: "speaking_coach",
    source: "settings",
    grantedAt: "2026-07-31T10:00:00.000Z",
    ...overrides,
  };
}

function testConsentPolicy(): void {
  const requirement = {
    consentType: "voice_processing" as const,
    minimumVersion: "v2",
    scope: "speaking_coach",
  };

  const satisfied = evaluateConsentRequirements([baseConsent()], [requirement]);
  assert(satisfied.allowed, "Matching active consent must allow processing.");
  assert(
    satisfied.reason === "consent_satisfied",
    "Matching consent must report consent_satisfied.",
  );

  const globalScope = evaluateConsentRequirements(
    [baseConsent({ scope: "global" })],
    [requirement],
  );
  assert(globalScope.allowed, "Global scope must satisfy a narrower requirement.");

  const missing = evaluateConsentRequirements([], [requirement]);
  assert(!missing.allowed, "Missing consent must deny processing.");
  assert(missing.reason === "consent_missing", "Missing consent reason must be explicit.");

  const outdated = evaluateConsentRequirements(
    [baseConsent({ version: "v1" })],
    [requirement],
  );
  assert(!outdated.allowed, "Outdated consent must deny processing.");
  assert(outdated.reason === "version_outdated", "Outdated version must be reported.");

  const scopeMismatch = evaluateConsentRequirements(
    [baseConsent({ scope: "lesson_audio" })],
    [requirement],
  );
  assert(!scopeMismatch.allowed, "Scope mismatch must deny processing.");
  assert(scopeMismatch.reason === "scope_mismatch", "Scope mismatch must be reported.");

  const withdrawnRecord = withdrawConsent(
    baseConsent(),
    "2026-07-31T11:00:00.000Z",
  );
  assert(
    withdrawnRecord.withdrawnAt === "2026-07-31T11:00:00.000Z",
    "Consent withdrawal must be persisted in the returned record.",
  );
  assert(
    withdrawConsent(withdrawnRecord, "2026-07-31T12:00:00.000Z") === withdrawnRecord,
    "Consent withdrawal must be idempotent.",
  );

  const withdrawn = evaluateConsentRequirements([withdrawnRecord], [requirement]);
  assert(!withdrawn.allowed, "Withdrawn consent must deny processing.");
  assert(withdrawn.reason === "consent_withdrawn", "Withdrawal must be reported.");
}

function testRetentionPolicy(): void {
  const policy: RetentionPolicy = {
    dataType: "voice_sample",
    classification: "sensitive",
    retainForDays: 1,
    legalHoldAllowed: true,
    deleteOnAccountDeletion: true,
  };

  assert(
    calculateExpiry("2026-07-31T00:00:00.000Z", policy) ===
      "2026-08-01T00:00:00.000Z",
    "Retention expiry must be calculated deterministically.",
  );

  const baseRecord = {
    recordId: "record-1",
    userId: "user-1",
    dataType: "voice_sample",
    classification: "sensitive" as const,
    createdAt: "2026-07-31T00:00:00.000Z",
  };

  const withinWindow = decideRetention({
    record: baseRecord,
    policy,
    now: "2026-07-31T12:00:00.000Z",
  });
  assert(
    withinWindow.action === "retain" && withinWindow.reason === "within_window",
    "Records inside the retention window must be retained.",
  );

  const expired = decideRetention({
    record: baseRecord,
    policy,
    now: "2026-08-01T00:00:00.000Z",
  });
  assert(
    expired.action === "delete" && expired.reason === "expired",
    "Expired records must be deleted at the boundary.",
  );

  const legalHold = decideRetention({
    record: { ...baseRecord, legalHold: true },
    policy,
    now: "2027-01-01T00:00:00.000Z",
    accountDeleted: true,
  });
  assert(
    legalHold.action === "retain" && legalHold.reason === "legal_hold",
    "Allowed legal hold must override expiry and account deletion.",
  );

  const deletedAccount = decideRetention({
    record: baseRecord,
    policy,
    now: "2026-07-31T12:00:00.000Z",
    accountDeleted: true,
  });
  assert(
    deletedAccount.action === "delete" && deletedAccount.reason === "account_deleted",
    "Account deletion must delete records when policy requires it.",
  );

  const anonymized = decideRetention({
    record: baseRecord,
    policy,
    now: "2026-07-31T12:00:00.000Z",
    accountDeleted: true,
    legalRecordRequired: true,
  });
  assert(
    anonymized.action === "anonymize" &&
      anonymized.reason === "account_deleted_legal_record",
    "Legally required records must be anonymized after account deletion.",
  );

  const indefinite = decideRetention({
    record: baseRecord,
    policy: { ...policy, retainForDays: null, deleteOnAccountDeletion: false },
    now: "2030-01-01T00:00:00.000Z",
  });
  assert(
    indefinite.action === "retain" && indefinite.reason === "indefinite",
    "Indefinite retention must remain explicit.",
  );
}

function baseAuditEntry(overrides: Partial<AuditLogEntry> = {}): AuditLogEntry {
  return {
    auditId: "audit-1",
    occurredAt: "2026-07-31T12:00:00.000Z",
    actorType: "service",
    actorId: "language-api",
    action: "voice.processed",
    resourceType: "voice_sample",
    resourceId: "sample-1",
    requestId: "request-1",
    userId: "user-1",
    before: {
      prompt: "secret prompt",
      nested: { access_token: "secret-token", safe: "visible" },
    },
    after: {
      answer: "secret answer",
      audio: "binary-audio",
      status: "processed",
    },
    ...overrides,
  };
}

function testAuditPolicy(): void {
  const sanitized = createAuditLogEntry(baseAuditEntry(), "sensitive");
  const before = sanitized.before as Record<string, unknown>;
  const nested = before.nested as Record<string, unknown>;
  const after = sanitized.after as Record<string, unknown>;

  assert(before.prompt === "[REDACTED]", "Prompt must be redacted from audit state.");
  assert(
    nested.access_token === "[REDACTED]" && nested.safe === "visible",
    "Nested credentials must be redacted without destroying safe fields.",
  );
  assert(after.answer === "[REDACTED]", "Answers must be redacted.");
  assert(after.audio === "[REDACTED]", "Audio payloads must be redacted.");
  assert(after.status === "processed", "Safe audit metadata must remain available.");

  const restricted = createAuditLogEntry(baseAuditEntry(), "highly_restricted");
  assert(
    restricted.before === undefined && restricted.after === undefined,
    "Highly restricted audit entries must suppress state snapshots entirely.",
  );

  const ledger = appendAuditEntry([], sanitized);
  assert(ledger.length === 1, "First audit entry must be appended.");
  const duplicate = appendAuditEntry(ledger, sanitized);
  assert(duplicate.length === 1, "Duplicate audit IDs must be idempotently ignored.");
  assert(duplicate !== ledger, "Append helper must return a defensive ledger copy.");

  let failed = false;
  try {
    createAuditLogEntry(baseAuditEntry({ requestId: "" }), "internal");
  } catch {
    failed = true;
  }
  assert(failed, "Audit entries without requestId must be rejected.");
}

testConsentPolicy();
testRetentionPolicy();
testAuditPolicy();
console.log("Foundation governance contract tests passed.");
