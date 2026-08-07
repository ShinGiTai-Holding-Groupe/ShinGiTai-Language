import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ScrollText, Award, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { listExamSessions, startExam } from "@/lib/exam.functions";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/exams/")({
  component: ExamsPage,
});

const LEVELS = [
  { code: "A1", label: "Beginner" },
  { code: "A2", label: "Elementary" },
  { code: "B1", label: "Intermediate" },
  { code: "B2", label: "Upper-Intermediate" },
  { code: "C1", label: "Advanced" },
  { code: "C2", label: "Proficiency" },
] as const;

type Session = {
  id: string;
  language_code: string;
  level: string;
  status: string;
  score_percent: number;
  passed: boolean;
  total_questions: number;
  correct_count: number;
  created_at: string;
  completed_at: string | null;
};

function ExamsPage() {
  const navigate = useNavigate();
  const startFn = useServerFn(startExam);
  const listFn = useServerFn(listExamSessions);
  const [lang, setLang] = useState<string>("");
  const [starting, setStarting] = useState<string | null>(null);

  const { data: languages } = useQuery({
    queryKey: ["languages-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("languages")
        .select("code, name, flag_emoji")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["exam-sessions"],
    queryFn: () => listFn() as Promise<Session[]>,
  });

  const certificates = (sessions ?? []).filter((s) => s.passed);

  const handleStart = async (level: string) => {
    if (!lang) {
      toast.error("Choose a language first");
      return;
    }
    setStarting(level);
    try {
      const res = await startFn({ data: { language_code: lang, level } });
      navigate({ to: "/exams/$sessionId", params: { sessionId: res.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start the exam");
    } finally {
      setStarting(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-brand text-primary-foreground">
            <ScrollText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Certification Exams</h1>
            <p className="text-muted-foreground">
              Take a CEFR-style exam for each level and earn your certificate.
            </p>
          </div>
        </div>

        <div className="mt-6 max-w-xs">
          <label className="text-sm font-medium">Exam language</label>
          <Select value={lang} onValueChange={setLang}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select a language" />
            </SelectTrigger>
            <SelectContent>
              {(languages ?? []).map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  {l.flag_emoji} {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <h2 className="mt-8 text-xl font-bold tracking-tight">Choose your level</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LEVELS.map((lvl) => {
            const passedThis = certificates.some(
              (c) => c.level === lvl.code && c.language_code === lang,
            );
            return (
              <div
                key={lvl.code}
                className="rounded-2xl border border-border bg-card p-5 shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-xl bg-primary/10 px-3 py-1.5 text-lg font-bold text-primary">
                    {lvl.code}
                  </span>
                  {passedThis && <Award className="h-5 w-5 text-gold" />}
                </div>
                <p className="mt-3 font-semibold">{lvl.label}</p>
                <p className="text-xs text-muted-foreground">12 questions · 60% to pass</p>
                <Button
                  className="mt-4 w-full"
                  variant={passedThis ? "soft" : "hero"}
                  disabled={starting !== null}
                  onClick={() => handleStart(lvl.code)}
                >
                  {starting === lvl.code ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Preparing…
                    </>
                  ) : passedThis ? (
                    "Retake exam"
                  ) : (
                    "Start exam"
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {certificates.length > 0 && (
          <>
            <h2 className="mt-10 text-xl font-bold tracking-tight">Your certificates</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {certificates.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate({ to: "/exams/$sessionId", params: { sessionId: c.id } })}
                  className="flex items-center gap-4 rounded-2xl border border-gold/40 bg-gold/5 p-5 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant"
                >
                  <Award className="h-9 w-9 shrink-0 text-gold" />
                  <div>
                    <p className="font-semibold">
                      {c.language_code.toUpperCase()} · {c.level} Certificate
                    </p>
                    <p className="text-sm text-muted-foreground">Score {c.score_percent}%</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        <h2 className="mt-10 text-xl font-bold tracking-tight">Exam history</h2>
        <div className="mt-4 space-y-2">
          {isLoading ? (
            <>
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
            </>
          ) : sessions && sessions.length > 0 ? (
            sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => navigate({ to: "/exams/$sessionId", params: { sessionId: s.id } })}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-soft transition-colors hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  {s.status !== "completed" ? (
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  ) : s.passed ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <div>
                    <p className="font-medium">
                      {s.language_code.toUpperCase()} · {s.level}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.status === "completed"
                        ? `${s.correct_count}/${s.total_questions} correct`
                        : "In progress"}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-semibold",
                    s.status !== "completed"
                      ? "bg-muted text-muted-foreground"
                      : s.passed
                        ? "bg-primary/10 text-primary"
                        : "bg-destructive/10 text-destructive",
                  )}
                >
                  {s.status === "completed" ? `${s.score_percent}%` : "Resume"}
                </span>
              </button>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
              No exams yet. Pick a language and level above to take your first certification exam.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
