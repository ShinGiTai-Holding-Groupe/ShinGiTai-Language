import { Link } from "@tanstack/react-router";
import { BookOpen, CheckCircle2, Layers, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type TodaysFocusCardProps = {
  activeLanguageName?: string;
  dailyGoalMinutes: number;
  streak: number;
  hasActiveCourse: boolean;
  isLoading?: boolean;
};

const ACTIVE_FOCUS_STEPS = [
  {
    icon: BookOpen,
    title: "Core lesson",
    description: "Start with one structured lesson to move the main course forward.",
  },
  {
    icon: Layers,
    title: "Flashcard review",
    description: "Review vocabulary while the lesson is still fresh.",
  },
  {
    icon: MessageCircle,
    title: "Speaking practice",
    description: "Finish with a short AI conversation to make the words usable.",
  },
];

const EMPTY_FOCUS_STEPS = [
  {
    icon: BookOpen,
    title: "Choose one language",
    description: "Start with a single path so progress and recommendations stay focused.",
  },
  {
    icon: Layers,
    title: "Set a daily rhythm",
    description: "Use a small daily goal first. Consistency beats heroic chaos.",
  },
  {
    icon: MessageCircle,
    title: "Unlock practice flow",
    description: "Lessons, flashcards, and speaking practice become easier to follow after setup.",
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
    ? `Today's focus: ${activeLanguageName ?? "your active language"}`
    : "Today's focus: choose your first path";
  const focusDescription = hasActiveCourse
    ? `A simple ${dailyGoalMinutes}-minute stack to protect your ${streak}-day streak and keep progress moving.`
    : "Choose one language first. The app will then turn this area into a daily practice stack instead of a blank dashboard.";
  const footerCopy = hasActiveCourse
    ? "One focused session is better than opening five features and finishing none."
    : "Setup is the first win. After that, ShinGiTai Language can guide the next useful action.";

  return (
    <section className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Today's focus
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">
            {isLoading ? <Skeleton className="h-8 w-80" /> : focusTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{focusDescription}</p>
        </div>

        <Button asChild variant="outline" className="shrink-0">
          <Link to={hasActiveCourse ? "/teacher" : "/onboarding"}>
            {hasActiveCourse ? "Start focus" : "Choose language"}
          </Link>
        </Button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {focusSteps.map((step, index) => (
          <div key={step.title} className="rounded-2xl border border-border bg-background/60 p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <step.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Step {index + 1}
              </span>
            </div>
            <h3 className="mt-3 font-semibold">{step.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-2xl bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 text-primary" />
        <span>{footerCopy}</span>
      </div>
    </section>
  );
}
