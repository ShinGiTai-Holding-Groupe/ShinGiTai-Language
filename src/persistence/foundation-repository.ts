import type { AssessmentDecision } from "../domains/assessment";
import type { LearningEvidenceRecord } from "../domains/learning-evidence";
import type { LearningTransition } from "../domains/promotion";
import { assertSameTenant, assertTenant, type TenantContext } from "../domains/shared";

export interface FoundationPersistencePort {
  saveEvidence(value: LearningEvidenceRecord, tenant: TenantContext): Promise<void>;
  saveDecision(value: AssessmentDecision, tenant: TenantContext): Promise<void>;
  saveTransition(value: LearningTransition, tenant: TenantContext): Promise<void>;
  loadEvidence(id: string, tenant: TenantContext): Promise<LearningEvidenceRecord | undefined>;
  loadDecision(id: string, tenant: TenantContext): Promise<AssessmentDecision | undefined>;
  loadTransition(id: string, tenant: TenantContext): Promise<LearningTransition | undefined>;
}

export class InMemoryFoundationRepository implements FoundationPersistencePort {
  private readonly evidence = new Map<string, LearningEvidenceRecord>();
  private readonly decisions = new Map<string, AssessmentDecision>();
  private readonly transitions = new Map<string, LearningTransition>();
  private key(id: string, tenant: TenantContext) {
    assertTenant(tenant);
    return `${tenant.tenantPartition}:${tenant.userId}:${tenant.organizationId ?? ""}:${id}`;
  }
  async saveEvidence(value: LearningEvidenceRecord, tenant: TenantContext) {
    assertSameTenant(tenant, value);
    this.evidence.set(this.key(value.evidenceId, tenant), value);
  }
  async saveDecision(value: AssessmentDecision, tenant: TenantContext) {
    assertSameTenant(tenant, value);
    this.decisions.set(this.key(value.assessmentDecisionId, tenant), value);
  }
  async saveTransition(value: LearningTransition, tenant: TenantContext) {
    assertSameTenant(tenant, value);
    this.transitions.set(this.key(value.transitionId, tenant), value);
  }
  async loadEvidence(id: string, tenant: TenantContext) {
    return this.evidence.get(this.key(id, tenant));
  }
  async loadDecision(id: string, tenant: TenantContext) {
    return this.decisions.get(this.key(id, tenant));
  }
  async loadTransition(id: string, tenant: TenantContext) {
    return this.transitions.get(this.key(id, tenant));
  }
}
