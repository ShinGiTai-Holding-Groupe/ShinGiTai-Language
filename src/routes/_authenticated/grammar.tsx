import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ArrowRight } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { Skeleton } from "@/components/ui/skeleton";
import grammarImg from "@/assets/learn-grammar.jpg";

export const Route = createFileRoute("/_authenticated/grammar")({
  component: GrammarPage,
});

type Lesson = {
  id: string;
  title: string;
  summary: string | null;
  level: string;
  language_code: string;
};

function GrammarPage() {
  const { data: lessons, isLoading } = useQuery({
    queryKey: ["grammar-lessons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grammar_lessons")
        .select("id, title, summary, level, language_code, sort_order")
        .eq("is_published", true)
        .order("language_code", { ascending: true })
        .order("level", { ascending: true })
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Lesson[];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
          <img
            src={grammarImg}
            alt="Colourful illustration of grammar building blocks and puzzle pieces"
            loading="lazy"
            width={1280}
            height={640}
            className="h-40 w-full object-cover sm:h-52"
          />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight">Grammar lessons</h1>
        <p className="text-muted-foreground">
          Clear explanations with examples, organised by level.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {isLoading ? (
            <>
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
            </>
          ) : lessons && lessons.length > 0 ? (
            lessons.map((l) => (
              <Link
                key={l.id}
                to="/grammar/$lessonId"
                params={{ lessonId: l.id }}
                className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold uppercase text-muted-foreground">
                    {l.language_code} · {l.level}
                  </span>
                </div>
                <p className="mt-3 font-semibold">{l.title}</p>
                {l.summary && <p className="text-sm text-muted-foreground">{l.summary}</p>}
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Read{" "}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))
          ) : (
            <div className="col-span-full rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
              No lessons available yet.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
