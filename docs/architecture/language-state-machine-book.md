# ShinGiTai Language State Machine Book

**Version:** 0.1-draft  
**Status:** WORKING ARCHITECTURE REFERENCE  
**Canonical source:** `docs/architecture/kanon1.txt`

## 0. Purpose

This book defines allowed lifecycle transitions, guards, side effects, retry rules and forbidden transitions for core Language aggregates.

## 1. Global rules

- State transitions occur only through commands owned by the aggregate.
- Every accepted transition increments `aggregate_version`.
- Failed guards do not mutate state.
- Historical terminal states are immutable unless superseded by a new aggregate or explicit superseding record.
- UI, Hikari, projections and analytics cannot transition domain state directly.

## 2. LearnerCourseEnrollment

```text
PENDING -> ACTIVE -> COMPLETED
PENDING -> CANCELLED
ACTIVE -> SUSPENDED -> ACTIVE
ACTIVE -> WITHDRAWN
```

Guards:

- `ACTIVE` requires an available immutable `CourseRelease`.
- release migration creates an explicit migration decision; it does not rewrite history.

## 3. LessonAttempt

```text
NOT_STARTED -> IN_PROGRESS
IN_PROGRESS -> PAUSED -> IN_PROGRESS
IN_PROGRESS -> COMPLETED
IN_PROGRESS -> ABANDONED
PAUSED -> ABANDONED
COMPLETED -> terminal
ABANDONED -> terminal
```

Guards:

- `COMPLETED` requires all required activities completed or formally waived.
- `ABANDONED` never creates positive mastery by itself.
- retry creates a new `LessonAttempt` referencing the source attempt.

## 4. ActivityAttempt

```text
CREATED -> ACTIVE
ACTIVE -> ANSWER_SUBMITTED
ANSWER_SUBMITTED -> EVALUATION_PENDING
ANSWER_SUBMITTED -> EVIDENCE_RECORDED
EVALUATION_PENDING -> EVIDENCE_RECORDED
EVIDENCE_RECORDED -> COMPLETED
ACTIVE -> SKIPPED
ACTIVE -> ABANDONED
```

Forbidden:

- `ACTIVE -> COMPLETED` without accepted evidence or an explicit non-assessed completion policy.
- mutation of an accepted answer; correction requires a new submission or superseding evidence.

## 5. LearningEvidenceRecord

```text
PROPOSED -> PENDING_VALIDATION
PENDING_VALIDATION -> VALIDATED
PENDING_VALIDATION -> REJECTED
VALIDATED -> DISPUTED
DISPUTED -> VALIDATED
DISPUTED -> REJECTED
VALIDATED -> SUPERSEDED
VALIDATED -> REVOKED
```

Rules:

- deterministic evidence may move directly to `VALIDATED` when policy allows.
- AI-assisted evidence cannot become educational truth before validation.
- `SUPERSEDED` and `REVOKED` are terminal.

## 6. AssessmentDecision

```text
REQUESTED -> RUNNING
RUNNING -> ISSUED
RUNNING -> REVIEW_REQUIRED
REVIEW_REQUIRED -> RUNNING
ISSUED -> SUPERSEDED
```

Decision payload:

```text
PASS | FAIL | INCOMPLETE | REVIEW_REQUIRED
```

Guards:

- only eligible evidence can be selected.
- issued decision is immutable.
- Assessment Engine never performs unlock transitions.

## 7. LearningTransition / Promotion

```text
PENDING -> APPLIED
PENDING -> REMEDIATION_CREATED
PENDING -> REJECTED
REMEDIATION_CREATED -> COMPLETED
COMPLETED -> REASSESSMENT_ELIGIBLE
```

Rules:

- accepts only current, approved `AssessmentDecision`.
- cannot alter assessment outcome.
- duplicate application is idempotent.

## 8. LearnerCompetencyProfile

Competency state is derived from validated evidence:

```text
UNKNOWN -> INTRODUCED -> PRACTICED -> VERIFIED -> STABLE -> MASTERED
MASTERED -> DECAYING -> REVIEW_REQUIRED -> RESTORED
```

The overall state is a projection over dimensional mastery and evidence recency, not a manually set flag.

## 9. LearnerVocabularyItem

```text
NEW -> LEARNING -> PRACTICING -> VERIFIED -> STABLE -> MASTERED
MASTERED -> DECAYING -> REVIEW_REQUIRED -> RESTORED
ANY_ACTIVE -> SUSPENDED
SUSPENDED -> LEARNING
```

Each mastery dimension may progress independently.

## 10. LearnerGrammarConcept

```text
INTRODUCED -> UNDERSTOOD -> GUIDED_USAGE -> INDEPENDENT_USAGE -> VERIFIED -> MASTERED
MASTERED -> DECAYING -> REVIEW_REQUIRED -> RESTORED
```

Recognition cannot automatically promote free production.

## 11. ReviewSchedule

```text
PLANNED -> AVAILABLE -> RUNNING -> COMPLETED
AVAILABLE -> MISSED
MISSED -> RESCHEDULED -> AVAILABLE
RUNNING -> INTERRUPTED -> AVAILABLE
```

A completed review creates new Learning Evidence.

## 12. TeacherSession

```text
CREATED -> PREPARING -> ACTIVE -> SUMMARIZING -> CLOSED
ACTIVE -> RECOVERY -> SUMMARIZING
PREPARING -> CANCELLED
```

Rules:

- every non-cancelled session ends with summary or recovery summary.
- session state cannot mutate educational truth.

## 13. TeacherResponseProjection

```text
REQUESTED -> GENERATING -> SEMANTIC_RESULT_RECEIVED -> REALIZING -> QUALITY_REVIEW -> READY -> DELIVERED
GENERATING -> DEGRADED
QUALITY_REVIEW -> REJECTED
DEGRADED -> READY
```

Order is mandatory:

```text
pre-generation policy -> inference -> semantic result -> response realizer -> quality gate
```

## 14. Synchronization event

```text
LOCAL_PENDING -> SUBMITTED -> ACCEPTED -> APPLIED
SUBMITTED -> CONFLICTED
SUBMITTED -> REJECTED
SUBMITTED -> QUARANTINED
CONFLICTED -> RESOLVED -> ACCEPTED
```

Server revision is authoritative; client time is not.

## 15. Required tests

Every state machine requires:

- all allowed transition tests,
- every forbidden transition test,
- stale aggregate version test,
- idempotent replay test,
- tenant isolation test,
- terminal-state immutability test,
- event emission test,
- persistence restore test.

## 16. Status

```text
STATE MACHINES: DRAFT BASELINE
GUARDS: DEFINED
FORBIDDEN TRANSITIONS: DEFINED
AUTOMATED TESTS: NOT YET IMPLEMENTED
STABLE REFERENCE: NOT YET LOCKED
```