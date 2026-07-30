import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, CheckCircle2, Layers, MessageCircle } from "lucide-react";

import { ShinGiTaiLanguageMark } from "@/components/shingitai-language-mark";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type TodaysFocusCardProps = {
  activeLanguageName?: string;
  dailyGoalMinutes: number;
  streak: number;
  hasActiveCourse: boolean;
  isLoading?: boolean;
};

type FocusStep = {
  icon: typeof BookOpen;
  title: string;
  description: string;
  to: "/teacher" | "/flashcards" | "/tutor" | "/onboarding";
  action: string;
};

const ACTIVE_FOCUS_STEPS: FocusStep[] = [
  {
    icon: BookOpen,
    title: "Core lesson",
    description: "Start with one structured Hikari lesson to move the main course forward.",
    to: "/teacher",
    action: "Start lesson",
  },
  {
    icon: Layers,
    title: "Vocabulary review",
    description: "Review saved words while the lesson is still fresh.",
    to: "/flashcards",
    action: "Review words",
  },
  {
    icon: MessageCircle,
    title: "Speaking practice",
    description: "Finish with a short OdynAI conversation and use the new vocabulary.",
    to: "/tutor",
    action: "Start conversation",
  },
];

const EMPTY_FOCUS_STEPS: FocusStep[] = [
  {
    icon: BookOpen,
    title: "Choose one language",
    description: "Start with a single path so progress and recommendations stay focused.",
    to: "/onboarding",
    action: "Choose language",
  },
  {
    icon: Layers,
    title: "Set a daily rhythm",
    description: "Use a small daily goal first. Consistency beats heroic chaos.",
    to: "/onboarding",
    action: "Set goal",
  },
  {
    icon: MessageCircle,
    title: "Unlock Hikari",
    description: "Complete setup so lessons, vocabulary and conversation share one learning context.",
    to: "/onboarding",
    action: "Complete setup",
  },
];

export function TodaysFocusCard({
  activeLanguageName,
  dailyGoalMinutes,
  streak,
  hasActiveCourse,
  isLoading,
}: TodaysFocusCardProps) {
  const focusSteps = hasActiveCourse ? ACTIVE_FOCUS_STEPS : EMPTY_FOCUS_STEPS;
  const focusTitle = hasActiveCourse
    ? `Hikari's focus: ${activeLanguageName ?? "your active language"}`
    : "Hikari is ready to build your first learning path";
  const focusDescription = hasActiveCourse
    ? `A focused ${dailyGoalMinutes}-minute learning loop designed to protect your ${streak}-day streak and turn new material into usable language.`
    : "Choose one language and a realistic daily target. Hikari will then guide you through lesson, vocabulary and conversation instead of leaving you on an empty dashboard.";
  const footerCopy = hasActiveCourse
    ? "Complete the three steps in order. Every button opens the corresponding working product area."
    : "Setup is the first real action. No simulated progress is shown before a course exists.";

  return (
    <section className="relative mt-6 overflow-hidden rounded-3xl border border-violet-300/20 bg-card p-6 shadow-soft">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_92%_0%,rgba(34,211,238,.14),transparent_31%),radial-gradient(circle_at_0%_100%,rgba(139,92,246,.16),transparent_38%)]" />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="hikari-avatar hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-violet-300/25 bg-gradient-to-br from-violet-500/20 via-indigo-500/15 to-cyan-400/20 shadow-lg sm:flex">
            <ShinGiTaiLanguageMark className="h-12 w-12" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Hikari · powered by OdynAI
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {isLoading ? <Skeleton className="h-8 w-80" /> : focusTitle}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {focusDescription}
            </p>
          </div>
        </div>

        <Button asChild className="shrink-0 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg hover:from-violet-500 hover:to-indigo-500">
          <Link to={hasActiveCourse ? "/teacher" : "/onboarding"}>
            {hasActiveCourse ? "Learn with Hikari" : "Configure learning path"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="relative mt-5 grid gap-3 md:grid-cols-3">
        {focusSteps.map((step, index) => (
          <Link
            key={step.title}
            to={step.to}
            className="group rounded-2xl border border-border bg-background/70 p-4 transition hover:-translate-y-0.5 hover:border-violet-400/35 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/15 to-cyan-400/15 text-primary ring-1 ring-violet-300/15">
                  <step.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Step {index + 1}
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
            <h3 className="mt-3 font-semibold">{step.title}</h3>
            <p className="mt-1 min-h-10 text-sm leading-5 text-muted-foreground">{step.description}</p>
            <span className="mt-3 inline-flex text-sm font-semibold text-primary">{step.action}</span>
          </Link>
        ))}
      </div>

      <div className="relative mt-5 flex items-start gap-2 rounded-2xl border border-violet-300/15 bg-violet-500/5 px-4 py-3 text-sm text-muted-foreground">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span>{footerCopy}</span>
      </div>
    </section>
  );
}
