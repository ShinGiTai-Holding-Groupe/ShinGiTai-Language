# LANG-AUDIT-023 — Atoms 16–22 Consolidated Repair

**Status:** ACTIVE / MERGE BLOCKING  
**Branch:** `feat/atoms-16-22-foundation`  
**Audit base:** `b5a7283799778788ecb316df3d2537e22b4925ec`  
**PR:** `#13`  
**Merge decision:** `DO NOT MERGE`

## Scope freeze

Until this repair closes:

- no new product features;
- no new screens;
- no new providers;
- no additional broad architecture books;
- no unrelated refactors;
- no merge of PR #13.

## Accepted foundation

- Hikari as the central teacher experience;
- Learning Core as owner of educational truth;
- separate Assessment and Promotion authority;
- versioned Learning Evidence and immutable published content;
- Hikari Teacher Specification;
- pre/post-inference Human Interaction Layer;
- deterministic-first policies;
- Early Vertical E2E direction.

## Repair atoms

### REPAIR-001 — Canon consolidation

- [x] README points to `kanon1.txt`.
- [x] `language-learning-core-canonical.md` marked `SUPERSEDED / HISTORICAL`.
- [x] `kanon1.txt` is the sole governing canon.
- [ ] stale validation report marked superseded.
- [ ] document status matrix validated.

### REPAIR-002 — AI boundary and architecture gate

- [ ] remove or quarantine direct Lovable/OpenAI-compatible provider path;
- [ ] remove unused production dependency;
- [ ] replace Language-owned `RuntimePort` with `OdynAiApplicationPort`;
- [ ] require tenant context in the application port;
- [ ] make port result a discriminated union;
- [ ] remove nonexistent active module entrypoint or implement the adapter;
- [ ] validate package dependencies, imports, aliases, URLs and entrypoints;
- [ ] add seeded architecture-violation tests.

### REPAIR-003 — TenantContext and idempotency

- [ ] add mandatory `TenantContext` to learner-owned operations;
- [ ] tenant-scope persistence, sync, consent, audit, accessibility, entitlements, usage and telemetry;
- [ ] bind idempotency to tenant, operation and semantic payload hash;
- [ ] return `IDEMPOTENCY_PAYLOAD_CONFLICT` for key reuse with a different payload.

### REPAIR-004 — Synchronization repair

- [ ] remove client-clock last-write-wins for canonical educational state;
- [ ] restrict conflict strategies by data class;
- [ ] tenant-scope delta and batch selection;
- [ ] require trusted devices;
- [ ] replace plain resume token with signed or opaque token;
- [ ] add skew, replay, tampering and cross-tenant tests.

### REPAIR-005 — Domain policy repair

- [ ] Engagement: timezone, DST, unique counting and tests;
- [ ] Entitlements: fail closed, strict timestamps/status, restriction precedence and tenancy;
- [ ] Governance: subject/tenant consent, scope/version policy and audit allowlist;
- [ ] Observability: versioned schemas, property allowlists and strict validation;
- [ ] Accessibility/localization: tenant profile, BCP 47/script-aware fallback and NaN rejection.

### REPAIR-006 — Test and CI hardening

- [ ] add `tsconfig.tests.json`;
- [ ] typecheck test sources;
- [ ] introduce a standard test runner and per-test reporting;
- [ ] add contract consistency tests;
- [ ] add state-enum consistency tests;
- [ ] add tenant-schema checks;
- [ ] establish full-lint baseline and no-regression gate;
- [ ] establish coverage baseline.

### REPAIR-007 — Executable registries

- [ ] establish machine-readable command registry;
- [ ] establish machine-readable event registry;
- [ ] establish machine-readable state registry;
- [ ] establish machine-readable error registry;
- [ ] validate or generate documentation from registries.

### REPAIR-008 — Final foundation audit

- [ ] all blockers closed;
- [ ] all MUST FIX items closed or explicitly waived with owner and expiry;
- [ ] exact-HEAD validation report generated;
- [ ] no direct-provider residue in active source/build;
- [ ] tenant contract tests pass;
- [ ] sync skew tests pass;
- [ ] test typecheck passes;
- [ ] seeded architecture violations fail as expected.

### REPAIR-009 — Early Vertical E2E

- [ ] pin Language SHA;
- [ ] pin OdynAI SHA;
- [ ] pin RuntimePort contract version;
- [ ] pin Shinrei SHA;
- [ ] execute happy path;
- [ ] execute timeout/unavailable/malformed-result degraded paths;
- [ ] retain execution receipt, request ID, trace ID and result evidence.

## Merge gate

PR #13 remains blocked until all blocker and MUST FIX gates are satisfied or explicitly owner-waived with an expiry date. Green CI alone is insufficient.
