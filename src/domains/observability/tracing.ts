import type { ServiceLevelIndicator, ServiceLevelObjective, TraceSpan } from "./types";

export function completeSpan(
  span: TraceSpan,
  input: { endedAt: string; status: "ok" | "error"; attributes?: TraceSpan["attributes"] },
): TraceSpan {
  if (span.status !== "in_progress") return span;

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
  if (Number.isNaN(started) || Number.isNaN(ended) || ended < started) return null;
  return ended - started;
}

export function sliRatio(indicator: ServiceLevelIndicator): number {
  if (indicator.total <= 0) return 1;
  return Math.max(0, Math.min(1, indicator.successful / indicator.total));
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
  if (indicator.key !== objective.key) {
    throw new Error("SLI and SLO keys must match");
  }

  const actualRatio = sliRatio(indicator);
  const allowedFailureRatio = 1 - objective.targetRatio;
  const actualFailureRatio = 1 - actualRatio;
  const errorBudgetRemaining = allowedFailureRatio <= 0
    ? actualFailureRatio === 0 ? 1 : 0
    : Math.max(0, Math.min(1, 1 - actualFailureRatio / allowedFailureRatio));

  return {
    met: actualRatio >= objective.targetRatio,
    actualRatio,
    targetRatio: objective.targetRatio,
    errorBudgetRemaining,
  };
}
