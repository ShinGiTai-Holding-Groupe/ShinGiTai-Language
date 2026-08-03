# ShinGiTai Language Cross-Repository Contract Matrix

**Version:** 0.1-draft  
**Status:** WORKING ARCHITECTURE REFERENCE

## 0. Purpose

Define the contracts Language depends on outside its repository without leaking execution-plane ownership into the product domain.

## 1. Boundary matrix

| Boundary | Language responsibility | External responsibility | Version required | Evidence |
|---|---|---|---|---|
| Language -> OdynAI | request product capability and provide authorized context | own/enforce product AI policy, global Hikari Identity, orchestration | capability contract | contract test |
| OdynAI -> RuntimePort | none directly; consumes projected result | project application request into stable execution contract | RuntimePort contract | compatibility test |
| RuntimePort -> Shinrei | no physical execution knowledge | stable boundary plus runtime-side implementation | protocol version | runtime contract test |
| Shinrei -> provider/model | no ownership or visibility required | provider routing, model selection, inference, health | internal runtime release | execution receipt |

## 2. Language-to-OdynAI request contract

Required logical fields:

```text
request_id
trace_id
user_id
tenant_partition
organization_id, optional
application = LANGUAGE
capability
capability_contract_version
hikari_identity_reference
pedagogical_context_projection
semantic_task
interaction_constraints
privacy_scope
timeout_budget
```

Forbidden:

```text
provider
physical_model
node
GPU
provider_endpoint
provider_credentials
```

## 3. OdynAI response contract

Required logical fields:

```text
request_id
trace_id
execution_receipt_id
capability_contract_version
result_status
semantic_result
usage_projection, policy-controlled
error_category, optional
retryability
```

The execution receipt enables technical audit without putting physical runtime details into Language educational state.

## 4. RuntimePort contract expectations

RuntimePort:

- defines and version-controls the stable execution boundary,
- validates contract shape,
- carries capability and trace metadata,
- does not own Language product policy,
- does not own provider selection,
- does not own educational concepts.

Compatibility dimensions:

```text
request schema
response schema
streaming behavior
timeout semantics
cancellation semantics
error taxonomy
receipt propagation
capability declaration
```

## 5. Shinrei runtime expectations

Shinrei:

- implements runtime side of RuntimePort,
- owns providers and physical models,
- physically executes inference,
- emits health and execution receipts,
- does not store durable learner memory,
- does not understand course, lesson, mastery or promotion.

## 6. Hikari Identity boundary

OdynAI owns global Hikari Identity Core.

Language owns only:

- Hikari Teacher Policy,
- pedagogical relationship state,
- session planning,
- educational interaction realization.

Contract test must prove Language consumes identity reference/constraints and does not define a divergent global identity.

## 7. Version pinning record

Every accepted E2E run records:

```text
language_commit_sha
odynai_commit_sha
runtimeport_contract_version
shinrei_commit_sha
odynai_capability_contract_version
hikari_identity_contract_version
```

A green local build is not cross-repository compatibility evidence.

## 8. Compatibility policy

- additive backward-compatible fields require schema-version rules,
- breaking change requires new major contract version,
- Language must reject unsupported major versions,
- temporary compatibility adapters belong at integration boundaries, not in Learning Core,
- deprecated versions require migration deadline and test coverage.

## 9. Failure mapping

External failures are mapped into Language-safe categories:

```text
AI_CAPABILITY_UNAVAILABLE
AI_EXECUTION_TIMEOUT
AI_CONTRACT_MISMATCH
AI_RESULT_INVALID
AI_EXECUTION_CANCELLED
AI_POLICY_DENIED
AI_DEGRADED_RESULT
```

Physical provider errors are not copied directly into learner-facing or educational domain state.

## 10. Required cross-repository tests

- supported contract happy path,
- unsupported major version,
- missing execution receipt,
- timeout and cancellation,
- malformed semantic result,
- policy denial,
- capability unavailable,
- trace propagation,
- tenant context propagation,
- provider identity non-leakage,
- global Hikari Identity continuity.

## 11. Current confirmation status

```text
LANGUAGE CONTRACT SHAPE: DEFINED
ODYN AI EXACT VERSION: NOT PINNED
RUNTIMEPORT EXACT VERSION: NOT PINNED
SHINREI EXACT VERSION: NOT PINNED
CROSS-REPO EXECUTION: NOT YET CONFIRMED
STABLE REFERENCE: PENDING
```