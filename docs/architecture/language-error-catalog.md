# ShinGiTai Language Error Catalog

**Version:** 0.1-draft  
**Status:** WORKING ARCHITECTURE REFERENCE

## 0. Purpose

Provide stable, non-overlapping error identities for domain, application, synchronization, content and AI-boundary failures.

## 1. Format

```text
LANG-<AREA>-<NUMBER>
```

Each error defines:

- code,
- canonical name,
- owner,
- retryability,
- learner visibility,
- HTTP/transport mapping later,
- audit requirement,
- safe message guidance.

## 2. Course and content

| Code | Name | Retryable | Meaning |
|---|---|---:|---|
| LANG-CRS-001 | CourseNotFound | No | course identifier unavailable |
| LANG-CRS-002 | CourseReleaseUnavailable | Later | requested immutable release unavailable |
| LANG-CRS-003 | ContentVersionMismatch | No | attempt references incompatible content version |
| LANG-CRS-004 | CourseMigrationRequired | No | enrollment requires explicit migration decision |
| LANG-CRS-005 | PublishedContentMutationForbidden | No | update-in-place attempted on published content |

## 3. Enrollment and lesson

| Code | Name | Retryable | Meaning |
|---|---|---:|---|
| LANG-LSN-001 | EnrollmentNotActive | No | lesson cannot start for inactive enrollment |
| LANG-LSN-002 | LessonLocked | No | prerequisites or promotion state not satisfied |
| LANG-LSN-003 | LessonAttemptNotFound | No | attempt unavailable in tenant scope |
| LANG-LSN-004 | LessonAttemptAlreadyTerminal | No | mutation attempted after completion/abandonment |
| LANG-LSN-005 | LessonCheckpointConflict | Yes | expected aggregate version stale |
| LANG-LSN-006 | RequiredActivityIncomplete | No | lesson completion guard failed |

## 4. Activity and answer

| Code | Name | Retryable | Meaning |
|---|---|---:|---|
| LANG-ACT-001 | ActivityAttemptNotFound | No | attempt unavailable |
| LANG-ACT-002 | DuplicateAnswerSubmission | Idempotent | same client submission already accepted |
| LANG-ACT-003 | AnswerMutationForbidden | No | accepted answer cannot be overwritten |
| LANG-ACT-004 | UnsupportedInputModality | No | activity does not support submitted modality |
| LANG-ACT-005 | AccessibilityPolicyMissing | No | required accommodation lacks policy |

## 5. Learning Evidence

| Code | Name | Retryable | Meaning |
|---|---|---:|---|
| LANG-EVD-001 | EvidenceNotFound | No | evidence unavailable |
| LANG-EVD-002 | EvidenceValidationRequired | Later | evidence not eligible for mastery/assessment |
| LANG-EVD-003 | EvidenceStatusConflict | No | invalid lifecycle transition |
| LANG-EVD-004 | EvidenceProvenanceIncomplete | Yes | required receipt/version metadata missing |
| LANG-EVD-005 | EvidenceDisputed | No | evidence awaiting resolution |
| LANG-EVD-006 | EvidenceSuperseded | No | stale evidence cannot be applied |
| LANG-EVD-007 | PhysicalExecutionLeakForbidden | No | provider/model/node/GPU field detected |

## 6. Assessment

| Code | Name | Retryable | Meaning |
|---|---|---:|---|
| LANG-ASM-001 | AssessmentEvidenceInsufficient | Later | decision cannot be completed |
| LANG-ASM-002 | AssessmentRubricUnavailable | Later | pinned rubric missing |
| LANG-ASM-003 | AssessmentAlreadyIssued | No | issued decision immutable |
| LANG-ASM-004 | AssessmentRequiresReview | No | human or additional validation required |
| LANG-ASM-005 | AssessmentDecisionSuperseded | No | decision no longer current |
| LANG-ASM-006 | UnmeasuredCapabilityProjectionForbidden | No | external level would claim unmeasured skill |

## 7. Promotion and remediation

| Code | Name | Retryable | Meaning |
|---|---|---:|---|
| LANG-PRM-001 | PromotionDecisionInvalid | No | assessment not eligible/current |
| LANG-PRM-002 | PromotionDenied | No | rules do not permit transition |
| LANG-PRM-003 | PromotionAlreadyApplied | Idempotent | transition previously applied |
| LANG-PRM-004 | RemediationRequired | No | learner must complete remediation |
| LANG-PRM-005 | RemediationNotComplete | No | reassessment eligibility unavailable |

## 8. Synchronization

| Code | Name | Retryable | Meaning |
|---|---|---:|---|
| LANG-SYN-001 | StaleAggregateVersion | Yes | optimistic concurrency conflict |
| LANG-SYN-002 | TenantMismatch | No | ownership boundary violation |
| LANG-SYN-003 | UnsupportedEventSchema | Later | event quarantined |
| LANG-SYN-004 | SynchronizationCursorInvalid | Yes | cursor reset/rebuild required |
| LANG-SYN-005 | DependencyNotAccepted | Later | prior event must be accepted first |
| LANG-SYN-006 | EventQuarantined | Later | manual or migration processing needed |
| LANG-SYN-007 | ServerRevisionGap | Yes | client must fetch missing delta |

## 9. Hikari and AI boundary

| Code | Name | Retryable | Meaning |
|---|---|---:|---|
| LANG-AI-001 | AiCapabilityUnavailable | Yes | requested capability unavailable |
| LANG-AI-002 | AiExecutionTimeout | Yes | execution exceeded budget |
| LANG-AI-003 | AiContractMismatch | No | unsupported contract version |
| LANG-AI-004 | AiResultInvalid | Yes | semantic result failed validation |
| LANG-AI-005 | AiPolicyDenied | No | OdynAI denied request |
| LANG-AI-006 | ExecutionReceiptMissing | Yes | auditable receipt absent |
| LANG-AI-007 | ConversationQualityRejected | Yes | response failed quality gate |
| LANG-AI-008 | HikariIdentityContractMissing | No | global identity context unavailable |
| LANG-AI-009 | TeacherResponseDegraded | Yes | deterministic fallback used |

## 10. Security and privacy

| Code | Name | Retryable | Meaning |
|---|---|---:|---|
| LANG-SEC-001 | UnauthorizedActor | No | actor cannot perform command |
| LANG-SEC-002 | CrossTenantAccessDenied | No | tenant boundary rejected |
| LANG-SEC-003 | ConsentScopeMissing | No | media/memory operation lacks consent |
| LANG-SEC-004 | RetentionPolicyViolation | No | data retention action forbidden |
| LANG-SEC-005 | AuditRecordRequired | No | privileged operation lacks audit context |

## 11. Safe presentation

Learner-facing messages must not expose:

- stack traces,
- provider names,
- model/node/GPU identity,
- tenant internals,
- raw policy rules,
- other user identifiers.

A safe response separates:

```text
error_code
user_message
operator_detail
retryable
correlation_id
```

## 12. Status

```text
ERROR NAMESPACE: DEFINED
BASELINE CATALOG: DEFINED
TRANSPORT MAPPINGS: NOT YET LOCKED
LOCALIZATION: NOT YET IMPLEMENTED
OBSERVABILITY INTEGRATION: NOT YET BUILT
```