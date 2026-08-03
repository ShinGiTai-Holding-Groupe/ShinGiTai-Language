# ShinGiTai Language Synchronization Specification

**Version:** 0.1-draft  
**Status:** WORKING ARCHITECTURE REFERENCE

## 0. Purpose

This specification defines offline event submission, authoritative ordering, conflict handling, replay, delta synchronization and client recovery.

## 1. Authority model

```text
Backend Language = canonical synchronized learning state
Client = local projection + pending offline events + checkpoints + cursor
```

Client clock is never authoritative. Server-assigned revision determines accepted order.

## 2. Offline event lifecycle

Success path:

```text
LOCAL_PENDING -> SUBMITTED -> ACCEPTED -> APPLIED
```

Failure paths:

```text
SUBMITTED -> CONFLICTED
SUBMITTED -> REJECTED
SUBMITTED -> QUARANTINED
```

Conflict recovery:

```text
CONFLICTED -> RESOLVED -> ACCEPTED -> APPLIED
```

## 3. Client event envelope

```text
event_id
idempotency_key
command_id
user_id
tenant_partition
organization_id
device_id
aggregate_id
expected_aggregate_version
occurred_at
client_sequence
schema_version
correlation_id
causation_id
payload
```

The server adds:

```text
received_at
server_revision
accepted_aggregate_version
processing_status
```

## 4. Submission rules

- submissions are tenant-authenticated,
- duplicate idempotency key returns the original result,
- stale aggregate version produces explicit conflict,
- malformed or unsupported schema is quarantined,
- unauthorized ownership is rejected,
- local event order is advisory only.

## 5. Server processing

```text
receive batch
-> authenticate tenant and actor
-> validate schema
-> deduplicate
-> validate expected aggregate version
-> apply command semantics
-> persist mutation and event atomically
-> assign server revision
-> return per-event result
```

Partial batch acceptance is allowed only when each item has an independent result and dependency ordering is preserved.

## 6. Delta synchronization

Client requests:

```text
GetDeltaSinceRevision(tenant_partition, cursor_revision, limit)
```

Server returns:

```text
from_revision
to_revision
has_more
events
projection_hints, optional
```

Cursor advances only after durable local application.

## 7. Conflict classes

- `STALE_AGGREGATE_VERSION`
- `DUPLICATE_SEMANTIC_OPERATION`
- `CONTENT_VERSION_UNAVAILABLE`
- `ATTEMPT_ALREADY_TERMINAL`
- `ASSESSMENT_ALREADY_ISSUED`
- `PROMOTION_DECISION_SUPERSEDED`
- `TENANT_MISMATCH`
- `UNSUPPORTED_SCHEMA`
- `DEPENDENCY_NOT_ACCEPTED`

## 8. Resolution rules

Automatic resolution allowed for:

- exact idempotent duplicate,
- projection-only divergence,
- checkpoint where server state is strictly newer and no learner answer is lost.

Manual or explicit domain resolution required for:

- conflicting accepted answers,
- competing terminal lesson states,
- assessment decision conflict,
- course release migration conflict,
- pedagogical memory dispute.

## 9. Checkpoints

Checkpoints are resumability aids and may be compacted. They cannot overwrite accepted answers, evidence, assessments or transitions.

A stale checkpoint is discarded or merged only according to a versioned checkpoint policy.

## 10. Projection rebuild

Client may rebuild local state from:

```text
baseline snapshot + server delta
```

Rebuild must preserve pending local events separately until they are resubmitted or explicitly discarded.

## 11. Multi-device rules

- each device has unique `device_id`,
- server revision orders accepted operations across devices,
- read-your-writes may require synchronization acknowledgment,
- concurrent attempts may coexist only when course policy allows,
- same aggregate uses optimistic concurrency.

## 12. Security and privacy

- synchronization endpoints are tenant-scoped,
- payload minimization is mandatory,
- raw audio and images are not embedded in event streams,
- revoked consent may invalidate upload references without rewriting historical non-sensitive domain decisions,
- audit records track administrative conflict resolution.

## 13. Failure recovery

Required scenarios:

- network loss before acknowledgment,
- acknowledgment lost after server commit,
- app restart with pending events,
- server restart during batch,
- projection corruption,
- unsupported client schema,
- prolonged offline operation,
- deleted or migrated content release.

Idempotency must make retry safe after unknown outcome.

## 14. Tests

- duplicate submission,
- out-of-order client timestamps,
- stale aggregate version,
- two-device checkpoint conflict,
- accepted answer replay,
- tenant mismatch,
- cursor paging,
- projection rebuild,
- quarantine and later reprocessing,
- offline-to-online Early Vertical E2E.

## 15. Status

```text
AUTHORITY MODEL: DEFINED
OFFLINE LIFECYCLE: DEFINED
CONFLICT CLASSES: DEFINED
DELTA CONTRACT: DRAFT
PHYSICAL TRANSPORT: NOT LOCKED
IMPLEMENTATION: NOT YET BUILT
```