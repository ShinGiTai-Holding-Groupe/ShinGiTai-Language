export {
  createAuditLogEntry,
  appendAuditEntry,
} from "./audit-log";
export {
  evaluateConsentRequirements,
  withdrawConsent,
} from "./consent-policy";
export {
  calculateExpiry,
  decideRetention,
  type RetentionDecision,
} from "./retention-policy";
export type {
  AuditActorType,
  AuditLogEntry,
  ConsentRecord,
  ConsentRequirement,
  ConsentSource,
  ConsentType,
  DataClassification,
  GovernedRecord,
  ProcessingDecision,
  RetentionPolicy,
} from "./types";
