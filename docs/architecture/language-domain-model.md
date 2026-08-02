# ShinGiTai Language Domain Model

**Version:** 0.1-draft  
**Status:** WORKING DOMAIN REFERENCE  
**Owner:** ShinGiTai Holding Groupe  
**Canonical source:** `docs/architecture/kanon1.txt`  
**Architecture reference:** `docs/architecture/language-architecture-book.md`

---

## 0. Purpose

This document defines the first implementation-oriented domain model for ShinGiTai Language.

It establishes:

- bounded contexts,
- aggregate roots,
- entities,
- value objects,
- lifecycle states,
- authority boundaries,
- ownership rules,
- cross-context references,
- required invariants.

This document does not define physical database tables, transport DTOs or provider-specific execution details.

When this document conflicts with `kanon1.txt`, the canon wins.

---

## 1. Domain boundaries

```text
ShinGiTai Language
|
|-- Learning Core
|   |-- Course and Curriculum
|   |-- Lesson Runtime
|   |-- Exercise Runtime
|   |-- Learning Evidence
|   |-- Assessment
|   |-- Promotion
|   |-- Vocabulary and SRS
|   |-- Grammar
|   |-- Competency and Mastery
|   `-- Progress
|
|-- Hikari Teacher Runtime
|-- Hikari Human Interaction Layer
|-- Application Services
|-- Persistence / Synchronization
|-- Content System
`-- UI
```

Global Hikari Identity Core belongs to OdynAI and is consumed by Language.

---

## 2. Universal identity and tenancy

Every durable student-owned record must contain:

- `user_id`,
- `tenant_partition`,
- `organization_id` when applicable.

No progress, evidence, memory, answer, recording, assessment or promotion record may exist without an explicit owner and tenant partition.

### 2.1 Shared value objects

#### UserId

Opaque stable identifier of one learner.

#### TenantPartition

Mandatory partition boundary used for authorization, storage and synchronization.

#### OrganizationId

Optional only when the learner record is not organization-owned. Required when a school, company or institution owns the learning context.

#### DeviceId

Stable identifier of one authorized client device.

#### ContentReference

```text
content_id
content_version
schema_version
release_id
```

A historical learning record must always preserve the exact content version used.

#### ExecutionReceiptReference

```text
execution_receipt_id
request_id
trace_id
capability_contract_version
evaluator_release
```

Language stores this auditable receipt reference without storing physical provider, model, node or GPU identity.

---

## 3. Aggregate map

| Bounded context | Aggregate root | Primary responsibility |
|---|---|---|
| Content System | `CourseRelease` | Immutable published course structure |
| Course and Curriculum | `LearnerCourseEnrollment` | Learner-specific course position and eligibility |
| Lesson Runtime | `LessonAttempt` | Runtime state of one concrete lesson attempt |
| Exercise Runtime | `ActivityAttempt` | Submission lifecycle for one activity |
| Learning Evidence | `LearningEvidenceRecord` | Auditable proof of observed competence |
| Assessment | `AssessmentDecision` | Versioned evaluation outcome |
| Promotion | `LearningTransition` | Module/level unlock or remediation transition |
| Vocabulary | `LearnerVocabularyItem` | Multidimensional mastery and review state |
| Grammar | `LearnerGrammarConcept` | Multidimensional grammar mastery |
| SRS | `ReviewSchedule` | Deterministic future review plan |
| Competency | `LearnerCompetencyProfile` | Internal source of truth for skill state |
| Progress | `LearnerProgressProjection` | Read model derived from canonical events |
| Pedagogical Memory | `PedagogicalObservation` | Validated durable teacher observation |
| Hikari Teacher Runtime | `TeacherSession` | One planned and executed teacher session |
| Human Interaction | `TeacherResponseProjection` | Final display and spoken projections |
| Synchronization | `LearningEventEnvelope` | Append-only accepted learning event |

Aggregates reference one another by identifiers. They must not be loaded as one graph and mutated together by UI code.

---

## 4. Content System domain

## 4.1 CourseRelease aggregate

`CourseRelease` is the aggregate root for one immutable published release.

### Contains

- Course
- Module
- Chapter
- LessonDefinition
- ActivityDefinition
- ChallengeDefinition
- ExamDefinition
- InternalCompetencyScope
- ExternalFrameworkMapping
- ContentProvenance

### Lifecycle

```text
DRAFT
→ IN_REVIEW
→ APPROVED
→ PUBLISHED
→ DEPRECATED
→ RETIRED
```

### Invariants

1. `PUBLISHED` content is immutable.
2. A correction creates a new content version or release.
3. Every activity declares skills measured.
4. Every evaluable activity declares evaluator type and rubric or deterministic answer contract.
5. Every external framework mapping is versioned.
6. External framework mappings are not parents in the course hierarchy.
7. AI-generated content cannot enter `PUBLISHED` without linguistic, pedagogical, provenance and technical review.

### Course hierarchy

```text
Course
→ Module
→ Chapter
→ Lesson
→ Activity
→ Challenge
→ Exam
```

Parallel references:

```text
Course
├── InternalCompetencyScope
└── ExternalFrameworkMappings
```

---

## 5. LearnerCourseEnrollment aggregate

Represents one learner enrolled in one course release.

### Fields

```text
enrollment_id
user_id
tenant_partition
organization_id?
course_id
release_id
target_language
instruction_language
interface_language
regional_variant?
status
verified_starting_point
current_module_id?
current_chapter_id?
created_at
updated_at
```

### Status

```text
ACTIVE
PAUSED
COMPLETED
WITHDRAWN
MIGRATION_REQUIRED
```

### Invariants

1. Enrollment is pinned to one course release until an explicit migration.
2. User declaration is never treated as verified competence.
3. `verified_starting_point` must reference validated evidence or an approved assessment decision.
4. Enrollment cannot directly alter mastery.
5. Enrollment cannot unlock content without an accepted `LearningTransition`.

---

## 6. LessonAttempt aggregate

Represents one execution of one lesson definition for one learner.

### Fields

```text
lesson_attempt_id
user_id
tenant_partition
organization_id?
enrollment_id
lesson_id
content_reference
status
started_at
updated_at
completed_at?
current_checkpoint
activity_attempt_ids
hint_usage_count
error_count
learning_evidence_ids
assessment_decision_id?
```

### Lifecycle

```text
NOT_STARTED
→ IN_PROGRESS
→ PAUSED
→ COMPLETED

IN_PROGRESS → ABANDONED
IN_PROGRESS → FAILED
COMPLETED → REQUIRES_REVIEW
```

### Commands

- `StartLesson`
- `PauseLesson`
- `ResumeLesson`
- `SaveCheckpoint`
- `AttachActivityAttempt`
- `FinishLesson`
- `AbandonLesson`
- `RequireReview`

### Invariants

1. The lesson content version never changes during an attempt.
2. A completed attempt cannot accept new activity submissions.
3. A checkpoint must reference a valid activity position in the pinned lesson version.
4. Lesson completion does not itself grant promotion.
5. Lesson status must be reproducible from accepted domain events.

---

## 7. ActivityAttempt aggregate

Represents one learner response cycle for one activity.

### Fields

```text
activity_attempt_id
lesson_attempt_id
user_id
tenant_partition
activity_id
content_reference
input_modality
submission
hint_usage
response_time
status
evaluator_type
created_at
submitted_at?
```

### Status

```text
CREATED
IN_PROGRESS
SUBMITTED
EVALUATION_PENDING
EVALUATED
CANCELLED
INVALIDATED
```

### Invariants

1. A submitted answer is immutable.
2. A retry creates a new `ActivityAttempt`.
3. Deterministic activities must not invoke AI.
4. AI-assisted evaluation must produce a proposed evidence record, never direct mastery mutation.
5. Accessibility accommodation must record what was and was not measured.

---

## 8. LearningEvidenceRecord aggregate

The fundamental auditable proof used for consequential learning-state changes.

### Required fields

```text
evidence_id
user_id
tenant_partition
organization_id?
activity_id
skill_id
content_reference
attempt_id
evidence_type
input_modality
result
confidence
hint_usage
response_time
rubric_version
evaluator_type
model_capability?
capability_contract_version?
evaluation_policy_version
evaluator_release
execution_receipt_reference?
supersedes_evidence_id?
created_at
validated_at?
validated_by?
status
```

### Evaluator types

```text
DETERMINISTIC
AI_ASSISTED
HUMAN_REVIEWED
```

### Status

```text
PROPOSED
PENDING_VALIDATION
VALIDATED
REJECTED
DISPUTED
SUPERSEDED
REVOKED
```

### Invariants

1. Only `VALIDATED` evidence may affect assessment, mastery or promotion.
2. AI-assisted output starts as `PROPOSED` or `PENDING_VALIDATION`.
3. Physical model, provider, node and GPU identity are forbidden in educational state.
4. Re-evaluation creates a new evidence record and links through `supersedes_evidence_id`.
5. Revocation never deletes the historical record.
6. Evidence cannot be reassigned to another learner or tenant.
7. Measurement status must distinguish assessed competence from accommodated but unmeasured competence.

### Measurement status

```text
ASSESSED
ACCOMMODATED
NOT_ASSESSED
NOT_APPLICABLE
INSUFFICIENT_EVIDENCE
```

---

## 9. AssessmentDecision aggregate

The sole authority for evaluating evidence against a versioned rubric.

### Fields

```text
assessment_decision_id
user_id
tenant_partition
assessment_definition_id
content_reference
rubric_version
evaluation_policy_version
evidence_ids
result
satisfied_requirements
unsatisfied_requirements
confidence
integrity_signature
issued_at
issued_by
status
```

### Result

```text
PASS
FAIL
INCOMPLETE
REVIEW_REQUIRED
```

### Status

```text
DRAFT
APPROVED
DISPUTED
SUPERSEDED
REVOKED
```

### Invariants

1. AssessmentDecision never unlocks modules or levels.
2. It consumes only validated evidence unless policy explicitly produces `REVIEW_REQUIRED`.
3. Rubric and evaluation policy are versioned and immutable for the decision.
4. Evidence identifiers are immutable after approval.
5. A later reassessment supersedes; it does not edit history.
6. `PASS` cannot be emitted if a required channel is unmeasured unless the published assessment policy explicitly allows an accommodated equivalent.

---

## 10. LearningTransition aggregate

The sole authority for applying module or level progression after assessment.

### Fields

```text
transition_id
user_id
tenant_partition
enrollment_id
assessment_decision_id
transition_type
from_state
to_state
rule_set_version
remediation_path_id?
created_at
status
```

### Transition type

```text
MODULE_UNLOCK
LEVEL_UNLOCK
STARTING_POINT_ASSIGNMENT
REMEDIATION_REQUIRED
COURSE_COMPLETION
```

### Status

```text
PROPOSED
APPLIED
REJECTED
REVERSED
```

### Invariants

1. Promotion accepts only approved AssessmentDecision records.
2. Promotion cannot alter the assessment result.
3. Unlock rules are versioned.
4. Every applied transition is append-only and auditable.
5. Failure or incomplete evidence creates remediation rather than arbitrary unlock.
6. Reversal creates a compensating transition; history is never overwritten.

---

## 11. LearnerCompetencyProfile aggregate

Internal source of truth for learner skill state.

### Structure

```text
learner_competency_profile_id
user_id
tenant_partition
competency_nodes[]
last_applied_event_revision
updated_at
```

Each competency node contains:

```text
skill_id
mastery_dimensions
measurement_status
confidence
supporting_evidence_ids
retention_state
last_observed_at
```

### Invariants

1. External CEFR, JLPT, HSK, TOPIK and ACTFL levels are projections only.
2. Competency state changes only from validated evidence and accepted reducers.
3. A missing measurement cannot be converted into mastery.
4. Mastery remains multidimensional.
5. Projection rebuilding from canonical events must be deterministic.

---

## 12. LearnerVocabularyItem aggregate

Represents one learner's state for one lexical item.

### Mastery dimensions

- recognition
- recall
- listening
- production
- pronunciation
- orthography
- contextual use

### Lifecycle projection

```text
NEW
LEARNING
REVIEW
MASTERED
RELEARNING
SUSPENDED
```

The lifecycle status is a projection over dimensions, not the sole source of truth.

### Invariants

1. Recognition mastery does not imply production mastery.
2. Correct free production is stronger evidence than flashcard recognition.
3. Review scheduling must use accepted evidence only.
4. Suspension pauses review but does not erase history.
5. Every mastery update records supporting evidence ids.

---

## 13. LearnerGrammarConcept aggregate

Represents learner-specific mastery of one grammar concept.

### Dimensions

- recognition
- controlled production
- free production
- conversation transfer
- retention

### Invariants

1. Grammar explanation consumption is not evidence of mastery.
2. Free production requires productive evidence.
3. Conversation transfer requires evidence from a new context.
4. Canonical grammar definitions belong to Content System; learner state belongs to Learning Core.

---

## 14. ReviewSchedule aggregate

Deterministically schedules future reviews.

### Fields

```text
review_schedule_id
user_id
tenant_partition
subject_type
subject_id
review_policy_version
next_review_at
interval
priority
supporting_evidence_ids
status
```

### Status

```text
SCHEDULED
DUE
COMPLETED
SUSPENDED
CANCELLED
```

### Invariants

1. Scheduling must be deterministic for the same accepted inputs and policy version.
2. Client clocks never define canonical ordering.
3. AI may recommend context but cannot directly set canonical review state.
4. Completing a review produces new evidence before rescheduling.

---

## 15. PedagogicalObservation aggregate

Durable pedagogical memory owned by Language.

### Observation types

- StudentGoal
- LearningPreference
- RecurringError
- ObservedStrength
- InterventionResult
- ExamHistory
- MotivationSignal
- TeacherObservation

### Status

```text
PROPOSED
VALIDATED
REJECTED
EXPIRED
```

### Invariants

1. Model-generated observations are proposed, not automatically trusted.
2. Only Language validates durable pedagogical memory.
3. OdynAI controls access policy and context projection.
4. Shinrei stores no durable learner memory.
5. User can inspect, correct, delete or disable durable pedagogical memory subject to legal retention constraints.

---

## 16. TeacherSession aggregate

Owned by Hikari Teacher Runtime, not Learning Core.

### Fields

```text
teacher_session_id
user_id
tenant_partition
session_type
student_profile_version
pedagogical_context_version
teacher_policy_version
planned_objectives
selected_activity_ids
assessment_context_ids
status
started_at
ended_at?
```

### Session types

```text
PLACEMENT
LESSON
REMEDIATION
CONVERSATION
EXAM
QUICK_REVIEW
```

### Invariants

1. TeacherSession consumes global Hikari Identity Core from OdynAI.
2. Language cannot fork Hikari into a separate identity.
3. TeacherSession may recommend but not directly mutate assessment, mastery or promotion.
4. All consequential changes must pass through Application Services and Learning Core.

---

## 17. TeacherResponseProjection aggregate

Owned by Hikari Human Interaction Layer.

### Internal phases

```text
Pre-generation Interaction Policy
→ semantic AI result
→ Post-generation Response Realizer
→ Spoken Response Realizer
→ Conversation Quality Gate
```

### Output

```text
display_text
spoken_text
interaction_profile
speech_profile
quality_gate_result
semantic_result_reference
```

### Invariants

1. `display_text` and `spoken_text` are projections of the same teacher decision.
2. They may differ in wording and rhythm.
3. Post-generation realization occurs after semantic inference.
4. Quality gate rejects IVONA-effect patterns before user delivery.
5. Teacher response does not become educational truth without evidence and validation.

---

## 18. LearningEventEnvelope aggregate

Append-only synchronization envelope for canonical learning events.

### Fields

```text
event_id
idempotency_key
user_id
tenant_partition
organization_id?
device_id
event_type
occurred_at
received_at
server_revision
schema_version
payload
status
```

### Client lifecycle

```text
LOCAL_PENDING
→ SUBMITTED
→ ACCEPTED
→ APPLIED
```

Alternative states:

```text
CONFLICTED
REJECTED
QUARANTINED
```

### Invariants

1. Backend Language owns canonical synchronized learning state.
2. Client owns only local projection, pending events, checkpoints and sync cursor.
3. Server revision defines accepted ordering.
4. Idempotency key prevents duplicate effects.
5. Critical learning evidence, assessment and promotion events are append-only.
6. Event replay must produce the same canonical projection.

---

## 19. Application Service boundaries

Application Services orchestrate, but do not own domain rules.

Initial services:

- `StartLessonService`
- `SubmitActivityAnswerService`
- `RecordLearningEvidenceService`
- `EvaluateAssessmentService`
- `ApplyPromotionDecisionService`
- `ScheduleReviewService`
- `StartTeacherSessionService`
- `GenerateTeacherFeedbackService`
- `SynchronizeLearningEventsService`

### Example orchestration

```text
user answer
→ SubmitActivityAnswerService
→ ActivityAttempt submitted
→ deterministic or AI-assisted evaluator
→ LearningEvidence proposed
→ evidence validation
→ AssessmentDecision
→ optional Promotion transition
→ TeacherSession context
→ OdynAI
→ RuntimePort
→ Shinrei
→ semantic result
→ Human Interaction Layer
→ Hikari feedback
```

No Application Service may bypass the canonical AI path.

---

## 20. Forbidden couplings

The following are prohibited:

- UI mutating mastery directly,
- Hikari directly unlocking a level,
- Assessment Engine applying promotion,
- Promotion Engine changing assessment result,
- Language storing physical provider or model identity in educational state,
- Shinrei storing durable pedagogical memory,
- RuntimePort owning product policy,
- Course content edited in place after publication,
- client timestamp deciding canonical synchronization order,
- accessibility alternative falsely setting unmeasured mastery,
- AI mutating canonical curriculum dependencies.

---

## 21. Minimum vertical aggregate slice

The Early Vertical E2E requires the following minimum domain objects:

```text
CourseRelease
→ LearnerCourseEnrollment
→ LessonAttempt
→ ActivityAttempt
→ LearningEvidenceRecord
→ AssessmentDecision
→ TeacherSession
→ TeacherResponseProjection
```

Optional in the first slice:

- `LearningTransition` if the test validates unlock,
- `ReviewSchedule` if the activity introduces vocabulary review.

Canonical E2E order:

```text
Minimal Course
→ one Lesson
→ one Exercise
→ user answer
→ Learning Evidence
→ AssessmentDecision
→ Language Application Service
→ Hikari Teacher Runtime
→ Pre-generation Interaction Policy
→ OdynAI
→ RuntimePort
→ Shinrei
→ real model
→ semantic AI result
→ Post-generation Response Realizer
→ Conversation Quality Gate
→ Hikari feedback
```

---

## 22. Domain model validation checklist

Before this document becomes stable:

- every aggregate root has one owner,
- no aggregate has two authorities for the same decision,
- every consequential transition references validated evidence,
- all historical content references are version-pinned,
- tenancy is explicit,
- AI-assisted outputs are non-authoritative until validated,
- synchronization ordering is server-authoritative,
- Hikari Identity remains global and owned by OdynAI,
- RuntimePort remains a versioned communication boundary,
- Shinrei remains the sole physical inference owner,
- Early Vertical E2E plan references the exact aggregate slice.

---

## 23. Next domain-model increments

Planned additions:

1. identifier catalogue,
2. command catalogue,
3. query catalogue,
4. complete event catalogue,
5. value-object specifications,
6. error taxonomy,
7. repository port definitions,
8. reducer ownership,
9. transaction boundaries,
10. domain test catalogue.
