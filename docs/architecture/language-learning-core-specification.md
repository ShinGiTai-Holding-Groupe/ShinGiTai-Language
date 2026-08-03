# ShinGiTai Language Learning Core Specification

**Version:** 0.1-draft  
**Status:** WORKING ARCHITECTURE REFERENCE  
**Owner:** ShinGiTai Holding Groupe  
**Canonical source:** `docs/architecture/kanon1.txt`

## 0. Purpose

This document defines the behavioral model of Learning Core. It complements the architecture, domain, command/query and event catalogs.

Learning Core owns educational truth. It does not own Hikari Identity, teacher personality, provider execution or physical inference.

## 1. Canonical learning cycle

```text
DISCOVER
→ LEARN
→ PRACTICE
→ PRODUCE EVIDENCE
→ ASSESS
→ TRANSITION OR REMEDIATE
→ REVIEW
→ RETAIN
→ PROJECT MASTERY
```

No consequential progress mutation may bypass Learning Evidence.

Forbidden shortcut:

```text
answer → mastery
```

Required path:

```text
answer
→ attempt
→ evidence
→ validation
→ competency update
→ mastery projection
```

## 2. Learning Evidence lifecycle

```text
PROPOSED
→ PENDING_VALIDATION
→ VALIDATED
```

Alternative states:

```text
REJECTED
DISPUTED
SUPERSEDED
REVOKED
```

Rules:

- deterministic evidence may validate synchronously,
- AI-assisted evidence must remain auditable,
- correction creates a superseding record,
- historical evidence is immutable,
- provider, physical model, node and GPU data are excluded from educational state,
- execution provenance is retained through receipt, request and trace identifiers.

## 3. Competency lifecycle

Canonical competency states:

```text
UNKNOWN
INTRODUCED
PRACTICED
SUPPORTED
VERIFIED
STABLE
MASTERED
```

Decay path:

```text
MASTERED
→ DECAYING
→ REVIEW_REQUIRED
→ RESTORED
```

A competency may be stronger in one modality than another. The stored source state must remain multidimensional.

## 4. Vocabulary lifecycle

Vocabulary state is derived from validated evidence across dimensions:

- recognition,
- recall,
- listening,
- production,
- pronunciation,
- orthography,
- contextual use.

Typical lifecycle:

```text
NEW
→ LEARNING
→ PRACTICING
→ VERIFIED
→ STABLE
→ MASTERED
```

Decay and recovery:

```text
MASTERED
→ DECAYING
→ REVIEW
→ RESTORED
```

Recognition alone must never prove productive mastery.

## 5. Grammar lifecycle

Grammar requires separate evidence for understanding and production.

```text
INTRODUCED
→ UNDERSTOOD
→ GUIDED_USAGE
→ INDEPENDENT_USAGE
→ VERIFIED
→ MASTERED
```

Stored dimensions:

- recognition,
- controlled production,
- free production,
- conversation transfer,
- retention.

## 6. Lesson lifecycle

```text
NOT_STARTED
→ IN_PROGRESS
→ PAUSED
→ IN_PROGRESS
→ COMPLETED
```

Alternative terminal states:

```text
FAILED
ABANDONED
REQUIRES_REVIEW
```

Rules:

- lesson attempts are pinned to content and release versions,
- checkpoints are resumable,
- stale client state cannot overwrite newer server state,
- lesson completion does not itself cause promotion,
- retry creates a new attempt and preserves the historical attempt.

## 7. Activity lifecycle

```text
AVAILABLE
→ STARTED
→ ANSWER_SUBMITTED
→ EVALUATION_PENDING
→ COMPLETED
```

Alternative states:

```text
SKIPPED
ABANDONED
REVIEW_REQUIRED
```

Hint usage, response time, input modality and accommodation status must be preserved for evidence generation.

## 8. Assessment lifecycle

```text
REQUESTED
→ EVIDENCE_SELECTED
→ EVIDENCE_VALIDATED
→ RUBRIC_EVALUATED
→ DECISION_ISSUED
```

Decision values:

```text
PASS
FAIL
INCOMPLETE
REVIEW_REQUIRED
```

Assessment Engine:

- evaluates validated evidence,
- applies a versioned rubric,
- issues an immutable decision,
- identifies satisfied and unsatisfied requirements,
- never unlocks a module or level.

## 9. Promotion lifecycle

```text
AssessmentDecision
→ Promotion Engine
→ transition or remediation
```

Promotion Engine:

- accepts only approved current decisions,
- applies versioned unlock policy,
- records the transition,
- creates remediation when required,
- cannot change the assessment result.

## 10. Review lifecycle

```text
validated evidence
→ review scheduling
→ review activity
→ new evidence
→ retention update
→ next review
```

Review is not a checkbox. Every review must be capable of producing new Learning Evidence.

## 11. Mastery computation

Mastery is a projection derived from evidence, not a manually set flag.

```text
validated evidence
→ evidence weighting
→ temporal weighting
→ modality aggregation
→ competency evaluation
→ mastery projection
```

The policy must account for:

- evidence type,
- modality,
- recency,
- hint use,
- confidence,
- transfer to new context,
- retention after delay,
- accessibility measurement status.

## 12. Accessibility and honest measurement

Allowed measurement statuses:

```text
ASSESSED
ACCOMMODATED
NOT_ASSESSED
NOT_APPLICABLE
INSUFFICIENT_EVIDENCE
```

Accommodation must never fabricate mastery in an unmeasured modality.

Example:

```text
speaking_measurement = ACCOMMODATED
speaking_mastery = NOT_DERIVED
```

## 13. Daily learning loop

```text
open Language
→ load canonical learner state
→ prepare review debt and goals
→ Hikari proposes session plan
→ learner selects full or quick mode
→ activities produce evidence
→ assessment updates learning state
→ review schedule is recalculated
→ Hikari summarizes and recommends next action
```

## 14. Quick Learning behavior

Quick Learning may use:

- flashcards,
- matching,
- memory,
- dictation,
- listening,
- sentence building,
- kana/kanji practice,
- pronunciation,
- short conversation challenge.

All Quick Learning modes must write evidence to the same Learning Core. They must not maintain a separate gamified truth source.

## 15. External framework projection

Internal Competency Graph is authoritative.

External mappings are versioned projections:

- CEFR,
- JLPT,
- HSK,
- TOPIK,
- ACTFL,
- course-specific levels.

An external level must not claim competence in an unmeasured channel.

## 16. Synchronization behavior

Backend Language owns canonical synchronized learning state.

Client owns:

- local projection,
- pending offline events,
- checkpoints,
- synchronization cursor.

Offline lifecycle:

```text
LOCAL_PENDING
→ SUBMITTED
→ ACCEPTED
→ APPLIED
```

Failure outcomes:

```text
CONFLICTED
REJECTED
QUARANTINED
```

Client clock is never authoritative.

## 17. Early Vertical E2E behavioral slice

```text
Minimal Course
→ one Lesson
→ one Exercise
→ user answer
→ Learning Evidence
→ evidence validation
→ AssessmentDecision
→ Language Application Service
→ Hikari Teacher Runtime
→ OdynAI
→ RuntimePort
→ Shinrei
→ real model
→ semantic AI result
→ Human Interaction Layer
→ Conversation Quality Gate
→ Hikari feedback
```

The slice must verify both deterministic educational truth and physical AI execution.

## 18. Core invariants

1. Every consequential progress mutation derives from versioned Learning Evidence.
2. Assessment Engine decides; Promotion Engine applies.
3. Hikari does not directly mutate educational truth.
4. UI does not own scoring, mastery, promotion or review policy.
5. Published content is immutable.
6. Historical attempts, evidence and decisions are preserved.
7. Backend Language owns canonical synchronized state.
8. Accessibility accommodation does not create false mastery.
9. AI output is an observation until validated.
10. Deterministic evaluation is preferred where sufficient.

## 19. Validation requirements

Before this specification can become stable:

- architecture validation,
- typecheck,
- domain tests,
- persistence tests,
- synchronization tests,
- assessment/promotion contract tests,
- Early Vertical E2E plan review,
- cross-repository compatibility confirmation,
- owner acceptance.
