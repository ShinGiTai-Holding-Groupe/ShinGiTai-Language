import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const CefrLevel = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);

// Resolve the learner's native language name (defaults to English).
async function getNativeName(supabase: SupabaseClient<Database>, userId: string): Promise<string> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("native_language_code")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.native_language_code) return "English";
  const { data: nativeLang } = await supabase
    .from("languages")
    .select("name")
    .eq("code", profile.native_language_code)
    .maybeSingle();
  return nativeLang?.name ?? "English";
}

// Level-appropriate topic sets for auto-generated starter decks.
const STARTER_TOPICS: Record<string, string> = {
  A1: "essential everyday words: greetings, numbers, common objects, family, food and drinks, days and colours",
  A2: "everyday life: shopping, travel, directions, daily routines, weather, hobbies and simple past-tense verbs",
  B1: "work and study, opinions and feelings, health, technology, travel plans and common phrasal expressions",
  B2: "abstract topics: environment, media, culture, relationships, argument connectors and nuanced adjectives",
  C1: "advanced vocabulary: politics, economics, science, idioms, formal register and precise synonyms",
  C2: "near-native mastery: rare idioms, literary and academic vocabulary, subtle connotations and collocations",
};

export const listDecks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: decks, error } = await supabase
      .from("flashcard_decks")
      .select("id, name, description, language_code, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);

    const today = new Date().toISOString().slice(0, 10);
    const { data: cards } = await supabase
      .from("flashcards")
      .select("deck_id, due_date")
      .eq("user_id", userId);

    const counts: Record<string, { total: number; due: number }> = {};
    for (const c of cards ?? []) {
      const entry = (counts[c.deck_id] ??= { total: 0, due: 0 });
      entry.total += 1;
      if (c.due_date <= today) entry.due += 1;
    }

    return (decks ?? []).map((d) => ({
      ...d,
      total: counts[d.id]?.total ?? 0,
      due: counts[d.id]?.due ?? 0,
    }));
  });

export const createDeck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().min(1).max(80),
        language_code: z.string().min(2),
        description: z.string().max(300).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("flashcard_decks")
      .insert({
        user_id: userId,
        name: data.name,
        language_code: data.language_code,
        description: data.description ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteDeck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("flashcard_decks")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getDeck = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: deck, error } = await supabase
      .from("flashcard_decks")
      .select("id, name, description, language_code")
      .eq("id", data.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!deck) return null;

    const { data: cards, error: cardsError } = await supabase
      .from("flashcards")
      .select("id, front, back, example, emoji, due_date, repetitions")
      .eq("deck_id", data.id)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (cardsError) throw new Error(cardsError.message);

    return { deck, cards: cards ?? [] };
  });

export const addCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        deck_id: z.string().uuid(),
        front: z.string().min(1).max(200),
        back: z.string().min(1).max(200),
        example: z.string().max(300).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("flashcards").insert({
      deck_id: data.deck_id,
      user_id: userId,
      front: data.front,
      back: data.back,
      example: data.example ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("flashcards")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getDueCards = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ deckId: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const today = new Date().toISOString().slice(0, 10);
    const { data: cards, error } = await supabase
      .from("flashcards")
      .select("id, front, back, example, emoji, ease_factor, interval_days, repetitions")
      .eq("deck_id", data.deckId)
      .eq("user_id", userId)
      .lte("due_date", today)
      .order("due_date", { ascending: true })
      .limit(50);
    if (error) throw new Error(error.message);
    return cards ?? [];
  });

// SM-2 review. quality: 0 again, 1 hard, 2 good, 3 easy
const QUALITY_MAP = [2, 3, 4, 5];

export const reviewCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        rating: z.number().int().min(0).max(3),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: card, error } = await supabase
      .from("flashcards")
      .select("id, ease_factor, interval_days, repetitions")
      .eq("id", data.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!card) throw new Error("Card not found");

    const quality = QUALITY_MAP[data.rating];
    let { ease_factor, interval_days, repetitions } = card;

    if (quality < 3) {
      repetitions = 0;
      interval_days = 1;
    } else {
      if (repetitions === 0) interval_days = 1;
      else if (repetitions === 1) interval_days = 6;
      else interval_days = Math.round(interval_days * Number(ease_factor));
      repetitions += 1;
    }
    ease_factor =
      Math.round(
        (Math.max(
          1.3,
          Number(ease_factor) + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
        ) +
          Number.EPSILON) *
          100,
      ) / 100;

    const due = new Date();
    due.setUTCDate(due.getUTCDate() + interval_days);
    const due_date = due.toISOString().slice(0, 10);

    const { error: updError } = await supabase
      .from("flashcards")
      .update({
        ease_factor,
        interval_days,
        repetitions,
        due_date,
        last_reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (updError) throw new Error(updError.message);

    // small XP reward
    await bumpXp(supabase, userId, 2);

    return { ok: true, interval_days };
  });

export const generateFlashcards = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        deck_id: z.string().uuid(),
        topic: z.string().min(1).max(120),
        level: CefrLevel,
        count: z.number().int().min(3).max(15),
      })
      .parse(input),
  )
  .handler(async () => {
    throw new Error(
      "AI flashcard generation is quarantined until an accepted OdynAI application contract is available",
    );
  });

export const createStarterDeck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ language_code: z.string().min(2), level: CefrLevel }).parse(input),
  )
  .handler(async () => {
    throw new Error(
      "AI starter-deck generation is quarantined until an accepted OdynAI application contract is available",
    );
  });

async function bumpXp(supabase: SupabaseClient<Database>, userId: string, amount: number) {
  const { data: stats } = await supabase
    .from("user_stats")
    .select("total_xp")
    .eq("user_id", userId)
    .maybeSingle();
  const current = stats?.total_xp ?? 0;
  await supabase
    .from("user_stats")
    .update({
      total_xp: current + amount,
      last_activity_date: new Date().toISOString().slice(0, 10),
    })
    .eq("user_id", userId);
}
