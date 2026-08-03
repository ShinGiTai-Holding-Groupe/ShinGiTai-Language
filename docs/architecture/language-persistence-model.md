# ShinGiTai Language Persistence Model

**Version:** 0.1-draft  
**Status:** WORKING ARCHITECTURE REFERENCE

## 0. Purpose

This document defines persistence responsibilities, canonical records, append-only history, projections, outbox rules, tenant isolation and recovery expectations. It does not lock a concrete database vendor.

## 1. Persistence principles

- Backend Language owns canonical synchronized learning state.
- Aggregate state changes and emitted events are committed atomically.
- Critical history is append-only.
- Published content, issued assessments and validated evidence are immutable.
- Corrections create superseding records.
- Read projections are rebuildable.
- Client storage is a cache and offline queue, not canonical truth.

## 2. Logical stores

```text
Domain Aggregate Store
Domain Event Store
Integration Outbox
Read Projection Store
Content Release Store
Pedagogical Memory Store
Synchronization Inbox / Cursor Store
Audit Store
Binary Asset Metadata Store
```

A single physical database may host multiple logical stores initially, provided ownership and transaction boundaries remain explicit.

## 3. Aggregate persistence

Every mutable aggregate record includes:

```text
aggregate_id
aggregate_type
aggregate_version
user_id, when learner-owned
tenant_partition
organization_id, when applicable
created_at
updated_at
state_payload
```

Optimistic concurrency condition:

```text
stored aggregate_version == expected_aggregate_version
```

Successful mutation increments version exactly once.

## 4. Immutable records

Immutable after issue or validation:

- `CourseRelease`,
- published content item version,
- accepted answer submission,
- `LearningEvidenceRecord` payload,
- issued `AssessmentDecision`,
- applied `LearningTransition`,
- accepted domain event.

Status transitions may append metadata, but original semantic payload is never overwritten.

## 5. Event storage

Every accepted domain event includes:

```text
event_id
aggregate_id
aggregate_type
aggregate_version
event_type
schema_version
user_id
tenant_partition
organization_id
correlation_id
causation_id
occurred_at
received_at
server_revision
payload
```

Uniqueness constraints:

- `event_id`,
- `(aggregate_id, aggregate_version)`,
- `idempotency_key` within command scope.

## 6. Transactional outbox

Domain mutation and outbox message must share a transaction.

Flow:

```text
command accepted
-> aggregate mutation
-> domain event append
-> outbox append
-> commit
-> asynchronous publication
-> publication acknowledgment
```

Publication retry cannot reapply the aggregate mutation.

## 7. Read projections

Recommended projections:

- current enrollment,
- current lesson and resume state,
- competency profile,
- vocabulary profile,
- grammar profile,
- review queue,
- teacher session context,
- assessment history,
- synchronization status.

Projection rows store:

```text
projection_version
source_server_revision
rebuilt_at
```

Projection lag is observable and never silently presented as canonical strong state.

## 8. Content persistence

Content hierarchy is persisted as immutable release data:

```text
CourseRelease
ModuleVersion
ChapterVersion
LessonVersion
ActivityVersion
ChallengeVersion
ExamVersion
CompetencyMappingVersion
FrameworkMappingVersion
```

An in-progress lesson pins exact release and content versions.

## 9. Pedagogical Memory

Durable structured records only:

```text
StudentGoal
LearningPreference
RecurringError
ObservedStrength
InterventionResult
ExamHistory
MotivationSignal
TeacherObservation
```

Each record includes status, provenance, retention policy and user visibility controls.

Free-form hidden model memory is not canonical pedagogical state.

## 10. Tenant isolation

Every learner-owned table, event, projection, cache key and index includes `tenant_partition`.

Mandatory controls:

- composite lookup by tenant and record ID,
- row-level or repository-level isolation,
- cross-tenant foreign keys forbidden,
- tenant-aware backups and deletion workflows,
- tests for identifier collision across tenants.

## 11. Binary and multimodal data

Audio, images and document uploads are stored outside core aggregate payloads.

Domain state stores only:

```text
asset_id
owner_user_id
tenant_partition
purpose
consent_scope
retention_class
content_hash
created_at
expires_at
```

Raw media must not become permanent by default.

## 12. Snapshots

Snapshots are performance aids, not sources of truth.

A snapshot includes:

```text
aggregate_id
aggregate_version
last_event_id
state_payload
snapshot_schema_version
created_at
```

Restore verification must compare snapshot-plus-tail state with full replay for reference fixtures.

## 13. Migration policy

- schema migrations are versioned and reversible where feasible,
- content migrations never rewrite historical evidence,
- destructive migration requires backup and explicit owner approval,
- projection migrations may rebuild from canonical history,
- aggregate migrations require compatibility tests.

## 14. Backup and recovery

Required recovery targets must eventually define RPO and RTO per store.

Minimum recovery exercises:

- aggregate restore,
- event replay,
- projection rebuild,
- outbox recovery,
- synchronization cursor recovery,
- tenant-scoped export and deletion verification.

## 15. Physical implementation decision deferred

This specification does not yet select PostgreSQL, SQLite, event-store product or cloud service. The first implementation should favor the smallest solution that preserves:

- transactions,
- optimistic concurrency,
- immutable history,
- tenant isolation,
- offline synchronization support,
- migration safety.

## 16. Status

```text
LOGICAL PERSISTENCE MODEL: DEFINED
TRANSACTION RULES: DEFINED
OUTBOX RULES: DEFINED
TENANT ISOLATION: DEFINED
PHYSICAL DATABASE: NOT LOCKED
MIGRATION IMPLEMENTATION: NOT YET BUILT
```