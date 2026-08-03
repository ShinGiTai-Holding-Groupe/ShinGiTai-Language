# ShinGiTai Language Architecture Decision Records

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
- `docs/architecture/language-learning-core-specification.md`
- `docs/architecture/language-hikari-teacher-specification.md`

---

## 0. Purpose

This document records the major architectural decisions governing ShinGiTai Language.

Each ADR explains:

- the decision,
- its context,
- rejected alternatives,
- consequences,
- implementation obligations,
- validation requirements.

The ADR set does not override `kanon1.txt`. When an ADR conflicts with the canon, the canon wins until an explicit owner-approved revision is created.

ADR statuses:

- `PROPOSED`
- `ACCEPTED`
- `SUPERSEDED`
- `DEPRECATED`
- `REJECTED`

---

# ADR-0001 — Learning Core owns educational truth

**Status:** ACCEPTED  
**Decision owner:** ShinGiTai Language

## Context

Language contains UI, Hikari Teacher Runtime, Human Interaction Layer, persistence, synchronization and AI-assisted flows. Without one authoritative owner, progress, mastery, assessment and course state could diverge.

## Decision

Learning Core is the sole owner of educational truth.

It owns:

- course state,
- lesson state,
- Learning Evidence,
- assessment,
- mastery,
- progress,
- review scheduling,
- promotion prerequisites,
- remediation state.

## Rejected alternatives

- UI mutates progress directly.
- Hikari changes mastery from conversational judgment.
- Analytics becomes a source of state.
- Synchronization resolves domain rules.

## Consequences

- all consequential state changes require domain commands,
- projections remain read-only,
- Hikari may recommend but not mutate truth,
- test coverage must protect authority boundaries.

---

# ADR-0002 — Global Hikari Identity belongs to OdynAI

**Status:** ACCEPTED

## Context

Hikari must remain the same character across Language, Hub, Forge and future products.

## Decision

OdynAI owns the global Hikari Identity Core and global behavioral constraints.

Language owns only education-specific behavior:

- Hikari Teacher Policy,
- pedagogical relationship state,
- Session Planner,
- Lesson Orchestrator,
- Exam Runtime,
- Human Interaction Layer for learning.

## Rejected alternatives

- Language creates its own Hikari identity.
- every product maintains a separate persona prompt.
- Shinrei stores Hikari identity.

## Consequences

- Language consumes identity through OdynAI,
- product-specific policies cannot redefine core identity,
- identity compatibility becomes a cross-repository contract concern.

---

# ADR-0003 — Canonical AI execution flow

**Status:** ACCEPTED

## Decision

The only supported application AI flow is:

```text
Language
→ OdynAI
→ RuntimePort
→ Shinrei
→ provider/model
```

## Consequences

Language must not:

- call providers directly,
- call Ollama directly,
- embed provider credentials,
- identify physical models, nodes or GPUs in educational state.

Shinrei owns physical inference execution.
RuntimePort defines and version-controls the execution boundary.
OdynAI owns application AI policy and context projection.

---

# ADR-0004 — Assessment and promotion have separate authority

**Status:** ACCEPTED

## Decision

Assessment Engine:

- evaluates eligible Learning Evidence,
- applies a versioned rubric,
- issues `AssessmentDecision`,
- returns `PASS`, `FAIL`, `INCOMPLETE` or `REVIEW_REQUIRED`.

Promotion Engine:

- accepts only approved versioned AssessmentDecision records,
- applies unlock rules,
- records transitions,
- creates remediation paths,
- cannot alter the assessment result.

## Canonical flow

```text
Learning Evidence
→ Assessment Engine
→ signed/versioned AssessmentDecision
→ Promotion Engine
→ transition or remediation
```

## Consequences

There is one owner of evaluation and one owner of state transition. No duplicate authority is permitted.

---

# ADR-0005 — Learning Evidence is immutable and auditable

**Status:** ACCEPTED

## Decision

Accepted Learning Evidence is never edited in place.

Correction uses:

- superseding evidence,
- dispute status,
- revocation,
- re-evaluation history.

Evidence lifecycle:

```text
PROPOSED
→ PENDING_VALIDATION
→ VALIDATED
```

Alternative states:

- `REJECTED`
- `DISPUTED`
- `SUPERSEDED`
- `REVOKED`

## Consequences

- history remains auditable,
- assessment decisions can be reproduced,
- AI-assisted evidence remains traceable through execution receipts.

---

# ADR-0006 — AI provenance uses execution receipts, not physical model leakage

**Status:** ACCEPTED

## Decision

Language stores:

- `execution_receipt_id`,
- `request_id`,
- `trace_id`,
- `capability_contract_version`,
- `evaluation_policy_version`,
- `evaluator_release`.

Language does not store:

- provider,
- physical model,
- node,
- GPU,
- physical endpoint.

## Consequences

Technical provenance remains reconstructable through OdynAI/Shinrei without coupling the educational domain to the execution plane.

---

# ADR-0007 — Deterministic first, AI when pedagogically useful

**Status:** ACCEPTED

## Decision

Deterministic evaluation is used whenever the answer can be evaluated reliably without a model.

AI is reserved for:

- conversation,
- open-ended writing,
- speaking feedback,
- contextual explanations,
- semantic interpretation,
- teacher planning from validated state.

## Consequences

The product remains functional during AI degradation for:

- flashcards,
- matching,
- deterministic quizzes,
- SRS,
- checkpointing,
- basic scoring,
- unlock rules.

---

# ADR-0008 — Published content is immutable

**Status:** ACCEPTED

## Decision

Published course content is versioned and immutable.

A correction creates a new version or release.

An in-progress lesson remains pinned to its original content version.
Historical evidence and assessment remain tied to the version used at execution time.

## Consequences

- reproducible assessments,
- explicit migrations,
- stable learner history,
- safer rollback and audit.

---

# ADR-0009 — Internal Competency Graph is the source of truth

**Status:** ACCEPTED

## Decision

The internal competency graph is authoritative.

CEFR, JLPT, HSK, TOPIK, ACTFL and product-specific levels are versioned projections.

```text
internal_skill_state = source of truth
external_framework_mapping = projection
```

## Consequences

- mixed skill profiles are represented honestly,
- framework mappings can evolve independently,
- no single external standard distorts the internal learning model.

---

# ADR-0010 — Mastery is multidimensional

**Status:** ACCEPTED

## Decision

A single `MASTERED` field cannot be the source state.

Vocabulary dimensions include:

- recognition,
- recall,
- listening,
- production,
- pronunciation,
- orthography,
- contextual use.

Grammar dimensions include:

- recognition,
- controlled production,
- free production,
- conversation transfer,
- retention.

## Consequences

UI may show a simplified projection, but persistence and assessment retain dimensional state.

---

# ADR-0011 — Accessibility accommodations cannot create false mastery

**Status:** ACCEPTED

## Decision

An alternative activity cannot automatically confirm a competency channel that was not measured.

Measurement statuses:

- `ASSESSED`
- `ACCOMMODATED`
- `NOT_ASSESSED`
- `NOT_APPLICABLE`
- `INSUFFICIENT_EVIDENCE`

## Consequences

External framework projections must not claim complete competence in an unmeasured channel.

---

# ADR-0012 — Backend Language owns canonical synchronized learning state

**Status:** ACCEPTED

## Decision

Backend Language owns canonical synchronized state.

Client owns:

- local projection,
- pending offline events,
- checkpoints,
- synchronization cursor.

Client clock is never authoritative.
Server-assigned revision determines accepted ordering.

## Offline lifecycle

```text
LOCAL_PENDING
→ SUBMITTED
→ ACCEPTED
→ APPLIED
```

Failure states:

- `CONFLICTED`
- `REJECTED`
- `QUARANTINED`

---

# ADR-0013 — Hikari Human Interaction Layer has pre- and post-inference phases

**Status:** ACCEPTED

## Decision

The Human Interaction Layer is divided into:

1. Pre-generation Interaction Policy
2. Post-generation Response Realizer

## Canonical flow

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

## Consequences

Implementers cannot incorrectly realize spoken text before inference.

---

# ADR-0014 — Hikari feedback is downstream of validated educational state

**Status:** ACCEPTED

## Decision

Hikari feedback must be generated from the relevant educational state and AssessmentDecision.

Minimal vertical flow:

```text
user answer
→ Learning Evidence
→ AssessmentDecision
→ Language Application Service
→ Hikari Teacher Runtime
→ AI execution
→ Human Interaction Layer
→ Hikari feedback
```

Hikari feedback does not create the AssessmentDecision it explains.

---

# ADR-0015 — Event envelope and tenant identity are mandatory

**Status:** ACCEPTED

## Decision

Every critical event includes at least:

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
- `correlation_id`,
- `causation_id`,
- `payload`.

## Consequences

No progress, memory, answer, recording or assessment may exist without clear ownership and tenant isolation.

---

# ADR-0016 — UI and projections are not domain authorities

**Status:** ACCEPTED

## Decision

UI owns presentation, interaction, accessibility and visualization.

It does not own:

- scoring,
- assessment,
- promotion,
- mastery,
- review scheduling,
- provider logic.

Queries and projections must remain read-only.

---

# ADR-0017 — Early Vertical E2E is required before broad expansion

**Status:** ACCEPTED

## Decision

A minimal cross-repository slice must be validated before broad implementation of the full platform.

Required slice:

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

## Required evidence

- exact repository commits,
- protocol version,
- contract version,
- execution receipt,
- timestamp,
- result,
- timeout and degraded-state behavior.

---

## ADR change policy

An accepted ADR may only be changed by:

1. creating a new ADR,
2. marking the old ADR as `SUPERSEDED`,
3. recording the replacement identifier,
4. updating impacted architecture documents,
5. passing architecture validation and relevant tests,
6. obtaining owner approval when the change affects canon.

Silent architectural drift is forbidden.

---

## Current status

```text
ADR BASELINE: DRAFT
CORE DECISIONS: RECORDED
CANON ALIGNMENT: REQUIRED
IMPLEMENTATION ENFORCEMENT: PARTIAL
STABLE REFERENCE: NOT YET LOCKED
```
