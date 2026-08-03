# ShinGiTai Language Early Vertical E2E Plan

**Version:** 0.1-draft  
**Status:** REVIEW CANDIDATE

## 0. Objective

Prove the minimum real path from educational interaction to real model feedback without bypassing any architectural boundary.

## 1. Canonical slice

```text
Minimal Course
-> one Lesson
-> one Exercise
-> user answer
-> Learning Evidence
-> AssessmentDecision
-> Language Application Service
-> Hikari Teacher Runtime
-> Pre-generation Interaction Policy
-> OdynAI
-> RuntimePort
-> Shinrei
-> real model
-> semantic AI result
-> Post-generation Response Realizer
-> Conversation Quality Gate
-> Hikari feedback
```

## 2. Minimal fixture

Course:

```text
course_id: e2e-language-course
release_id: e2e-release-1
module_id: greetings
lesson_id: greeting-001
activity_id: greeting-choice-001
```

Exercise: deterministic single-choice or short exact answer.

Expected educational result:

- accepted answer,
- validated deterministic evidence,
- issued `AssessmentDecision`,
- no automatic level promotion required,
- teacher feedback generated from the decision.

## 3. Required Language components

- immutable minimal CourseRelease,
- LearnerCourseEnrollment,
- LessonAttempt,
- ActivityAttempt,
- answer submission,
- LearningEvidenceRecord,
- AssessmentDecision,
- application orchestration,
- Hikari Teacher Runtime context builder,
- pre-generation interaction policy,
- post-generation response realizer,
- quality gate,
- diagnostic UI or CLI.

## 4. Required cross-repository contracts

OdynAI must accept an application capability request containing:

```text
request_id
trace_id
user/tenant context
capability
contract_version
semantic teacher context
interaction constraints
```

RuntimePort must preserve a versioned execution boundary.

Shinrei must physically execute the selected provider/model and return an auditable execution receipt without requiring Language to know provider identity.

## 5. Success criteria

- no direct Language-to-Shinrei call,
- no provider/model identity in educational state,
- evidence exists before assessment,
- AssessmentDecision exists before teacher feedback request,
- semantic model result passes through post-generation realization,
- quality gate returns `READY` or documented degraded state,
- all IDs correlate through request, trace and execution receipt,
- exact repository SHAs and contract versions recorded,
- tenant isolation proven,
- deterministic educational path works even when AI feedback is unavailable.

## 6. Negative scenarios

1. OdynAI unavailable.
2. RuntimePort contract mismatch.
3. Shinrei timeout.
4. malformed semantic result.
5. quality gate rejection.
6. duplicate answer submission.
7. stale aggregate version.
8. cross-tenant request.
9. execution succeeds but response acknowledgment is lost.
10. AI unavailable after AssessmentDecision.

Expected principle:

```text
AI feedback failure must not corrupt validated educational truth.
```

## 7. Degraded behavior

When AI feedback is unavailable, Language returns deterministic feedback based on AssessmentDecision:

```text
status: DEGRADED
assessment_result: preserved
retry_allowed: true
educational_state: committed
```

## 8. Evidence bundle

The test run must record:

```text
language_commit_sha
odynai_commit_sha
shinrei_commit_sha
runtimeport_contract_version
odynai_capability_contract_version
course_release_id
lesson_attempt_id
activity_attempt_id
evidence_id
assessment_decision_id
request_id
trace_id
execution_receipt_id
quality_gate_result
final_feedback_status
started_at
completed_at
```

## 9. Validation sequence

```text
architecture validation
typecheck
foundation lint
foundation tests
production build
Language deterministic slice test
OdynAI contract test
RuntimePort compatibility test
Shinrei health and execution test
full E2E happy path
negative/degraded path tests
artifact review
owner acceptance
```

## 10. Lock criteria

The Architecture Book and `kanon1` may only advance toward stable/locked reference when:

- this plan is owner-approved,
- exact cross-repository contract versions are confirmed,
- the reference slice executes successfully,
- failure behavior is demonstrated,
- results are committed or attached as auditable artifacts.

## 11. Status

```text
E2E PLAN: READY FOR REVIEW
EXECUTION: NOT YET PERFORMED
CROSS-REPO VERSIONS: NOT YET PINNED
OWNER ACCEPTANCE: PENDING
```