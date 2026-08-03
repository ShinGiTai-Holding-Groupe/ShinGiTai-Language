# ShinGiTai Language Command & Query Catalog

**Version:** 0.1-draft  
**Status:** WORKING ARCHITECTURE REFERENCE  
**Owner:** ShinGiTai Holding Groupe  
**Canonical source:** `docs/architecture/kanon1.txt`  
**Related references:**

- `docs/architecture/language-architecture-book.md`
- `docs/architecture/language-domain-model.md`

---

## 0. Purpose

This catalog defines the application-level commands and queries used to coordinate ShinGiTai Language bounded contexts.

It does not define physical HTTP routes, database tables or provider APIs.

Its purpose is to establish:

- one owner for every state-changing command,
- read-only semantics for queries,
- authorization and tenant boundaries,
- idempotency requirements,
- expected outputs and emitted domain events,
- the distinction between deterministic and AI-assisted execution,
- stable contracts for UI, application services and future SDKs.

The catalog follows the rule:

```text
command = intent to change state
query   = request to read a projection
```

A query must never mutate canonical state.

---

## 1. Shared command envelope

Every externally initiated command must contain or resolve:

```text
command_id
idempotency_key
user_id
tenant_partition
organization_id, when applicable
device_id
actor_type
issued_at
schema_version
correlation_id
causation_id, when applicable
expected_aggregate_version, when optimistic concurrency applies
```

### 1.1 Actor types

```text
LEARNER
HIKARI_TEACHER_RUNTIME
SYSTEM
ADMINISTRATOR
CONTENT_REVIEWER
HUMAN_EVALUATOR
```

### 1.2 Command result

A command result should use one of:

```text
ACCEPTED
APPLIED
REJECTED
CONFLICTED
QUARANTINED
REVIEW_REQUIRED
```

The result must include:

```text
command_id
result_status
aggregate_id, when applicable
aggregate_version, when applicable
server_revision
emitted_event_ids
error_code, when applicable
```

---

## 2. Shared query envelope

Every query must contain or resolve:

```text
query_id
user_id
tenant_partition
organization_id, when applicable
requested_at
projection_version
consistency_requirement
```

Consistency requirements:

```text
EVENTUAL
READ_YOUR_WRITES
STRONG_FOR_AGGREGATE
```

Queries must enforce tenant and user isolation before reading data.

---

# PART I — LEARNING CORE COMMANDS

## 3. Course and enrollment commands

### 3.1 `EnrollLearnerInCourse`

**Owner:** LearnerCourseEnrollment aggregate  
**Purpose:** Create an enrollment pinned to a concrete course release.

Input:

```text
course_id
release_id
target_language
instruction_language
interface_language
regional_variant, optional
verified_starting_point, optional
```

Preconditions:

- course release exists and is available,
- user and tenant identity are valid,
- language combination is supported,
- duplicate active enrollment is rejected or resolved idempotently.

Output:

```text
enrollment_id
course_id
release_id
enrollment_status
```

Events:

```text
LEARNER_ENROLLED_IN_COURSE
```

---

### 3.2 `ChangeInstructionLanguage`

**Owner:** LearnerCourseEnrollment aggregate

Input:

```text
enrollment_id
instruction_language
```

Rules:

- target language remains unchanged,
- course release remains unchanged,
- historical evidence keeps its original instruction-language metadata.

Events:

```text
INSTRUCTION_LANGUAGE_CHANGED
```

---

### 3.3 `RequestCourseReleaseMigration`

**Owner:** LearnerCourseEnrollment aggregate

Input:

```text
enrollment_id
target_release_id
migration_policy_version
```

Rules:

- migration is explicit,
- in-progress lesson attempts remain pinned to their original content version,
- historical evidence is never rewritten.

Possible result:

```text
ACCEPTED
REVIEW_REQUIRED
REJECTED
```

Events:

```text
COURSE_RELEASE_MIGRATION_REQUESTED
COURSE_RELEASE_MIGRATION_APPROVED
COURSE_RELEASE_MIGRATION_REJECTED
```

---

## 4. Lesson Runtime commands

### 4.1 `StartLesson`

**Owner:** LessonAttempt aggregate

Input:

```text
enrollment_id
lesson_id
content_version
release_id
session_id, optional
```

Preconditions:

- lesson belongs to enrollment release,
- prerequisite and unlock rules are satisfied,
- no incompatible active attempt exists,
- content version is available.

Output:

```text
lesson_attempt_id
state = IN_PROGRESS
checkpoint
aggregate_version
```

Events:

```text
LESSON_STARTED
```

---

### 4.2 `PauseLesson`

**Owner:** LessonAttempt aggregate

Input:

```text
lesson_attempt_id
checkpoint
pause_reason, optional
```

Events:

```text
LESSON_PAUSED
LESSON_CHECKPOINT_SAVED
```

---

### 4.3 `ResumeLesson`

**Owner:** LessonAttempt aggregate

Input:

```text
lesson_attempt_id
client_checkpoint_version
```

Preconditions:

- attempt is resumable,
- server state is authoritative,
- stale client checkpoint cannot overwrite newer server state.

Events:

```text
LESSON_RESUMED
```

---

### 4.4 `SaveLessonCheckpoint`

**Owner:** LessonAttempt aggregate

Input:

```text
lesson_attempt_id
checkpoint
expected_aggregate_version
```

Properties:

- idempotent,
- optimistic-concurrency protected,
- no assessment or mastery mutation.

Events:

```text
LESSON_CHECKPOINT_SAVED
```

---

### 4.5 `CompleteLesson`

**Owner:** LessonAttempt aggregate

Input:

```text
lesson_attempt_id
completion_reason
```

Preconditions:

- required activities completed or explicitly waived by policy,
- unresolved critical conflicts absent.

Events:

```text
LESSON_COMPLETED
```

This command does not automatically promote the learner.

---

### 4.6 `AbandonLesson`

**Owner:** LessonAttempt aggregate

Input:

```text
lesson_attempt_id
abandon_reason
```

Events:

```text
LESSON_ABANDONED
```

---

### 4.7 `RetryLesson`

**Owner:** LessonAttempt aggregate

Input:

```text
source_lesson_attempt_id
retry_policy_version
```

Output:

```text
new_lesson_attempt_id
```

Historical attempt remains immutable.

Events:

```text
LESSON_RETRY_CREATED
```

---

## 5. Exercise and answer commands

### 5.1 `StartActivityAttempt`

**Owner:** ActivityAttempt aggregate

Input:

```text
lesson_attempt_id
activity_id
content_version
input_modality
accessibility_accommodation, optional
```

Events:

```text
ACTIVITY_ATTEMPT_STARTED
```

---

### 5.2 `SubmitExerciseAnswer`

**Owner:** ActivityAttempt aggregate

Input:

```text
activity_attempt_id
answer_payload
input_modality
response_time
client_submission_id
```

Rules:

- duplicate submission ID is idempotent,
- answer is immutable after acceptance,
- correction produces a new attempt or superseding evidence,
- deterministic answers are evaluated without AI when possible.

Events:

```text
ANSWER_SUBMITTED
```

Follow-up orchestration may invoke:

```text
EvaluateDeterministicAnswer
RequestAiAssistedEvaluation
RecordLearningEvidence
```

---

### 5.3 `UseHint`

**Owner:** ActivityAttempt aggregate

Input:

```text
activity_attempt_id
hint_id
hint_level
```

Events:

```text
HINT_USED
```

Hint usage must be available to Learning Evidence and Assessment.

---

### 5.4 `SkipActivity`

**Owner:** ActivityAttempt aggregate

Input:

```text
activity_attempt_id
skip_reason
```

Rules:

- skipping does not create positive mastery,
- policy determines whether lesson completion remains possible.

Events:

```text
ACTIVITY_SKIPPED
```

---

### 5.5 `CompleteActivityAttempt`

**Owner:** ActivityAttempt aggregate

Input:

```text
activity_attempt_id
completion_status
```

Events:

```text
ACTIVITY_COMPLETED
```

---

## 6. Learning Evidence commands

### 6.1 `RecordLearningEvidence`

**Owner:** LearningEvidenceRecord aggregate

Input:

```text
user_id
tenant_partition
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
capability_contract_version, when AI-assisted
evaluation_policy_version
evaluator_release
execution_receipt_id, when AI-assisted
request_id, when AI-assisted
trace_id, when AI-assisted
```

Rules:

- AI-assisted evidence starts as `PROPOSED` or `PENDING_VALIDATION`,
- deterministic evidence may be validated synchronously by deterministic policy,
- provider, physical model, node and GPU identity are forbidden in educational state.

Events:

```text
LEARNING_EVIDENCE_RECORDED
```

---

### 6.2 `ValidateLearningEvidence`

**Owner:** LearningEvidenceRecord aggregate

Input:

```text
evidence_id
validation_policy_version
validated_by
validation_result
```

Allowed transitions:

```text
PROPOSED -> PENDING_VALIDATION
PENDING_VALIDATION -> VALIDATED
PENDING_VALIDATION -> REJECTED
DISPUTED -> VALIDATED
DISPUTED -> REJECTED
```

Events:

```text
LEARNING_EVIDENCE_VALIDATED
LEARNING_EVIDENCE_REJECTED
```

---

### 6.3 `DisputeLearningEvidence`

**Owner:** LearningEvidenceRecord aggregate

Input:

```text
evidence_id
dispute_reason
requested_by
```

Events:

```text
LEARNING_EVIDENCE_DISPUTED
```

---

### 6.4 `SupersedeLearningEvidence`

**Owner:** LearningEvidenceRecord aggregate

Input:

```text
superseded_evidence_id
replacement_evidence_id
reason
```

Rules:

- old evidence is not deleted,
- replacement must be independently valid,
- audit chain remains intact.

Events:

```text
LEARNING_EVIDENCE_SUPERSEDED
```

---

### 6.5 `RevokeLearningEvidence`

**Owner:** LearningEvidenceRecord aggregate

Input:

```text
evidence_id
revocation_reason
authorized_actor
```

Events:

```text
LEARNING_EVIDENCE_REVOKED
```

---

## 7. Assessment commands

### 7.1 `RequestAssessment`

**Owner:** AssessmentDecision aggregate

Input:

```text
assessment_scope
user_id
enrollment_id
module_id, optional
level_mapping_id, optional
rubric_version
evidence_selection_policy_version
```

Rules:

- only eligible evidence is selected,
- accessibility measurement status is preserved,
- missing evidence can produce `INCOMPLETE` or `REVIEW_REQUIRED`.

Events:

```text
ASSESSMENT_REQUESTED
```

---

### 7.2 `IssueAssessmentDecision`

**Owner:** AssessmentDecision aggregate

Input:

```text
assessment_id
eligible_evidence_ids
rubric_version
decision
satisfied_requirements
unsatisfied_requirements
measurement_statuses
confidence
```

Decision values:

```text
PASS
FAIL
INCOMPLETE
REVIEW_REQUIRED
```

Rules:

- decision is immutable after issue,
- correction creates a superseding decision,
- decision does not unlock content.

Events:

```text
ASSESSMENT_DECISION_ISSUED
```

---

### 7.3 `SupersedeAssessmentDecision`

**Owner:** AssessmentDecision aggregate

Input:

```text
superseded_assessment_decision_id
replacement_assessment_decision_id
reason
```

Events:

```text
ASSESSMENT_DECISION_SUPERSEDED
```

---

## 8. Promotion commands

### 8.1 `ApplyAssessmentDecision`

**Owner:** LearningTransition aggregate

Input:

```text
assessment_decision_id
promotion_policy_version
current_enrollment_state_version
```

Rules:

- only approved and current decisions are accepted,
- Promotion Engine cannot alter the assessment result,
- duplicate application is idempotent.

Possible outcomes:

```text
TRANSITION_APPLIED
REMEDIATION_CREATED
NO_TRANSITION_REQUIRED
REJECTED
```

Events:

```text
PROMOTION_APPROVED
PROMOTION_REJECTED
REMEDIATION_PATH_CREATED
LEARNING_TRANSITION_APPLIED
```

---

### 8.2 `CreateRemediationPath`

**Owner:** LearningTransition aggregate

Input:

```text
assessment_decision_id
unsatisfied_requirement_ids
remediation_policy_version
```

Output:

```text
remediation_path_id
assigned_learning_units
reassessment_eligibility_rule
```

Events:

```text
REMEDIATION_PATH_CREATED
```

---

### 8.3 `CompleteRemediationPath`

**Owner:** LearningTransition aggregate

Input:

```text
remediation_path_id
supporting_evidence_ids
```

Events:

```text
REMEDIATION_PATH_COMPLETED
REASSESSMENT_ELIGIBILITY_GRANTED
```

---

## 9. Vocabulary and SRS commands

### 9.1 `IntroduceVocabularyItem`

**Owner:** LearnerVocabularyItem aggregate

Input:

```text
user_id
lexeme_id
content_version
source_context
```

Events:

```text
VOCABULARY_ITEM_INTRODUCED
```

---

### 9.2 `ApplyVocabularyEvidence`

**Owner:** LearnerVocabularyItem aggregate

Input:

```text
vocabulary_item_id
evidence_id
mastery_policy_version
```

Rules:

- evidence must be validated,
- mastery updates are dimensional,
- UI-level `MASTERED` is derived, not canonical.

Events:

```text
VOCABULARY_MASTERY_UPDATED
```

---

### 9.3 `ScheduleVocabularyReview`

**Owner:** ReviewSchedule aggregate

Input:

```text
vocabulary_item_id
review_policy_version
source_evidence_ids
```

Events:

```text
REVIEW_SCHEDULED
```

---

### 9.4 `RecordVocabularyReviewOutcome`

**Owner:** ReviewSchedule aggregate

Input:

```text
review_item_id
evidence_id
outcome
```

Events:

```text
VOCABULARY_REVIEW_COMPLETED
NEXT_REVIEW_CALCULATED
```

---

### 9.5 `SuspendVocabularyItem`

**Owner:** LearnerVocabularyItem aggregate

Input:

```text
vocabulary_item_id
reason
```

Events:

```text
VOCABULARY_ITEM_SUSPENDED
```

---

## 10. Grammar commands

### 10.1 `IntroduceGrammarConcept`

**Owner:** LearnerGrammarConcept aggregate

Input:

```text
grammar_concept_id
content_version
source_context
```

Events:

```text
GRAMMAR_CONCEPT_INTRODUCED
```

---

### 10.2 `ApplyGrammarEvidence`

**Owner:** LearnerGrammarConcept aggregate

Input:

```text
learner_grammar_concept_id
evidence_id
mastery_policy_version
```

Events:

```text
GRAMMAR_MASTERY_UPDATED
```

---

### 10.3 `ScheduleGrammarReview`

**Owner:** ReviewSchedule aggregate

Input:

```text
learner_grammar_concept_id
review_policy_version
```

Events:

```text
GRAMMAR_REVIEW_SCHEDULED
```

---

## 11. Competency profile commands

### 11.1 `ApplyValidatedEvidenceToCompetencyProfile`

**Owner:** LearnerCompetencyProfile aggregate

Input:

```text
profile_id
evidence_id
competency_policy_version
```

Rules:

- only validated evidence,
- internal skill state is authoritative,
- external framework levels are not directly mutated.

Events:

```text
COMPETENCY_PROFILE_UPDATED
```

---

### 11.2 `RecalculateExternalFrameworkProjection`

**Owner:** External Framework Mapping projection service

Input:

```text
profile_id
framework
mapping_version
```

Output:

```text
external_level_projection
coverage
unmeasured_channels
confidence
```

Events:

```text
EXTERNAL_FRAMEWORK_PROJECTION_UPDATED
```

---

# PART II — HIKARI TEACHER RUNTIME COMMANDS

## 12. Teacher-session commands

### 12.1 `StartTeacherSession`

**Owner:** TeacherSession aggregate

Input:

```text
user_id
enrollment_id
session_goal
available_time
interaction_mode
```

Output:

```text
teacher_session_id
planned_activities
selected_pedagogical_context_version
```

Events:

```text
TEACHER_SESSION_STARTED
```

---

### 12.2 `PlanTeacherSession`

**Owner:** TeacherSession aggregate

Input:

```text
teacher_session_id
validated_learning_state_version
pedagogical_memory_projection_version
teacher_policy_version
```

Rules:

- plan may recommend activities,
- plan cannot mutate mastery or promotion state,
- deterministic-first policy applies.

Events:

```text
TEACHER_SESSION_PLANNED
```

---

### 12.3 `RequestHikariResponse`

**Owner:** Language Application Service orchestration

Input:

```text
teacher_session_id
interaction_intent
validated_learning_context
selected_pedagogical_context
user_message
teacher_policy_version
interaction_policy_version
capability_requested
```

Canonical flow:

```text
Hikari Teacher Runtime
-> Pre-generation Interaction Policy
-> OdynAI
-> RuntimePort
-> Shinrei
-> semantic AI result
-> Post-generation Response Realizer
-> Conversation Quality Gate
```

Output:

```text
semantic_result
execution_receipt_id
request_id
trace_id
```

The command itself must not directly write educational truth.

Events:

```text
HIKARI_RESPONSE_REQUESTED
HIKARI_SEMANTIC_RESULT_RECEIVED
```

---

### 12.4 `RealizeTeacherResponse`

**Owner:** TeacherResponseProjection aggregate

Input:

```text
semantic_result
teacher_decision_context
interaction_profile
speech_profile
response_realizer_version
```

Output:

```text
display_text
spoken_text
interaction_profile
speech_profile
```

Events:

```text
TEACHER_RESPONSE_REALIZED
```

---

### 12.5 `ValidateConversationQuality`

**Owner:** TeacherResponseProjection aggregate

Input:

```text
teacher_response_projection_id
quality_gate_version
ivona_effect_benchmark_version
```

Possible result:

```text
PASS
REWRITE_REQUIRED
REJECTED
```

Events:

```text
CONVERSATION_QUALITY_VALIDATED
CONVERSATION_REWRITE_REQUESTED
```

---

### 12.6 `EndTeacherSession`

**Owner:** TeacherSession aggregate

Input:

```text
teacher_session_id
completion_reason
```

Events:

```text
TEACHER_SESSION_ENDED
```

---

## 13. Pedagogical Memory commands

### 13.1 `ProposePedagogicalObservation`

**Owner:** PedagogicalObservation aggregate

Input:

```text
user_id
observation_type
structured_payload
source_evidence_ids
source_session_id
confidence
proposed_by
```

Initial state:

```text
PROPOSED
```

Events:

```text
PEDAGOGICAL_OBSERVATION_PROPOSED
```

---

### 13.2 `ValidatePedagogicalObservation`

**Owner:** PedagogicalObservation aggregate

Input:

```text
observation_id
validation_policy_version
validated_by
```

Events:

```text
PEDAGOGICAL_OBSERVATION_VALIDATED
PEDAGOGICAL_OBSERVATION_REJECTED
```

---

### 13.3 `ExpirePedagogicalObservation`

**Owner:** PedagogicalObservation aggregate

Input:

```text
observation_id
expiry_reason
```

Events:

```text
PEDAGOGICAL_OBSERVATION_EXPIRED
```

---

### 13.4 `DeletePedagogicalObservationByUserRequest`

**Owner:** PedagogicalObservation aggregate

Input:

```text
observation_id
user_confirmation_id
```

Must preserve the minimum audit record required by policy without retaining deleted private content.

Events:

```text
PEDAGOGICAL_OBSERVATION_DELETED
```

---

# PART III — SYNCHRONIZATION COMMANDS

## 14. Offline and synchronization commands

### 14.1 `SubmitOfflineLearningEvents`

**Owner:** Synchronization application service

Input:

```text
device_id
user_id
tenant_partition
client_cursor
events[]
```

Each event begins in:

```text
LOCAL_PENDING
```

Server outcomes:

```text
SUBMITTED
ACCEPTED
APPLIED
CONFLICTED
REJECTED
QUARANTINED
```

Rules:

- client clock is not authoritative,
- server revision defines accepted order,
- duplicate idempotency keys do not duplicate effects,
- cross-user and cross-tenant batches are rejected.

Events:

```text
OFFLINE_EVENT_BATCH_SUBMITTED
OFFLINE_EVENT_ACCEPTED
OFFLINE_EVENT_APPLIED
OFFLINE_EVENT_CONFLICTED
OFFLINE_EVENT_QUARANTINED
```

---

### 14.2 `AcknowledgeSynchronizationCursor`

**Owner:** Synchronization application service

Input:

```text
device_id
accepted_server_revision
```

Events:

```text
SYNCHRONIZATION_CURSOR_ACKNOWLEDGED
```

---

### 14.3 `ResolveSynchronizationConflict`

**Owner:** Domain owner of the conflicted aggregate

Input:

```text
conflict_id
resolution_strategy
resolved_by
```

Rules:

- evidence, assessment and promotion history remain append-only,
- no last-write-wins for immutable educational decisions.

Events:

```text
SYNCHRONIZATION_CONFLICT_RESOLVED
```

---

# PART IV — CONTENT SYSTEM COMMANDS

## 15. Content lifecycle commands

### 15.1 `CreateContentDraft`

**Owner:** Content item aggregate

Input:

```text
content_type
source_language
target_language
schema_version
author
provenance
license_metadata
```

Events:

```text
CONTENT_DRAFT_CREATED
```

---

### 15.2 `SubmitContentForReview`

**Owner:** Content item aggregate

Input:

```text
content_id
content_version
review_stage
```

Review stages:

```text
LINGUISTIC
PEDAGOGICAL
LICENSE_PROVENANCE
TECHNICAL
```

Events:

```text
CONTENT_REVIEW_REQUESTED
```

---

### 15.3 `ApproveContentReview`

**Owner:** Content item aggregate

Input:

```text
content_id
content_version
review_stage
reviewer_id
review_notes
```

Events:

```text
CONTENT_REVIEW_APPROVED
```

---

### 15.4 `PublishContentRelease`

**Owner:** CourseRelease aggregate

Input:

```text
release_id
included_content_versions
release_policy_version
```

Rules:

- all mandatory reviews passed,
- published items become immutable,
- AI-generated content cannot bypass human review requirements.

Events:

```text
CONTENT_RELEASE_PUBLISHED
```

---

### 15.5 `DeprecateContentRelease`

**Owner:** CourseRelease aggregate

Input:

```text
release_id
deprecation_reason
replacement_release_id, optional
```

Events:

```text
CONTENT_RELEASE_DEPRECATED
```

---

# PART V — QUERY CATALOG

## 16. Course and lesson queries

### 16.1 `GetAvailableCourses`

Returns:

```text
course_id
current_release_id
target_language
available_instruction_languages
regional_variants
availability_status
```

---

### 16.2 `GetLearnerEnrollments`

Returns active and historical enrollment projections for the authorized user.

---

### 16.3 `GetCourseStructure`

Input:

```text
enrollment_id
release_id
```

Returns:

```text
modules
chapters
lessons
challenges
exams
unlock_state
```

---

### 16.4 `GetCurrentLesson`

Returns the authoritative current lesson projection, server checkpoint and client synchronization status.

---

### 16.5 `GetLessonAttemptHistory`

Returns immutable attempt summaries without exposing another user or tenant.

---

### 16.6 `GetLessonResumeProjection`

Returns:

```text
lesson_attempt_id
server_checkpoint
client_checkpoint_status
resume_allowed
content_version
release_id
```

---

## 17. Evidence and assessment queries

### 17.1 `GetLearningEvidence`

Input:

```text
evidence_id
```

Returns authorized evidence projection excluding forbidden execution-plane details.

---

### 17.2 `GetEvidenceForSkill`

Returns evidence timeline, validation states and supersession chain for one skill.

---

### 17.3 `GetAssessmentDecision`

Returns:

```text
assessment_decision_id
decision
rubric_version
satisfied_requirements
unsatisfied_requirements
measurement_statuses
evidence_ids
supersession_status
```

---

### 17.4 `GetAssessmentHistory`

Returns immutable assessment history for the learner.

---

### 17.5 `GetPromotionState`

Returns:

```text
current_module
current_level_projection
unlocked_items
blocked_items
active_remediation_path
last_applied_assessment_decision_id
```

---

## 18. Competency and mastery queries

### 18.1 `GetCompetencyProfile`

Returns internal competency dimensions, evidence coverage and measurement status.

---

### 18.2 `GetExternalFrameworkProjection`

Input:

```text
framework
mapping_version, optional
```

Returns:

```text
projected_level
confidence
coverage
unmeasured_channels
mapping_version
```

---

### 18.3 `GetVocabularyProfile`

Returns vocabulary states with multidimensional mastery.

---

### 18.4 `GetGrammarProfile`

Returns grammar concept states with multidimensional mastery.

---

### 18.5 `GetReviewQueue`

Returns due reviews ordered by server-authoritative scheduling policy.

---

## 19. Hikari queries

### 19.1 `GetStudentProfileProjection`

Returns the minimum validated learning and pedagogical context required by Hikari Teacher Runtime.

Must not expose unrestricted raw memory.

---

### 19.2 `GetTeacherSession`

Returns teacher-session state, planned activities and current interaction context.

---

### 19.3 `GetPedagogicalMemory`

Returns user-visible durable pedagogical observations with status, source and edit/delete eligibility.

---

### 19.4 `GetHikariResponseProjection`

Returns:

```text
display_text
spoken_text
interaction_profile
speech_profile
quality_gate_status
```

---

## 20. Synchronization queries

### 20.1 `GetSynchronizationStatus`

Returns:

```text
device_id
local_pending_count
last_acknowledged_server_revision
current_server_revision
conflicted_count
quarantined_count
```

---

### 20.2 `GetDeltaSinceRevision`

Input:

```text
server_revision
```

Returns authorized events/projections after the requested revision.

---

### 20.3 `GetConflictDetails`

Returns conflict metadata and allowed resolution strategies without leaking another tenant's data.

---

## 21. Content queries

### 21.1 `GetContentItem`

Returns one explicit content version.

---

### 21.2 `GetContentVersionHistory`

Returns immutable version history and provenance metadata.

---

### 21.3 `GetCourseRelease`

Returns release contents, status and framework mappings.

---

### 21.4 `GetContentReviewStatus`

Returns review gates and outstanding approvals.

---

# PART VI — CROSS-CUTTING RULES

## 22. Authorization rules

Every command and query must verify:

```text
user_id
tenant_partition
organization_id, when applicable
actor permission
resource ownership
```

A record containing learner progress, memory, answer, recording, evidence or assessment cannot exist without an unambiguous user owner and tenant partition.

---

## 23. Idempotency rules

Mandatory idempotency applies to:

- answer submission,
- offline event submission,
- evidence recording,
- assessment decision application,
- promotion transition,
- review outcome recording,
- Hikari execution request settlement,
- content publication.

Idempotency prevents duplicate effects. It does not permit conflicting payload reuse under the same key.

---

## 24. AI boundary rules

Commands may request AI capability only through:

```text
Language
-> OdynAI
-> RuntimePort
-> Shinrei
```

Language stores:

```text
execution_receipt_id
request_id
trace_id
capability_contract_version
evaluation_policy_version
```

Language does not store in educational domain state:

```text
physical_model
provider
runtime_node
GPU
```

---

## 25. Deterministic-first routing

Application Services must prefer deterministic execution for:

- unambiguous answer validation,
- scoring,
- SRS scheduling,
- checkpoints,
- unlock rules,
- promotion application,
- content schema validation.

AI-assisted execution is reserved for pedagogically useful ambiguity or natural interaction.

---

## 26. Early Vertical E2E command path

The first executable vertical slice must prove this exact orchestration:

```text
EnrollLearnerInCourse
-> StartLesson
-> StartActivityAttempt
-> SubmitExerciseAnswer
-> RecordLearningEvidence
-> ValidateLearningEvidence
-> RequestAssessment
-> IssueAssessmentDecision
-> RequestHikariResponse
-> OdynAI
-> RuntimePort
-> Shinrei
-> semantic AI result
-> RealizeTeacherResponse
-> ValidateConversationQuality
-> Hikari feedback projection
```

Required runtime evidence:

```text
Language commit
OdynAI commit
Shinrei commit
RuntimePort protocol version
Language product-contract version
execution_receipt_id
request_id
trace_id
test timestamp
result
```

---

## 27. Open review items

Before this catalog becomes stable implementation reference, review must confirm:

1. command names align with final TypeScript naming conventions,
2. aggregate owners match the implemented domain modules,
3. event names align with the Event Catalog,
4. authorization rules align with persistence row-level policy,
5. Early Vertical E2E commands map to current OdynAI contracts,
6. timeout, cancellation and degraded-state semantics are documented,
7. Hikari response realization ownership remains post-inference,
8. no command gives Hikari direct authority over educational truth.

---

## 28. Status

```text
COMMAND CATALOG: DRAFT
QUERY CATALOG: DRAFT
IMPLEMENTATION CONTRACT: NOT YET LOCKED
```

The document becomes stable only after:

- Architecture Book review,
- Domain Model review,
- Event Catalog alignment,
- Data Dictionary alignment,
- branch validation,
- Early Vertical E2E plan review,
- cross-repository compatibility confirmation,
- owner acceptance.
