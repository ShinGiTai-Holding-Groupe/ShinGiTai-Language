import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  Flame,
  Star,
  Trophy,
  BookOpen,
  Brain,
  BadgeCheck,
  MessageCircle,
  Layers,
  Footprints,
  Lock,
  type LucideIcon,
} from "lucide-react";

import { useAuth } from "@/lib/auth";
import { getAchievements } from "@/lib/account.functions";
import { AppHeader } from "@/components/app-header";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/achievements")({
  component: AchievementsPage,
});

const ICONS: Record<string, LucideIcon> = {
  footprints: Footprints,
  flame: Flame,
  star: Star,
  trophy: Trophy,
  "book-open": BookOpen,
  brain: Brain,
  "badge-check": BadgeCheck,
  "message-circle": MessageCircle,
  layers: Layers,
  award: Award,
};

type Item = {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  earned: boolean;
  earned_at: string | null;
};

function AchievementsPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["achievements", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const res = await getAchievements();
      return res as { items: Item[]; newlyEarned: unknown[] };
    },
  });

  const items = data?.items ?? [];
  const earnedCount = items.filter((i) => i.earned).length;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
            <p className="text-muted-foreground">Earn badges as you learn and stay consistent.</p>
          </div>
          {!isLoading && (
            <div className="rounded-2xl border border-border bg-card px-5 py-3 text-center shadow-soft">
              <p className="text-2xl font-bold tabular-nums">
                {earnedCount}
                <span className="text-muted-foreground">/{items.length}</span>
              </p>
              <p className="text-xs text-muted-foreground">Unlocked</p>
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))
            : items.map((a) => {
                const Icon = ICONS[a.icon] ?? Award;
                return (
                  <div
                    key={a.id}
                    className={cn(
                      "relative rounded-2xl border p-5 shadow-soft transition-all",
                      a.earned
                        ? "border-primary/40 bg-card"
                        : "border-border bg-muted/30 opacity-80",
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-xl",
                          a.earned
                            ? "gradient-warm text-accent-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {a.earned ? <Icon className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
                      </div>
                      <span className="rounded-full bg-gold/15 px-2.5 py-1 text-xs font-semibold text-gold">
                        +{a.xp_reward} XP
                      </span>
                    </div>
                    <p className="mt-3 font-semibold">{a.title}</p>
                    <p className="text-sm text-muted-foreground">{a.description}</p>
                    {a.earned && a.earned_at && (
                      <p className="mt-2 text-xs font-medium text-primary">
                        Unlocked {new Date(a.earned_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                );
              })}
        </div>
      </main>
    </div>
  );
}
