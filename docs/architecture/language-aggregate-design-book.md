# ShinGiTai Language Aggregate Design Book

**Version:** 0.1-draft  
**Status:** WORKING ARCHITECTURE REFERENCE  
**Owner:** ShinGiTai Holding Groupe  
**Canonical source:** `docs/architecture/kanon1.txt`

Related references:

- `docs/architecture/language-architecture-book.md`
- `docs/architecture/language-domain-model.md`
- `docs/architecture/language-command-query-catalog.md`
- `docs/architecture/language-event-catalog.md`
- `docs/architecture/language-data-dictionary.md`
- `docs/architecture/language-architecture-decision-records.md`
- `docs/architecture/language-invariants-catalog.md`

---

## 0. Purpose

This book defines transactional boundaries, aggregate roots, invariants, optimistic-concurrency rules, state ownership and cross-aggregate coordination for ShinGiTai Language.

It does not define physical database tables.

It answers five implementation-critical questions:

1. Which object is the aggregate root?
2. Which changes must be consistent in one transaction?
3. Which rules are enforced inside the aggregate?
4. Which interactions are eventually consistent?
5. Which events are emitted after a successful state transition?

The governing rule is:

```text
one business decision
→ one aggregate authority
→ one transactional boundary
```

No aggregate may silently acquire authority owned by another bounded context.

---

## 1. Aggregate design principles

### 1.1 Aggregate roots are authority boundaries

An aggregate root is not merely a container. It is the sole entry point for state changes within its consistency boundary.

External code must not mutate aggregate internals directly.

### 1.2 Aggregates remain small

Aggregates contain only data required to enforce immediate invariants.

Large read models, histories, analytics and cross-course projections belong outside aggregates.

### 1.3 Cross-aggregate coordination is event-driven

When a workflow spans multiple aggregates, Application Services coordinate commands and events.

Example:

```text
ActivityAttempt
→ LearningEvidenceRecord
→ AssessmentDecision
→ LearningTransition
```

These are separate aggregates. They are not one giant transaction.

### 1.4 Optimistic concurrency is mandatory

Every mutable aggregate has:

```text
aggregate_id
aggregate_version
updated_at
```

State-changing commands should carry:

```text
expected_aggregate_version
```

A stale command must fail with a conflict rather than overwrite newer state.

### 1.5 Historical records are immutable

The following are immutable after issue or acceptance:

- submitted answers,
- validated Learning Evidence,
- issued AssessmentDecision,
- applied LearningTransition,
- published content releases,
- completed historical attempts.

Corrections use superseding records.

---

## 2. Aggregate map

```text
Content System
├── CourseRelease
└── CurriculumRelease

Learning Core
├── LearnerCourseEnrollment
├── LessonAttempt
├── ActivityAttempt
├── LearningEvidenceRecord
├── AssessmentDecision
├── LearningTransition
├── LearnerCompetencyProfile
├── LearnerVocabularyItem
├── LearnerGrammarConcept
└── ReviewSchedule

Hikari Teacher Runtime
├── TeacherSession
├── PedagogicalRelationshipState
└── PedagogicalObservation

Hikari Human Interaction Layer
└── TeacherResponseProjection

Synchronization
└── SynchronizationStream
```

Each aggregate owns one class of business decision.

---

# PART I — CONTENT AGGREGATES

## 3. CourseRelease aggregate

### 3.1 Aggregate root

```text
CourseRelease
```

### 3.2 Purpose

Represents one immutable published version of a course.

### 3.3 Owns

- course metadata,
- target language,
- supported instruction-language variants,
- release identity,
- course hierarchy references,
- internal competency scope,
- external framework mappings,
- publication status,
- provenance and licensing metadata.

### 3.4 Does not own

- learner progress,
- lesson attempts,
- assessments,
- Hikari behavior,
- physical AI execution.

### 3.5 Invariants

- a published release is immutable,
- all child content references point to versions in the same release graph,
- every published content item has provenance metadata,
- framework mappings are projections, not hierarchy parents,
- release identity never changes after publication.

### 3.6 Commands

- `CreateCourseDraft`
- `ValidateCourseRelease`
- `PublishCourseRelease`
- `DeprecateCourseRelease`

### 3.7 Events

- `COURSE_DRAFT_CREATED`
- `COURSE_RELEASE_VALIDATED`
- `COURSE_RELEASE_PUBLISHED`
- `COURSE_RELEASE_DEPRECATED`

### 3.8 Concurrency

Draft updates use optimistic concurrency.

Published releases reject all mutation commands except lifecycle metadata such as deprecation state.

---

## 4. CurriculumRelease aggregate

### 4.1 Purpose

Owns the versioned competency graph and curriculum relationships used by one course release.

### 4.2 Invariants

- prerequisites are acyclic unless an explicit cyclic-learning pattern is approved,
- every node referenced by a lesson exists,
- every external framework mapping points to internal competency nodes,
- AI proposals cannot directly mutate the release,
- accepted graph changes create a new version.

### 4.3 Commands

- `ProposeCurriculumChange`
- `ApproveCurriculumChange`
- `PublishCurriculumRelease`

### 4.4 Events

- `CURRICULUM_CHANGE_PROPOSED`
- `CURRICULUM_CHANGE_APPROVED`
- `CURRICULUM_RELEASE_PUBLISHED`

---

# PART II — LEARNING CORE AGGREGATES

## 5. LearnerCourseEnrollment aggregate

### 5.1 Purpose

Represents the learner's active relationship with one concrete course release.

### 5.2 Owns

- `enrollment_id`,
- learner and tenant ownership,
- course and release binding,
- target, instruction and interface language selection,
- enrollment lifecycle,
- current unlock projection,
- migration status.

### 5.3 Invariants

- one active enrollment per learner/course/release policy unless explicitly allowed,
- target language cannot change within an enrollment,
- instruction language may change without rewriting history,
- migration to another release is explicit,
- in-progress attempts remain pinned to original release content,
- unlock state may change only through applied LearningTransition.

### 5.4 State machine

```text
PENDING
→ ACTIVE
→ COMPLETED
→ ARCHIVED
```

Alternative transitions:

```text
ACTIVE → SUSPENDED → ACTIVE
ACTIVE → MIGRATION_PENDING → ACTIVE
```

### 5.5 Commands

- `EnrollLearnerInCourse`
- `ChangeInstructionLanguage`
- `SuspendEnrollment`
- `ResumeEnrollment`
- `RequestCourseReleaseMigration`
- `ApplyLearningTransitionToEnrollment`

### 5.6 Events

- `LEARNER_ENROLLED_IN_COURSE`
- `INSTRUCTION_LANGUAGE_CHANGED`
- `ENROLLMENT_SUSPENDED`
- `ENROLLMENT_RESUMED`
- `COURSE_RELEASE_MIGRATION_REQUESTED`
- `ENROLLMENT_UNLOCK_STATE_UPDATED`

### 5.7 Transaction boundary

Enrollment state and unlock projection update atomically.

AssessmentDecision and LearningTransition remain external references.

---

## 6. LessonAttempt aggregate

### 6.1 Purpose

Owns the lifecycle of one learner attempt at one lesson version.

### 6.2 Owns

- lesson attempt identity,
- pinned lesson content version,
- lifecycle state,
- checkpoint,
- activity references,
- completion eligibility,
- session linkage,
- timestamps.

### 6.3 Invariants

- an attempt is pinned to one release and content version,
- completed and abandoned attempts are immutable,
- a stale checkpoint cannot overwrite a newer checkpoint,
- completion does not imply promotion,
- activity answers are not stored as mutable embedded objects,
- no direct mastery mutation occurs here.

### 6.4 State machine

```text
NOT_STARTED
→ IN_PROGRESS
→ PAUSED
→ IN_PROGRESS
→ COMPLETED
```

Alternative terminal states:

```text
IN_PROGRESS → ABANDONED
IN_PROGRESS → FAILED
PAUSED → ABANDONED
```

### 6.5 Commands

- `StartLesson`
- `PauseLesson`
- `ResumeLesson`
- `SaveLessonCheckpoint`
- `CompleteLesson`
- `AbandonLesson`
- `RetryLesson`

### 6.6 Events

- `LESSON_STARTED`
- `LESSON_PAUSED`
- `LESSON_RESUMED`
- `LESSON_CHECKPOINT_SAVED`
- `LESSON_COMPLETED`
- `LESSON_ABANDONED`
- `LESSON_RETRY_CREATED`

### 6.7 Consistency boundary

Lesson state and checkpoint change atomically.

ActivityAttempt creation occurs separately and is correlated by `lesson_attempt_id`.

---

## 7. ActivityAttempt aggregate

### 7.1 Purpose

Owns one learner interaction with one activity instance.

### 7.2 Owns

- activity attempt identity,
- content version,
- answer submission identity,
- input modality,
- accessibility accommodation metadata,
- hint usage,
- response time,
- attempt lifecycle.

### 7.3 Invariants

- accepted answer payload is immutable,
- duplicate `client_submission_id` is idempotent,
- skipping never creates positive mastery,
- hints are recorded before evidence generation,
- accommodation metadata is preserved,
- deterministic evaluation is preferred when possible.

### 7.4 State machine

```text
STARTED
→ ANSWER_SUBMITTED
→ COMPLETED
```

Alternative states:

```text
STARTED → SKIPPED
STARTED → ABANDONED
ANSWER_SUBMITTED → EVALUATION_PENDING
```

### 7.5 Commands

- `StartActivityAttempt`
- `SubmitExerciseAnswer`
- `UseHint`
- `SkipActivity`
- `CompleteActivityAttempt`

### 7.6 Events

- `ACTIVITY_ATTEMPT_STARTED`
- `ANSWER_SUBMITTED`
- `HINT_USED`
- `ACTIVITY_SKIPPED`
- `ACTIVITY_COMPLETED`

### 7.7 Boundary note

ActivityAttempt does not own Learning Evidence. It emits facts from which evidence may be produced.

---

## 8. LearningEvidenceRecord aggregate

### 8.1 Purpose

Owns one immutable, auditable unit of evidence about learner competence.

### 8.2 Owns

- evidence identity,
- learner and tenant ownership,
- activity and skill references,
- result and confidence,
- evaluator metadata,
- execution provenance receipt,
- validation state,
- supersession chain.

### 8.3 Invariants

- provider, physical model, node and GPU details are forbidden,
- AI-assisted evidence is not immediately canonical,
- only valid lifecycle transitions are accepted,
- validated evidence is immutable,
- corrections create superseding evidence,
- revoked evidence remains auditable,
- evidence cannot cross tenant boundaries.

### 8.4 State machine

```text
PROPOSED
→ PENDING_VALIDATION
→ VALIDATED
```

Alternative states:

```text
PENDING_VALIDATION → REJECTED
VALIDATED → DISPUTED
DISPUTED → VALIDATED
DISPUTED → REJECTED
VALIDATED → SUPERSEDED
VALIDATED → REVOKED
```

### 8.5 Commands

- `RecordLearningEvidence`
- `ValidateLearningEvidence`
- `DisputeLearningEvidence`
- `SupersedeLearningEvidence`
- `RevokeLearningEvidence`

### 8.6 Events

- `LEARNING_EVIDENCE_RECORDED`
- `LEARNING_EVIDENCE_VALIDATED`
- `LEARNING_EVIDENCE_REJECTED`
- `LEARNING_EVIDENCE_DISPUTED`
- `LEARNING_EVIDENCE_SUPERSEDED`
- `LEARNING_EVIDENCE_REVOKED`

### 8.7 Transaction boundary

One evidence record transition is atomic.

Competency-profile updates happen asynchronously after validated evidence events.

---

## 9. AssessmentDecision aggregate

### 9.1 Purpose

Owns the authoritative evaluation of an assessment scope.

### 9.2 Owns

- assessment identity,
- evidence set,
- rubric and policy versions,
- decision,
- satisfied and unsatisfied requirements,
- measurement statuses,
- confidence,
- signature/integrity metadata,
- supersession relation.

### 9.3 Invariants

- only eligible validated evidence is evaluated,
- decision values are limited to `PASS`, `FAIL`, `INCOMPLETE`, `REVIEW_REQUIRED`,
- issued decisions are immutable,
- accessibility accommodation never creates false measured mastery,
- AssessmentDecision never unlocks content,
- correction creates a superseding decision.

### 9.4 State machine

```text
REQUESTED
→ EVALUATING
→ ISSUED
```

Corrective state:

```text
ISSUED → SUPERSEDED
```

### 9.5 Commands

- `RequestAssessment`
- `IssueAssessmentDecision`
- `SupersedeAssessmentDecision`

### 9.6 Events

- `ASSESSMENT_REQUESTED`
- `ASSESSMENT_EVALUATION_STARTED`
- `ASSESSMENT_DECISION_ISSUED`
- `ASSESSMENT_DECISION_SUPERSEDED`

### 9.7 Boundary note

Promotion Engine consumes the issued decision but cannot modify it.

---

## 10. LearningTransition aggregate

### 10.1 Purpose

Owns application of an AssessmentDecision to module or level state.

### 10.2 Owns

- transition identity,
- assessment-decision reference,
- promotion-policy version,
- previous state,
- resulting state,
- remediation path,
- application status.

### 10.3 Invariants

- only current approved AssessmentDecision may be applied,
- assessment result cannot be altered,
- duplicate application is idempotent,
- one decision cannot produce contradictory transitions,
- remediation is derived from unsatisfied requirements,
- transition history is immutable.

### 10.4 State machine

```text
PENDING
→ APPLIED
```

Alternative outcomes:

```text
PENDING → REMEDIATION_CREATED
PENDING → NO_TRANSITION_REQUIRED
PENDING → REJECTED
```

### 10.5 Commands

- `ApplyAssessmentDecision`
- `CreateRemediationPath`
- `CompleteRemediationPath`

### 10.6 Events

- `PROMOTION_APPROVED`
- `PROMOTION_REJECTED`
- `LEARNING_TRANSITION_APPLIED`
- `REMEDIATION_PATH_CREATED`
- `REMEDIATION_PATH_COMPLETED`
- `REASSESSMENT_ELIGIBILITY_GRANTED`

---

## 11. LearnerCompetencyProfile aggregate

### 11.1 Purpose

Owns the canonical multidimensional internal competency state for one learner and competency scope.

### 11.2 Owns

- competency dimensions,
- evidence references,
- decay state,
- stability state,
- last-evaluated metadata,
- external framework projections as derived references.

### 11.3 Invariants

- only validated evidence may update the profile,
- mastery is multidimensional,
- UI-level `MASTERED` is derived,
- unmeasured channels cannot be marked mastered,
- external framework mapping is a projection,
- profile update policy is versioned,
- Hikari and UI cannot mutate the profile directly.

### 11.4 Commands

- `ApplyValidatedEvidenceToCompetencyProfile`
- `RecalculateCompetencyStability`
- `MarkCompetencyDecay`
- `ProjectExternalFrameworkLevel`

### 11.5 Events

- `COMPETENCY_PROFILE_UPDATED`
- `COMPETENCY_DECAY_DETECTED`
- `COMPETENCY_STABILITY_RECALCULATED`
- `EXTERNAL_FRAMEWORK_PROJECTION_UPDATED`

### 11.6 Consistency

One competency profile update is atomic.

Bulk learner-level projections are eventually consistent read models.

---

## 12. LearnerVocabularyItem aggregate

### 12.1 Purpose

Owns learner-specific vocabulary lifecycle and multidimensional mastery for one lexeme.

### 12.2 Invariants

- evidence must be validated,
- dimensions update independently,
- review state does not overwrite evidence history,
- suspension does not delete history,
- free production is stronger evidence than recognition,
- item state can decay after mastery.

### 12.3 Lifecycle

```text
NEW
→ LEARNING
→ REVIEW
→ MASTERED
```

Corrective states:

```text
MASTERED → RELEARNING
ANY → SUSPENDED
```

### 12.4 Commands

- `IntroduceVocabularyItem`
- `ApplyVocabularyEvidence`
- `SuspendVocabularyItem`
- `RestoreVocabularyItem`

### 12.5 Events

- `VOCABULARY_ITEM_INTRODUCED`
- `VOCABULARY_MASTERY_UPDATED`
- `VOCABULARY_ITEM_SUSPENDED`
- `VOCABULARY_ITEM_RESTORED`

---

## 13. LearnerGrammarConcept aggregate

### 13.1 Purpose

Owns learner-specific mastery of one grammar concept.

### 13.2 Mastery dimensions

- recognition,
- controlled production,
- free production,
- conversation transfer,
- retention.

### 13.3 Invariants

- understanding a rule does not imply productive mastery,
- conversation transfer requires evidence from an appropriate modality,
- validated evidence is required,
- canonical grammar definition belongs to content, not learner state.

### 13.4 Commands

- `IntroduceGrammarConcept`
- `ApplyGrammarEvidence`
- `MarkGrammarConceptForReview`

### 13.5 Events

- `GRAMMAR_CONCEPT_INTRODUCED`
- `GRAMMAR_MASTERY_UPDATED`
- `GRAMMAR_REVIEW_REQUIRED`

---

## 14. ReviewSchedule aggregate

### 14.1 Purpose

Owns scheduling and completion state for one review item.

### 14.2 Invariants

- review scheduling uses versioned policy,
- review completion must produce or reference new evidence,
- client clock is not authoritative,
- duplicate completion is idempotent,
- next-review calculation never rewrites historical review outcomes.

### 14.3 State machine

```text
SCHEDULED
→ DUE
→ IN_PROGRESS
→ COMPLETED
→ NEXT_REVIEW_SCHEDULED
```

Alternative state:

```text
SCHEDULED → SUSPENDED
```

### 14.4 Commands

- `ScheduleVocabularyReview`
- `ScheduleGrammarReview`
- `StartReview`
- `RecordReviewOutcome`
- `SuspendReview`

### 14.5 Events

- `REVIEW_SCHEDULED`
- `REVIEW_BECAME_DUE`
- `REVIEW_STARTED`
- `REVIEW_COMPLETED`
- `NEXT_REVIEW_CALCULATED`

---

# PART III — HIKARI AGGREGATES

## 15. TeacherSession aggregate

### 15.1 Purpose

Owns one bounded teaching session in Language.

### 15.2 Owns

- teacher-session identity,
- learner goal,
- selected strategy,
- activity plan,
- pedagogical-context references,
- interaction state,
- session summary,
- closure state.

### 15.3 Does not own

- global Hikari Identity,
- mastery,
- assessment decisions,
- promotion,
- physical model execution.

### 15.4 Invariants

- global Hikari Identity comes from OdynAI,
- every strategy references validated learning state or explicit learner intent,
- Hikari recommendation cannot mutate educational truth,
- session closure produces a summary or recovery marker,
- selected Pedagogical Memory is accessed through policy-controlled projection.

### 15.5 State machine

```text
PLANNED
→ ACTIVE
→ AWAITING_AI_RESULT
→ FEEDBACK_READY
→ COMPLETED
```

Failure states:

```text
ACTIVE → DEGRADED
ACTIVE → INTERRUPTED
INTERRUPTED → RECOVERED
```

### 15.6 Commands

- `PlanTeacherSession`
- `StartTeacherSession`
- `SelectTeachingStrategy`
- `RequestHikariResponse`
- `RecordTeacherSessionSummary`
- `CompleteTeacherSession`
- `RecoverTeacherSession`

### 15.7 Events

- `TEACHER_SESSION_PLANNED`
- `TEACHER_SESSION_STARTED`
- `TEACHING_STRATEGY_SELECTED`
- `HIKARI_RESPONSE_REQUESTED`
- `TEACHER_SESSION_SUMMARY_RECORDED`
- `TEACHER_SESSION_COMPLETED`
- `TEACHER_SESSION_DEGRADED`

---

## 16. PedagogicalRelationshipState aggregate

### 16.1 Purpose

Owns durable Language-specific state of the teaching relationship without redefining Hikari identity.

### 16.2 Owns

- preferred teaching style,
- intervention thresholds,
- learner communication preferences,
- trust and pacing signals,
- long-term teacher-policy state.

### 16.3 Invariants

- no independent Hikari persona is created,
- state remains subordinate to global Hikari behavior constraints,
- observations must be validated before durable use,
- user can review, edit or delete eligible records.

---

## 17. PedagogicalObservation aggregate

### 17.1 Purpose

Owns one structured observation proposed or validated for Pedagogical Memory.

### 17.2 Types

- `StudentGoal`
- `LearningPreference`
- `RecurringError`
- `ObservedStrength`
- `InterventionResult`
- `ExamHistory`
- `MotivationSignal`
- `TeacherObservation`

### 17.3 State machine

```text
PROPOSED
→ VALIDATED
```

Alternative states:

```text
PROPOSED → REJECTED
VALIDATED → EXPIRED
VALIDATED → REVOKED
```

### 17.4 Invariants

- free-form model text is not durable memory by default,
- each observation has provenance,
- user ownership and tenant partition are mandatory,
- sensitive observations require policy classification,
- expired or revoked observations are excluded from active projection.

---

# PART IV — HUMAN INTERACTION AGGREGATE

## 18. TeacherResponseProjection aggregate

### 18.1 Purpose

Owns post-inference realization of one semantic AI result into Language-facing display and speech projections.

### 18.2 Owns

- semantic-result reference,
- interaction policy version,
- `display_text`,
- `spoken_text`,
- interaction profile,
- speech profile,
- quality-gate result,
- delivery state.

### 18.3 Invariants

- pre-generation policy is applied before inference,
- response realization occurs after semantic AI result,
- display and spoken text represent the same teacher decision,
- Conversation Quality Gate must pass or produce an explicit degraded result,
- markdown artifacts must not leak into natural speech,
- automatic empty praise is prohibited.

### 18.4 State machine

```text
SEMANTIC_RESULT_RECEIVED
→ REALIZED
→ QUALITY_VALIDATED
→ DELIVERED
```

Failure states:

```text
REALIZED → QUALITY_REJECTED
QUALITY_REJECTED → REWRITTEN
ANY → DEGRADED_DELIVERY
```

### 18.5 Commands

- `RealizeTeacherResponse`
- `ValidateConversationQuality`
- `RewriteTeacherResponse`
- `DeliverTeacherFeedback`

### 18.6 Events

- `TEACHER_RESPONSE_REALIZED`
- `CONVERSATION_QUALITY_VALIDATED`
- `CONVERSATION_QUALITY_REJECTED`
- `TEACHER_RESPONSE_REWRITTEN`
- `TEACHER_FEEDBACK_DELIVERED`

---

# PART V — SYNCHRONIZATION AGGREGATE

## 19. SynchronizationStream aggregate

### 19.1 Purpose

Owns submission and acceptance state for offline learning events from one client stream.

### 19.2 Owns

- device stream identity,
- synchronization cursor,
- pending event references,
- accepted server revisions,
- conflict and quarantine records.

### 19.3 Invariants

- backend Language is authoritative,
- client clock never determines accepted ordering,
- idempotency key prevents duplicate application,
- tenant partition is checked before acceptance,
- rejected events never mutate canonical state,
- accepted events receive server revision.

### 19.4 Event lifecycle

```text
LOCAL_PENDING
→ SUBMITTED
→ ACCEPTED
→ APPLIED
```

Alternative states:

```text
SUBMITTED → CONFLICTED
SUBMITTED → REJECTED
SUBMITTED → QUARANTINED
```

### 19.5 Commands

- `SubmitOfflineEventBatch`
- `AcceptOfflineEvent`
- `RejectOfflineEvent`
- `QuarantineOfflineEvent`
- `AdvanceSynchronizationCursor`

---

## 20. Cross-aggregate workflow rules

### 20.1 Answer-to-evidence workflow

```text
ActivityAttempt accepts answer
→ ANSWER_SUBMITTED
→ evaluator produces result
→ LearningEvidenceRecord created
→ evidence validated
```

No transaction spans ActivityAttempt and LearningEvidenceRecord.

### 20.2 Evidence-to-mastery workflow

```text
LEARNING_EVIDENCE_VALIDATED
→ apply to competency/vocabulary/grammar aggregate
→ mastery projection updated
→ review scheduling considered
```

### 20.3 Assessment-to-promotion workflow

```text
validated evidence set
→ AssessmentDecision issued
→ LearningTransition applies decision
→ Enrollment unlock state updated
```

Each arrow is a separate consistency boundary.

### 20.4 Hikari-feedback workflow

```text
AssessmentDecision / learning state
→ Language Application Service
→ TeacherSession
→ pre-generation interaction policy
→ OdynAI
→ RuntimePort
→ Shinrei
→ semantic AI result
→ TeacherResponseProjection
→ Conversation Quality Gate
→ feedback delivered
```

Hikari feedback is not part of the AssessmentDecision transaction.

---

## 21. Transaction policy

### 21.1 Allowed atomic operations

Examples:

- update LessonAttempt state and checkpoint,
- accept one immutable answer,
- transition one evidence status,
- issue one AssessmentDecision,
- apply one LearningTransition,
- update one competency profile,
- accept one synchronization event.

### 21.2 Forbidden distributed transactions

Do not create atomic transactions spanning:

- LessonAttempt + AssessmentDecision,
- AssessmentDecision + LearningTransition,
- LearningTransition + Hikari feedback,
- Language + OdynAI + Shinrei,
- synchronization stream + all affected aggregates.

Use idempotent orchestration and events instead.

---

## 22. Eventual consistency policy

The following may be eventually consistent:

- dashboard projections,
- external framework projections,
- teacher-context projections,
- aggregate summaries,
- analytics,
- cross-device read models,
- review-count badges.

The following require aggregate-level strong consistency:

- accepting an answer,
- checkpoint update,
- evidence lifecycle transition,
- assessment issue,
- promotion application,
- tenant ownership validation,
- server-revision assignment.

---

## 23. Repository interface guidance

Each aggregate should expose an interface conceptually equivalent to:

```text
load(aggregate_id, tenant_partition)
save(aggregate, expected_version)
append_events(events)
```

Repository implementations must:

- enforce tenant isolation,
- reject stale aggregate versions,
- persist emitted events atomically with aggregate state where applicable,
- avoid leaking database-specific details into domain code.

Physical storage technology remains undecided by this document.

---

## 24. Snapshot policy

Snapshots are optional implementation details.

They may be used for long-lived aggregates such as:

- LearnerCompetencyProfile,
- PedagogicalRelationshipState,
- SynchronizationStream.

Snapshots must never replace immutable audit history.

A snapshot includes:

```text
aggregate_id
aggregate_version
snapshot_schema_version
created_at
state
```

---

## 25. Architecture-test candidates

Future automated tests should verify:

1. UI does not import aggregate repositories directly.
2. Hikari modules cannot mutate Learning Core aggregates.
3. Promotion code cannot write AssessmentDecision.
4. Learning Evidence contains no provider/model/node/GPU fields.
5. published CourseRelease has no mutation path.
6. all mutable aggregates use optimistic concurrency.
7. every aggregate-owned command maps to exactly one aggregate root.
8. every critical event includes tenant and correlation metadata.
9. synchronization acceptance assigns server revision.
10. TeacherResponseProjection is post-inference.
11. no direct Language-to-Shinrei dependency exists.
12. assessment and feedback are separate transactions.

---

## 26. Early Vertical E2E aggregate slice

The first vertical slice requires only these aggregates:

```text
CourseRelease
LearnerCourseEnrollment
LessonAttempt
ActivityAttempt
LearningEvidenceRecord
AssessmentDecision
TeacherSession
TeacherResponseProjection
```

Optional promotion extension adds:

```text
LearningTransition
```

Required sequence:

```text
CourseRelease available
→ Enrollment active
→ LessonAttempt started
→ ActivityAttempt answer accepted
→ LearningEvidenceRecord validated
→ AssessmentDecision issued
→ TeacherSession requests AI response
→ OdynAI
→ RuntimePort
→ Shinrei
→ semantic result
→ TeacherResponseProjection realized
→ quality validated
→ feedback delivered
```

The E2E result must record exact repository commits, protocol versions, contract versions, execution receipt, request ID, trace ID and timestamp.

---

## 27. Validation gates

This Aggregate Design Book remains draft until:

- aggregate names align with implemented types,
- command ownership is validated,
- event ownership is validated,
- state machines receive domain tests,
- optimistic-concurrency strategy is implemented,
- persistence design is reviewed,
- Early Vertical E2E plan is approved,
- cross-repository AI compatibility is confirmed,
- owner accepts stable-reference status.

Current status:

```text
AGGREGATE MAP: DEFINED
TRANSACTION BOUNDARIES: DEFINED
CROSS-AGGREGATE WORKFLOWS: DEFINED
STATE MACHINES: DRAFT BASELINE
PERSISTENCE IMPLEMENTATION: NOT LOCKED
AUTOMATED ENFORCEMENT: NOT YET IMPLEMENTED
STABLE REFERENCE: NOT YET LOCKED
```
