import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, ArrowRight } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/quizzes")({
  component: QuizzesPage,
});

type Quiz = {
  id: string;
  title: string;
  description: string | null;
  level: string;
  language_code: string;
  xp_reward: number;
};

function QuizzesPage() {
  const { data: quizzes, isLoading } = useQuery({
    queryKey: ["quizzes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("id, title, description, level, language_code, xp_reward, sort_order")
        .eq("is_published", true)
        .order("language_code", { ascending: true })
        .order("level", { ascending: true })
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Quiz[];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Quizzes</h1>
        <p className="text-muted-foreground">Test what you know and earn XP.</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {isLoading ? (
            <>
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
            </>
          ) : quizzes && quizzes.length > 0 ? (
            quizzes.map((q) => (
              <Link
                key={q.id}
                to="/quizzes/$quizId"
                params={{ quizId: q.id }}
                className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-warm text-accent-foreground">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold uppercase text-muted-foreground">
                    {q.language_code} · {q.level}
                  </span>
                </div>
                <p className="mt-3 font-semibold">{q.title}</p>
                {q.description && <p className="text-sm text-muted-foreground">{q.description}</p>}
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Start · +{q.xp_reward} XP{" "}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))
          ) : (
            <div className="col-span-full rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
              No quizzes available yet.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
