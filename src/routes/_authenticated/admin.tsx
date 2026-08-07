import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  Users,
  BookOpen,
  GraduationCap,
  Crown,
  Sparkles,
  Trophy,
  Eye,
  EyeOff,
  Trash2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getMyAccount, claimAdmin } from "@/lib/account.functions";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: account, isLoading: accountLoading } = useQuery({
    queryKey: ["account", user?.id],
    enabled: !!user,
    queryFn: async () => await getMyAccount(),
  });

  const handleClaim = async () => {
    try {
      const res = await claimAdmin();
      if (res.granted) {
        toast.success("You are now an admin!");
        await queryClient.invalidateQueries({ queryKey: ["account", user?.id] });
      } else {
        toast.error("An admin already exists.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  if (accountLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-5xl px-4 py-8">
          <Skeleton className="h-8 w-48" />
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!account?.isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Admin access required</h1>
          <p className="mt-2 text-muted-foreground">
            {account?.adminExists
              ? "You don't have permission to view this page."
              : "No admin exists yet. Claim the admin role to manage the platform."}
          </p>
          {!account?.adminExists && (
            <Button variant="hero" className="mt-6" onClick={handleClaim}>
              <Shield className="h-4 w-4" /> Claim admin role
            </Button>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Shield className="h-7 w-7 text-primary" /> Admin panel
        </h1>
        <p className="text-muted-foreground">Manage users, content and subscriptions.</p>

        <OverviewCards />
        <UsersSection />
        <LessonsSection />
        <QuizzesSection />
      </main>
    </div>
  );
}

function OverviewCards() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_overview");
      if (error) throw error;
      return data as Record<string, number>;
    },
  });

  const CARDS = [
    { key: "total_users", label: "Users", icon: Users, tone: "text-primary" },
    { key: "total_courses", label: "Enrollments", icon: Sparkles, tone: "text-accent" },
    { key: "total_lessons", label: "Lessons", icon: BookOpen, tone: "text-primary" },
    { key: "total_quizzes", label: "Quizzes", icon: GraduationCap, tone: "text-accent" },
    { key: "pro_subscribers", label: "Pro members", icon: Crown, tone: "text-gold" },
    { key: "total_xp_awarded", label: "XP awarded", icon: Trophy, tone: "text-gold" },
  ] as const;

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {CARDS.map((c) => (
        <div key={c.key} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <c.icon className={`h-5 w-5 ${c.tone}`} />
          {isLoading ? (
            <Skeleton className="mt-3 h-7 w-16" />
          ) : (
            <p className="mt-3 text-xl font-bold tabular-nums">
              {(data?.[c.key] ?? 0).toLocaleString()}
            </p>
          )}
          <p className="text-xs text-muted-foreground">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

type AdminUser = {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  total_xp: number;
  current_streak: number;
  roles: string[];
  tier: string;
};

function UsersSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_users", { _limit: 100 });
      if (error) throw error;
      return (data ?? []) as AdminUser[];
    },
  });

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold tracking-tight">Users</h2>
      <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        {isLoading ? (
          <div className="space-y-px">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-none" />
            ))}
          </div>
        ) : (data ?? []).length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No users yet.</div>
        ) : (
          (data ?? []).map((u) => {
            const name = u.display_name ?? u.username ?? "Learner";
            return (
              <div
                key={u.user_id}
                className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
              >
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarImage src={u.avatar_url ?? undefined} alt={name} />
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                    {name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{name}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(u.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {u.roles.includes("admin") && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      admin
                    </span>
                  )}
                  {u.tier === "pro" && (
                    <span className="rounded-full bg-gold/15 px-2 py-0.5 text-xs font-semibold text-gold">
                      pro
                    </span>
                  )}
                  <span className="hidden text-sm font-semibold tabular-nums text-muted-foreground sm:inline">
                    {u.total_xp.toLocaleString()} XP
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

type Lesson = {
  id: string;
  title: string;
  language_code: string;
  level: string;
  is_published: boolean;
};

function LessonsSection() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [lang, setLang] = useState("es");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-lessons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grammar_lessons")
        .select("id, title, language_code, level, is_published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Lesson[];
    },
  });

  const togglePublish = async (l: Lesson) => {
    const { error } = await supabase
      .from("grammar_lessons")
      .update({ is_published: !l.is_published })
      .eq("id", l.id);
    if (error) return toast.error(error.message);
    queryClient.invalidateQueries({ queryKey: ["admin-lessons"] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("grammar_lessons").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Lesson deleted");
    queryClient.invalidateQueries({ queryKey: ["admin-lessons"] });
  };

  const create = async () => {
    if (!title.trim()) return;
    setCreating(true);
    const slug = `${lang}-${title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 50)}-${Date.now().toString().slice(-5)}`;
    const { error } = await supabase.from("grammar_lessons").insert({
      title: title.trim(),
      slug,
      language_code: lang,
      level: "A1",
      content: `# ${title.trim()}\n\nWrite your lesson content here in Markdown.`,
      is_published: false,
    });
    setCreating(false);
    if (error) return toast.error(error.message);
    setTitle("");
    toast.success("Draft lesson created");
    queryClient.invalidateQueries({ queryKey: ["admin-lessons"] });
  };

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold tracking-tight">Grammar lessons</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <Input
          placeholder="New lesson title…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-10 max-w-xs"
        />
        <Input
          placeholder="lang"
          value={lang}
          onChange={(e) => setLang(e.target.value.toLowerCase())}
          className="h-10 w-20"
          maxLength={5}
        />
        <Button onClick={create} disabled={creating || !title.trim()}>
          <Plus className="h-4 w-4" /> Add draft
        </Button>
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        {isLoading ? (
          <Skeleton className="h-32 w-full rounded-none" />
        ) : (data ?? []).length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No lessons.</div>
        ) : (
          (data ?? []).map((l) => (
            <div
              key={l.id}
              className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{l.title}</p>
                <p className="text-xs uppercase text-muted-foreground">
                  {l.language_code} · {l.level} · {l.is_published ? "published" : "draft"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => togglePublish(l)}
                aria-label="Toggle publish"
              >
                {l.is_published ? (
                  <Eye className="h-4 w-4 text-primary" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => remove(l.id)}
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

type Quiz = {
  id: string;
  title: string;
  language_code: string;
  level: string;
  is_published: boolean;
};

function QuizzesSection() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-quizzes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("id, title, language_code, level, is_published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Quiz[];
    },
  });

  const togglePublish = async (q: Quiz) => {
    const { error } = await supabase
      .from("quizzes")
      .update({ is_published: !q.is_published })
      .eq("id", q.id);
    if (error) return toast.error(error.message);
    queryClient.invalidateQueries({ queryKey: ["admin-quizzes"] });
  };

  return (
    <section className="mt-10 pb-12">
      <h2 className="text-xl font-bold tracking-tight">Quizzes</h2>
      <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        {isLoading ? (
          <Skeleton className="h-24 w-full rounded-none" />
        ) : (data ?? []).length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No quizzes.</div>
        ) : (
          (data ?? []).map((q) => (
            <div
              key={q.id}
              className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{q.title}</p>
                <p className="text-xs uppercase text-muted-foreground">
                  {q.language_code} · {q.level} · {q.is_published ? "published" : "draft"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => togglePublish(q)}
                aria-label="Toggle publish"
              >
                {q.is_published ? (
                  <Eye className="h-4 w-4 text-primary" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
