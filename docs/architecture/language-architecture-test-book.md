# ShinGiTai Language Architecture Test Book

**Version:** 0.1-draft  
**Status:** WORKING ARCHITECTURE REFERENCE

## 0. Purpose

This book converts canon, ADRs, invariants, aggregate boundaries and state machines into executable validation targets.

## 1. Test layers

```text
static architecture tests
contract tests
domain invariant tests
persistence tests
synchronization tests
cross-repository compatibility tests
Early Vertical E2E
```

## 2. Static architecture tests

Required checks:

- Language contains no physical provider implementation.
- Language contains no Ollama, vLLM or model-specific direct client.
- Learning Core does not import Hikari Identity implementation.
- Hikari Teacher Runtime does not mutate Learning Core repositories directly.
- UI does not import persistence adapters or domain mutation internals.
- RuntimePort types are consumed only through the application integration boundary.
- provider, node, GPU and physical model fields are absent from educational domain entities.

## 3. Ownership tests

- only Assessment Engine creates `AssessmentDecision`.
- only Promotion Engine creates `LearningTransition`.
- Promotion Engine cannot modify an assessment result.
- only Language backend assigns accepted `server_revision`.
- only OdynAI supplies global Hikari Identity context.

## 4. Domain invariant tests

Critical cases:

- unvalidated evidence cannot change mastery.
- rejected, revoked or superseded evidence is excluded from current assessment.
- an accommodation cannot produce mastery for an unmeasured channel.
- a published content version cannot be edited in place.
- a completed historical attempt remains tied to its original release.
- Hikari feedback cannot create promotion.
- review completion creates new evidence.

## 5. State-machine tests

For each aggregate:

- allowed transitions succeed,
- forbidden transitions fail without mutation,
- stale aggregate versions conflict,
- replay is idempotent,
- terminal states remain immutable,
- required domain events are emitted once.

## 6. Persistence tests

- aggregate and event write are atomic.
- outbox entry is committed with domain mutation.
- projection rebuild from accepted events is deterministic.
- snapshot restore equals full replay state.
- tenant partition appears in every learner-owned record and index.
- immutable records reject update-in-place.

## 7. Synchronization tests

- offline event lifecycle follows defined states.
- client timestamp never determines canonical ordering.
- duplicate idempotency keys do not duplicate effects.
- stale cursor receives deterministic delta.
- conflicts are quarantined or resolved explicitly.
- cross-tenant event submission is rejected.
- local projection can be rebuilt from server delta.

## 8. AI boundary contract tests

Language must test against an OdynAI application contract stub and a real cross-repository environment.

Required assertions:

- capability request contains no provider identity.
- request carries contract version, request ID and trace ID.
- response returns an execution receipt.
- timeout, unavailable capability and malformed semantic result are handled.
- physical execution details remain outside educational state.
- pre-generation policy executes before request projection.
- response realization and quality gate execute after semantic result.

## 9. Assessment tests

- PASS, FAIL, INCOMPLETE and REVIEW_REQUIRED.
- missing evidence handling.
- accessibility measurement statuses.
- rubric version pinning.
- decision immutability.
- superseding decision chain.
- no direct unlock side effect.

## 10. Promotion tests

- only valid current PASS decisions can unlock.
- FAIL creates remediation where policy requires.
- INCOMPLETE cannot unlock.
- duplicate application is idempotent.
- superseded assessment is rejected.
- promotion cannot rewrite evidence or assessment.

## 11. Hikari tests

- global Hikari Identity is consumed, not recreated.
- teacher policy remains Language-owned.
- session planner reads projections only.
- teacher response has semantic consistency between display and spoken text.
- quality gate rejects artificial praise, markdown speech and repetitive endings.
- degraded response still preserves truthful assessment meaning.

## 12. Early Vertical E2E gate

The reference test must prove:

```text
course -> lesson -> exercise -> answer -> evidence -> assessment
-> application service -> teacher runtime -> OdynAI -> RuntimePort
-> Shinrei -> real model -> semantic result -> response realizer
-> quality gate -> feedback
```

Recorded evidence:

- exact Language SHA,
- OdynAI SHA,
- Shinrei SHA,
- protocol and contract versions,
- request and trace IDs,
- execution receipt,
- assessment decision ID,
- final response status,
- timestamp.

## 13. CI gates

Minimum branch gate:

```text
architecture validation
typecheck
foundation lint
foundation tests
production build
contract tests when dependencies are available
```

No document may be marked stable solely because markdown exists. Stable status requires implementation-backed validation.

## 14. Status

```text
TEST ARCHITECTURE: DEFINED
AUTOMATION TARGETS: DEFINED
CI IMPLEMENTATION: PARTIAL / FUTURE
E2E EXECUTION: NOT YET COMPLETED
STABLE REFERENCE: NOT YET LOCKED
```