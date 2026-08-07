import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Flame, Medal, Crown } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  component: LeaderboardPage,
});

type Row = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
};

function rankStyle(rank: number) {
  if (rank === 1) return "text-gold";
  if (rank === 2) return "text-muted-foreground";
  if (rank === 3) return "text-accent";
  return "text-muted-foreground";
}

function LeaderboardPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_leaderboard", { _limit: 50 });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const rows = data ?? [];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Trophy className="h-7 w-7 text-gold" /> Leaderboard
        </h1>
        <p className="text-muted-foreground">Top learners ranked by total XP.</p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          {isLoading ? (
            <div className="space-y-px">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-none" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">No learners ranked yet.</div>
          ) : (
            rows.map((r, idx) => {
              const rank = idx + 1;
              const isMe = r.user_id === user?.id;
              const name = r.display_name ?? "Learner";
              return (
                <div
                  key={r.user_id}
                  className={cn(
                    "flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0",
                    isMe && "bg-primary/5",
                  )}
                >
                  <div className="flex w-8 shrink-0 justify-center">
                    {rank <= 3 ? (
                      rank === 1 ? (
                        <Crown className={cn("h-5 w-5", rankStyle(rank))} />
                      ) : (
                        <Medal className={cn("h-5 w-5", rankStyle(rank))} />
                      )
                    ) : (
                      <span className="text-sm font-semibold text-muted-foreground">{rank}</span>
                    )}
                  </div>
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarImage src={r.avatar_url ?? undefined} alt={name} />
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {name}{" "}
                      {isMe && <span className="text-xs font-medium text-primary">(you)</span>}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Flame className="h-3.5 w-3.5 text-accent" /> {r.current_streak} day streak
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold tabular-nums text-gold">
                      {r.total_xp.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">XP</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
