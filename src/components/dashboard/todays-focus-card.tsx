import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Layers,
  MessageCircle,
  TriangleAlert,
  WifiOff,
} from "lucide-react";

import { ShinGiTaiLanguageMark } from "@/components/shingitai-language-mark";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  deriveDashboardLearningState,
  type DashboardLearningActionRoute,
} from "@/domain/dashboard/dashboard-learning-state";
import type { LearningSkill } from "@/domain/learning/content-model";

interface TodaysFocusCardProps {
  readonly activeLanguageCode?: string;
  readonly activeLanguageName?: string;
  readonly activeLevel?: string;
  readonly dailyGoalMinutes: number;
  readonly streak: number;
  readonly hasActiveCourse: boolean;
  readonly reviewDue?: number;
  readonly weakestSkill?: LearningSkill;
  readonly odynAiAvailable?: boolean;
  readonly isLoading?: boolean;
}

const actionIcon = (route: DashboardLearningActionRoute) => {
  if (route === "/flashcards") return Layers;
  if (route === "/tutor") return MessageCircle;
  return BookOpen;
};

export function TodaysFocusCard({
  activeLanguageCode,
  activeLanguageName,
  activeLevel,
  dailyGoalMinutes,
  streak,
  hasActiveCourse,
  reviewDue = 0,
  weakestSkill,
  odynAiAvailable = true,
  isLoading,
}: TodaysFocusCardProps) {
  const state = deriveDashboardLearningState({
    languageCode: hasActiveCourse ? activeLanguageCode : undefined,
    level: hasActiveCourse ? activeLevel : undefined,
    dailyGoalMinutes,
    streakDays: streak,
    reviewDue,
    weakestSkill,
    odynAiAvailable,
  });

  const displayLanguageName = activeLanguageName ?? state.languageName;
  const modeCopy = {
    setup: "Learning path required",
    offline: "Offline continuity mode",
    review: "Retention priority",
    repair: "Competency repair",
    progress: "Recommended next step",
  }[state.mode];

  return (
    <section className="relative mt-6 overflow-hidden rounded-3xl border border-violet-300/20 bg-card p-6 shadow-soft">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_92%_0%,rgba(34,211,238,.14),transparent_31%),radial-gradient(circle_at_0%_100%,rgba(139,92,246,.16),transparent_38%)]" />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="hikari-avatar hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-violet-300/25 bg-gradient-to-br from-violet-500/20 via-indigo-500/15 to-cyan-400/20 shadow-lg sm:flex">
            <ShinGiTaiLanguageMark className="h-12 w-12" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                Hikari · powered by OdynAI
              </p>
              <span className="rounded-full border border-border bg-background/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {modeCopy}
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {isLoading ? <Skeleton className="h-8 w-80" /> : state.title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {state.description}
            </p>
            {!isLoading && hasActiveCourse && (
              <p className="mt-3 text-sm font-medium text-foreground">
                {state.languageFlag} {displayLanguageName} {state.level ? `· ${state.level}` : ""}
              </p>
            )}
          </div>
        </div>

        <Button
          asChild
          className="shrink-0 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg hover:from-violet-500 hover:to-indigo-500"
        >
          <Link to={state.primaryAction.route}>
            {state.primaryAction.label}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {state.secondaryActions.length > 0 && (
        <div className="relative mt-5 grid gap-3 md:grid-cols-3">
          {state.secondaryActions.map((action, index) => {
            const Icon = actionIcon(action.route);
            return (
              <Link
                key={`${action.route}-${action.label}`}
                to={action.route}
                className="group rounded-2xl border border-border bg-background/70 p-4 transition hover:-translate-y-0.5 hover:border-violet-400/35 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/15 to-cyan-400/15 text-primary ring-1 ring-violet-300/15">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Step {index + 1}
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
                <h3 className="mt-3 font-semibold">{action.label}</h3>
                <p className="mt-1 min-h-10 text-sm leading-5 text-muted-foreground">{action.reason}</p>
              </Link>
            );
          })}
        </div>
      )}

      <div className="relative mt-5 flex items-start gap-2 rounded-2xl border border-violet-300/15 bg-violet-500/5 px-4 py-3 text-sm text-muted-foreground">
        {state.mode === "offline" ? (
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        ) : state.mode === "repair" ? (
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        ) : (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        )}
        <span>
          {state.mode === "setup"
            ? "No simulated progress is shown before a language and level are configured."
            : "This recommendation is derived from the active language path, level, review pressure and competency state."}
        </span>
      </div>
    </section>
  );
}
