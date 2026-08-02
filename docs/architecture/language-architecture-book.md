# ShinGiTai Language Architecture Book

**Version:** 0.1-draft  
**Status:** WORKING ARCHITECTURE REFERENCE  
**Owner:** ShinGiTai Holding Groupe  
**Primary canonical source:** `docs/architecture/kanon1.txt`

---

## 0. Purpose of this book

This book translates the accepted product vision and reviewed core architecture of ShinGiTai Language into an implementation-oriented architecture reference.

It does not replace `kanon1.txt`.

`kanon1.txt` defines product and architectural canon. This book explains how that canon is applied across bounded contexts, data ownership, execution flows, integration boundaries, testing, synchronization, content lifecycle, AI usage and future implementation phases.

When this book conflicts with `kanon1.txt`, the canon wins until an explicit owner-approved canon revision is created.

---

## 1. Product architecture thesis

ShinGiTai Language is an AI Teacher Platform led by Hikari.

The user-facing product goal is not:

```text
open application
→ click lesson
→ complete quiz
→ collect points
```

The target experience is:

```text
meet Hikari
→ verify current competence
→ follow an adaptive learning path
→ learn through lessons, conversation and quick practice
→ produce versioned Learning Evidence
→ receive a validated AssessmentDecision
→ unlock the next module or remediation path
```

The system is designed around five architectural truths:

1. Hikari is the central teacher experience.
2. Learning Core owns educational truth.
3. Language owns durable pedagogical state and canonical synchronized learning state.
4. OdynAI is the only application-facing AI boundary and owns the global Hikari Identity Core.
5. Shinrei is the only owner of providers, physical models and inference execution.

---

## 2. System context

### 2.1 Canonical AI flow

```text
ShinGiTai Language
        ↓
      OdynAI
        ↓
   RuntimePort
        ↓
     Shinrei
        ↓
 provider / model
```

Language must not:

- call a provider directly,
- call Ollama directly,
- call a physical model directly,
- bypass OdynAI,
- embed provider credentials,
- leak provider, node or GPU identity into educational domain state.

### 2.2 Canonical educational flow

```text
User interaction
        ↓
Application Service
        ↓
Learning Core
        ↓
Learning Evidence
        ↓
Assessment Engine
        ↓
AssessmentDecision
        ↓
Promotion Engine
        ↓
module / level transition or remediation
```

### 2.3 Hikari interaction flow

```text
Learning state + selected pedagogical context
        ↓
Hikari Teacher Runtime
        ↓
Hikari Human Interaction Layer
        ↓
OdynAI
        ↓
RuntimePort
        ↓
Shinrei
        ↓
AI result
        ↓
Conversation Quality Gate
        ↓
display_text + spoken_text
```

Hikari may explain, guide, assess conversationally and recommend actions. Hikari does not directly mutate mastery, promotion state, assessment outcomes or canonical curriculum dependencies.

---

## 3. Bounded contexts

ShinGiTai Language is divided into independent bounded contexts.

```text
ShinGiTai Language
|
|-- Learning Core
|-- Hikari Teacher Runtime
|-- Hikari Human Interaction Layer
|-- Application Services
|-- Persistence / Synchronization
|-- Content System
|-- UI
```

### 3.1 Learning Core

Owns:

- educational truth,
- course state,
- lesson state,
- activity state,
- Learning Evidence,
- assessment,
- mastery,
- progress,
- vocabulary state,
- grammar state,
- review scheduling,
- promotion prerequisites,
- remediation state,
- internal competency state.

Does not own:

- Hikari Identity,
- teacher persona,
- spoken response realization,
- provider routing,
- physical model execution,
- global memory access policy.

### 3.2 Hikari Teacher Runtime

Owned by Language, but separate from Learning Core.

Owns:

- Hikari Teacher Policy,
- pedagogical relationship state,
- Student Profile projection,
- Session Planner,
- Lesson Orchestrator,
- Exam Runtime,
- intervention policy,
- recommendation logic,
- selected Pedagogical Memory projection.

Consumes the global Hikari Identity Core from OdynAI.

Language must never create a separate identity that diverges from Hikari in Hub, Forge or other ShinGiTai products.

### 3.3 Hikari Human Interaction Layer

Owned by Language for educational interaction.

Owns:

- interaction intent,
- teacher tone,
- conversational pacing,
- response length policy,
- Spoken Response Realizer,
- Conversation Quality Gate,
- IVONA Effect benchmark rules,
- educational display and speech projections.

Core invariant:

```text
display_text and spoken_text are two projections
of the same teacher decision,
but they do not need to be identical.
```

### 3.4 Application Services

Owns orchestration between bounded contexts.

Responsibilities include:

- starting and resuming lessons,
- submitting answers,
- requesting deterministic or AI-assisted evaluation,
- creating evidence,
- invoking assessment,
- invoking promotion,
- projecting state to UI,
- preparing Hikari context,
- preserving transactional and authorization boundaries.

Application Services do not own educational rules.

### 3.5 Persistence / Synchronization

Backend Language owns canonical synchronized learning state.

Client owns only:

- local projections,
- pending offline events,
- local checkpoints,
- synchronization cursor.

Client time is never authoritative.
Server-assigned revision determines accepted ordering.

### 3.6 Content System

Owns:

- versioned course definitions,
- immutable published content,
- curriculum releases,
- provenance,
- licensing metadata,
- review states,
- framework mappings,
- content migration policy.

### 3.7 UI

Owns presentation, interaction, accessibility and visualization.

UI does not own:

- scoring,
- promotion rules,
- mastery rules,
- review scheduling,
- educational truth,
- AI provider logic.

---

## 4. Ecosystem ownership matrix

| Capability | Language | OdynAI | RuntimePort | Shinrei |
|---|---:|---:|---:|---:|
| Course state | Owns | No | No | No |
| Learning Evidence | Owns | No | No | No |
| AssessmentDecision | Owns | No | No | No |
| Promotion transition | Owns | No | No | No |
| Pedagogical Memory | Owns durable records | Controls access/projection policy | No | No |
| Global Hikari Identity Core | Consumes | Owns | No | No |
| Hikari Teacher Policy | Owns | Applies global constraints | No | No |
| AI request policy | Requests | Owns | Enforces contract | Executes indirectly |
| Runtime execution contract | No | Uses | Owns boundary | Implements runtime side |
| Providers and physical models | No | No | No | Owns |
| Provider/model/node/GPU details in educational state | Forbidden | Auditable internally | Transport only | Owns execution details |

---

## 5. Course and content architecture

### 5.1 Course hierarchy

```text
Course
→ Module
→ Chapter
→ Lesson
→ Activity
→ Challenge
→ Exam
```

In parallel:

```text
Course
├── Internal Competency Scope
└── External Framework Mappings
```

External framework mappings are projections, not parents in the course hierarchy.

### 5.2 Internal source of truth

The internal competency graph is authoritative.

External frameworks are versioned projections:

- CEFR,
- JLPT,
- HSK,
- TOPIK,
- ACTFL,
- course-specific levels.

```text
internal_skill_state = source of truth
external_level_mapping = versioned projection
```

### 5.3 Content immutability

Every published content item must include:

- `content_id`,
- `content_version`,
- `schema_version`,
- `release_id`,
- `status`,
- `valid_from`,
- `deprecated_at`.

Rules:

- a started lesson is pinned to a concrete content version,
- a published item is never edited in place,
- a correction creates a new version,
- historical assessment remains tied to the original version,
- migration between versions is explicit.

### 5.4 Multilingual architecture

The system separates:

- `interface_language`,
- `instruction_language`,
- `target_language`.

English is not assumed to be the universal base language.

The system model is:

```text
target-language curriculum
+
localized instructions
+
localized explanations
+
localized feedback
+
contrastive grammar notes
+
Hikari adaptation
```

---

## 6. Learning Evidence architecture

Learning Evidence is the basis for every consequential learning-state change.

Minimum fields:

- `evidence_id`,
- `user_id`,
- `tenant_partition`,
- `organization_id` when applicable,
- `activity_id`,
- `skill_id`,
- `content_version`,
- `attempt_id`,
- `evidence_type`,
- `input_modality`,
- `result`,
- `confidence`,
- `hint_usage`,
- `response_time`,
- `rubric_version`,
- `evaluator_type`,
- `model_capability`,
- `capability_contract_version`,
- `evaluation_policy_version`,
- `evaluator_release`,
- `execution_receipt_id`,
- `request_id`,
- `trace_id`,
- `supersedes_evidence_id`,
- `created_at`,
- `validated_at`,
- `validated_by`,
- `status`.

Evaluator types:

- `DETERMINISTIC`,
- `AI_ASSISTED`,
- `HUMAN_REVIEWED`.

Evidence lifecycle:

```text
PROPOSED
→ PENDING_VALIDATION
→ VALIDATED
```

Alternative terminal or corrective states:

- `REJECTED`,
- `DISPUTED`,
- `SUPERSEDED`,
- `REVOKED`.

Language records an execution receipt, request and trace identity. It does not record physical provider, model, node or GPU details in the educational domain.

AI output is an observation pending validation, not automatic educational truth.

---

## 7. Assessment and promotion authority

### 7.1 Assessment Engine

Assessment Engine:

- evaluates Learning Evidence,
- applies a versioned rubric,
- emits `AssessmentDecision`,
- returns one of:
  - `PASS`,
  - `FAIL`,
  - `INCOMPLETE`,
  - `REVIEW_REQUIRED`,
- records satisfied and unsatisfied requirements,
- never unlocks a module or level.

### 7.2 Promotion Engine

Promotion Engine:

- accepts only approved, versioned AssessmentDecision records,
- applies unlock rules,
- writes the transition,
- creates remediation paths,
- cannot change the assessment result.

Canonical flow:

```text
Learning Evidence
→ Assessment Engine
→ signed/versioned AssessmentDecision
→ Promotion Engine
→ module/level transition or remediation
```

---

## 8. Mastery model

Mastery is multidimensional.

### 8.1 Vocabulary mastery dimensions

- recognition,
- recall,
- listening,
- production,
- pronunciation,
- orthography,
- contextual use.

### 8.2 Grammar mastery dimensions

- recognition,
- controlled production,
- free production,
- conversation transfer,
- retention.

A single `MASTERED` value may exist as a UI projection only. It cannot be the sole stored source state.

---

## 9. Accessibility and honest assessment

Accessibility accommodations must not create false mastery.

Measurement states:

- `ASSESSED`,
- `ACCOMMODATED`,
- `NOT_ASSESSED`,
- `NOT_APPLICABLE`,
- `INSUFFICIENT_EVIDENCE`.

Example:

```text
speaking.assessment_status = ACCOMMODATED_NOT_MEASURED
```

Not:

```text
speaking_mastery = MASTERED
```

External framework projections must not claim competence in a channel that was not measured.

---

## 10. Synchronization architecture

Critical learning events are append-only.

Examples:

- `LESSON_STARTED`,
- `ANSWER_SUBMITTED`,
- `HINT_USED`,
- `ACTIVITY_COMPLETED`,
- `LEARNING_EVIDENCE_RECORDED`,
- `ASSESSMENT_COMPLETED`,
- `PROMOTION_APPROVED`,
- `REVIEW_SCHEDULED`.

Offline event lifecycle:

```text
LOCAL_PENDING
→ SUBMITTED
→ ACCEPTED
→ APPLIED
```

Failure states:

- `CONFLICTED`,
- `REJECTED`,
- `QUARANTINED`.

Every event includes at minimum:

- `event_id`,
- `idempotency_key`,
- `user_id`,
- `tenant_partition`,
- `organization_id` when applicable,
- `device_id`,
- `occurred_at`,
- `received_at`,
- `server_revision`,
- `schema_version`,
- `payload`.

No progress, memory, answer, recording or assessment record may exist without a clear user owner and tenant partition.

---

## 11. AI usage policy

The platform follows:

```text
deterministic-first
AI-when-pedagogically-useful
```

Without AI, the product must still support:

- flashcards,
- matching,
- deterministic quizzes,
- SRS,
- checkpoints,
- scoring for unambiguous answers,
- promotion rules,
- review scheduling.

AI is used for:

- conversation,
- adaptive explanations,
- writing feedback,
- speaking feedback,
- contextual examples,
- interpretation of open responses,
- teacher planning based on validated data.

---

## 12. Early Vertical E2E

The architecture must be validated early through a minimal reference slice:

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

A minimal diagnostic UI may be used before full product UI exists.

The vertical slice must record:

- Language commit,
- OdynAI commit,
- Shinrei commit,
- protocol version,
- contract version,
- execution receipt,
- result,
- test timestamp.

---

## 13. Implementation phases

```text
PHASE 0  Vision Freeze
PHASE 1  Core contracts, identifiers and events
PHASE 2  Minimal Persistence
PHASE 3  Minimal Course + Lesson + Exercise
PHASE 4  Minimal Assessment
PHASE 5  Early Vertical E2E
PHASE 6  Vocabulary + SRS
PHASE 7  Grammar
PHASE 8  Learning Graph
PHASE 9  Hikari Teacher Runtime
PHASE 10 Natural Interaction and Voice
PHASE 11 Full Synchronization
PHASE 12 Content Pipeline
PHASE 13 Quick Learning
PHASE 14 Dashboard and full UI
PHASE 15 Course expansion
PHASE 16 Multimodality
```

---

## 14. Architecture validation gates

Before this book can be treated as stable implementation reference, the branch must pass:

- architecture validation,
- typecheck,
- tests,
- production build,
- Early Vertical E2E plan review,
- cross-repository compatibility confirmation.

The book remains a working architecture reference until those gates pass and the owner accepts the corresponding canon lock.

---

## 15. Planned next chapters

The next Architecture Book increments will add:

1. complete domain model,
2. aggregate boundaries and invariants,
3. command and query catalog,
4. event catalog,
5. data dictionary,
6. persistence model,
7. application-service orchestration,
8. Hikari Teacher Runtime contracts,
9. Human Interaction Layer contracts,
10. security and privacy model,
11. test architecture,
12. operational compatibility matrix,
13. Early Vertical E2E execution plan,
14. ADR index.
