import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { bumpXp, evaluateAchievements } from "@/lib/gamification.server";

export const markLessonComplete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ lesson_id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    const { data: existing } = await supabase
      .from("user_lesson_progress")
      .select("id, completed")
      .eq("user_id", userId)
      .eq("lesson_id", data.lesson_id)
      .maybeSingle();

    const alreadyDone = existing?.completed === true;

    const { error } = await supabase.from("user_lesson_progress").upsert(
      {
        user_id: userId,
        lesson_id: data.lesson_id,
        completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" },
    );
    if (error) throw new Error(error.message);

    if (!alreadyDone) {
      await bumpXp(supabase, userId, 15);
      await evaluateAchievements(supabase, userId);
    }
    return { ok: true, awarded: alreadyDone ? 0 : 15 };
  });

export const submitQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        quiz_id: z.string().uuid(),
        answers: z.array(z.number().int()).min(1),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    const { data: quiz, error: quizErr } = await supabase
      .from("quizzes")
      .select("id, xp_reward")
      .eq("id", data.quiz_id)
      .maybeSingle();
    if (quizErr) throw new Error(quizErr.message);
    if (!quiz) throw new Error("Quiz not found");

    const { data: questions, error: qErr } = await supabase
      .from("quiz_questions")
      .select("id, correct_index, explanation, prompt, options, sort_order")
      .eq("quiz_id", data.quiz_id)
      .order("sort_order", { ascending: true });
    if (qErr) throw new Error(qErr.message);
    if (!questions || questions.length === 0) throw new Error("Quiz has no questions");

    let score = 0;
    const results = questions.map((q, i) => {
      const chosen = data.answers[i];
      const correct = chosen === q.correct_index;
      if (correct) score += 1;
      return {
        question_id: q.id,
        correct,
        correct_index: q.correct_index,
        chosen_index: chosen ?? -1,
        explanation: q.explanation,
      };
    });

    const total = questions.length;
    const xpEarned = Math.round((score / total) * quiz.xp_reward);

    const { error: attErr } = await supabase.from("user_quiz_attempts").insert({
      user_id: userId,
      quiz_id: data.quiz_id,
      score,
      total,
      xp_earned: xpEarned,
    });
    if (attErr) throw new Error(attErr.message);

    if (xpEarned > 0) await bumpXp(supabase, userId, xpEarned);
    await evaluateAchievements(supabase, userId);

    return { score, total, xpEarned, results };
  });
