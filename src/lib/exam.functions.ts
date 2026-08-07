import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateExamQuestions } from "@/lib/exam.server";
import { bumpXp, evaluateAchievements } from "@/lib/gamification.server";

const CefrLevel = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);
const QUESTION_COUNT = 12;
const PASS_THRESHOLD = 60;

/**
 * Generates a fresh CEFR-style exam, stores it (with hidden answer key) and
 * returns the new session id. The learner never receives the correct answers.
 */
export const startExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ language_code: z.string().min(2), level: CefrLevel }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    const { data: lang } = await supabase
      .from("languages")
      .select("name")
      .eq("code", data.language_code)
      .maybeSingle();
    const languageName = lang?.name ?? data.language_code;

    // Resolve the learner's native language for exam instructions.
    const { data: profile } = await supabase
      .from("profiles")
      .select("native_language_code")
      .eq("id", userId)
      .maybeSingle();
    let nativeName = "English";
    if (profile?.native_language_code) {
      const { data: nativeLang } = await supabase
        .from("languages")
        .select("name")
        .eq("code", profile.native_language_code)
        .maybeSingle();
      nativeName = nativeLang?.name ?? nativeName;
    }

    const questions = await generateExamQuestions(
      languageName,
      nativeName,
      data.level,
      QUESTION_COUNT,
    );
    if (questions.length < 4) {
      throw new Error("Could not generate the exam right now. Please try again.");
    }

    const { data: session, error } = await supabase
      .from("exam_sessions")
      .insert({
        user_id: userId,
        language_code: data.language_code,
        level: data.level,
        status: "in_progress",
        total_questions: questions.length,
        pass_threshold: PASS_THRESHOLD,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    // Questions (including the answer key) are written with the service role so
    // the answer key is never reachable through the learner's Data API access.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rows = questions.map((q, i) => ({
      session_id: session.id,
      order_index: i,
      section: q.section,
      prompt: q.prompt,
      options: q.options,
      correct_index: q.correct_index,
    }));
    const { error: qErr } = await supabaseAdmin.from("exam_questions").insert(rows);
    if (qErr) throw new Error(qErr.message);

    return { id: session.id as string };
  });

export const getExamSession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: session, error } = await supabase
      .from("exam_sessions")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!session) return null;

    // correct_index is not granted to the learner, so it cannot be selected here.
    const { data: questions, error: qErr } = await supabase
      .from("exam_questions")
      .select("id, order_index, section, prompt, options, user_answer")
      .eq("session_id", data.id)
      .order("order_index", { ascending: true });
    if (qErr) throw new Error(qErr.message);

    return { session, questions: questions ?? [] };
  });

export const listExamSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("exam_sessions")
      .select(
        "id, language_code, level, status, score_percent, passed, total_questions, correct_count, created_at, completed_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/**
 * Returns questions WITH the correct answer, but only for a COMPLETED exam that
 * belongs to the caller. Used to render the post-exam review screen.
 */
export const getExamReview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    // Ownership + completion enforced via the learner-scoped client (RLS).
    const { data: session, error } = await supabase
      .from("exam_sessions")
      .select("status")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!session) throw new Error("Exam not found");
    if (session.status !== "completed") return { questions: [] };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: questions, error: qErr } = await supabaseAdmin
      .from("exam_questions")
      .select("id, order_index, section, prompt, options, user_answer, correct_index")
      .eq("session_id", data.id)
      .order("order_index", { ascending: true });
    if (qErr) throw new Error(qErr.message);
    return { questions: questions ?? [] };
  });

export const submitExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        answers: z.array(z.number().int().min(0).max(3).nullable()).min(1).max(50),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    const { data: session, error } = await supabase
      .from("exam_sessions")
      .select("id, status, pass_threshold, total_questions, level, language_code")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!session) throw new Error("Exam not found");
    if (session.status === "completed") throw new Error("This exam was already submitted");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: questions, error: qErr } = await supabaseAdmin
      .from("exam_questions")
      .select("id, order_index, correct_index")
      .eq("session_id", data.id)
      .order("order_index", { ascending: true });
    if (qErr) throw new Error(qErr.message);

    const qs = questions ?? [];
    let correct = 0;
    for (let i = 0; i < qs.length; i++) {
      const ans = data.answers[i] ?? null;
      if (ans !== null && ans === qs[i].correct_index) correct += 1;
      await supabaseAdmin.from("exam_questions").update({ user_answer: ans }).eq("id", qs[i].id);
    }

    const total = qs.length || session.total_questions || 1;
    const percent = Math.round((correct / total) * 100);
    const threshold = session.pass_threshold ?? PASS_THRESHOLD;
    const passed = percent >= threshold;

    const { error: upErr } = await supabaseAdmin
      .from("exam_sessions")
      .update({
        status: "completed",
        correct_count: correct,
        score_percent: percent,
        passed,
        completed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (upErr) throw new Error(upErr.message);

    // Reward XP using the learner-scoped client so RLS on user_stats applies.
    await bumpXp(supabase, userId, passed ? 50 : 10);
    if (passed) {
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "achievement",
        title: `${session.level} certificate earned!`,
        body: `You passed the ${session.level} exam with ${percent}%. +50 XP`,
        icon: "award",
        link: "/exams",
      });
    }
    await evaluateAchievements(supabase, userId);

    return { correct, total, percent, passed, threshold };
  });
