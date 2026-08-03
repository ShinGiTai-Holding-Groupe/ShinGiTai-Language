# ShinGiTai Language Event Catalog

**Version:** 0.1-draft  
**Status:** WORKING ARCHITECTURE REFERENCE  
**Owner:** ShinGiTai Holding Groupe  
**Canonical source:** `docs/architecture/kanon1.txt`  
**Related references:**

- `docs/architecture/language-architecture-book.md`
- `docs/architecture/language-domain-model.md`
- `docs/architecture/language-command-query-catalog.md`

---

## 0. Purpose

This catalog defines the domain and integration events used by ShinGiTai Language.

It establishes:

- one publisher for every event,
- immutable event semantics,
- stable payload expectations,
- idempotency and ordering rules,
- subscriber responsibilities,
- retry and quarantine policy,
- tenant and user isolation,
- separation between educational truth and AI execution metadata,
- the event chain used by the Early Vertical E2E.

An event records something that has already happened.

```text
command = intent
state transition = validated domain change
event = immutable fact about that change
```

Events must never be used as disguised commands.

---

## 1. Event classes

### 1.1 Domain events

Published by a domain aggregate after a successful state transition.

Examples:

- `LESSON_STARTED`,
- `LEARNING_EVIDENCE_VALIDATED`,
- `ASSESSMENT_DECISION_ISSUED`,
- `LEARNING_TRANSITION_APPLIED`.

Domain events are part of the educational audit trail.

### 1.2 Integration events

Published when another bounded context or external system must react.

Examples:

- `HIKARI_RESPONSE_REQUESTED`,
- `AI_EXECUTION_COMPLETED`,
- `COURSE_RELEASE_PUBLISHED`.

Integration events must expose only the minimum information required by subscribers.

### 1.3 Operational events

Describe transport, synchronization, retry, quarantine or projection processing.

Examples:

- `OFFLINE_EVENT_ACCEPTED`,
- `PROJECTION_REBUILD_COMPLETED`,
- `EVENT_QUARANTINED`.

Operational events are not educational truth.

---

## 2. Canonical event envelope

Every persisted event must include:

```text
event_id
idempotency_key
event_name
event_version
schema_version
aggregate_type
aggregate_id
aggregate_version
user_id
tenant_partition
organization_id, when applicable
device_id, when applicable
actor_type
occurred_at
received_at
server_revision
correlation_id
causation_id, when applicable
command_id, when applicable
trace_id, when applicable
payload
metadata
```

### 2.1 Required invariants

- `event_id` is globally unique.
- `idempotency_key` prevents duplicate application.
- `user_id` is mandatory for learner-owned educational events.
- `tenant_partition` is always mandatory.
- client time is descriptive only.
- `server_revision` is authoritative for accepted ordering.
- payload is immutable after acceptance.
- event names are past tense.
- physical model, provider, node and GPU identity are forbidden in educational event payloads.

### 2.2 Event processing status

```text
LOCAL_PENDING
SUBMITTED
ACCEPTED
APPLIED
CONFLICTED
REJECTED
QUARANTINED
```

The backend Language owns canonical synchronized event acceptance and application state.

---

## 3. Delivery semantics

Default delivery model:

```text
at-least-once delivery
+
idempotent consumers
+
append-only accepted event history
```

Exactly-once transport is not assumed.

Each consumer must persist its processed-event identity or an equivalent deduplication key before acknowledging completion.

### 3.1 Retry policy

Retryable failures:

- temporary database unavailability,
- transient network failure,
- temporary projection lag,
- temporary AI runtime unavailability where the event represents a pending request.

Non-retryable failures:

- schema incompatibility,
- invalid tenant boundary,
- revoked user access,
- impossible aggregate transition,
- malformed immutable payload.

Non-retryable failures enter rejection or quarantine, never an infinite retry loop.

### 3.2 Ordering policy

Global ordering is not required.

Ordering is required per:

```text
tenant_partition + aggregate_type + aggregate_id
```

For learner progress projections, `server_revision` is authoritative.

---

# PART I — COURSE AND CONTENT EVENTS

## 4. Course enrollment events

### 4.1 `LEARNER_ENROLLED_IN_COURSE`

**Publisher:** LearnerCourseEnrollment  
**Triggering command:** `EnrollLearnerInCourse`

Payload:

```text
enrollment_id
course_id
release_id
target_language
instruction_language
interface_language
regional_variant, optional
verified_starting_point, optional
enrollment_status
```

Primary subscribers:

- Progress projection,
- Hikari Teacher Runtime,
- Dashboard projection,
- Synchronization ledger.

Idempotency:

- one active enrollment for the same user, course and release unless policy explicitly permits otherwise.

---

### 4.2 `INSTRUCTION_LANGUAGE_CHANGED`

**Publisher:** LearnerCourseEnrollment

Payload:

```text
enrollment_id
previous_instruction_language
new_instruction_language
changed_at
```

Historical Learning Evidence remains tied to the instruction language used when it was created.

---

### 4.3 `COURSE_RELEASE_MIGRATION_REQUESTED`

Payload:

```text
enrollment_id
source_release_id
target_release_id
migration_policy_version
```

Subscribers:

- Content migration service,
- Enrollment projection,
- Audit ledger.

---

### 4.4 `COURSE_RELEASE_MIGRATION_APPROVED`

Payload:

```text
enrollment_id
source_release_id
target_release_id
migration_plan_id
approved_at
```

In-progress lesson attempts remain pinned to their original content version unless an explicit migration policy says otherwise.

---

### 4.5 `COURSE_RELEASE_MIGRATION_REJECTED`

Payload:

```text
enrollment_id
source_release_id
target_release_id
reason_code
```

---

## 5. Content lifecycle events

### 5.1 `COURSE_RELEASE_PUBLISHED`

**Publisher:** Content System

Payload:

```text
course_id
release_id
schema_version
content_version_set
published_at
provenance_review_status
license_review_status
pedagogical_review_status
```

Rules:

- published content is immutable,
- a correction creates a new version or release,
- AI-generated content cannot reach this event without required review gates.

---

### 5.2 `COURSE_RELEASE_DEPRECATED`

Payload:

```text
course_id
release_id
deprecated_at
replacement_release_id, optional
reason_code
```

---

### 5.3 `CONTENT_ITEM_REVIEW_COMPLETED`

Payload:

```text
content_id
content_version
review_type
reviewer_id
result
reviewed_at
```

Review types:

```text
LINGUISTIC
PEDAGOGICAL
LICENSE_PROVENANCE
TECHNICAL
ACCESSIBILITY
```

---

# PART II — LESSON AND ACTIVITY EVENTS

## 6. Lesson Runtime events

### 6.1 `LESSON_STARTED`

**Publisher:** LessonAttempt  
**Triggering command:** `StartLesson`

Payload:

```text
lesson_attempt_id
enrollment_id
lesson_id
content_version
release_id
session_id, optional
initial_checkpoint
```

Subscribers:

- Progress projection,
- Hikari Teacher Runtime,
- Analytics,
- Synchronization.

---

### 6.2 `LESSON_CHECKPOINT_SAVED`

Payload:

```text
lesson_attempt_id
checkpoint_version
checkpoint
saved_at
```

Ordering:

- later aggregate version supersedes earlier checkpoint projections,
- stale client checkpoints cannot overwrite newer server state.

---

### 6.3 `LESSON_PAUSED`

Payload:

```text
lesson_attempt_id
checkpoint_version
pause_reason, optional
paused_at
```

---

### 6.4 `LESSON_RESUMED`

Payload:

```text
lesson_attempt_id
resumed_from_checkpoint_version
resumed_at
```

---

### 6.5 `LESSON_COMPLETED`

Payload:

```text
lesson_attempt_id
completion_reason
completed_activity_ids
missing_optional_activity_ids
completed_at
```

This event does not imply promotion.

---

### 6.6 `LESSON_ABANDONED`

Payload:

```text
lesson_attempt_id
abandon_reason
abandoned_at
```

---

### 6.7 `LESSON_RETRY_CREATED`

Payload:

```text
source_lesson_attempt_id
new_lesson_attempt_id
retry_policy_version
created_at
```

The source attempt remains immutable.

---

## 7. Activity and answer events

### 7.1 `ACTIVITY_ATTEMPT_STARTED`

Payload:

```text
activity_attempt_id
lesson_attempt_id
activity_id
content_version
input_modality
accessibility_accommodation, optional
measurement_status
```

---

### 7.2 `ANSWER_SUBMITTED`

Payload:

```text
activity_attempt_id
submission_id
answer_payload_reference
input_modality
response_time
submitted_at
```

Sensitive raw media should be referenced through governed storage rather than embedded directly in the event.

---

### 7.3 `HINT_USED`

Payload:

```text
activity_attempt_id
hint_id
hint_level
used_at
```

Hint usage must flow into Learning Evidence and Assessment.

---

### 7.4 `ACTIVITY_SKIPPED`

Payload:

```text
activity_attempt_id
skip_reason
measurement_status
skipped_at
```

Skipping never creates positive mastery.

---

### 7.5 `ACTIVITY_COMPLETED`

Payload:

```text
activity_attempt_id
completion_status
completed_at
```

Completion status is not automatically equivalent to correctness.

---

# PART III — LEARNING EVIDENCE EVENTS

## 8. Evidence lifecycle events

### 8.1 `LEARNING_EVIDENCE_RECORDED`

**Publisher:** LearningEvidenceRecord  
**Triggering command:** `RecordLearningEvidence`

Payload:

```text
evidence_id
activity_id
skill_id
content_version
attempt_id
evidence_type
input_modality
result
confidence
hint_usage
response_time
rubric_version
evaluator_type
model_capability, when applicable
capability_contract_version, when applicable
evaluation_policy_version
evaluator_release
execution_receipt_id, when applicable
request_id, when applicable
trace_id, when applicable
status
measurement_status
```

Rules:

- AI-assisted evidence begins as `PROPOSED` or `PENDING_VALIDATION`,
- deterministic evidence may be validated immediately only under a versioned deterministic policy,
- provider and physical model details are forbidden.

---

### 8.2 `LEARNING_EVIDENCE_VALIDATION_REQUESTED`

Payload:

```text
evidence_id
validation_policy_version
requested_at
```

---

### 8.3 `LEARNING_EVIDENCE_VALIDATED`

Payload:

```text
evidence_id
validation_policy_version
validated_at
validated_by
previous_status
new_status = VALIDATED
```

Subscribers:

- Assessment Engine,
- Competency Profile,
- Vocabulary Engine,
- Grammar Engine,
- Review scheduler.

No subscriber may apply evidence twice.

---

### 8.4 `LEARNING_EVIDENCE_REJECTED`

Payload:

```text
evidence_id
reason_code
validated_at
validated_by
```

Rejected evidence cannot contribute to mastery or promotion.

---

### 8.5 `LEARNING_EVIDENCE_DISPUTED`

Payload:

```text
evidence_id
dispute_reason
requested_by
disputed_at
```

A disputed evidence item must be excluded from consequential assessment unless policy explicitly allows provisional use.

---

### 8.6 `LEARNING_EVIDENCE_SUPERSEDED`

Payload:

```text
superseded_evidence_id
replacement_evidence_id
reason
superseded_at
```

Historical chain remains queryable.

---

### 8.7 `LEARNING_EVIDENCE_REVOKED`

Payload:

```text
evidence_id
revocation_reason
authorized_actor
revoked_at
```

Revocation must trigger projection correction without deleting history.

---

# PART IV — ASSESSMENT AND PROMOTION EVENTS

## 9. Assessment events

### 9.1 `ASSESSMENT_REQUESTED`

**Publisher:** AssessmentDecision aggregate

Payload:

```text
assessment_id
assessment_scope
enrollment_id
module_id, optional
level_mapping_id, optional
rubric_version
evidence_selection_policy_version
requested_at
```

---

### 9.2 `ASSESSMENT_DECISION_ISSUED`

Payload:

```text
assessment_decision_id
assessment_id
eligible_evidence_ids
rubric_version
decision
satisfied_requirements
unsatisfied_requirements
measurement_statuses
confidence
issued_at
integrity_signature
```

Decision values:

```text
PASS
FAIL
INCOMPLETE
REVIEW_REQUIRED
```

Rules:

- immutable after issue,
- does not unlock content,
- correction requires a superseding decision.

---

### 9.3 `ASSESSMENT_DECISION_SUPERSEDED`

Payload:

```text
superseded_assessment_decision_id
replacement_assessment_decision_id
reason
superseded_at
```

---

## 10. Promotion and remediation events

### 10.1 `PROMOTION_APPROVED`

**Publisher:** LearningTransition aggregate

Payload:

```text
transition_id
assessment_decision_id
promotion_policy_version
source_state
target_state
approved_at
```

Promotion Engine may approve only from a current, validated `PASS` decision.

---

### 10.2 `PROMOTION_REJECTED`

Payload:

```text
transition_request_id
assessment_decision_id
reason_code
rejected_at
```

Promotion Engine cannot change the assessment decision.

---

### 10.3 `LEARNING_TRANSITION_APPLIED`

Payload:

```text
transition_id
enrollment_id
source_state
target_state
server_revision
applied_at
```

This is the authoritative event for module or level unlock state.

---

### 10.4 `REMEDIATION_PATH_CREATED`

Payload:

```text
remediation_path_id
assessment_decision_id
unsatisfied_requirement_ids
assigned_learning_units
reassessment_eligibility_rule
created_at
```

---

### 10.5 `REMEDIATION_PATH_COMPLETED`

Payload:

```text
remediation_path_id
supporting_evidence_ids
completed_at
```

---

### 10.6 `REASSESSMENT_ELIGIBILITY_GRANTED`

Payload:

```text
remediation_path_id
assessment_scope
eligible_from
```

---

# PART V — MASTERY, VOCABULARY, GRAMMAR AND SRS EVENTS

## 11. Competency events

### 11.1 `COMPETENCY_PROFILE_UPDATED`

**Publisher:** LearnerCompetencyProfile

Payload:

```text
competency_profile_id
skill_id
source_evidence_ids
previous_dimensions
new_dimensions
mastery_policy_version
updated_at
```

Mastery remains multidimensional.

---

### 11.2 `EXTERNAL_LEVEL_PROJECTION_UPDATED`

Payload:

```text
competency_profile_id
framework
mapping_version
previous_projection
new_projection
measurement_limitations
updated_at
```

External projections must not claim unmeasured competence.

---

## 12. Vocabulary events

### 12.1 `VOCABULARY_ITEM_INTRODUCED`

Payload:

```text
vocabulary_item_id
lexeme_id
content_version
source_context
introduced_at
```

---

### 12.2 `VOCABULARY_MASTERY_UPDATED`

Payload:

```text
vocabulary_item_id
source_evidence_id
previous_mastery_dimensions
new_mastery_dimensions
mastery_policy_version
updated_at
```

---

### 12.3 `VOCABULARY_ITEM_SUSPENDED`

Payload:

```text
vocabulary_item_id
reason
suspended_at
```

---

### 12.4 `VOCABULARY_REVIEW_COMPLETED`

Payload:

```text
review_item_id
vocabulary_item_id
evidence_id
outcome
completed_at
```

---

## 13. Grammar events

### 13.1 `GRAMMAR_CONCEPT_INTRODUCED`

Payload:

```text
learner_grammar_concept_id
grammar_concept_id
content_version
source_context
introduced_at
```

---

### 13.2 `GRAMMAR_MASTERY_UPDATED`

Payload:

```text
learner_grammar_concept_id
source_evidence_id
previous_mastery_dimensions
new_mastery_dimensions
mastery_policy_version
updated_at
```

---

## 14. Review scheduling events

### 14.1 `REVIEW_SCHEDULED`

Payload:

```text
review_item_id
review_subject_type
review_subject_id
review_policy_version
source_evidence_ids
scheduled_for
```

---

### 14.2 `GRAMMAR_REVIEW_SCHEDULED`

Payload follows `REVIEW_SCHEDULED` with grammar-specific subject metadata.

---

### 14.3 `NEXT_REVIEW_CALCULATED`

Payload:

```text
review_item_id
previous_due_at
next_due_at
review_policy_version
calculated_at
```

---

# PART VI — HIKARI TEACHER EVENTS

## 15. Teacher session events

### 15.1 `TEACHER_SESSION_STARTED`

**Publisher:** Hikari Teacher Runtime

Payload:

```text
teacher_session_id
student_profile_version
pedagogical_context_version
session_mode
started_at
```

Global Hikari Identity is referenced through OdynAI context and is not duplicated inside Language.

---

### 15.2 `TEACHER_ACTION_RECOMMENDED`

Payload:

```text
teacher_session_id
action_type
target_id, optional
reason_codes
confidence
recommended_at
```

A recommendation does not mutate educational truth.

---

### 15.3 `HIKARI_RESPONSE_REQUESTED`

Payload:

```text
teacher_session_id
teacher_decision_id
interaction_intent
interaction_profile
speech_profile
capability_contract_version
context_projection_id
requested_at
```

This event represents a request boundary, not completed inference.

---

### 15.4 `AI_EXECUTION_COMPLETED`

**Publisher:** OdynAI integration adapter

Payload:

```text
request_id
trace_id
execution_receipt_id
capability_contract_version
finish_status
semantic_result_reference
completed_at
```

Language does not receive physical provider, model, node or GPU identity.

---

### 15.5 `TEACHER_RESPONSE_REALIZED`

**Publisher:** Hikari Human Interaction Layer

Payload:

```text
teacher_response_id
teacher_session_id
teacher_decision_id
display_text
spoken_text
interaction_profile
speech_profile
realizer_version
realized_at
```

`display_text` and `spoken_text` are separate projections of the same teacher decision.

---

### 15.6 `CONVERSATION_QUALITY_VALIDATED`

Payload:

```text
teacher_response_id
quality_gate_version
ivona_effect_benchmark_result
validation_result
violations
validated_at
```

A failed quality gate must prevent normal publication or route the response to a governed degraded fallback.

---

### 15.7 `TEACHER_FEEDBACK_DELIVERED`

Payload:

```text
teacher_response_id
teacher_session_id
delivery_channels
delivered_at
```

---

## 16. Pedagogical Memory events

### 16.1 `PEDAGOGICAL_OBSERVATION_PROPOSED`

Payload:

```text
observation_id
observation_type
subject_reference
evidence_references
proposed_value
confidence
proposed_by
proposed_at
```

---

### 16.2 `PEDAGOGICAL_OBSERVATION_VALIDATED`

Payload:

```text
observation_id
validated_value
validated_by
validated_at
```

Language owns the durable record. OdynAI owns access and context-projection policy.

---

### 16.3 `PEDAGOGICAL_OBSERVATION_REJECTED`

Payload:

```text
observation_id
reason_code
rejected_by
rejected_at
```

---

### 16.4 `PEDAGOGICAL_OBSERVATION_EXPIRED`

Payload:

```text
observation_id
expiration_policy_version
expired_at
```

---

# PART VII — SYNCHRONIZATION AND OPERATIONS EVENTS

## 17. Offline synchronization events

### 17.1 `OFFLINE_EVENT_SUBMITTED`

Payload:

```text
client_event_id
idempotency_key
device_id
client_sequence
submitted_at
```

---

### 17.2 `OFFLINE_EVENT_ACCEPTED`

Payload:

```text
client_event_id
canonical_event_id
server_revision
accepted_at
```

---

### 17.3 `OFFLINE_EVENT_APPLIED`

Payload:

```text
canonical_event_id
aggregate_id
aggregate_version
server_revision
applied_at
```

---

### 17.4 `OFFLINE_EVENT_CONFLICTED`

Payload:

```text
client_event_id
conflict_type
server_aggregate_version
resolution_policy
conflicted_at
```

---

### 17.5 `OFFLINE_EVENT_REJECTED`

Payload:

```text
client_event_id
reason_code
rejected_at
```

---

### 17.6 `EVENT_QUARANTINED`

Payload:

```text
event_id
reason_code
quarantine_category
quarantined_at
```

Quarantined events require explicit inspection or policy-driven release.

---

## 18. Projection events

### 18.1 `PROJECTION_UPDATED`

Payload:

```text
projection_name
projection_key
source_event_id
projection_version
updated_at
```

---

### 18.2 `PROJECTION_REBUILD_STARTED`

Payload:

```text
projection_name
from_server_revision
started_at
```

---

### 18.3 `PROJECTION_REBUILD_COMPLETED`

Payload:

```text
projection_name
through_server_revision
processed_event_count
completed_at
```

---

# PART VIII — EARLY VERTICAL E2E EVENT CHAIN

## 19. Canonical event sequence

The first reference E2E must prove this chain:

```text
LEARNER_ENROLLED_IN_COURSE
→ LESSON_STARTED
→ ACTIVITY_ATTEMPT_STARTED
→ ANSWER_SUBMITTED
→ LEARNING_EVIDENCE_RECORDED
→ LEARNING_EVIDENCE_VALIDATED
→ ASSESSMENT_REQUESTED
→ ASSESSMENT_DECISION_ISSUED
→ HIKARI_RESPONSE_REQUESTED
→ AI_EXECUTION_COMPLETED
→ TEACHER_RESPONSE_REALIZED
→ CONVERSATION_QUALITY_VALIDATED
→ TEACHER_FEEDBACK_DELIVERED
```

Optional promotion branch:

```text
ASSESSMENT_DECISION_ISSUED(PASS)
→ PROMOTION_APPROVED
→ LEARNING_TRANSITION_APPLIED
```

Failure branch examples:

```text
AI_EXECUTION_COMPLETED(failed)
→ governed degraded response
→ TEACHER_RESPONSE_REALIZED
→ CONVERSATION_QUALITY_VALIDATED
```

or:

```text
LEARNING_EVIDENCE_REJECTED
→ ASSESSMENT_DECISION_ISSUED(INCOMPLETE or REVIEW_REQUIRED)
```

## 19.1 Required E2E receipts

The E2E run must record:

```text
language_commit
odynai_commit
shinrei_commit
runtime_protocol_version
language_contract_version
capability_contract_version
course_release_id
content_version
assessment_rubric_version
execution_receipt_id
request_id
trace_id
result
tested_at
```

---

## 20. Subscriber rules

### 20.1 Projection subscribers

May update read models only.

They must not mutate authoritative aggregates.

### 20.2 Domain subscribers

May issue a new command after validating authorization, idempotency and current state.

They must not directly edit another aggregate.

### 20.3 Analytics subscribers

May observe redacted events.

Analytics cannot become a source of product state.

### 20.4 Hikari subscribers

May consume validated pedagogical projections.

They may recommend actions but cannot directly mutate mastery, assessment, promotion or curriculum.

---

## 21. Schema evolution

Rules:

- event name remains stable within a semantic contract,
- breaking payload changes require a new `event_version`,
- consumers must declare supported versions,
- old accepted events remain readable,
- upcasters may project old payloads into a newer read representation,
- historical event bytes are not rewritten,
- removal of a field is breaking unless it was explicitly optional and unused by contract.

---

## 22. Validation gates

Before this catalog becomes a stable implementation contract, it requires:

- alignment review against `kanon1`,
- alignment review against the Command & Query Catalog,
- aggregate-owner review,
- event-schema validation plan,
- idempotency test plan,
- replay and projection-rebuild test plan,
- tenant-isolation test plan,
- Early Vertical E2E plan approval,
- cross-repository contract confirmation.

---

## 23. Status

```text
EVENT CATALOG: DRAFT
DOMAIN EVENT OWNERSHIP: DEFINED
INTEGRATION EVENT BOUNDARIES: DEFINED
IMPLEMENTATION CONTRACT: NOT YET LOCKED
```
