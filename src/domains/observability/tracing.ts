import type { ServiceLevelIndicator, ServiceLevelObjective, TraceSpan } from "./types";

export function completeSpan(
  span: TraceSpan,
  input: { endedAt: string; status: "ok" | "error"; attributes?: TraceSpan["attributes"] },
): TraceSpan {
  if (span.status !== "in_progress") return span;
  const started = Date.parse(span.startedAt);
  const ended = Date.parse(input.endedAt);
  if (!Number.isFinite(started) || !Number.isFinite(ended) || ended < started) {
    throw new Error("Span end must be a valid timestamp after span start");
  }
  return {
    ...span,
    endedAt: input.endedAt,
    status: input.status,
    attributes: { ...span.attributes, ...input.attributes },
  };
}

export function spanDurationMs(span: TraceSpan): number | null {
  if (!span.endedAt) return null;
  const started = Date.parse(span.startedAt);
  const ended = Date.parse(span.endedAt);
  if (!Number.isFinite(started) || !Number.isFinite(ended) || ended < started) return null;
  return ended - started;
}

function validateIndicator(indicator: ServiceLevelIndicator): void {
  if (!Number.isInteger(indicator.successful) || indicator.successful < 0) {
    throw new Error("SLI successful must be a non-negative integer");
  }
  if (!Number.isInteger(indicator.total) || indicator.total < 0) {
    throw new Error("SLI total must be a non-negative integer");
  }
  if (indicator.successful > indicator.total) {
    throw new Error("SLI successful cannot exceed total");
  }
  const start = Date.parse(indicator.windowStartedAt);
  const end = Date.parse(indicator.windowEndedAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    throw new Error("SLI window must contain valid increasing timestamps");
  }
}

export function sliRatio(indicator: ServiceLevelIndicator): number {
  validateIndicator(indicator);
  if (indicator.total === 0) return 1;
  return indicator.successful / indicator.total;
}

export function evaluateObjective(
  indicator: ServiceLevelIndicator,
  objective: ServiceLevelObjective,
): {
  met: boolean;
  actualRatio: number;
  targetRatio: number;
  errorBudgetRemaining: number;
} {
  if (indicator.key !== objective.key) throw new Error("SLI and SLO keys must match");
  if (!Number.isFinite(objective.targetRatio) || objective.targetRatio < 0 || objective.targetRatio > 1) {
    throw new Error("SLO targetRatio must be within 0..1");
  }
  if (!Number.isInteger(objective.windowDays) || objective.windowDays <= 0) {
    throw new Error("SLO windowDays must be a positive integer");
  }

  const actualRatio = sliRatio(indicator);
  const allowedFailureRatio = 1 - objective.targetRatio;
  const actualFailureRatio = 1 - actualRatio;
  const errorBudgetRemaining =
    allowedFailureRatio <= 0
      ? actualFailureRatio === 0
        ? 1
        : 0
      : Math.max(0, Math.min(1, 1 - actualFailureRatio / allowedFailureRatio));

  return {
    met: actualRatio >= objective.targetRatio,
    actualRatio,
    targetRatio: objective.targetRatio,
    errorBudgetRemaining,
  };
}
