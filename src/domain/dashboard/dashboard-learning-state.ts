import type { CefrLevel, LearningSkill, SupportedLanguageCode } from "../learning/content-model";
import { getLanguageCatalogEntry } from "../learning/language-catalog";

export type DashboardLearningActionRoute = "/onboarding" | "/grammar" | "/flashcards" | "/quizzes" | "/tutor";

export interface DashboardLearningInput {
  readonly languageCode?: string;
  readonly level?: string;
  readonly dailyGoalMinutes: number;
  readonly streakDays: number;
  readonly reviewDue?: number;
  readonly weakestSkill?: LearningSkill;
  readonly odynAiAvailable?: boolean;
}

export interface DashboardLearningState {
  readonly mode: "setup" | "offline" | "review" | "repair" | "progress";
  readonly languageName: string;
  readonly languageFlag: string;
  readonly level: CefrLevel | null;
  readonly title: string;
  readonly description: string;
  readonly primaryAction: {
    readonly label: string;
    readonly route: DashboardLearningActionRoute;
  };
  readonly secondaryActions: readonly {
    readonly label: string;
    readonly route: DashboardLearningActionRoute;
    readonly reason: string;
  }[];
}

const skillRoute = (skill: LearningSkill): DashboardLearningActionRoute =>
  skill === "speaking" || skill === "pronunciation" ? "/tutor" : "/quizzes";

export function deriveDashboardLearningState(input: DashboardLearningInput): DashboardLearningState {
  const language = input.languageCode ? getLanguageCatalogEntry(input.languageCode) : undefined;
  const level = language?.availableLevels.includes(input.level as CefrLevel)
    ? (input.level as CefrLevel)
    : null;

  if (!language || !level) {
    return {
      mode: "setup",
      languageName: "New learning path",
      languageFlag: "🌐",
      level: null,
      title: "Choose a language and starting level",
      description: "Hikari needs a concrete language path before calculating lessons, reviews and competency repair.",
      primaryAction: { label: "Configure learning path", route: "/onboarding" },
      secondaryActions: [],
    };
  }

  if (input.odynAiAvailable === false) {
    return {
      mode: "offline",
      languageName: language.name,
      languageFlag: language.flag,
      level,
      title: `${language.name} ${level} · offline practice`,
      description: "OdynAI is unavailable, so Hikari has switched to local lessons, vocabulary and quizzes until the runtime returns.",
      primaryAction: { label: "Open local lesson", route: "/grammar" },
      secondaryActions: [
        { label: "Review vocabulary", route: "/flashcards", reason: "Available without live AI guidance." },
        { label: "Take a quiz", route: "/quizzes", reason: "Preserves progress while offline." },
      ],
    };
  }

  if ((input.reviewDue ?? 0) > 0) {
    return {
      mode: "review",
      languageName: language.name,
      languageFlag: language.flag,
      level,
      title: `${input.reviewDue} review item${input.reviewDue === 1 ? "" : "s"} due now`,
      description: `Hikari prioritised spaced repetition before new ${language.name} ${level} material to protect long-term retention.`,
      primaryAction: { label: "Review due words", route: "/flashcards" },
      secondaryActions: [
        { label: "Continue lesson", route: "/grammar", reason: "Resume after the review queue is cleared." },
        { label: "Use words in conversation", route: "/tutor", reason: "Convert recalled vocabulary into active speech." },
      ],
    };
  }

  if (input.weakestSkill) {
    return {
      mode: "repair",
      languageName: language.name,
      languageFlag: language.flag,
      level,
      title: `Strengthen ${input.weakestSkill}`,
      description: `Your current ${language.name} ${level} path shows ${input.weakestSkill} as the weakest competency. Hikari moved repair work ahead of new content.`,
      primaryAction: { label: `Practise ${input.weakestSkill}`, route: skillRoute(input.weakestSkill) },
      secondaryActions: [
        { label: "Review supporting words", route: "/flashcards", reason: "Rebuild the vocabulary needed for the weak skill." },
        { label: "Return to course", route: "/grammar", reason: "Continue once the competency gap is reduced." },
      ],
    };
  }

  return {
    mode: "progress",
    languageName: language.name,
    languageFlag: language.flag,
    level,
    title: `Continue ${language.name} ${level}`,
    description: `A ${input.dailyGoalMinutes}-minute path selected for your ${input.streakDays}-day streak: lesson, retrieval practice and active production.`,
    primaryAction: { label: "Continue current lesson", route: "/grammar" },
    secondaryActions: [
      { label: "Review vocabulary", route: "/flashcards", reason: "Consolidate the lesson immediately after learning." },
      { label: "Speak with Hikari", route: "/tutor", reason: "Use the same material in active conversation." },
      { label: "Verify mastery", route: "/quizzes", reason: "Finish the loop with measurable evidence." },
    ],
  };
}
