# ShinGiTai Language Data Dictionary

**Version:** 0.1-draft  
**Status:** WORKING ARCHITECTURE REFERENCE  
**Owner:** ShinGiTai Holding Groupe  
**Canonical source:** `docs/architecture/kanon1.txt`

Related references:

- `docs/architecture/language-architecture-book.md`
- `docs/architecture/language-domain-model.md`
- `docs/architecture/language-command-query-catalog.md`
- `docs/architecture/language-event-catalog.md`
- `docs/architecture/language-learning-core-specification.md`
- `docs/architecture/language-hikari-teacher-specification.md`

---

## 0. Purpose

This dictionary defines the canonical meaning, ownership, type expectations, mutability and validation rules of shared Language data fields.

It does not prescribe one physical database schema.

Its goals are:

- eliminate ambiguous field names,
- preserve consistent semantics across bounded contexts,
- prevent execution-plane leakage into educational state,
- support code generation and contract tests,
- support event, command, query and persistence design,
- preserve tenant isolation and auditability.

A field name must not be reused with a different meaning in another Language context.

---

## 1. Naming rules

### 1.1 Identifier naming

Identifiers must use explicit names:

```text
course_id
lesson_id
lesson_attempt_id
assessment_decision_id
```

Avoid generic names such as:

```text
id
item_id
object_id
record_id
```

unless the surrounding schema guarantees one unambiguous aggregate type.

### 1.2 Timestamp naming

Use:

- `created_at`
- `updated_at`
- `started_at`
- `completed_at`
- `occurred_at`
- `received_at`
- `validated_at`
- `deprecated_at`

All canonical timestamps use UTC and ISO 8601 serialization.

### 1.3 Version naming

Use distinct fields for distinct concepts:

- `schema_version` — serialized contract shape,
- `content_version` — immutable content revision,
- `release_id` — published course/content release,
- `aggregate_version` — optimistic concurrency revision,
- `server_revision` — backend-assigned synchronization order,
- `policy_version` — versioned decision policy,
- `rubric_version` — versioned assessment rubric,
- `capability_contract_version` — AI capability contract.

These fields are not interchangeable.

---

## 2. Global identity and tenancy fields

### `user_id`

- Type: opaque stable identifier, preferably UUIDv7.
- Owner: platform identity resolved for Language.
- Required: yes for learner-owned state.
- Mutable: no.
- Meaning: person whose learning state is represented.
- Rule: never inferred from untrusted payload when authenticated context exists.

### `tenant_partition`

- Type: opaque stable identifier.
- Owner: Language tenancy boundary.
- Required: always for durable product state.
- Mutable: no.
- Meaning: canonical isolation partition.
- Rule: all reads and writes must validate it before accessing state.

### `organization_id`

- Type: opaque stable identifier.
- Required: when a record belongs to a school, company or institution.
- Mutable: no in historical records.
- Meaning: organization-level ownership or administration scope.

### `actor_id`

- Type: opaque identifier.
- Meaning: actor initiating a command or validation.
- Required: for auditable state changes.

### `actor_type`

Allowed values:

```text
LEARNER
HIKARI_TEACHER_RUNTIME
SYSTEM
ADMINISTRATOR
CONTENT_REVIEWER
HUMAN_EVALUATOR
```

Rule: actor type never grants permission by itself; authorization remains policy-driven.

### `device_id`

- Type: opaque stable device identifier.
- Owner: client/device registration context.
- Use: synchronization, revocation and replay protection.
- Rule: not a security principal on its own.

---

## 3. Correlation and idempotency fields

### `command_id`

- Type: UUIDv7 or equivalent sortable unique identifier.
- Owner: command initiator.
- Mutable: no.
- Purpose: uniquely identifies one command attempt.

### `query_id`

- Type: UUIDv7 or equivalent.
- Purpose: trace one query operation.

### `event_id`

- Type: UUIDv7 or equivalent.
- Owner: event publisher.
- Mutable: no.
- Purpose: globally unique event identity.

### `idempotency_key`

- Type: bounded string or opaque identifier.
- Required: external and offline state-changing commands.
- Rule: same key plus same semantic payload must resolve idempotently.
- Rule: same key plus different payload must be rejected.

### `correlation_id`

- Type: opaque identifier.
- Purpose: groups all work for one logical user or system interaction.

### `causation_id`

- Type: opaque identifier.
- Purpose: identifies the direct command or event that caused a new event.

### `request_id`

- Type: opaque execution request identifier.
- Owner: OdynAI-facing application integration.
- Stored in educational state: only when required for AI-assisted evidence provenance.

### `trace_id`

- Type: opaque distributed trace identifier.
- Purpose: audit and troubleshooting across Language, OdynAI, RuntimePort and Shinrei.

### `execution_receipt_id`

- Type: opaque immutable receipt identifier.
- Owner: OdynAI/Shinrei execution chain.
- Purpose: enables later technical provenance reconstruction.
- Rule: Language must not derive physical provider, model, node or GPU from this field inside educational logic.

---

## 4. Aggregate and synchronization versions

### `aggregate_version`

- Type: non-negative 64-bit integer.
- Owner: aggregate repository.
- Purpose: optimistic concurrency.
- Initial value: implementation-defined but consistent.
- Rule: client cannot choose the accepted next value.

### `expected_aggregate_version`

- Type: non-negative 64-bit integer.
- Purpose: compare-and-set precondition supplied by a command.
- Failure result: `CONFLICTED`.

### `server_revision`

- Type: monotonically increasing backend-assigned value within the defined synchronization partition.
- Owner: Language backend.
- Purpose: accepted canonical ordering.
- Rule: client clock is never authoritative for ordering.

### `synchronization_cursor`

- Type: opaque cursor or last accepted server revision.
- Owner: client projection.
- Purpose: request deltas after a known synchronized state.

---

## 5. Course and content identifiers

### `course_id`

- Meaning: stable logical course identity.
- Mutable: no.
- Distinct from: `release_id`.

### `release_id`

- Meaning: immutable published release identity.
- Rule: historical attempts and evidence remain pinned to the original release.

### `module_id`

- Meaning: stable module identity inside a course definition.

### `chapter_id`

- Meaning: stable chapter identity inside a module.

### `lesson_id`

- Meaning: stable logical lesson identity.

### `activity_id`

- Meaning: stable logical activity identity.

### `challenge_id`

- Meaning: stable challenge identity.

### `exam_id`

- Meaning: stable exam definition identity.

### `content_id`

- Meaning: stable logical content item identity.

### `content_version`

- Type: immutable semantic or monotonic version string.
- Rule: a published version is never modified in place.

### `schema_version`

- Type: version string.
- Purpose: serialized payload contract version.

### `status` for content

Allowed values:

```text
PLANNED
STRUCTURED
CONTENT_DRAFT
LINGUISTIC_REVIEWED
PEDAGOGICALLY_REVIEWED
TECHNICALLY_VALIDATED
TESTED
RELEASE_READY
DEPRECATED
```

---

## 6. Enrollment and lesson fields

### `enrollment_id`

- Owner: LearnerCourseEnrollment aggregate.
- Meaning: one learner's participation in one pinned course release.

### `lesson_attempt_id`

- Owner: LessonAttempt aggregate.
- Meaning: one concrete execution of a lesson by one learner.
- Mutable: no.

### `activity_attempt_id`

- Owner: ActivityAttempt aggregate.
- Meaning: one concrete activity execution.

### `attempt_id`

- Generic use: allowed only in contracts that explicitly name the attempt type elsewhere.
- Preferred: concrete identifier such as `lesson_attempt_id` or `activity_attempt_id`.

### `checkpoint`

- Type: versioned structured payload.
- Meaning: resumable state projection.
- Rule: checkpoint does not own educational truth.

### `lesson_state`

Allowed values:

```text
NOT_STARTED
IN_PROGRESS
PAUSED
COMPLETED
FAILED
ABANDONED
REQUIRES_REVIEW
```

### `activity_completion_status`

Allowed values:

```text
IN_PROGRESS
COMPLETED
SKIPPED
ABANDONED
FAILED
```

### `hint_usage`

- Type: structured collection or normalized counters.
- Must include: hint level or count when relevant.
- Purpose: evidence weighting and assessment.

### `response_time`

- Type: non-negative duration in milliseconds.
- Rule: never interpreted without activity and accessibility context.

---

## 7. Learning Evidence fields

### `evidence_id`

- Owner: LearningEvidenceRecord aggregate.
- Mutable: no.
- Meaning: immutable identity of one evidence record.

### `evidence_type`

Suggested values:

```text
RECOGNITION
RECALL
LISTENING_COMPREHENSION
READING_COMPREHENSION
CONTROLLED_PRODUCTION
FREE_PRODUCTION
WRITING
SPEAKING
PRONUNCIATION
CONVERSATION_TRANSFER
RETENTION
TEACHER_OBSERVATION
```

This list remains versioned and extensible through reviewed contract changes.

### `input_modality`

Allowed values:

```text
TEXT
AUDIO
IMAGE
VIDEO
GESTURE
MIXED
SYSTEM_GENERATED
```

### `result`

- Type: versioned structured result.
- Rule: must not be an unbounded provider-specific payload.
- Rule: retain only pedagogically relevant observations.

### `confidence`

- Type: decimal from 0.0 to 1.0.
- Meaning: confidence in the evidence interpretation, not learner confidence unless explicitly named.

### `evaluator_type`

Allowed values:

```text
DETERMINISTIC
AI_ASSISTED
HUMAN_REVIEWED
```

### `model_capability`

- Meaning: abstract capability used for evaluation.
- Examples: structured writing evaluation, pronunciation analysis.
- Rule: not a physical model name.

### `capability_contract_version`

- Meaning: version of the application-visible AI capability contract.

### `evaluation_policy_version`

- Meaning: exact policy used to turn observations into evidence.

### `evaluator_release`

- Meaning: release identifier of evaluator implementation.
- Rule: no physical model or provider leakage.

### `rubric_version`

- Meaning: exact scoring rubric used.

### `supersedes_evidence_id`

- Type: nullable evidence identifier.
- Meaning: explicit correction chain.
- Rule: superseding does not delete historical evidence.

### `validated_by`

- Type: actor identity or policy identity.
- Meaning: entity responsible for final validation.

### `evidence_status`

Allowed values:

```text
PROPOSED
PENDING_VALIDATION
VALIDATED
REJECTED
DISPUTED
SUPERSEDED
REVOKED
```

Only `VALIDATED` evidence may update canonical mastery unless a separate reviewed policy explicitly allows provisional projections.

---

## 8. Assessment fields

### `assessment_id`

- Meaning: assessment execution identity.

### `assessment_decision_id`

- Owner: AssessmentDecision aggregate.
- Mutable: no.
- Meaning: immutable issued decision identity.

### `assessment_scope`

Suggested values:

```text
ACTIVITY
LESSON
MODULE
LEVEL
PLACEMENT
REMEDIATION
COMPETENCY
```

### `assessment_decision`

Allowed values:

```text
PASS
FAIL
INCOMPLETE
REVIEW_REQUIRED
```

### `satisfied_requirements`

- Type: list of stable requirement identifiers.
- Rule: no free-text-only representation for machine decisions.

### `unsatisfied_requirements`

- Type: list of stable requirement identifiers.
- Purpose: remediation and explainability.

### `measurement_status`

Allowed values:

```text
ASSESSED
ACCOMMODATED
NOT_ASSESSED
NOT_APPLICABLE
INSUFFICIENT_EVIDENCE
```

### `integrity_signature`

- Type: implementation-defined integrity proof.
- Purpose: detect unauthorized modification of issued decisions.
- Rule: signature mechanism must be versioned and replaceable.

---

## 9. Promotion and remediation fields

### `learning_transition_id`

- Owner: LearningTransition aggregate.
- Meaning: immutable transition application identity.

### `promotion_policy_version`

- Meaning: exact unlock policy version.

### `transition_status`

Allowed values:

```text
PENDING
APPLIED
REJECTED
NO_TRANSITION_REQUIRED
SUPERSEDED
```

### `remediation_path_id`

- Meaning: identity of a targeted recovery learning path.

### `reassessment_eligibility_rule`

- Type: versioned structured policy reference.
- Rule: must not be encoded only as free text.

---

## 10. Competency and mastery fields

### `skill_id`

- Meaning: stable internal competency graph node identity.
- Rule: external framework labels such as A2 or N5 are not skill identifiers.

### `competency_profile_id`

- Owner: LearnerCompetencyProfile aggregate.

### `mastery_value`

- Preferred type: bounded decimal 0.0 to 1.0 plus status metadata.
- Rule: never interpreted without `mastery_policy_version` and evidence provenance.

### `mastery_status`

Suggested projection values:

```text
UNKNOWN
INTRODUCED
LEARNING
PRACTICING
SUPPORTED
VERIFIED
STABLE
MASTERED
DECAYING
REVIEW_REQUIRED
RELEARNING
```

### Vocabulary mastery dimensions

```text
recognition_mastery
recall_mastery
listening_mastery
production_mastery
pronunciation_mastery
orthography_mastery
contextual_use_mastery
```

### Grammar mastery dimensions

```text
recognition_mastery
controlled_production_mastery
free_production_mastery
conversation_transfer_mastery
retention_mastery
```

A single aggregate `MASTERED` label may be exposed to UI but is never the sole canonical source state.

---

## 11. Vocabulary, grammar and review fields

### `lexeme_id`

- Meaning: stable canonical vocabulary item identity.

### `learner_vocabulary_item_id`

- Meaning: learner-specific state for one lexeme.

### `grammar_concept_id`

- Meaning: stable canonical grammar concept identity.

### `learner_grammar_concept_id`

- Meaning: learner-specific state for one grammar concept.

### `review_item_id`

- Meaning: one scheduled review instance or queue item.

### `review_due_at`

- Type: UTC timestamp.
- Owner: Review/SRS Engine.

### `review_policy_version`

- Meaning: exact scheduling algorithm/policy version.

### `review_state`

Allowed values:

```text
SCHEDULED
AVAILABLE
IN_PROGRESS
COMPLETED
MISSED
CANCELLED
SUPERSEDED
```

---

## 12. Hikari Teacher Runtime fields

### `teacher_session_id`

- Owner: Hikari Teacher Runtime.
- Meaning: one pedagogically coherent Hikari session.

### `student_profile_projection_version`

- Meaning: version of the read projection used for planning.
- Rule: projection does not become canonical educational truth.

### `teacher_strategy`

Suggested values:

```text
EXPLAIN
DEMONSTRATE
GUIDE
CHALLENGE
REVIEW
CORRECT
ENCOURAGE
EVALUATE
SUMMARIZE
ASK
```

### `interaction_intent`

Suggested values:

```text
TEACHER_GREETING
LESSON_GUIDANCE
CORRECTION
EXPLANATION
ASSESSMENT_FEEDBACK
MOTIVATION
INTERVENTION
SESSION_SUMMARY
EXAM_INTRODUCTION
EXAM_RESULT
```

### `teacher_tone`

Suggested values:

```text
NEUTRAL
SUPPORTIVE
SUPPORTIVE_FIRM
CALM
DIRECT
ENCOURAGING
SERIOUS
PLAYFUL_LIGHT
```

### `display_text`

- Meaning: UI-optimized teacher response projection.

### `spoken_text`

- Meaning: speech-optimized projection of the same teacher decision.
- Rule: may differ in wording from `display_text` but not in semantic decision.

### `conversation_quality_status`

Allowed values:

```text
PENDING
PASSED
REWRITE_REQUIRED
REJECTED
DEGRADED
```

---

## 13. Pedagogical Memory fields

### `pedagogical_observation_id`

- Owner: Language Pedagogical Memory.

### `observation_type`

Allowed values:

```text
STUDENT_GOAL
LEARNING_PREFERENCE
RECURRING_ERROR
OBSERVED_STRENGTH
INTERVENTION_RESULT
EXAM_HISTORY
MOTIVATION_SIGNAL
TEACHER_OBSERVATION
```

### `observation_status`

Allowed values:

```text
PROPOSED
VALIDATED
REJECTED
EXPIRED
```

### `expires_at`

- Type: nullable UTC timestamp.
- Meaning: memory validity boundary.

### `source_evidence_ids`

- Type: list of evidence identifiers.
- Rule: validated pedagogical claims should be traceable to evidence or explicit learner declaration.

---

## 14. Synchronization state fields

### `sync_state`

Allowed values:

```text
LOCAL_PENDING
SUBMITTED
ACCEPTED
APPLIED
CONFLICTED
REJECTED
QUARANTINED
```

### `occurred_at`

- Meaning: time reported by the originating actor or device.
- Rule: not authoritative for canonical ordering.

### `received_at`

- Meaning: backend receipt time.

### `conflict_reason`

- Type: stable error code plus optional safe detail.

### `quarantine_reason`

- Type: stable error code.
- Meaning: reason an event cannot be safely applied or discarded automatically.

---

## 15. Command and query result fields

### `result_status`

Allowed command values:

```text
ACCEPTED
APPLIED
REJECTED
CONFLICTED
QUARANTINED
REVIEW_REQUIRED
```

### `consistency_requirement`

Allowed query values:

```text
EVENTUAL
READ_YOUR_WRITES
STRONG_FOR_AGGREGATE
```

### `projection_version`

- Meaning: version of a read model or projection schema.
- Rule: not equal to aggregate version unless explicitly documented.

### `error_code`

- Type: stable namespaced error identifier.
- Rule: UI text is not an error code.

---

## 16. Forbidden educational-domain fields

The following values must not be stored as part of canonical educational state:

```text
physical_model
provider
provider_secret
node
GPU
CUDA_device
raw_runtime_host
physical_endpoint
```

Execution provenance must be referenced through:

```text
execution_receipt_id
request_id
trace_id
capability_contract_version
evaluator_release
```

---

## 17. Nullability rules

- Required ownership fields are never nullable.
- Historical audit fields are never removed to simplify a current projection.
- Optional fields must have explicit semantic meaning when absent.
- `null` must not mean both "unknown" and "not applicable".
- Use explicit statuses such as `NOT_ASSESSED` or `NOT_APPLICABLE` where ambiguity would affect assessment.

---

## 18. Serialization and validation rules

- Unknown enum values must fail closed or be preserved as unsupported according to the contract.
- Numeric mastery and confidence fields must reject values outside defined bounds.
- Timestamps must include timezone or serialize as UTC.
- Payload sizes must be bounded.
- Free text must be separated from machine-authoritative codes.
- Every cross-boundary schema must include `schema_version`.
- Every versioned policy reference must resolve to an immutable definition.

---

## 19. Stability status

Current status:

```text
FIELD SEMANTICS: DRAFT
IDENTIFIER RULES: DEFINED
ENUM BASELINE: DEFINED
PHYSICAL STORAGE TYPES: NOT LOCKED
IMPLEMENTATION CONTRACT: NOT YET LOCKED
```

Before lock:

- reconcile with implemented TypeScript types,
- validate command and event field coverage,
- validate persistence mappings,
- run architecture validation,
- run typecheck and tests,
- review Early Vertical E2E payloads,
- approve enum evolution policy.
