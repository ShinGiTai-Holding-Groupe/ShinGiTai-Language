import type {
  CefrLevel,
  LearningSkill,
  SupportedLanguageCode,
} from "./content-model";

export interface SkillProgress {
  readonly skill: LearningSkill;
  readonly mastery: number;
  readonly confidence: number;
  readonly attempts: number;
  readonly lastPractisedAt?: string;
}

export interface ReviewItem {
  readonly id: string;
  readonly kind: "vocabulary" | "lesson" | "pronunciation" | "exam";
  readonly dueAt: string;
  readonly priority: number;
  readonly relatedSkill: LearningSkill;
}

export interface LearnerProgress {
  readonly userId: string;
  readonly language: SupportedLanguageCode;
  readonly currentLevel: CefrLevel;
  readonly completedLessonIds: readonly string[];
  readonly skillProgress: readonly SkillProgress[];
  readonly reviewQueue: readonly ReviewItem[];
  readonly activeLessonId?: string;
  readonly streakDays: number;
  readonly weeklyMinutes: number;
  readonly lastActivityAt?: string;
}

export type LearningRecommendationKind =
  | "continue-lesson"
  | "review"
  | "repair-skill"
  | "conversation"
  | "start-lesson";

export interface LearningRecommendation {
  readonly kind: LearningRecommendationKind;
  readonly title: string;
  readonly reason: string;
  readonly route: "/grammar" | "/flashcards" | "/quizzes" | "/tutor";
  readonly targetId?: string;
  readonly skill?: LearningSkill;
}

const clampPercent = (value: number): number => Math.min(100, Math.max(0, value));

export function calculateSkillMastery(
  previousMastery: number,
  scorePercent: number,
  confidence: number,
): number {
  const safePrevious = clampPercent(previousMastery);
  const safeScore = clampPercent(scorePercent);
  const safeConfidence = clampPercent(confidence);
  const evidenceWeight = 0.2 + (safeConfidence / 100) * 0.25;

  return Math.round(
    clampPercent(safePrevious * (1 - evidenceWeight) + safeScore * evidenceWeight),
  );
}

export function selectNextRecommendation(
  progress: LearnerProgress,
  now = new Date(),
): LearningRecommendation {
  if (progress.activeLessonId) {
    return {
      kind: "continue-lesson",
      title: "Continue your active lesson",
      reason: "Finishing an active lesson preserves context and learning momentum.",
      route: "/grammar",
      targetId: progress.activeLessonId,
    };
  }

  const dueReview = [...progress.reviewQueue]
    .filter((item) => new Date(item.dueAt).getTime() <= now.getTime())
    .sort((left, right) => right.priority - left.priority)[0];

  if (dueReview) {
    return {
      kind: "review",
      title: "Complete your due review",
      reason: "This material is due now according to the spaced-repetition queue.",
      route: dueReview.kind === "vocabulary" ? "/flashcards" : "/quizzes",
      targetId: dueReview.id,
      skill: dueReview.relatedSkill,
    };
  }

  const weakestSkill = [...progress.skillProgress]
    .filter((skill) => skill.attempts > 0)
    .sort((left, right) => left.mastery - right.mastery)[0];

  if (weakestSkill && weakestSkill.mastery < 65) {
    return {
      kind: "repair-skill",
      title: `Strengthen ${weakestSkill.skill}`,
      reason: `Current mastery is ${weakestSkill.mastery}%, below the reinforcement threshold.`,
      route: weakestSkill.skill === "speaking" || weakestSkill.skill === "pronunciation"
        ? "/tutor"
        : "/quizzes",
      skill: weakestSkill.skill,
    };
  }

  const speaking = progress.skillProgress.find((skill) => skill.skill === "speaking");
  if (!speaking || speaking.mastery < 75) {
    return {
      kind: "conversation",
      title: "Practise a guided conversation",
      reason: "Conversation practice balances receptive learning with active production.",
      route: "/tutor",
      skill: "speaking",
    };
  }

  return {
    kind: "start-lesson",
    title: "Start the next lesson",
    reason: "No urgent review or weak competency currently blocks progression.",
    route: "/grammar",
  };
}
