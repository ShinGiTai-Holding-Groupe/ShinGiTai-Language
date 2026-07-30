import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpenCheck, BrainCircuit, ChevronRight, MessageCircle, Sparkles, X } from "lucide-react";
import { useState } from "react";

import { ShinGiTaiLanguageMark } from "@/components/shingitai-language-mark";

const ACTIONS = [
  {
    to: "/teacher",
    label: "Start a lesson",
    description: "Learn with Hikari in guided teacher mode.",
    icon: BookOpenCheck,
  },
  {
    to: "/flashcards",
    label: "Review vocabulary",
    description: "Continue the words already saved to your account.",
    icon: BrainCircuit,
  },
  {
    to: "/quizzes",
    label: "Take a test",
    description: "Check recall and close the learning loop.",
    icon: Sparkles,
  },
  {
    to: "/tutor",
    label: "Practice conversation",
    description: "Use the current language in an OdynAI conversation.",
    icon: MessageCircle,
  },
] as const;

export function HikariGuide() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [open, setOpen] = useState(false);

  if (pathname === "/" || pathname.startsWith("/auth")) return null;

  return (
    <aside className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open ? (
        <section
          aria-label="Hikari learning guide"
          className="hikari-panel w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-[1.75rem] border border-violet-300/30 bg-slate-950/95 text-white shadow-2xl backdrop-blur-2xl"
        >
          <div className="relative overflow-hidden border-b border-white/10 px-5 pb-5 pt-4">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_0%,rgba(34,211,238,.24),transparent_34%),radial-gradient(circle_at_10%_100%,rgba(139,92,246,.3),transparent_42%)]" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="hikari-avatar relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-br from-violet-500/30 via-indigo-500/20 to-cyan-400/20">
                  <ShinGiTaiLanguageMark className="h-11 w-11" />
                  <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-slate-950 bg-emerald-400" aria-label="Hikari online" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Powered by OdynAI</p>
                  <h2 className="truncate text-xl font-bold tracking-tight">Hikari</h2>
                  <p className="text-sm text-slate-300">Your language learning guide</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                aria-label="Close Hikari guide"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid gap-2 p-3">
            {ACTIONS.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                onClick={() => setOpen(false)}
                className="group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 transition hover:border-violet-300/20 hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-400/15 text-cyan-200 ring-1 ring-white/10">
                  <action.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-white">{action.label}</span>
                  <span className="block text-xs leading-5 text-slate-400">{action.description}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-cyan-200" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="hikari-launcher group relative flex items-center gap-3 rounded-full border border-violet-300/30 bg-slate-950/95 py-2 pl-2 pr-4 text-white shadow-2xl backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-cyan-300/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-expanded={open}
        aria-label={open ? "Hide Hikari guide" : "Open Hikari guide"}
      >
        <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/35 to-cyan-400/25 ring-1 ring-white/15">
          <ShinGiTaiLanguageMark className="h-8 w-8" />
          <span className="absolute inset-0 rounded-full ring-1 ring-cyan-300/0 transition group-hover:ring-cyan-300/40" />
        </span>
        <span className="text-left">
          <span className="block text-xs font-medium text-cyan-300">Hikari</span>
          <span className="block text-sm font-semibold">What do you want to practice?</span>
        </span>
      </button>
    </aside>
  );
}
