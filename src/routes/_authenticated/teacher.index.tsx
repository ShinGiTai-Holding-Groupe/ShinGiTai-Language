import { createFileRoute } from "@tanstack/react-router";
import { BookOpenCheck, GraduationCap, MessageCircle, Sparkles, Volume2 } from "lucide-react";

import { TeacherAvatar } from "@/components/teacher-avatar";
import { TeacherAvatarPicker, useTeacherAvatar } from "@/components/teacher-avatar-picker";

export const Route = createFileRoute("/_authenticated/teacher/")({
  component: TeacherEmpty,
});

const LESSON_PROMISES = [
  {
    icon: BookOpenCheck,
    title: "Structured lesson",
    desc: "Start with a clear explanation before moving into practice.",
  },
  {
    icon: MessageCircle,
    title: "Active exercises",
    desc: "Answer questions and get corrected inside the lesson flow.",
  },
  {
    icon: Volume2,
    title: "Voice support",
    desc: "Let the teacher read the lesson out loud when voice is available.",
  },
];

const STARTER_PROMPTS = [
  "Teach me five useful phrases for today.",
  "Explain one grammar rule, then quiz me.",
  "Practice a short real-life conversation with me.",
];

const COMPLETION_PROMPTS = [
  "Recap what I learned in this lesson.",
  "Show my mistakes and corrected examples.",
  "Give me one next step for tomorrow.",
];

function TeacherEmpty() {
  const avatar = useTeacherAvatar();

  return (
    <div className="flex h-full w-full flex-col items-center justify-center overflow-y-auto p-6 text-center sm:p-8">
      <div className="w-full max-w-3xl rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
        <TeacherAvatar variant={avatar} className="mx-auto mb-6 w-32" />
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">AI Teacher</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Start a guided language lesson
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
          Pick an existing lesson from the sidebar or create a new one. ShinGiTai Language will
          guide you through explanation, practice, correction, and voice-based listening support.
        </p>

        <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
          {LESSON_PROMISES.map((item) => (
            <div key={item.title} className="rounded-2xl border border-border bg-background/60 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-background/60 p-4 text-left">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4" /> Starter prompts
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            After creating a lesson, use one of these ideas if you are not sure what to ask first.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {STARTER_PROMPTS.map((prompt) => (
              <div
                key={prompt}
                className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium"
              >
                “{prompt}”
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-left">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <BookOpenCheck className="h-4 w-4" /> Finish strong
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Before leaving a lesson, ask the teacher to turn the session into a short review plan.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {COMPLETION_PROMPTS.map((prompt) => (
              <div
                key={prompt}
                className="rounded-xl border border-primary/20 bg-background/80 px-3 py-2 text-sm font-medium text-foreground"
              >
                “{prompt}”
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <GraduationCap className="h-4 w-4" /> Use New lesson to begin
          </div>
          <TeacherAvatarPicker />
        </div>
      </div>
    </div>
  );
}
