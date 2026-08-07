import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Flame,
  Gem,
  Heart,
  Trophy,
  Sparkles,
  Plus,
  LogOut,
  Moon,
  Sun,
  MessageCircle,
  Layers,
  BookOpen,
  ArrowRight,
  GraduationCap,
  School,
  ScrollText,
  Award,
  Crown,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/notification-bell";
import { ContinueLearningCard } from "@/components/dashboard/continue-learning-card";
import { TodaysFocusCard } from "@/components/dashboard/todays-focus-card";
import dashboardImg from "@/assets/learn-dashboard.jpg";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

type Profile = {
  display_name: string | null;
  avatar_url: string | null;
  username: string | null;
  daily_goal_minutes: number;
  onboarding_completed: boolean;
};

type Stats = {
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  hearts: number;
  gems: number;
};

type Course = {
  id: string;
  language_code: string;
  level: string;
  course_xp: number;
  languages: { name: string; native_name: string; flag_emoji: string } | null;
};

function levelFromXp(xp: number) {
  return Math.floor(xp / 500) + 1;
}

function DashboardPage() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, username, daily_goal_minutes, onboarding_completed")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile && profile.onboarding_completed === false) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [profile, navigate]);

  const { data: stats } = useQuery({
    queryKey: ["stats", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Stats | null> => {
      const { data, error } = await supabase
        .from("user_stats")
        .select("total_xp, current_streak, longest_streak, hearts, gems")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ["courses", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Course[]> => {
      const { data, error } = await supabase
        .from("user_courses")
        .select("id, language_code, level, course_xp, languages(name, native_name, flag_emoji)")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as Course[]) ?? [];
    },
  });

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/auth", replace: true });
  };

  const name = profile?.display_name ?? user?.email?.split("@")[0] ?? "Learner";
  const xp = stats?.total_xp ?? 0;
  const level = levelFromXp(xp);
  const xpIntoLevel = xp % 500;
  const goal = profile?.daily_goal_minutes ?? 15;
  const currentStreak = stats?.current_streak ?? 0;
  const activeCourse = courses?.[0];
  const activeLanguageName = activeCourse?.languages?.name ?? activeCourse?.language_code;
  const continueLearningCourse = activeCourse
    ? {
        languageName: activeCourse.languages?.name ?? activeCourse.language_code,
        languageFlag: activeCourse.languages?.flag_emoji ?? "🌐",
        level: activeCourse.level,
        xp: activeCourse.course_xp,
      }
    : undefined;

  const STAT_CARDS = [
    { icon: Flame, label: "Day streak", value: currentStreak, tone: "text-accent" },
    { icon: Trophy, label: "Total XP", value: xp, tone: "text-gold" },
    { icon: Heart, label: "Hearts", value: stats?.hearts ?? 5, tone: "text-destructive" },
    { icon: Gem, label: "Gems", value: stats?.gems ?? 0, tone: "text-primary" },
  ];

  const PRACTICE_STACK = [
    {
      icon: School,
      title: "1. Learn",
      desc: "Start with a structured AI Teacher lesson.",
      to: "/teacher",
    },
    {
      icon: Layers,
      title: "2. Review",
      desc: "Lock today’s words with flashcards.",
      to: "/flashcards",
    },
    {
      icon: MessageCircle,
      title: "3. Speak",
      desc: "Use the new words in tutor conversation.",
      to: "/tutor",
    },
    {
      icon: GraduationCap,
      title: "4. Test",
      desc: "Finish the loop with a short quiz.",
      to: "/quizzes",
    },
  ];

  const SUPPORT_ACTIONS = [
    { icon: BookOpen, title: "Grammar", desc: "Explain the rules", to: "/grammar" },
    { icon: ScrollText, title: "Exams", desc: "Certification practice", to: "/exams" },
    { icon: Trophy, title: "Leaderboard", desc: "See the rankings", to: "/leaderboard" },
    { icon: Award, title: "Achievements", desc: "Unlock badges", to: "/achievements" },
    { icon: Crown, title: "Go Pro", desc: "Unlock everything", to: "/premium" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link to="/dashboard" className="flex min-w-0 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-brand text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="truncate text-base font-bold tracking-tight sm:text-lg">
              ShinGiTai Language
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <NotificationBell />
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Avatar className="h-9 w-9 border border-border">
              <AvatarImage src={profile?.avatar_url ?? undefined} alt={name} />
              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                {name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex flex-col gap-2 p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Today’s mission
              </p>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {profileLoading ? <Skeleton className="h-9 w-64" /> : `Welcome back, ${name}!`}
              </h1>
              <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
                Keep your streak alive and use the focused practice flow below.
              </p>
            </div>
            <img
              src={dashboardImg}
              alt="Illustration of learners studying languages together"
              loading="lazy"
              width={1280}
              height={640}
              className="hidden h-36 w-60 shrink-0 object-cover sm:block"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-4">
          {STAT_CARDS.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <s.icon className={`h-5 w-5 ${s.tone}`} />
              <p className="mt-3 text-2xl font-bold tabular-nums">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Level progress */}
        <div className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-warm text-accent-foreground">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold">Level {level}</p>
                <p className="text-xs text-muted-foreground">
                  {xpIntoLevel} / 500 XP to level {level + 1}
                </p>
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Daily goal: {goal} min</p>
          </div>
          <Progress value={(xpIntoLevel / 500) * 100} className="mt-4 h-2.5" />
        </div>

        <ContinueLearningCard
          course={continueLearningCourse}
          currentStreak={currentStreak}
          dailyGoalMinutes={goal}
          isLoading={coursesLoading}
        />
        <TodaysFocusCard
          activeLanguageName={activeLanguageName}
          dailyGoalMinutes={goal}
          streak={currentStreak}
          hasActiveCourse={Boolean(activeCourse)}
          isLoading={coursesLoading}
        />

        {/* Practice stack */}
        <div className="mt-8 flex flex-col gap-1 sm:mt-10">
          <h2 className="text-xl font-bold tracking-tight">Practice Stack</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Follow this order when you want a complete learning loop.
          </p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PRACTICE_STACK.map((a) => (
            <Link
              key={a.title}
              to={a.to}
              className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <a.icon className="h-6 w-6" />
              </div>
              <p className="mt-4 font-semibold">{a.title}</p>
              <p className="text-sm text-muted-foreground">{a.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Continue{" "}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-7 flex flex-col gap-1">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Support tools
          </h3>
          <p className="text-sm text-muted-foreground">
            Use these when you need extra practice or review.
          </p>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {SUPPORT_ACTIONS.map((a) => (
            <Link
              key={a.title}
              to={a.to}
              className="group rounded-2xl border border-border bg-card/70 p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <a.icon className="h-5 w-5" />
              </div>
              <p className="mt-3 font-semibold">{a.title}</p>
              <p className="text-xs text-muted-foreground">{a.desc}</p>
            </Link>
          ))}
        </div>

        {/* Courses */}
        <div className="mt-10 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">My languages</h2>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {coursesLoading ? (
            <>
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
            </>
          ) : courses && courses.length > 0 ? (
            courses.map((c) => (
              <div key={c.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{c.languages?.flag_emoji ?? "🌐"}</span>
                  <div>
                    <p className="font-semibold">{c.languages?.name ?? c.language_code}</p>
                    <p className="text-xs text-muted-foreground">
                      Level {c.level} · {c.course_xp} XP
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <AddLanguageCard
              userId={user!.id}
              onAdded={() => queryClient.invalidateQueries({ queryKey: ["courses", user?.id] })}
            />
          )}
          {courses && courses.length > 0 && (
            <AddLanguageCard
              userId={user!.id}
              onAdded={() => queryClient.invalidateQueries({ queryKey: ["courses", user?.id] })}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function AddLanguageCard({ userId, onAdded }: { userId: string; onAdded: () => void }) {
  const { data: languages } = useQuery({
    queryKey: ["languages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("languages")
        .select("code, name, flag_emoji")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const enroll = async (code: string) => {
    const { error } = await supabase
      .from("user_courses")
      .insert({ user_id: userId, language_code: code });
    if (error) {
      toast.error(
        error.message.includes("duplicate") ? "Already learning that language." : error.message,
      );
      return;
    }
    toast.success("Language added! Let's learn.");
    onAdded();
  };

  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Plus className="h-4 w-4 text-primary" /> Add a language
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(languages ?? []).slice(0, 8).map((l) => (
          <button
            key={l.code}
            onClick={() => enroll(l.code)}
            className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-sm transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span>{l.flag_emoji}</span>
            <span>{l.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
