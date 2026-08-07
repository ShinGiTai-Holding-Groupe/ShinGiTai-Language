import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Layers, Trash2, Loader2, ArrowRight, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { listDecks, createDeck, deleteDeck, createStarterDeck } from "@/lib/flashcards.functions";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/flashcards")({
  component: FlashcardsPage,
});

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
type Level = (typeof LEVELS)[number];

type Deck = {
  id: string;
  name: string;
  description: string | null;
  language_code: string;
  total: number;
  due: number;
};

function FlashcardsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const listFn = useServerFn(listDecks);
  const createFn = useServerFn(createDeck);
  const deleteFn = useServerFn(deleteDeck);
  const starterFn = useServerFn(createStarterDeck);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [lang, setLang] = useState("");
  const [saving, setSaving] = useState(false);

  const [starterLang, setStarterLang] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const { data: decks, isLoading } = useQuery({
    queryKey: ["decks"],
    queryFn: () => listFn() as Promise<Deck[]>,
  });

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

  const handleCreate = async () => {
    if (!name.trim() || !lang) {
      toast.error("Name and language are required");
      return;
    }
    setSaving(true);
    try {
      const row = (await createFn({
        data: { name: name.trim(), language_code: lang, description: desc.trim() || undefined },
      })) as { id: string };
      await queryClient.invalidateQueries({ queryKey: ["decks"] });
      setOpen(false);
      setName("");
      setDesc("");
      setLang("");
      navigate({ to: "/flashcards/$deckId", params: { deckId: row.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create deck");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFn({ data: { id } });
      await queryClient.invalidateQueries({ queryKey: ["decks"] });
    } catch {
      toast.error("Could not delete deck");
    }
  };

  const effectiveStarterLang = starterLang || languages?.[0]?.code || "";

  const handleStarter = async (level: Level) => {
    if (!effectiveStarterLang) {
      toast.error("Pick a language first");
      return;
    }
    const key = `${effectiveStarterLang}-${level}`;
    setBusyKey(key);
    try {
      const res = (await starterFn({ data: { language_code: effectiveStarterLang, level } })) as {
        deck_id: string;
      };
      await queryClient.invalidateQueries({ queryKey: ["decks"] });
      toast.success(`${level} starter deck ready!`);
      navigate({ to: "/flashcards/$deckId", params: { deckId: res.deck_id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not build deck");
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Flashcards</h1>
            <p className="text-muted-foreground">
              Spaced repetition keeps words in long-term memory.
            </p>
          </div>
          <Button variant="hero" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New deck
          </Button>
        </div>

        {/* Ready-made starter decks by level */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Ready-made decks</p>
                <p className="text-sm text-muted-foreground">
                  Instant vocabulary by level — translated into your native language.
                </p>
              </div>
            </div>
            <Select value={effectiveStarterLang} onValueChange={setStarterLang}>
              <SelectTrigger className="w-52">
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

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {LEVELS.map((lvl) => {
              const key = `${effectiveStarterLang}-${lvl}`;
              const busy = busyKey === key;
              return (
                <button
                  key={lvl}
                  type="button"
                  disabled={!!busyKey}
                  onClick={() => handleStarter(lvl)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border border-border p-3 text-center transition-all hover:border-primary/60 hover:bg-primary/5 disabled:opacity-60",
                  )}
                >
                  <span className="text-lg font-bold">{lvl}</span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    {busy ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Wand2 className="h-3 w-3" />
                    )}
                    {busy ? "Building…" : "Generate"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <>
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
            </>
          ) : decks && decks.length > 0 ? (
            decks.map((d) => (
              <div
                key={d.id}
                className="group rounded-2xl border border-border bg-card p-5 shadow-soft"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Layers className="h-6 w-6" />
                  </div>
                  <button
                    type="button"
                    aria-label="Delete deck"
                    onClick={() => handleDelete(d.id)}
                    className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-4 font-semibold">{d.name}</p>
                <p className="text-sm text-muted-foreground">
                  {d.total} cards · {d.due} due
                </p>
                <Link
                  to="/flashcards/$deckId"
                  params={{ deckId: d.id }}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary"
                >
                  Open <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))
          ) : (
            <div className="col-span-full rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
              No decks yet. Create your first deck to start studying.
            </div>
          )}
        </div>
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New deck</DialogTitle>
            <DialogDescription>Group related vocabulary into a deck.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Travel vocabulary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Language</label>
              <Select value={lang} onValueChange={setLang}>
                <SelectTrigger>
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
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description (optional)</label>
              <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Create deck
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
