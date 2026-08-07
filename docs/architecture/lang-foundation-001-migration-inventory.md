# LANG-FOUNDATION-001 migration inventory

## Migrated from the prior foundation branch

- Sync: server-authoritative command queue, conflict resolution, and sync policy.
- Accessibility: locale, inclusive experience, and assessment-channel policies.
- Architecture: module catalog, dependency policy, cycle detection, and executable source validation.

Only these independently useful areas were migrated. Their implementation was repaired where tenant boundaries or executable validation were incomplete.

## Implemented on this branch

- Canonical `LearningEvidence`, `AssessmentDecision`, `Promotion`, and `PedagogicalMemory` domains.
- Tenant-safe in-memory persistence and a deterministic no-AI application service.
- Public domain entrypoint and behavior-level foundation tests.
- CI validation for source/test type checking, lint, architecture, tests, and build.

## Explicitly excluded or quarantined

- The Hikari Teacher Adapter and all Hikari/OdynAI composition code are outside this mission.
- Direct Lovable/provider execution, the obsolete OdynAI gateway endpoint, raw AI chat output, AI exam generation, flashcard generation, and TTS generation fail closed.
- The prior branch's incomplete domain contracts and its direct provider/gateway paths were not migrated.

## Remaining integration blocker

The product-owned Hikari Teacher Adapter remains intentionally absent. It can be implemented only after a separately accepted canonical integration contract is available; this foundation exposes deterministic domain APIs for that future adapter without embedding AI execution or provider concerns.
