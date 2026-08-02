# ShinGiTai Language

Status: Product foundation / active development  
Owner: ShinGiTai Holding Groupe  
Product area: ArticSakuraTech

## Product definition

ShinGiTai Language is an AI Teacher Platform led by Hikari.

It is not a conventional language-learning application with a chatbot attached. Language owns the educational system, evidence, progress, assessment, content and pedagogical memory. Hikari is the central teacher-facing experience that uses those systems to guide the learner.

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

Language must not call physical providers, models, Ollama or Shinrei directly.

Shinrei is the single AI execution runtime. Learning Core is a deterministic domain system inside Language, not a separate AI engine.

## Canonical product document

The authoritative product, Learning Core, Hikari, evidence, assessment, memory, synchronization, accessibility, content and implementation rules are defined in:

[`docs/architecture/language-learning-core-canonical.md`](docs/architecture/language-learning-core-canonical.md)

That document is canonical and governs new architecture and product decisions.

## Product components

```text
ShinGiTai Language
├── Learning Core
│   ├── Course and Curriculum
│   ├── Lesson Runtime
│   ├── Exercise Engine
│   ├── Learning Evidence
│   ├── Assessment and Promotion
│   ├── Vocabulary and SRS
│   ├── Grammar
│   ├── Learning Graph
│   ├── Progress and Mastery
│   ├── Pedagogical Memory
│   ├── Persistence
│   └── Synchronization
├── Hikari Teacher Runtime
├── Content System
├── Quick Learning
└── Learning Experience UI
```

## Core rules

- Language owns durable pedagogical memory and educational truth.
- OdynAI owns AI-access policy and approved context projection.
- Shinrei owns providers, models and inference and stores no durable student memory.
- Model output is evidence or a proposal requiring validation, not automatic truth.
- Progress and promotion must derive from versioned Learning Evidence.
- Published educational content is immutable; corrections create new versions.
- CEFR, JLPT, HSK, TOPIK and similar levels are projections of an internal competency graph.
- Student records always require explicit `user_id` and `tenant_partition` ownership.
- Deterministic functionality works without AI wherever AI is not pedagogically necessary.
- Accessibility is a product and assessment invariant.

## Implementation order

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

The early E2E reference slice is mandatory:

```text
Minimal Course
→ Lesson
→ Exercise
→ Learning Evidence
→ Assessment
→ Hikari feedback
→ Language
→ OdynAI
→ RuntimePort
→ Shinrei
→ real model
```

## Current technical status

The repository contains a working Language-to-OdynAI tutor-chat boundary and the Atoms 16–22 domain foundation for engagement, entitlements, governance, observability, synchronization, accessibility and architecture.

The product remains incomplete. Learning Core, production persistence, evidence-based assessment, full Hikari Teacher Runtime, complete content and full product E2E still require implementation and validation.

No external launch, investor claim or production-readiness statement should represent the complete Language product as finished until the final product-readiness audit passes.
