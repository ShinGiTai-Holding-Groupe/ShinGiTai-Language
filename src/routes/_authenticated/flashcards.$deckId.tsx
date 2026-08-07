import { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Plus, Sparkles, Trash2, Loader2, Play, Check, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import {
  getDeck,
  addCard,
  deleteCard,
  getDueCards,
  reviewCard,
  generateFlashcards,
} from "@/lib/flashcards.functions";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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

export const Route = createFileRoute("/_authenticated/flashcards/$deckId")({
  component: DeckPage,
});

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
type Card = {
  id: string;
  front: string;
  back: string;
  example: string | null;
  emoji: string | null;
  due_date: string;
  repetitions: number;
};

function DeckPage() {
  const { deckId } = useParams({ from: "/_authenticated/flashcards/$deckId" });
  const queryClient = useQueryClient();
  const getFn = useServerFn(getDeck);
  const addFn = useServerFn(addCard);
  const delFn = useServerFn(deleteCard);
  const genFn = useServerFn(generateFlashcards);

  const [reviewing, setReviewing] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [genOpen, setGenOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [genLevel, setGenLevel] = useState<string>("A1");
  const [genCount, setGenCount] = useState("8");
  const [generating, setGenerating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["deck", deckId],
    queryFn: () => getFn({ data: { id: deckId } }),
  });

  const handleAdd = async () => {
    if (!front.trim() || !back.trim()) return;
    try {
      await addFn({ data: { deck_id: deckId, front: front.trim(), back: back.trim() } });
      setFront("");
      setBack("");
      await queryClient.invalidateQueries({ queryKey: ["deck", deckId] });
    } catch {
      toast.error("Could not add card");
    }
  };

  const handleDelete = async (id: string) => {
    await delFn({ data: { id } });
    await queryClient.invalidateQueries({ queryKey: ["deck", deckId] });
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Enter a topic");
      return;
    }
    setGenerating(true);
    try {
      const res = (await genFn({
        data: { deck_id: deckId, topic: topic.trim(), level: genLevel, count: Number(genCount) },
      })) as { inserted: number };
      toast.success(`Added ${res.inserted} AI flashcards`);
      setGenOpen(false);
      setTopic("");
      await queryClient.invalidateQueries({ queryKey: ["deck", deckId] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-3xl px-4 py-8">
          <Skeleton className="h-40 rounded-2xl" />
        </main>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-3xl px-4 py-8 text-center text-muted-foreground">
          Deck not found.
        </main>
      </div>
    );
  }

  if (reviewing) {
    return (
      <ReviewSession
        deckId={deckId}
        onExit={() => {
          setReviewing(false);
          queryClient.invalidateQueries({ queryKey: ["deck", deckId] });
        }}
      />
    );
  }

  const cards = data.cards as Card[];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link
          to="/flashcards"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All decks
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{data.deck.name}</h1>
            <p className="text-sm text-muted-foreground">{cards.length} cards</p>
          </div>
          <div className="flex gap-2">
            <Button variant="soft" onClick={() => setGenOpen(true)}>
              <Sparkles className="h-4 w-4" /> AI generate
            </Button>
            <Button variant="hero" onClick={() => setReviewing(true)} disabled={cards.length === 0}>
              <Play className="h-4 w-4" /> Review
            </Button>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Front (target language)"
            />
            <Input
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Back (translation)"
            />
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {cards.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
              No cards yet. Add some or use AI generate.
            </p>
          ) : (
            cards.map((c) => (
              <div
                key={c.id}
                className="group flex items-center justify-between rounded-xl border border-border bg-card p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {c.emoji && <span className="shrink-0 text-2xl leading-none">{c.emoji}</span>}
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.front}</p>
                    <p className="truncate text-sm text-muted-foreground">{c.back}</p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Delete card"
                  onClick={() => handleDelete(c.id)}
                  className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </main>

      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI flashcard generator</DialogTitle>
            <DialogDescription>Generate vocabulary cards for any topic.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Topic</label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="At the restaurant"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Level</label>
                <Select value={genLevel} onValueChange={setGenLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Count</label>
                <Select value={genCount} onValueChange={setGenCount}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["5", "8", "10", "12", "15"].map((n) => (
                      <SelectItem key={n} value={n}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setGenOpen(false)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}{" "}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type DueCard = {
  id: string;
  front: string;
  back: string;
  example: string | null;
  emoji: string | null;
};

function ReviewSession({ deckId, onExit }: { deckId: string; onExit: () => void }) {
  const getDue = useServerFn(getDueCards);
  const reviewFn = useServerFn(reviewCard);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);

  const { data: cards, isLoading } = useQuery({
    queryKey: ["due", deckId],
    queryFn: () => getDue({ data: { deckId } }) as Promise<DueCard[]>,
  });

  const rate = async (rating: number) => {
    if (!cards) return;
    await reviewFn({ data: { id: cards[idx].id, rating } });
    setDone((d) => d + 1);
    setFlipped(false);
    setIdx((i) => i + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-xl px-4 py-8">
        <button
          type="button"
          onClick={onExit}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> End session
        </button>
        {isLoading ? (
          <Skeleton className="h-64 rounded-2xl" />
        ) : !cards || cards.length === 0 || idx >= cards.length ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-soft">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Check className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-xl font-bold">All caught up!</h2>
            <p className="mt-1 text-muted-foreground">
              You reviewed {done} card{done === 1 ? "" : "s"}. Nice work.
            </p>
            <Button variant="hero" className="mt-5" onClick={onExit}>
              Back to deck
            </Button>
          </div>
        ) : (
          <div>
            <p className="mb-3 text-center text-sm text-muted-foreground">
              {idx + 1} / {cards.length}
            </p>
            <button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              className="flex min-h-64 w-full flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 text-center shadow-soft transition-transform active:scale-[0.99]"
            >
              {cards[idx].emoji && (
                <span className="mb-3 text-5xl leading-none">{cards[idx].emoji}</span>
              )}
              <p className="text-2xl font-bold">{flipped ? cards[idx].back : cards[idx].front}</p>
              {flipped && cards[idx].example && (
                <p className="mt-3 text-sm italic text-muted-foreground">{cards[idx].example}</p>
              )}
              {!flipped && (
                <span className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <RotateCcw className="h-3 w-3" /> Tap to flip
                </span>
              )}
            </button>
            {flipped ? (
              <div className="mt-4 grid grid-cols-4 gap-2">
                <Button variant="outline" onClick={() => rate(0)}>
                  Again
                </Button>
                <Button variant="outline" onClick={() => rate(1)}>
                  Hard
                </Button>
                <Button variant="outline" onClick={() => rate(2)}>
                  Good
                </Button>
                <Button variant="hero" onClick={() => rate(3)}>
                  Easy
                </Button>
              </div>
            ) : (
              <Button variant="hero" className="mt-4 w-full" onClick={() => setFlipped(true)}>
                Show answer
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
