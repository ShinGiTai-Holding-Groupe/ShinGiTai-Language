# ShinGiTai Language — Learning Core and Hikari Teacher Platform

Status: `CANONICAL`
Version: `1.1`
Owner: ShinGiTai Holding Groupe
Product: ShinGiTai Language

## 1. Product definition

ShinGiTai Language is not a conventional language-learning application with AI added to selected screens.

It is an AI Teacher Platform in which Hikari is the central teacher-facing experience, while Language owns the durable educational truth, course state, evidence, mastery, assessment, progression and pedagogical memory.

The target user experience is:

> I am going to study with Hikari.

not:

> I am opening an application to click through another lesson.

Structured courses, vocabulary drills, grammar practice, quizzes, games, reviews and examinations remain essential. They are tools used by Hikari and by the learner, not isolated product silos.

## 2. Canonical architecture

```text
Language UI
    ↓
Language application services
    ↓
Learning Core
    ├── Course and Curriculum
    ├── Lesson Runtime
    ├── Exercise Engine
    ├── Learning Evidence
    ├── Assessment and Promotion
    ├── Vocabulary and SRS
    ├── Grammar
    ├── Learning Graph
    ├── Progress and Mastery
    ├── Pedagogical Memory
    ├── Persistence
    └── Synchronization

Hikari interaction
    ↓
OdynAI
    ↓
RuntimePort
    ↓
Shinrei
    ↓
provider / model
```

### Ownership boundaries

**Language owns:**

- educational truth;
- course and curriculum state;
- durable pedagogical memory;
- learning evidence;
- mastery;
- assessment results;
- promotion state;
- review scheduling;
- content versions;
- user and tenant ownership.

**Hikari owns:**

- teacher behaviour;
- lesson presentation;
- natural interaction;
- explanations;
- recommendations;
- interpretation and communication of validated decisions.

**OdynAI owns:**

- application-facing AI access;
- memory-access policy;
- approved context projection;
- governance, limits and orchestration.

**RuntimePort owns:**

- the stable execution contract between OdynAI and Shinrei.

**Shinrei owns:**

- providers;
- models;
- inference;
- runtime capabilities;
- runtime health;
- execution metadata.

Shinrei stores no durable student memory and knows nothing about lessons, courses, SRS, mastery or promotion.

## 3. AI usage policy

The platform follows:

```text
deterministic-first
AI-when-pedagogically-useful
```

The following must work without model inference:

- flashcards;
- matching;
- deterministic quizzes;
- checkpoints;
- score calculation;
- progression gates;
- SRS scheduling;
- validation of unambiguous answers;
- persistence and synchronization.

AI is used where it provides genuine pedagogical value:

- conversation;
- flexible explanations;
- contextual examples;
- open-answer interpretation;
- writing feedback;
- speaking and pronunciation support;
- teacher planning;
- adaptive interaction.

A model observation is never automatically educational truth.

## 4. Language and locale model

The system separates:

- `interface_language`;
- `instruction_language`;
- `target_language`.

Examples:

```text
Japanese interface + Japanese instruction + Polish target
Polish interface + Polish instruction + Korean target
Norwegian interface + English instruction + Japanese target
```

English is not the mandatory base language.

Courses are not duplicated for every language pair. The canonical target-language curriculum is combined with localized instructions, explanations, feedback and contrastive notes.

## 5. Internal competency model

CEFR is not the internal source of truth for every language.

The system uses:

```text
Internal Competency Graph
        ↓
versioned external framework mappings
```

Supported projections may include:

- CEFR;
- JLPT;
- HSK;
- TOPIK;
- ACTFL;
- course-specific levels.

`internal_skill_state` is authoritative. External levels are versioned projections used for explanation, reporting and interoperability.

## 6. Course and curriculum model

Canonical hierarchy:

```text
Course
→ Level
→ Module
→ Chapter
→ Lesson
→ Activity
→ Challenge
→ Exam
```

A course definition includes:

- target language;
- available instruction languages;
- regional variant;
- communication objectives;
- vocabulary objectives;
- grammar objectives;
- competency prerequisites;
- assessment rules;
- repair paths;
- framework mappings.

Courses and lessons are data, not React or UI code.

## 7. Immutable content releases

Published educational content is immutable.

Every content element includes:

```text
content_id
content_version
schema_version
release_id
status
valid_from
deprecated_at
```

Rules:

- a started lesson is pinned to an exact version;
- an update never changes a historical assessment;
- every result references the content version used;
- migration between versions is explicit;
- published records are not edited in place;
- corrections create a new version.

Content lifecycle:

```text
PLANNED
→ STRUCTURED
→ CONTENT_DRAFT
→ LINGUISTIC_REVIEWED
→ PEDAGOGICALLY_REVIEWED
→ PROVENANCE_REVIEWED
→ TECHNICALLY_VALIDATED
→ TESTED
→ RELEASE_READY
→ DEPRECATED
```

## 8. Content provenance

Each educational asset records:

- author;
- source;
- license;
- commercial-use permission;
- whether AI generated it;
- generation model;
- reviewers;
- review dates;
- release version.

AI-generated content cannot move directly to `RELEASE_READY`.

## 9. Lesson Runtime

States:

```text
NOT_STARTED
IN_PROGRESS
PAUSED
COMPLETED
FAILED
ABANDONED
REQUIRES_REVIEW
```

Operations:

```text
start
pause
resume
save_checkpoint
submit_answer
request_hint
skip_activity
finish
retry
abandon
restore_after_restart
```

The lesson state must survive application closure, connectivity loss, device restart and supported device changes.

## 10. Exercise Engine

Required activity families include:

- single choice;
- multiple choice;
- true/false;
- fill in the blank;
- translation;
- sentence building;
- word ordering;
- matching;
- flashcards;
- dictation;
- listening comprehension;
- reading comprehension;
- writing;
- speaking;
- pronunciation;
- free response;
- dialogue simulation;
- picture description;
- story building;
- conversation challenge.

Every exercise defines input, evaluation rules, hints, difficulty, required competencies and the evidence it may produce.

## 11. Learning Evidence Model

Every meaningful educational state change must be supported by versioned learning evidence.

Each evidence record includes:

```text
evidence_id
user_id
tenant_partition
organization_id
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
model_capability
created_at
status
```

Evaluator types:

```text
DETERMINISTIC
AI_ASSISTED
HUMAN_REVIEWED
```

Evidence may be `VALID`, `DISPUTED`, `SUPERSEDED` or `REVOKED`.

Speaking and writing evidence must preserve:

- rubric and rubric version;
- structured observations;
- confidence;
- evidence excerpts where permitted;
- re-evaluation capability;
- dispute status;
- manual correction history.

AI output is an observation subject to validation, not automatic truth.

## 12. Assessment and promotion

The learner may declare a starting level, but Hikari verifies it through adaptive conversation and tasks.

```text
user declaration
→ Hikari verification
→ evidence collection
→ assessment
→ verified starting point
```

Each module ends with an assessment. Each level ends with a broader examination.

Hikari conducts and explains the process. Assessment Engine calculates and validates the result. Promotion Engine unlocks the next module or level only from accepted evidence and versioned policy.

A failed assessment creates a focused repair path rather than forcing repetition of the entire module.

## 13. Multi-dimensional mastery

Mastery is never stored only as one `MASTERED` flag.

Vocabulary dimensions include:

```text
recognition_mastery
recall_mastery
listening_mastery
production_mastery
pronunciation_mastery
orthography_mastery
contextual_use_mastery
```

Grammar dimensions include:

```text
recognition
controlled_production
free_production
conversation_transfer
retention
```

A simplified overall state may be projected for UI, but it is not the underlying source of truth.

## 14. Vocabulary and SRS

Vocabulary lifecycle:

```text
NEW
LEARNING
REVIEW
MASTERED
RELEARNING
SUSPENDED
```

SRS considers correctness, response time, hint usage, modality, transfer to new contexts and forgetting history.

Recognition on a flashcard is weaker evidence than independent production in conversation or writing.

## 15. Grammar Engine

Each grammar concept records:

- canonical definition;
- use cases;
- examples and counterexamples;
- exceptions;
- common errors;
- prerequisites;
- register and regional variation;
- exercises;
- evidence requirements;
- multi-dimensional mastery.

AI may explain grammar dynamically, but the canonical concept and mastery state belong to Language.

## 16. Learning Graph

The graph connects vocabulary, grammar, listening, speaking, reading, writing, pronunciation and conversation skills.

Hikari may:

- choose a path;
- recommend revision;
- identify a likely gap;
- propose material.

Hikari may not directly mutate the canonical graph, prerequisites or promotion thresholds.

Graph changes follow:

```text
AI_PROPOSAL
→ CONTENT_REVIEW
→ PEDAGOGICAL_REVIEW
→ VERSIONED_RELEASE
```

## 17. Pedagogical Memory

Durable pedagogical memory belongs to Language.

OdynAI controls memory-access policy and projects only approved context. Hikari consumes selected context. Shinrei stores no durable student memory.

Structured records include:

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

Each observation status is:

```text
PROPOSED
VALIDATED
REJECTED
EXPIRED
```

A model may propose an observation. Language decides whether it becomes trusted memory.

Users must be able to inspect, correct and delete eligible pedagogical observations.

## 18. Hikari Teacher Runtime

Modules:

- Hikari Identity;
- Hikari Relationship State;
- Hikari Teacher Policy;
- Hikari Human Interaction Layer;
- Hikari Spoken Response Realizer;
- Hikari Conversation Quality Gate;
- Student Profile;
- Pedagogical Memory projection;
- Session Planner;
- Lesson Orchestrator;
- Conversation Runtime;
- Exam Runtime;
- Feedback Engine;
- Motivation and Intervention Policy.

Hikari is supportive, calm, honest and appropriately demanding. It does not praise automatically and does not pretend every answer is correct.

## 19. Human Interaction Layer

The platform explicitly protects Hikari from robotic interaction patterns.

A teacher reaction may produce two projections:

```json
{
  "display_text": "Odpowiedź jest prawie poprawna, ale wymaga zmiany końcówki.",
  "spoken_text": "Prawie. Sens jest dobry, ale końcówka znowu ci uciekła. Spróbuj jeszcze raz.",
  "interaction_profile": {
    "mode": "teacher_feedback",
    "tone": "supportive_firm",
    "response_length": "short"
  },
  "speech_profile": {
    "pace": "calm",
    "energy": "low",
    "pause_style": "conversational"
  }
}
```

`display_text` and `spoken_text` are separate projections of the same teacher decision and do not have to be identical.

### IVONA_EFFECT_BENCHMARK

The quality gate checks for:

- artificial formulas;
- automatic praise;
- excessive lists;
- unchanged rhythm;
- reading Markdown aloud;
- repeating the user question;
- ending every response with a question;
- unnatural spoken language.

## 20. Hikari relationship safety

Hikari may be warm, relational and consistent without manipulation.

It must not:

- shame a learner for losing a streak;
- induce guilt for taking a break;
- pretend to be a biological person;
- claim to suffer when the learner leaves;
- coerce emotional attachment;
- present itself as a substitute for a teacher, doctor or therapist;
- hide when assessment was AI-assisted.

## 21. Quick Learning

Quick Learning provides low-friction practice without replacing Hikari-led learning.

Activities may include:

- Flashcards;
- Speed Recall;
- Match & Connect;
- Memory;
- Sentence Builder;
- Listening Challenge;
- Dictation;
- Kana Trainer;
- Kanji Trainer;
- Pronunciation Practice;
- Story Builder;
- Conversation Challenge;
- Boss Challenge.

Every activity writes real evidence into Learning Core.

## 22. Event-based synchronization

Critical educational history uses append-only events and deterministic reducers.

```text
append-only Learning Events
→ deterministic reducers
→ current learning state
```

Core events include:

```text
LESSON_STARTED
ANSWER_SUBMITTED
HINT_USED
ACTIVITY_COMPLETED
VOCABULARY_EVIDENCE_RECORDED
ASSESSMENT_COMPLETED
REVIEW_SCHEDULED
PROMOTION_APPROVED
```

Each event contains:

```text
event_id
idempotency_key
user_id
tenant_partition
organization_id
device_id
occurred_at
received_at
schema_version
payload
```

Evidence, assessments and promotions are append-only. Retry must not duplicate effects.

## 23. User and tenant isolation

For student records:

- `user_id` is always required;
- `tenant_partition` is always required;
- `organization_id` is required when the record belongs to an organization.

No progress, answer, pedagogical memory, recording or assessment record may exist without an unambiguous owner and tenant partition.

## 24. Privacy and consent

Required controls include:

- explicit consent for long-term pedagogical memory;
- memory inspection, correction and deletion;
- data export;
- account and data deletion;
- separate consent for audio and images;
- retention policies;
- no raw recordings in logs;
- default deletion of raw audio after assessment unless retention is explicitly approved;
- encryption for local and server storage.

## 25. Accessibility

Accessibility is a product and assessment invariant, not a cosmetic UI option.

Required support includes:

- full keyboard use;
- screen readers;
- captions and transcripts;
- silent-mode alternatives;
- alternatives for speaking and listening tasks;
- reduced motion;
- high contrast;
- text scaling;
- dyslexia support;
- no penalty caused by speech or hearing disability.

Assessment must distinguish an accessibility accommodation from a failed competency attempt.

## 26. Early vertical E2E

Cross-repository E2E is not deferred until the end.

The first reference slice is:

```text
Minimal Course
→ one Lesson
→ one Exercise
→ Learning Evidence
→ Assessment
→ Hikari feedback
→ Language
→ OdynAI
→ RuntimePort
→ Shinrei
→ real model
```

A minimal diagnostic UI is allowed before full product UI.

Every E2E result records exact component SHAs, protocol versions, environment and timestamp.

## 27. Implementation phases

```text
PHASE 0   Vision Freeze
PHASE 1   Core contracts, identifiers and events
PHASE 2   Minimal Persistence
PHASE 3   Minimal Course + Lesson + Exercise
PHASE 4   Minimal Assessment
PHASE 5   Early Vertical E2E
PHASE 6   Vocabulary + SRS
PHASE 7   Grammar
PHASE 8   Learning Graph
PHASE 9   Hikari Teacher Runtime
PHASE 10  Natural Interaction and Voice
PHASE 11  Full Synchronization
PHASE 12  Content Pipeline
PHASE 13  Quick Learning
PHASE 14  Dashboard and full UI
PHASE 15  Course expansion
PHASE 16  Multimodality
```

Each phase must preserve the canonical flow:

```text
Language → OdynAI → RuntimePort → Shinrei → provider/model
```

## 28. Delivery standard

Each module follows:

```text
domain design
→ contracts
→ implementation
→ unit tests
→ persistence tests
→ integration tests
→ architecture validation
→ application service
→ early or full E2E
→ Hikari integration
→ UI integration
→ documentation
→ audit
```

UI cannot be treated as proof of implemented behaviour.

## 29. Canonical invariants

1. Hikari is the central teacher-facing experience.
2. Learning Core is the source of educational truth.
3. AI cannot directly change level, progress or mastery.
4. Assessment Engine validates promotion from evidence.
5. No pedagogical logic belongs in Shinrei.
6. AI access follows `Language → OdynAI → RuntimePort → Shinrei`.
7. Interface, instruction and target languages are independent.
8. Quick Learning affects the real learner profile.
9. UI panels display real state, not fabricated progress.
10. A feature is not complete without tests and persistence.
11. Every progress change derives from versioned Learning Evidence.
12. Pedagogical Memory belongs to Language; OdynAI controls access; Shinrei stores none.
13. Display text and spoken text are separate projections of one Hikari decision.
14. Published educational content is immutable; changes create new versions.
15. CEFR, JLPT and similar levels are projections of internal competency state.
16. AI usage is deterministic-first and pedagogically justified.
17. Critical evidence, assessments and promotions are append-only.
18. Every student record has explicit user ownership and tenant partitioning.
19. Hikari cannot mutate canonical curriculum or Learning Graph rules directly.
20. Accessibility accommodations cannot be treated as ordinary failure.

## 30. Governing question

Every proposed feature must answer:

> Does this help Hikari become a better teacher or help the learner study more effectively?

If not, it is outside the core product unless separately justified.
