import { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { markLessonComplete } from "@/lib/study.functions";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/grammar/$lessonId")({
  component: LessonPage,
});

function LessonPage() {
  const { lessonId } = useParams({ from: "/_authenticated/grammar/$lessonId" });
  const completeFn = useServerFn(markLessonComplete);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const { data: lesson, isLoading } = useQuery({
    queryKey: ["grammar-lesson", lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grammar_lessons")
        .select("id, title, summary, content, level, language_code")
        .eq("id", lessonId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const handleComplete = async () => {
    setSaving(true);
    try {
      const res = (await completeFn({ data: { lesson_id: lessonId } })) as { awarded: number };
      setDone(true);
      toast.success(res.awarded > 0 ? `Lesson complete! +${res.awarded} XP` : "Lesson complete!");
    } catch {
      toast.error("Could not save progress");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link
          to="/grammar"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All lessons
        </Link>
        {isLoading ? (
          <Skeleton className="h-96 rounded-2xl" />
        ) : !lesson ? (
          <p className="text-center text-muted-foreground">Lesson not found.</p>
        ) : (
          <article>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold uppercase text-muted-foreground">
              {lesson.language_code} · {lesson.level}
            </span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">{lesson.title}</h1>
            {lesson.summary && (
              <p className="mt-2 text-lg text-muted-foreground">{lesson.summary}</p>
            )}
            <div className="prose prose-neutral mt-6 max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-primary">
              <ReactMarkdown>{lesson.content}</ReactMarkdown>
            </div>
            <Button
              variant="hero"
              className="mt-8"
              onClick={handleComplete}
              disabled={saving || done}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {done ? "Completed" : "Mark as complete"}
            </Button>
          </article>
        )}
      </main>
    </div>
  );
}
