# ShinGiTai Language Invariants Catalog

**Version:** 0.1-draft  
**Status:** WORKING ARCHITECTURE REFERENCE  
**Owner:** ShinGiTai Holding Groupe  
**Canonical source:** `docs/architecture/kanon1.txt`  
**Related references:**

- `docs/architecture/language-architecture-book.md`
- `docs/architecture/language-domain-model.md`
- `docs/architecture/language-command-query-catalog.md`
- `docs/architecture/language-event-catalog.md`
- `docs/architecture/language-data-dictionary.md`
- `docs/architecture/language-architecture-decision-records.md`
- `docs/architecture/language-learning-core-specification.md`
- `docs/architecture/language-hikari-teacher-specification.md`

---

## 0. Purpose

This catalog defines non-negotiable invariants for ShinGiTai Language.

An invariant is a rule that must remain true regardless of implementation language, storage technology, UI shape, model provider, runtime topology or deployment environment.

ADR records explain why a decision was made.

This catalog states what must never be violated.

Each invariant is intended to become one or more of:

- architecture tests,
- domain tests,
- contract tests,
- persistence constraints,
- synchronization checks,
- runtime guards,
- review checklist items,
- CI validation rules.

---

## 1. Classification

### 1.1 Severity

```text
CRITICAL
HIGH
MEDIUM
```

- `CRITICAL` — violation may corrupt educational truth, break ecosystem boundaries, leak tenant data or invalidate assessment.
- `HIGH` — violation may produce inconsistent state, wrong behavior or unauditable decisions.
- `MEDIUM` — violation may reduce maintainability, quality or user trust without immediate state corruption.

### 1.2 Enforcement level

```text
STATIC_ARCHITECTURE
DOMAIN_RUNTIME
PERSISTENCE
CONTRACT
SYNCHRONIZATION
CI_REVIEW
E2E
```

### 1.3 Status

```text
DRAFT
ACCEPTED
SUPERSEDED
DEPRECATED
```

All invariants in this document are `DRAFT` until the document passes owner review and the required repository validation gates.

---

# PART I — OWNERSHIP AND AUTHORITY

## INV-0001 — Learning Core owns educational truth

**Severity:** CRITICAL  
**Owner:** Learning Core  
**Related ADR:** Educational Truth Ownership

Learning Core is the sole owner of canonical educational state.

This includes:

- course progress,
- lesson state,
- activity state,
- Learning Evidence,
- assessment results,
- mastery projections,
- promotion prerequisites,
- vocabulary state,
- grammar state,
- review scheduling,
- remediation state.

The following must never directly mutate educational truth:

- UI,
- Hikari Teacher Runtime,
- Hikari Human Interaction Layer,
- analytics,
- reporting,
- synchronization projections,
- AI output,
- client-side optimistic state.

**Enforcement:** STATIC_ARCHITECTURE, DOMAIN_RUNTIME, CI_REVIEW

---

## INV-0002 — Assessment Engine exclusively issues AssessmentDecision

**Severity:** CRITICAL  
**Owner:** Assessment Engine

Only Assessment Engine may issue a canonical `AssessmentDecision`.

No other component may:

- fabricate a decision,
- alter its decision value,
- rewrite its satisfied requirements,
- rewrite its unsatisfied requirements,
- change its rubric version,
- replace its evidence set in place.

Correction requires a superseding decision.

**Enforcement:** DOMAIN_RUNTIME, PERSISTENCE, CONTRACT

---

## INV-0003 — Promotion Engine cannot alter assessment

**Severity:** CRITICAL  
**Owner:** Promotion Engine

Promotion Engine may only:

- consume an approved AssessmentDecision,
- apply unlock rules,
- persist a transition,
- create remediation,
- reject application of an invalid or stale decision.

Promotion Engine must never change:

- PASS,
- FAIL,
- INCOMPLETE,
- REVIEW_REQUIRED,
- evidence selection,
- rubric outcome.

**Enforcement:** DOMAIN_RUNTIME, CONTRACT, E2E

---

## INV-0004 — Hikari cannot directly mutate educational truth

**Severity:** CRITICAL  
**Owner:** Hikari Teacher Runtime boundary

Hikari may:

- recommend,
- explain,
- select a teaching strategy,
- request an assessment,
- request a review,
- request a lesson,
- communicate a decision.

Hikari must never directly mutate:

- mastery,
- promotion state,
- assessment decision,
- course unlock state,
- canonical competency dependencies,
- canonical curriculum releases.

**Enforcement:** STATIC_ARCHITECTURE, CONTRACT, CI_REVIEW

---

## INV-0005 — Global Hikari Identity belongs to OdynAI

**Severity:** CRITICAL  
**Owner:** OdynAI boundary

Language must consume the global Hikari Identity Core from OdynAI.

Language may own only Language-specific teacher policy and pedagogical relationship state.

Language must never create a separate identity that diverges from Hikari in Hub, Forge or other ShinGiTai products.

**Enforcement:** CROSS_REPOSITORY_REVIEW, CONTRACT, CI_REVIEW

---

# PART II — AI AND EXECUTION BOUNDARIES

## INV-0006 — Canonical AI path is mandatory

**Severity:** CRITICAL  
**Owner:** Ecosystem integration boundary

All Language AI execution must follow:

```text
Language
→ OdynAI
→ RuntimePort
→ Shinrei
→ provider/model
```

Forbidden paths include:

```text
Language → Shinrei
Language → provider
Language → model
Language → Ollama
Language → cloud model API
```

**Enforcement:** STATIC_ARCHITECTURE, CONTRACT, E2E

---

## INV-0007 — RuntimePort owns only the execution contract boundary

**Severity:** HIGH  
**Owner:** RuntimePort boundary

RuntimePort defines and version-controls the stable communication contract.

RuntimePort does not own:

- product AI policy,
- teacher policy,
- educational truth,
- provider selection policy,
- physical inference.

**Enforcement:** CONTRACT, CROSS_REPOSITORY_REVIEW

---

## INV-0008 — Shinrei owns physical inference

**Severity:** CRITICAL  
**Owner:** Shinrei

Shinrei is the sole owner of:

- providers,
- physical models,
- model loading,
- inference,
- execution scheduling,
- runtime health,
- physical node details.

Language must remain model-agnostic.

**Enforcement:** STATIC_ARCHITECTURE, CONTRACT, CROSS_REPOSITORY_REVIEW

---

## INV-0009 — AI output is not educational truth

**Severity:** CRITICAL  
**Owner:** Learning Evidence boundary

AI output may produce:

- a proposal,
- an observation,
- a structured evaluation candidate,
- a teacher response candidate.

AI output must not become canonical educational state until validated by the appropriate Language domain policy.

**Enforcement:** DOMAIN_RUNTIME, CONTRACT, TESTS

---

## INV-0010 — Deterministic evaluation has priority

**Severity:** HIGH  
**Owner:** Evaluation orchestration

When an answer can be evaluated deterministically with sufficient reliability, the system must not require AI evaluation.

Examples include:

- exact matching,
- bounded normalized matching,
- multiple choice,
- true/false,
- deterministic ordering,
- deterministic SRS transitions.

**Enforcement:** CI_REVIEW, DOMAIN_TESTS

---

# PART III — LEARNING EVIDENCE AND AUDITABILITY

## INV-0011 — Learning Evidence is immutable

**Severity:** CRITICAL  
**Owner:** LearningEvidenceRecord

Accepted evidence must never be overwritten in place.

Corrections require one of:

- superseding evidence,
- revocation,
- dispute resolution,
- validation status transition.

The audit chain must remain intact.

**Enforcement:** PERSISTENCE, DOMAIN_RUNTIME, TESTS

---

## INV-0012 — AI-assisted evidence requires execution provenance

**Severity:** CRITICAL  
**Owner:** LearningEvidenceRecord

AI-assisted evidence must include:

- `capability_contract_version`,
- `evaluation_policy_version`,
- `evaluator_release`,
- `execution_receipt_id`,
- `request_id`,
- `trace_id`,
- `validated_at`,
- `validated_by`.

**Enforcement:** DATA_VALIDATION, CONTRACT, PERSISTENCE

---

## INV-0013 — Physical execution details are forbidden in educational state

**Severity:** CRITICAL  
**Owner:** Language domain boundary

Educational state must never persist:

- physical model name,
- provider name,
- node identity,
- GPU identity,
- physical endpoint,
- provider credential.

Technical provenance is referenced through execution receipt identifiers.

**Enforcement:** STATIC_SCHEMA_CHECK, DATA_DICTIONARY_VALIDATION, CI_REVIEW

---

## INV-0014 — Every state-changing learning decision requires evidence

**Severity:** CRITICAL  
**Owner:** Learning Core

Canonical changes to mastery, assessment, promotion eligibility or remediation must be traceable to one or more Learning Evidence records.

Forbidden shortcut:

```text
answer → mastery
```

Required shape:

```text
answer
→ evidence
→ validation
→ evaluation
→ state transition
```

**Enforcement:** DOMAIN_RUNTIME, TESTS, E2E

---

## INV-0015 — Evidence status transitions are controlled

**Severity:** HIGH  
**Owner:** LearningEvidenceRecord

Only valid transitions are allowed among:

```text
PROPOSED
PENDING_VALIDATION
VALIDATED
REJECTED
DISPUTED
SUPERSEDED
REVOKED
```

Invalid backward transitions are forbidden unless represented through a new audit record.

**Enforcement:** STATE_MACHINE_TESTS, DOMAIN_RUNTIME

---

# PART IV — CONTENT AND CURRICULUM

## INV-0016 — Published content is immutable

**Severity:** CRITICAL  
**Owner:** Content System

A published course release or content item must never be edited in place.

A correction creates a new version.

Historical attempts and assessments remain pinned to the original version.

**Enforcement:** PERSISTENCE, CONTENT_PIPELINE, TESTS

---

## INV-0017 — Course hierarchy and framework mapping remain separate

**Severity:** HIGH  
**Owner:** Course Engine

Canonical hierarchy:

```text
Course
→ Module
→ Chapter
→ Lesson
→ Activity
→ Challenge
→ Exam
```

Parallel mappings:

```text
Course
├── Internal Competency Scope
└── External Framework Mappings
```

External framework mappings must never become parents of modules.

**Enforcement:** CONTENT_SCHEMA_VALIDATION, TESTS

---

## INV-0018 — Internal Competency Graph is authoritative

**Severity:** CRITICAL  
**Owner:** Learning Core

CEFR, JLPT, HSK, TOPIK, ACTFL and course-specific levels are projections.

They must not replace the Internal Competency Graph as the canonical source of skill state.

**Enforcement:** DOMAIN_RUNTIME, CONTENT_MAPPING_TESTS

---

## INV-0019 — AI cannot directly edit canonical curriculum dependencies

**Severity:** CRITICAL  
**Owner:** Content System

AI may propose curriculum changes.

Canonical graph changes require:

```text
AI_PROPOSAL
→ CONTENT_REVIEW
→ PEDAGOGICAL_REVIEW
→ VERSIONED_RELEASE
```

**Enforcement:** WORKFLOW_POLICY, CONTENT_PIPELINE, CI_REVIEW

---

# PART V — MASTERY, ASSESSMENT AND ACCESSIBILITY

## INV-0020 — Mastery is multidimensional

**Severity:** CRITICAL  
**Owner:** Mastery Engine

A single `MASTERED` value must not be the sole canonical representation.

Vocabulary and grammar mastery must preserve separate dimensions such as recognition, recall, listening, production, pronunciation, orthography, transfer and retention where applicable.

**Enforcement:** DATA_MODEL_TESTS, DOMAIN_TESTS

---

## INV-0021 — UI mastery is a projection

**Severity:** HIGH  
**Owner:** Projection layer

Any simplified UI label such as `MASTERED` is derived from canonical multidimensional state.

UI cannot write back a simplified mastery value as canonical truth.

**Enforcement:** STATIC_ARCHITECTURE, CONTRACT

---

## INV-0022 — Accessibility accommodation cannot create false mastery

**Severity:** CRITICAL  
**Owner:** Assessment Engine

An alternative activity must not prove a competency channel that was not measured.

Allowed measurement states:

```text
ASSESSED
ACCOMMODATED
NOT_ASSESSED
NOT_APPLICABLE
INSUFFICIENT_EVIDENCE
```

Example:

```text
speaking.assessment_status = ACCOMMODATED_NOT_MEASURED
```

Not:

```text
speaking_mastery = MASTERED
```

**Enforcement:** ASSESSMENT_TESTS, FRAMEWORK_MAPPING_TESTS

---

## INV-0023 — External projections cannot overstate unmeasured competence

**Severity:** CRITICAL  
**Owner:** External Framework Mapping

CEFR, JLPT and other projections must not claim full competence in a modality that lacks sufficient evidence.

**Enforcement:** MAPPING_POLICY_TESTS

---

## INV-0024 — Promotion requires a valid current decision

**Severity:** CRITICAL  
**Owner:** Promotion Engine

A promotion transition may be applied only from a current, non-superseded, accepted AssessmentDecision.

Stale, disputed, revoked or superseded decisions are ineligible.

**Enforcement:** DOMAIN_RUNTIME, PERSISTENCE, TESTS

---

# PART VI — SYNCHRONIZATION AND CONSISTENCY

## INV-0025 — Backend Language owns canonical synchronized state

**Severity:** CRITICAL  
**Owner:** Language backend

The client owns only:

- local projections,
- pending offline events,
- checkpoints,
- synchronization cursor.

The client does not own canonical ordering or canonical learning state.

**Enforcement:** SYNCHRONIZATION, CONTRACT, E2E

---

## INV-0026 — Client clock is never authoritative

**Severity:** CRITICAL  
**Owner:** Synchronization boundary

Client timestamps may be recorded for observation, but accepted ordering is determined by server-assigned revision.

**Enforcement:** SYNCHRONIZATION_TESTS

---

## INV-0027 — Offline events follow explicit lifecycle

**Severity:** HIGH  
**Owner:** Synchronization boundary

Valid success path:

```text
LOCAL_PENDING
→ SUBMITTED
→ ACCEPTED
→ APPLIED
```

Valid failure outcomes:

```text
CONFLICTED
REJECTED
QUARANTINED
```

No event may silently disappear.

**Enforcement:** STATE_MACHINE_TESTS, OFFLINE_E2E

---

## INV-0028 — Idempotency is mandatory for externally initiated commands

**Severity:** CRITICAL  
**Owner:** Application Services

Every externally initiated state-changing command must resolve an idempotency key.

Retries must not create duplicate canonical transitions.

**Enforcement:** CONTRACT, DOMAIN_RUNTIME, E2E

---

## INV-0029 — Aggregate version protects concurrent mutation

**Severity:** HIGH  
**Owner:** Aggregate boundary

Optimistic concurrency must reject stale writes where aggregate consistency requires it.

**Enforcement:** PERSISTENCE, DOMAIN_RUNTIME, CONCURRENCY_TESTS

---

# PART VII — TENANT AND USER ISOLATION

## INV-0030 — Every learner record has explicit ownership

**Severity:** CRITICAL  
**Owner:** Persistence boundary

Every learner-specific record must include:

- `user_id`,
- `tenant_partition`,
- `organization_id` when applicable.

No anonymous canonical learner state is allowed.

**Enforcement:** SCHEMA_VALIDATION, PERSISTENCE, TESTS

---

## INV-0031 — Tenant boundaries cannot be crossed

**Severity:** CRITICAL  
**Owner:** Authorization and persistence boundary

No query, command, event, projection, evidence, assessment, memory record, recording or synchronization payload may cross tenant boundaries.

**Enforcement:** AUTHORIZATION_TESTS, PERSISTENCE_TESTS, E2E

---

## INV-0032 — Queries cannot mutate canonical state

**Severity:** CRITICAL  
**Owner:** Application Services

A query is read-only.

No query handler may:

- emit domain events,
- change aggregate state,
- advance synchronization revision,
- write pedagogical memory,
- schedule review,
- trigger promotion.

**Enforcement:** STATIC_ARCHITECTURE, TESTS

---

# PART VIII — HIKARI TEACHER BEHAVIOR

## INV-0033 — Hikari response generation has pre- and post-inference phases

**Severity:** HIGH  
**Owner:** Hikari Human Interaction Layer

Required flow:

```text
Learning state + pedagogical context
→ Hikari Teacher Runtime
→ Pre-generation Interaction Policy
→ OdynAI
→ RuntimePort
→ Shinrei
→ semantic AI result
→ Post-generation Response Realizer
→ Spoken Response Realizer
→ Conversation Quality Gate
→ display_text + spoken_text
```

The pre-generation layer must not be confused with post-generation realization.

**Enforcement:** CONTRACT, E2E, CI_REVIEW

---

## INV-0034 — Hikari feedback follows AssessmentDecision where assessment is involved

**Severity:** CRITICAL  
**Owner:** Language Application Services

For assessment feedback, Hikari must communicate an existing AssessmentDecision.

Hikari must not announce a pass, fail or promotion before the decision exists.

**Enforcement:** ORCHESTRATION_TESTS, E2E

---

## INV-0035 — Display and spoken output are sibling projections

**Severity:** HIGH  
**Owner:** Human Interaction Layer

`display_text` and `spoken_text` must derive from the same teacher decision.

They may differ in phrasing, rhythm and format, but must not contradict one another.

**Enforcement:** CONTRACT_TESTS, QUALITY_GATE_TESTS

---

## INV-0036 — Conversation Quality Gate cannot change educational truth

**Severity:** CRITICAL  
**Owner:** Conversation Quality Gate

The quality gate may:

- reject phrasing,
- request realization retry,
- shorten output,
- remove artificial patterns,
- block unsafe or inconsistent wording.

It must not alter:

- assessment result,
- mastery state,
- promotion state,
- evidence state.

**Enforcement:** STATIC_ARCHITECTURE, CONTRACT_TESTS

---

## INV-0037 — Pedagogical Memory stores validated structured records

**Severity:** HIGH  
**Owner:** Language Pedagogical Memory

Pedagogical Memory must not be treated as unrestricted model-generated prose.

Durable records must use structured types and controlled status transitions.

**Enforcement:** DATA_MODEL_TESTS, DOMAIN_RUNTIME

---

## INV-0038 — User controls durable pedagogical memory

**Severity:** HIGH  
**Owner:** Language product boundary

The user must be able to:

- inspect,
- edit where policy allows,
- delete,
- export,
- disable long-term pedagogical memory.

**Enforcement:** PRODUCT_TESTS, PRIVACY_REVIEW

---

# PART IX — EVENTS, PROJECTIONS AND UI

## INV-0039 — Event is not a command

**Severity:** HIGH  
**Owner:** Event architecture

An event describes something that happened.

A subscriber must not reinterpret an event as permission to violate aggregate ownership.

**Enforcement:** EVENT_HANDLER_REVIEW, STATIC_ARCHITECTURE

---

## INV-0040 — Projections cannot become authoritative aggregates

**Severity:** CRITICAL  
**Owner:** Projection layer

A read model may be rebuilt from canonical events or state.

A projection must not become the source of truth for assessment, mastery, promotion or synchronization ordering.

**Enforcement:** STATIC_ARCHITECTURE, PERSISTENCE_REVIEW

---

## INV-0041 — UI panels must represent real state

**Severity:** HIGH  
**Owner:** UI

A panel must not present fabricated, hard-coded or disconnected product state as live data.

Demo fixtures must be explicitly marked and isolated from production projections.

**Enforcement:** UI_INTEGRATION_TESTS, REVIEW

---

## INV-0042 — Analytics cannot drive canonical learning state directly

**Severity:** CRITICAL  
**Owner:** Analytics boundary

Analytics may inform product decisions and policy review.

Analytics pipelines must not directly mutate learner aggregates.

**Enforcement:** STATIC_ARCHITECTURE, DATA_FLOW_REVIEW

---

# PART X — VALIDATION AND RELEASE

## INV-0043 — Early Vertical E2E is mandatory

**Severity:** CRITICAL  
**Owner:** Architecture validation

Before the architecture becomes a stable implementation reference, the following slice must be reviewed and executed:

```text
Minimal Course
→ one Lesson
→ one Exercise
→ user answer
→ Learning Evidence
→ AssessmentDecision
→ Language Application Service
→ Hikari Teacher Runtime
→ OdynAI
→ RuntimePort
→ Shinrei
→ real model
→ AI result
→ Human Interaction Layer
→ Conversation Quality Gate
→ Hikari feedback
```

**Enforcement:** E2E

---

## INV-0044 — E2E evidence records exact versions

**Severity:** HIGH  
**Owner:** Test architecture

Every accepted cross-repository E2E proof must record:

- Language commit,
- OdynAI commit,
- Shinrei commit,
- RuntimePort protocol version,
- product contract version,
- execution receipt,
- timestamp,
- result.

**Enforcement:** E2E_REPORT_VALIDATION

---

## INV-0045 — Canon status cannot be granted by documentation alone

**Severity:** CRITICAL  
**Owner:** Product owner and architecture review

A document may become stable or canonical only after the required validation gates pass.

At minimum:

- architecture validation,
- typecheck,
- tests,
- production build,
- Early Vertical E2E plan review,
- cross-repository compatibility confirmation,
- owner acceptance.

**Enforcement:** RELEASE_PROCESS, CI_REVIEW

---

## 2. Invariant test strategy

Each invariant should be mapped to at least one executable or reviewable control.

Recommended mapping:

| Invariant class | Primary control |
|---|---|
| ownership | architecture tests |
| state transition | domain tests |
| immutability | persistence constraints + tests |
| contract boundary | contract tests |
| cross-repository AI flow | E2E |
| tenant isolation | authorization + persistence tests |
| synchronization | offline and replay tests |
| content immutability | release pipeline validation |
| Hikari orchestration | integration tests |
| accessibility honesty | assessment mapping tests |

---

## 3. CI automation potential

Candidate automatic checks include:

- forbidden imports from provider SDKs,
- forbidden direct Shinrei access from Language,
- forbidden persistence field names such as `physical_model` and `gpu`,
- aggregate ownership dependency rules,
- query handlers emitting events,
- missing tenant fields,
- missing idempotency keys,
- missing evidence provenance fields,
- invalid evidence transitions,
- promotion without AssessmentDecision,
- mutation of published content,
- UI direct write access to educational aggregates.

---

## 4. Change policy

Changing an invariant requires:

1. a new or superseding ADR,
2. impact analysis across related documents,
3. updated tests and enforcement rules,
4. architecture validation,
5. owner approval when the invariant affects canon.

An invariant must not be weakened through an implementation shortcut.

---

## 5. Status

```text
INVARIANT CATALOG: DRAFT
CRITICAL OWNERSHIP RULES: DEFINED
AI BOUNDARY RULES: DEFINED
EVIDENCE AND ASSESSMENT RULES: DEFINED
SYNCHRONIZATION RULES: DEFINED
AUTOMATED ENFORCEMENT: NOT YET IMPLEMENTED
STABLE REFERENCE: NOT YET LOCKED
```
