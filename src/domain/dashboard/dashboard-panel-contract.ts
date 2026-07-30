import type {
  CefrLevel,
  LearningSkill,
  SupportedLanguageCode,
} from "../learning/content-model";
import type { LearningRecommendation } from "../learning/progress-engine";

export type PanelState = "ready" | "loading" | "empty" | "offline" | "error";

export interface DashboardPanelAction {
  readonly label: string;
  readonly route: string;
  readonly targetId?: string;
}

export interface DashboardPanelContext {
  readonly userId: string;
  readonly language: SupportedLanguageCode;
  readonly level: CefrLevel;
  readonly generatedAt: string;
  readonly odynAiAvailable: boolean;
}

export interface DashboardPanel<TData> {
  readonly id: string;
  readonly title: string;
  readonly state: PanelState;
  readonly context: DashboardPanelContext;
  readonly data: TData | null;
  readonly primaryAction?: DashboardPanelAction;
  readonly secondaryAction?: DashboardPanelAction;
  readonly message?: string;
}

export interface TodayFocusData {
  readonly recommendation: LearningRecommendation;
  readonly estimatedMinutes: number;
  readonly dueReviewCount: number;
}

export interface CompetencySnapshotData {
  readonly skills: readonly {
    readonly skill: LearningSkill;
    readonly mastery: number;
    readonly trend: "up" | "stable" | "down";
  }[];
  readonly weakestSkill?: LearningSkill;
  readonly strongestSkill?: LearningSkill;
}

export interface LearningMomentumData {
  readonly streakDays: number;
  readonly weeklyMinutes: number;
  readonly weeklyTargetMinutes: number;
  readonly completedActivities: number;
}

export function assertPanelIsActionable<TData>(panel: DashboardPanel<TData>): void {
  if (panel.state === "ready" && panel.data === null) {
    throw new Error(`Ready panel ${panel.id} must contain data`);
  }

  if (panel.state === "ready" && !panel.primaryAction) {
    throw new Error(`Ready panel ${panel.id} must expose a primary action`);
  }

  if (panel.state !== "ready" && !panel.message) {
    throw new Error(`Non-ready panel ${panel.id} must explain its state`);
  }

  if (!panel.context.userId.trim()) {
    throw new Error(`Panel ${panel.id} must be scoped to a user`);
  }
}
