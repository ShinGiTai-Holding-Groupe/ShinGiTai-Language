import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type ContinueLearningCourse = {
  languageName?: string;
  languageFlag?: string;
  level?: string;
  xp?: number;
};

type RecommendationPriority = "ready" | "recommended" | "quick-win";

type NextStepRecommendation = {
  label: string;
  description: string;
  reason: string;
  priority: RecommendationPriority;
  cta: string;
  to: string;
};

type ContinueLearningCardProps = {
  course?: ContinueLearningCourse;
  currentStreak?: number;
  dailyGoalMinutes?: number;
  isLoading?: boolean;
};

const DEFAULT_DAILY_GOAL_MINUTES = 15;
const MIN_BASE_XP_FOR_REVIEW = 50;

const PRIORITY_BADGES: Record<RecommendationPriority, { label: string; className: string }> = {
  ready: {
    label: "Ready now",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  recommended: {
    label: "Recommended",
    className: "border-primary/30 bg-primary/10 text-primary",
  },
  "quick-win": {
    label: "Quick win",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
};

function safePositiveNumber(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

function safeNonNegativeNumber(value: number | undefined, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function safeText(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function getNextStepRecommendation({
  course,
  currentStreak,
  dailyGoalMinutes,
}: Pick<
  ContinueLearningCardProps,
  "course" | "currentStreak" | "dailyGoalMinutes"
>): NextStepRecommendation {
  const safeCourseXp = safeNonNegativeNumber(course?.xp);
  const safeCurrentStreak = safeNonNegativeNumber(currentStreak);
  const safeDailyGoalMinutes = safePositiveNumber(dailyGoalMinutes, DEFAULT_DAILY_GOAL_MINUTES);

  if (!course) {
    return {
      label: "Create your path",
      description:
        "Pick one language first. After that, your dashboard can guide lessons, review, and practice in order.",
      reason: "No active course yet",
      priority: "recommended",
      cta: "Choose language",
      to: "/onboarding",
    };
  }

  if (safeCourseXp < MIN_BASE_XP_FOR_REVIEW) {
    return {
      label: "Build the base",
      description:
        "Start with AI Teacher to establish the first useful words and patterns for this course.",
      reason: "Early course progress",
      priority: "recommended",
      cta: "Start lesson",
      to: "/teacher",
    };
  }

  if (safeCurrentStreak === 0) {
    return {
      label: "Restart momentum",
      description:
        "Use a short flashcard review to make the next session easy to finish and easy to repeat tomorrow.",
      reason: "No active streak yet",
      priority: "quick-win",
      cta: "Review flashcards",
      to: "/flashcards",
    };
  }

  if (safeDailyGoalMinutes <= 10) {
    return {
      label: "Win the short session",
      description:
        "Keep today lightweight with flashcards before moving into a longer lesson or conversation.",
      reason: `${safeDailyGoalMinutes}-minute daily goal`,
      priority: "quick-win",
      cta: "Review flashcards",
      to: "/flashcards",
    };
  }

  return {
    label: "Use it in speech",
    description:
      "You have enough base work for today. Move into tutor conversation and make the language usable.",
    reason: "Ready for active practice",
    priority: "ready",
    cta: "Practice speaking",
    to: "/tutor",
  };
}

function RecommendationLoadingState() {
  return (
    <div
      className="rounded-2xl border border-border bg-background/70 p-4 shadow-sm"
      aria-busy="true"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-7 w-44" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-5/6" />
      <div className="mt-4 rounded-xl border border-border bg-card/80 p-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-2 h-4 w-32" />
      </div>
      <Skeleton className="mt-4 h-11 w-full rounded-md" />
    </div>
  );
}

export function ContinueLearningCard({
  course,
  currentStreak,
  dailyGoalMinutes,
  isLoading,
}: ContinueLearningCardProps) {
  const hasCourse = Boolean(course);
  const recommendation = getNextStepRecommendation({ course, currentStreak, dailyGoalMinutes });
  const priorityBadge = PRIORITY_BADGES[recommendation.priority];
  const courseLanguageName = safeText(course?.languageName, "Current language");
  const courseLanguageFlag = safeText(course?.languageFlag, "🌐");
  const courseLevel = safeText(course?.level, "A1");
  const courseXp = safeNonNegativeNumber(course?.xp);
  const title = hasCourse
    ? `${courseLanguageFlag} ${courseLanguageName} · Level ${courseLevel}`
    : "Start your first language path";

  return (
    <section className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div className="grid gap-5 md:grid-cols-[1.35fr_0.65fr] md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Continue learning
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">
            {isLoading ? <Skeleton className="h-8 w-72" /> : title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-5 w-full max-w-xl" />
            ) : hasCourse ? (
              `Pick up from your active course with ${courseXp} XP already earned.`
            ) : (
              "Choose a language first, then ShinGiTai Language can turn the dashboard into a guided practice path."
            )}
          </p>
        </div>

        {isLoading ? (
          <RecommendationLoadingState />
        ) : (
          <div className="rounded-2xl border border-border bg-background/70 p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Recommended next step
              </p>
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${priorityBadge.className}`}
              >
                {priorityBadge.label}
              </span>
            </div>
            <h3 className="mt-3 text-xl font-bold tracking-tight">{recommendation.label}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{recommendation.description}</p>

            <div className="mt-4 rounded-xl border border-border bg-card/80 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Why this?
              </p>
              <p className="mt-1 text-sm font-medium">{recommendation.reason}</p>
            </div>

            <Button
              asChild
              variant="hero"
              size="lg"
              className="mt-4 w-full shadow-soft transition-transform hover:-translate-y-0.5"
            >
              <Link to={recommendation.to}>
                {recommendation.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
