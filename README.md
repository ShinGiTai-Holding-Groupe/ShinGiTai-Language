# ShinGiTai Language

Status: Product foundation / active repair  
Owner: ShinGiTai Holding Groupe  
Product area: ArticSakuraTech

## Product definition

ShinGiTai Language is an AI Teacher Platform led by Hikari.

It is not a conventional language-learning application with a chatbot attached. Language owns the educational system, Learning Evidence, progress, assessment, course state and durable pedagogical relationship state. Hikari is the central teacher-facing experience that uses those systems to guide the learner.

The target experience is:

> I am going to study with Hikari.

## Canonical architecture

```text
Language
→ OdynAI
→ RuntimePort
→ Shinrei
→ provider / model
```

Language must not call physical providers, models, Ollama, Shinrei or provider-compatible gateways directly.

Language uses an application-facing OdynAI port. RuntimePort is the stable execution boundary between OdynAI and Shinrei. Shinrei is the single owner of providers, physical models and inference execution.

## Single canonical product document

The sole governing product and architecture canon for ShinGiTai Language is:

[`docs/architecture/kanon1.txt`](docs/architecture/kanon1.txt)

Its current status is `REVIEWED / NOT YET LOCKED`. It becomes locked only after the gates defined inside that document are satisfied.

`docs/architecture/language-learning-core-canonical.md` is historical and superseded. It must not be used as an implementation source.

All other architecture documents are supporting working references. They may elaborate the canon but cannot override it.

## Canonical bounded contexts

```text
ShinGiTai Language
├── Learning Core
├── Hikari Teacher Runtime
├── Hikari Human Interaction Layer
├── Application Services
├── Persistence / Synchronization
├── Content System
└── UI
```

### Ownership summary

- **OdynAI owns:** global Hikari Identity Core, ecosystem-wide identity continuity, global AI access and memory projection policy, product-independent Hikari behavior constraints.
- **Language owns:** Hikari Teacher Policy, pedagogical relationship state, Session Planner, Lesson Orchestrator, Exam Runtime, Language Human Interaction Layer and Spoken Response Realizer.
- **Learning Core owns:** educational truth, Learning Evidence, assessment, mastery, progress and course state.
- **RuntimePort owns:** the versioned OdynAI–Shinrei execution contract.
- **Shinrei owns:** providers, physical models, runtime capabilities and physical inference execution.

## Core invariants

- Assessment Engine evaluates evidence and issues a signed/versioned `AssessmentDecision`.
- Promotion Engine may only apply an approved decision; it cannot alter the assessment result.
- AI output is a proposal or observation until validated by domain policy.
- Published educational content and issued evidence/decisions are immutable; corrections supersede rather than overwrite.
- Backend Language owns canonical synchronized learning state.
- Client clocks are never authoritative for canonical ordering.
- Learner-owned records and operations require explicit tenant and user scope.
- Accessibility accommodations never manufacture mastery in an unmeasured channel.
- Deterministic behavior is preferred whenever AI is not pedagogically necessary.

## Early Vertical E2E reference slice

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
→ semantic AI result
→ Hikari Human Interaction Layer
→ Conversation Quality Gate
→ Hikari feedback
```

The slice is not considered complete until exact Language, OdynAI and Shinrei SHAs, protocol/contract versions, execution receipt, trace evidence and degraded-path results are recorded.

## Current repair status

PR #13 remains draft and must not be merged while `LANG-AUDIT-023 — Atoms 16–22 Consolidated Repair` is open.

Current priorities:

1. consolidate the canon and supersede stale references;
2. remove or quarantine direct-provider residue;
3. replace Language-owned RuntimePort terminology with an OdynAI application port;
4. enforce tenant-aware contracts and payload-aware idempotency;
5. repair synchronization so server revision is authoritative;
6. typecheck tests and strengthen architecture validation;
7. consolidate machine-readable commands, events, states and errors;
8. complete final foundation audit;
9. execute Early Vertical E2E.

CI green is not equivalent to merge-safe until these gates are enforced.
