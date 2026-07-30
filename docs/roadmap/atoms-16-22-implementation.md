# ShinGiTai Language — Atoms 16–22 Implementation Program

Status: active implementation
Branch: `feat/atoms-16-22-foundation`
Base: `main`

## Architectural invariants

1. Language remains the product frontend and application layer.
2. OdynAI is the only application-facing AI entry point.
3. RuntimePort remains the boundary between OdynAI and Shinrei.
4. Shinrei owns providers, models and inference.
5. Product domains do not import physical AI providers.
6. User and organization data must remain isolated by explicit identity context.
7. Analytics observes product state but does not mutate canonical product state.
8. Billing grants feature entitlements; it does not own learning progress.
9. Offline reconciliation preserves meaningful progress and uses idempotent commands.
10. Accessibility, privacy and localization requirements are part of feature acceptance criteria.

## Delivery sequence

### Atom 16 — Engagement

- notification policy and quiet hours
- channel preferences and priority
- consistency score and recovery sessions
- XP ledger, anti-farming rules and achievement grants
- deterministic policy tests

### Atom 17 — Commercial access

- plan-independent entitlement resolver
- usage reservation, commit and release
- subscription lifecycle and grace periods
- organization seats and offline entitlement snapshots
- billing provider port

### Atom 18 — Privacy and security

- consent registry and withdrawal
- data classification and processing context
- retention and deletion policies
- audit events, tenant boundaries and safe logging
- provider data-policy enforcement before OdynAI execution

### Atom 19 — Observability

- product event contracts and schema versions
- trace/request propagation through Language → OdynAI
- operational, learning and AI-cost telemetry
- feature flags, experiment assignment and guardrails
- privacy filtering and small-cohort protection

### Atom 20 — Offline continuity

- local command model and idempotency
- push/pull delta synchronization contracts
- domain-specific conflict resolution
- content manifests, version pinning and entitlement cache
- device revocation and recovery flows

### Atom 21 — Accessibility and localization

- locale profile and fallback chain
- semantic translation keys and content variants
- accessibility preference model
- keyboard, screen-reader, reduced-motion and reflow requirements
- Unicode, IME, RTL and script-aware input contracts

### Atom 22 — Platform boundaries

- explicit domain modules and public exports
- small shared kernel
- application ports for external capabilities
- dependency rules preventing cross-domain infrastructure coupling
- extension contracts and compatibility policy

## Implementation rule

Each atom is delivered through a small, reviewable slice:

1. domain contracts,
2. deterministic policy implementation,
3. unit and boundary tests,
4. application integration,
5. UI integration,
6. migration and rollout controls.

An atom is not considered complete when only its documentation exists. The implementation status must be updated as executable slices land.

## Current slice

The first executable slice establishes Atom 16 engagement policy primitives without coupling them to UI or infrastructure. Subsequent commits will integrate persistence, notification delivery and product surfaces.
