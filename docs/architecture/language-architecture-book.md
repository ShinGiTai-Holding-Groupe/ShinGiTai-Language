# ShinGiTai Language Architecture Book

**Version:** 0.1.1-draft  
**Status:** WORKING ARCHITECTURE REFERENCE — ACCEPTED WITH STABLE STATUS PENDING E2E PLAN  
**Owner:** ShinGiTai Holding Groupe  
**Primary canonical source:** `docs/architecture/kanon1.txt`

---

## 0. Purpose and review status

This book translates the accepted product vision and reviewed core architecture of ShinGiTai Language into an implementation-oriented architecture reference.

It does not replace `kanon1.txt`. When this book conflicts with `kanon1.txt`, the canon wins until an explicit owner-approved canon revision is created.

Current review state:

- Product vision: **ACCEPTED**
- Implementation direction: **ACCEPTED**
- Alignment with `kanon1`: **ACCEPTED**
- Repository validation for the reviewed SHA: **PASS**
- Stable reference status: **WAITING FOR EARLY VERTICAL E2E PLAN REVIEW AND CROSS-REPOSITORY CONFIRMATION**
- Merge status of PR #13: **NOT EVALUATED BY THIS DOCUMENT REVIEW**

---

## 1. Product architecture thesis

ShinGiTai Language is an AI Teacher Platform led by Hikari.

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

Language must not call providers, Ollama, Shinrei or physical models directly. Provider, node, GPU and physical-model identity must not leak into educational domain state.

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

### 2.3 Hikari interaction flow: pre-inference and post-inference phases

The Human Interaction Layer is explicitly split into two phases. This prevents response realization from being implemented before semantic generation.

```text
Learning state + selected pedagogical context
        ↓
Hikari Teacher Runtime
        ↓
Pre-generation Interaction Policy
(intent, tone, constraints, response length, teaching objective)
        ↓
OdynAI
        ↓
RuntimePort
        ↓
Shinrei
        ↓
semantic AI result
        ↓
Post-generation Response Realizer
        ↓
Spoken Response Realizer
        ↓
Conversation Quality Gate
        ↓
display_text + spoken_text
```

Canonical internal structure:

```text
Hikari Human Interaction Layer
├── Pre-generation Interaction Policy
└── Post-generation Response Realizer
    ├── Display Response Projection
    ├── Spoken Response Realizer
    └── Conversation Quality Gate
```

`display_text` and `spoken_text` are two projections of the same teacher decision, but they do not need to be identical.

Hikari may explain, guide, assess conversationally and recommend actions. Hikari does not directly mutate mastery, promotion state, assessment outcomes or canonical curriculum dependencies.

---

## 3. Bounded contexts

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

Owns educational truth, course and lesson state, Learning Evidence, assessment, mastery, progress, vocabulary, grammar, review scheduling, promotion prerequisites, remediation state and internal competency state.

Does not own Hikari Identity, teacher persona, response realization, provider routing, physical execution or global memory-access policy.

### 3.2 Hikari Teacher Runtime

Owned by Language, but separate from Learning Core.

Owns Hikari Teacher Policy, pedagogical relationship state, Student Profile projection, Session Planner, Lesson Orchestrator, Exam Runtime, intervention policy, recommendation logic and selected Pedagogical Memory projection.

Consumes the global Hikari Identity Core from OdynAI. Language must not create a separate Hikari identity that diverges from Hub, Forge or other ShinGiTai products.

### 3.3 Hikari Human Interaction Layer

Owned by Language for educational interaction.

Pre-generation responsibilities:

- interaction intent,
- teacher tone,
- conversational pacing constraints,
- response-length policy,
- generation constraints,
- teaching objective projection.

Post-generation responsibilities:

- semantic-result realization,
- display projection,
- spoken response realization,
- Conversation Quality Gate,
- IVONA Effect benchmark validation.

### 3.4 Application Services

Orchestrate bounded contexts, authorization and transactional boundaries. They start and resume lessons, submit answers, create evidence, invoke assessment and promotion, prepare Hikari context and project state to UI. They do not own educational rules.

### 3.5 Persistence / Synchronization

Backend Language owns canonical synchronized learning state.

Client owns local projections, pending offline events, checkpoints and synchronization cursor. Client time is never authoritative. Server-assigned revision determines accepted ordering.

### 3.6 Content System

Owns versioned course definitions, immutable published content, curriculum releases, provenance, licenses, review states, framework mappings and migration policy.

### 3.7 UI

Owns presentation, interaction, accessibility and visualization. UI does not own scoring, promotion, mastery, SRS, educational truth or provider logic.

---

## 4. Ecosystem ownership matrix

| Capability | Language | OdynAI | RuntimePort | Shinrei |
|---|---|---|---|---|
| Course state | Owns | No | No | No |
| Learning Evidence | Owns | No | No | No |
| AssessmentDecision | Owns | No | No | No |
| Promotion transition | Owns | No | No | No |
| Pedagogical Memory | Owns durable records | Controls access and context projection policy | No | No |
| Global Hikari Identity Core | Consumes | Owns | No | No |
| Hikari Teacher Policy | Owns | Applies global Hikari constraints | No | No |
| Product AI policy | Requests capability | Owns and enforces | No | No |
| Execution contract | Uses application side | Projects request | Defines and version-controls boundary | Implements runtime side |
| Physical execution | No | No | No | Owns and executes |
| Provider/model/node/GPU details in educational state | Forbidden | Auditable internally | Transport only | Owns execution details |

RuntimePort does not own product policy. It defines and protects the stable communication boundary. Shinrei physically executes inference; it does not execute indirectly.

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

The Internal Competency Graph is authoritative. CEFR, JLPT, HSK, TOPIK, ACTFL and course-specific levels are versioned projections.

```text
internal_skill_state = source of truth
external_level_mapping = versioned projection
```

### 5.3 Content immutability

Every published content item includes `content_id`, `content_version`, `schema_version`, `release_id`, `status`, `valid_from` and `deprecated_at`.

A started lesson remains pinned to a concrete version. Published content is never edited in place. Corrections create new versions. Historical assessments remain tied to their original content and rubric versions.

### 5.4 Multilingual architecture

The system separates `interface_language`, `instruction_language` and `target_language`. English is not a mandatory base language.

---

## 6. Learning Evidence architecture

Every consequential learning-state change must derive from versioned Learning Evidence.

Minimum fields include:

- `evidence_id`, `user_id`, `tenant_partition`, `organization_id` when applicable,
- `activity_id`, `skill_id`, `content_version`, `attempt_id`,
- `evidence_type`, `input_modality`, `result`, `confidence`,
- `hint_usage`, `response_time`, `rubric_version`, `evaluator_type`,
- `model_capability`, `capability_contract_version`,
- `evaluation_policy_version`, `evaluator_release`,
- `execution_receipt_id`, `request_id`, `trace_id`,
- `supersedes_evidence_id`, `created_at`, `validated_at`, `validated_by`,
- `status`.

Evaluator types:

- `DETERMINISTIC`
- `AI_ASSISTED`
- `HUMAN_REVIEWED`

Evidence statuses:

- `PROPOSED`
- `PENDING_VALIDATION`
- `VALIDATED`
- `REJECTED`
- `DISPUTED`
- `SUPERSEDED`
- `REVOKED`

Language stores execution receipts and traceable identifiers, not physical provider, model, node or GPU identity. AI output is an observation pending validation, not automatic educational truth.

---

## 7. Assessment and promotion authority

Assessment Engine evaluates Learning Evidence, applies a versioned rubric and emits a signed/versioned `AssessmentDecision` with one of:

- `PASS`
- `FAIL`
- `INCOMPLETE`
- `REVIEW_REQUIRED`

It records satisfied and unsatisfied requirements and never unlocks a module or level.

Promotion Engine accepts only approved AssessmentDecision records, applies unlock rules, writes transitions and creates remediation paths. It cannot alter the assessment result.

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

Vocabulary dimensions include recognition, recall, listening, production, pronunciation, orthography and contextual use.

Grammar dimensions include recognition, controlled production, free production, conversation transfer and retention.

A single `MASTERED` value may exist only as a UI projection.

---

## 9. Accessibility and honest assessment

Accommodation must not create false mastery.

Measurement states:

- `ASSESSED`
- `ACCOMMODATED`
- `NOT_ASSESSED`
- `NOT_APPLICABLE`
- `INSUFFICIENT_EVIDENCE`

An alternative exercise may provide access without claiming a competency channel that was not actually measured. External framework projections must preserve that distinction.

---

## 10. Synchronization architecture

Critical learning events are append-only. Backend Language owns canonical synchronized state.

Offline event lifecycle:

```text
LOCAL_PENDING
→ SUBMITTED
→ ACCEPTED
→ APPLIED
```

Failure paths:

- `CONFLICTED`
- `REJECTED`
- `QUARANTINED`

Every event includes identity, tenant partition, device identity, idempotency key, occurrence and receipt timestamps, server revision, schema version and payload.

---

## 11. AI usage policy

```text
deterministic-first
AI-when-pedagogically-useful
```

Fiszki, matching, deterministic quizzes, SRS, checkpoints, unambiguous scoring, promotion rules and review scheduling must work without AI.

AI is used for conversation, adaptive explanations, writing and speaking feedback, contextual examples, open-response interpretation and teacher planning based on validated data.

---

## 12. Early Vertical E2E

The first reference slice must use the following order:

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
→ Spoken Response Realizer
→ Conversation Quality Gate
→ Hikari feedback
```

A minimal diagnostic UI may be used before full product UI exists.

The slice must record:

- Language commit,
- OdynAI commit,
- Shinrei commit,
- RuntimePort protocol version,
- Language capability-contract version,
- content and rubric versions,
- execution receipt,
- request and trace IDs,
- result,
- test timestamp.

The Early Vertical E2E plan must explicitly test:

1. deterministic answer and evidence creation,
2. AssessmentDecision generation,
3. application-service orchestration,
4. Language-to-OdynAI contract,
5. RuntimePort boundary version,
6. Shinrei physical inference,
7. semantic-result realization,
8. Conversation Quality Gate,
9. display and spoken projections,
10. failure, timeout and degraded states.

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

Repository validation for the reviewed SHA has passed:

- architecture validation,
- typecheck,
- foundation lint,
- foundation tests,
- production build.

Before this book becomes a stable implementation reference, the project still requires:

- accepted Early Vertical E2E execution plan,
- current cross-repository compatibility confirmation,
- owner acceptance of stable-reference status.

---

## 15. Planned next chapters

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
