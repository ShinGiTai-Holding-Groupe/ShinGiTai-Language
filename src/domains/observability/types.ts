export type EventDomain =
  | "identity"
  | "learning"
  | "assessment"
  | "hikari"
  | "speaking"
  | "writing"
  | "billing"
  | "notification"
  | "system";

export type ProductEvent = {
  eventId: string;
  eventName: `${EventDomain}.${string}`;
  eventVersion: number;
  schemaVersion: number;
  occurredAt: string;
  source: "frontend" | "backend" | "odynai" | "shinrei" | "worker";
  userIdHash?: string;
  organizationId?: string;
  consentScope?: string;
  idempotencyKey?: string;
  properties: Record<string, unknown>;
};

export type TraceContext = {
  requestId: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
};

export type TraceSpan = TraceContext & {
  name: string;
  component: "frontend" | "backend" | "odynai" | "runtime_port" | "shinrei" | "provider";
  startedAt: string;
  endedAt?: string;
  status: "in_progress" | "ok" | "error";
  attributes: Record<string, string | number | boolean>;
};

export type ServiceLevelIndicator = {
  key: string;
  successful: number;
  total: number;
  windowStartedAt: string;
  windowEndedAt: string;
};

export type ServiceLevelObjective = {
  key: string;
  targetRatio: number;
  windowDays: number;
};

export type ExperimentVariant = {
  key: string;
  weight: number;
};

export type ExperimentDefinition = {
  experimentId: string;
  status: "draft" | "running" | "paused" | "completed";
  hypothesis: string;
  variants: ExperimentVariant[];
  audienceKey: string;
  primaryMetric: string;
  guardrailMetrics: string[];
  allocationPercent: number;
  salt: string;
};

export type ExperimentAssignment = {
  experimentId: string;
  subjectId: string;
  variantKey: string;
  assignedAt: string;
};
