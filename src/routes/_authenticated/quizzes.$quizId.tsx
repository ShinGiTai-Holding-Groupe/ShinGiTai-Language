import { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, X, Loader2, Trophy } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { submitQuiz } from "@/lib/study.functions";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/quizzes/$quizId")({
  component: QuizPage,
});

type Question = { id: string; prompt: string; options: string[]; sort_order: number };
type Result = {
  correct: boolean;
  correct_index: number;
  chosen_index: number;
  explanation: string | null;
};

function QuizPage() {
  const { quizId } = useParams({ from: "/_authenticated/quizzes/$quizId" });
  const submitFn = useServerFn(submitQuiz);

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<{
    score: number;
    total: number;
    xpEarned: number;
    results: Result[];
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: async () => {
      const { data: quiz, error } = await supabase
        .from("quizzes")
        .select("id, title, language_code, level")
        .eq("id", quizId)
        .maybeSingle();
      if (error) throw error;
      if (!quiz) return null;
      const { data: questions, error: qErr } = await supabase
        .from("quiz_questions")
        .select("id, prompt, options, sort_order")
        .eq("quiz_id", quizId)
        .order("sort_order", { ascending: true });
      if (qErr) throw qErr;
      return { quiz, questions: (questions ?? []) as unknown as Question[] };
    },
  });

  const handleSubmit = async () => {
    if (!data) return;
    if (Object.keys(answers).length < data.questions.length) {
      toast.error("Answer all questions first");
      return;
    }
    setSubmitting(true);
    try {
      const ordered = data.questions.map((_, i) => answers[i]);
      const res = (await submitFn({
        data: { quiz_id: quizId, answers: ordered },
      })) as typeof outcome;
      setOutcome(res);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit quiz");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link
          to="/quizzes"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All quizzes
        </Link>
        {isLoading ? (
          <Skeleton className="h-96 rounded-2xl" />
        ) : !data ? (
          <p className="text-center text-muted-foreground">Quiz not found.</p>
        ) : outcome ? (
          <div>
            <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl gradient-warm text-accent-foreground">
                <Trophy className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-2xl font-bold">
                {outcome.score} / {outcome.total} correct
              </h2>
              <p className="mt-1 text-muted-foreground">You earned +{outcome.xpEarned} XP</p>
            </div>
            <div className="mt-4 space-y-3">
              {data.questions.map((q, i) => {
                const r = outcome.results[i];
                return (
                  <div key={q.id} className="rounded-xl border border-border bg-card p-4">
                    <p className="font-medium">{q.prompt}</p>
                    <p
                      className={cn(
                        "mt-2 text-sm",
                        r.correct ? "text-primary" : "text-destructive",
                      )}
                    >
                      {r.correct ? "Correct" : `Your answer: ${q.options[r.chosen_index] ?? "—"}`}
                    </p>
                    {!r.correct && (
                      <p className="text-sm text-primary">Answer: {q.options[r.correct_index]}</p>
                    )}
                    {r.explanation && (
                      <p className="mt-1 text-sm text-muted-foreground">{r.explanation}</p>
                    )}
                  </div>
                );
              })}
            </div>
            <Link to="/quizzes">
              <Button variant="hero" className="mt-6 w-full">
                Back to quizzes
              </Button>
            </Link>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{data.quiz.title}</h1>
            <p className="text-sm uppercase text-muted-foreground">
              {data.quiz.language_code} · {data.quiz.level}
            </p>
            <div className="mt-6 space-y-5">
              {data.questions.map((q, i) => (
                <div
                  key={q.id}
                  className="rounded-2xl border border-border bg-card p-5 shadow-soft"
                >
                  <p className="font-semibold">
                    {i + 1}. {q.prompt}
                  </p>
                  <div className="mt-3 grid gap-2">
                    {q.options.map((opt, oi) => (
                      <button
                        key={oi}
                        type="button"
                        onClick={() => setAnswers((a) => ({ ...a, [i]: oi }))}
                        className={cn(
                          "rounded-xl border px-4 py-2.5 text-left text-sm transition-colors",
                          answers[i] === oi
                            ? "border-primary bg-primary/10 font-medium text-primary"
                            : "border-border hover:bg-muted",
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="hero"
              className="mt-6 w-full"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Submit quiz
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
