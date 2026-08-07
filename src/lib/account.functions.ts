import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { evaluateAchievements } from "@/lib/gamification.server";

const CefrLevel = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);

/** Saves the learner's chosen animated AI teacher avatar. */
export const updateTeacherAvatar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        avatar: z.enum(["nova", "hoot", "bao", "kit", "milo", "sage"]),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ teacher_avatar: data.avatar })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true, avatar: data.avatar };
  });

/** Completes the onboarding wizard: sets profile prefs + enrolls first course. */
export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        display_name: z.string().min(1).max(60).optional(),
        native_language_code: z.string().min(2).max(8),
        target_language_code: z.string().min(2).max(8),
        level: CefrLevel,
        daily_goal_minutes: z.number().int().min(5).max(120),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    const { error: pErr } = await supabase
      .from("profiles")
      .update({
        native_language_code: data.native_language_code,
        daily_goal_minutes: data.daily_goal_minutes,
        onboarding_completed: true,
        ...(data.display_name ? { display_name: data.display_name } : {}),
      })
      .eq("id", userId);
    if (pErr) throw new Error(pErr.message);

    // Enroll the first course (ignore duplicates).
    const { data: existing } = await supabase
      .from("user_courses")
      .select("id")
      .eq("user_id", userId)
      .eq("language_code", data.target_language_code)
      .maybeSingle();

    if (!existing) {
      const { error: cErr } = await supabase.from("user_courses").insert({
        user_id: userId,
        language_code: data.target_language_code,
        level: data.level,
      });
      if (cErr && !cErr.message.includes("duplicate")) throw new Error(cErr.message);
    }

    await evaluateAchievements(supabase, userId);
    return { ok: true };
  });

/** Returns a consolidated account snapshot: profile, roles, subscription. */
export const getMyAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [profileRes, rolesRes, subRes] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "display_name, username, avatar_url, native_language_code, daily_goal_minutes, onboarding_completed, teacher_avatar",
        )
        .eq("id", userId)
        .maybeSingle(),

      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase
        .from("subscribers")
        .select("tier, status, current_period_end")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    const roles = ((rolesRes.data ?? []) as { role: string }[]).map((r) => r.role);

    // Is there any admin at all? (controls the bootstrap CTA)
    let adminExists = true;
    if (!roles.includes("admin")) {
      const { count } = await supabase
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin");
      adminExists = (count ?? 0) > 0;
    }

    return {
      profile: profileRes.data ?? null,
      roles,
      isAdmin: roles.includes("admin"),
      adminExists,
      subscription: subRes.data ?? { tier: "free", status: "active", current_period_end: null },
    };
  });

/** Evaluates + returns the full achievements catalog with earned status. */
export const getAchievements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const newlyEarned = await evaluateAchievements(supabase, userId);

    const [catalogRes, earnedRes] = await Promise.all([
      supabase.from("achievements").select("*").order("sort_order"),
      supabase.from("user_achievements").select("achievement_id, earned_at").eq("user_id", userId),
    ]);

    const earnedMap = new Map(
      ((earnedRes.data ?? []) as { achievement_id: string; earned_at: string }[]).map((r) => [
        r.achievement_id,
        r.earned_at,
      ]),
    );

    const items = ((catalogRes.data ?? []) as any[]).map((a) => ({
      ...a,
      earned: earnedMap.has(a.id),
      earned_at: earnedMap.get(a.id) ?? null,
    }));

    return { items, newlyEarned };
  });

/** Demo subscription toggle. Real Stripe checkout can replace this server fn. */
export const setSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ tier: z.enum(["free", "pro"]) }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const periodEnd =
      data.tier === "pro" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null;

    const { error } = await supabase.from("subscribers").upsert(
      {
        user_id: userId,
        tier: data.tier,
        status: "active",
        current_period_end: periodEnd,
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true, tier: data.tier };
  });

/** Bootstrap: grant admin to the caller iff no admin exists yet. */
export const claimAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase.rpc("claim_first_admin", { _user_id: userId });
    if (error) throw new Error(error.message);
    return { granted: data === true };
  });
