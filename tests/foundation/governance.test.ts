import {
  appendAuditEntry,
  createAuditLogEntry,
  decideRetention,
  evaluateConsentRequirements,
  type AuditLogEntry,
  type ConsentRecord,
  type RetentionPolicy,
} from "../../src/domains/governance";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const consent: ConsentRecord = {
  consentId: "consent-1",
  tenantPartition: "tenant-1",
  subjectType: "user",
  subjectId: "user-1",
  userId: "user-1",
  consentType: "voice_processing",
  version: "2.1",
  scope: "speaking_coach",
  source: "settings",
  grantedAt: "2026-07-31T10:00:00.000Z",
};

const requirement = {
  consentType: "voice_processing" as const,
  minimumVersion: "2.0",
  acceptedScopes: ["speaking_coach"],
};

assert(
  evaluateConsentRequirements([consent], [requirement], {
    tenantPartition: "tenant-1",
    subjectType: "user",
    subjectId: "user-1",
  }).allowed,
  "Matching tenant-scoped consent must allow processing.",
);
assert(
  evaluateConsentRequirements([consent], [requirement], {
    tenantPartition: "tenant-2",
    subjectType: "user",
    subjectId: "user-1",
  }).reason === "tenant_mismatch",
  "Consent must not cross tenant boundaries.",
);
assert(
  !evaluateConsentRequirements([{ ...consent, scope: "global" }], [requirement], {
    tenantPartition: "tenant-1",
    subjectType: "user",
    subjectId: "user-1",
  }).allowed,
  "Global scope must not implicitly satisfy unrelated scopes.",
);

const policy: RetentionPolicy = {
  dataType: "voice_sample",
  classification: "sensitive",
  retainForDays: 1,
  legalHoldAllowed: true,
  deleteOnAccountDeletion: true,
};
const record = {
  recordId: "record-1",
  tenantPartition: "tenant-1",
  userId: "user-1",
  dataType: "voice_sample",
  classification: "sensitive" as const,
  createdAt: "2026-07-31T00:00:00.000Z",
};
assert(
  decideRetention({
    tenantPartition: "tenant-1",
    record,
    policy,
    now: "2026-08-01T00:00:00.000Z",
  }).action === "delete",
  "Expired records must be deleted.",
);

let mismatch = false;
try {
  decideRetention({
    tenantPartition: "tenant-1",
    record,
    policy: { ...policy, dataType: "different" },
    now: "2026-07-31T12:00:00.000Z",
  });
} catch {
  mismatch = true;
}
assert(mismatch, "Retention policy and record must match.");

const audit: AuditLogEntry = {
  auditId: "audit-1",
  tenantPartition: "tenant-1",
  occurredAt: "2026-07-31T12:00:00.000Z",
  actorType: "service",
  actorId: "language-api",
  action: "voice.processed",
  resourceType: "voice_sample",
  resourceId: "sample-1",
  requestId: "request-1",
  semanticPayloadHash: "hash-1",
  before: { raw_prompt: "secret", status: "queued" },
  after: { authorization: "secret", status: "processed" },
};
const sanitized = createAuditLogEntry(audit, "sensitive");
assert(JSON.stringify(sanitized.before) === JSON.stringify({ status: "queued" }), "Audit before payload must be allowlisted.");
assert(JSON.stringify(sanitized.after) === JSON.stringify({ status: "processed" }), "Audit after payload must be allowlisted.");

const ledger = appendAuditEntry([], sanitized);
let conflict = false;
try {
  appendAuditEntry(ledger, { ...sanitized, semanticPayloadHash: "different" });
} catch {
  conflict = true;
}
assert(conflict, "Duplicate audit ID with a different payload must conflict.");

console.log("Foundation governance contract tests passed.");
