// Shared server-side gamification helpers: XP + streaks + achievements.
// Not a server function file — imported by server functions only.

type AnySupabase = { from: (t: string) => any };

const DAY_MS = 24 * 60 * 60 * 1000;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function yesterdayStr() {
  return new Date(Date.now() - DAY_MS).toISOString().slice(0, 10);
}

/**
 * Adds XP and maintains the daily streak. Safe to call multiple times per day
 * (streak only increments on the first activity of a new day).
 */
export async function bumpXp(supabase: AnySupabase, userId: string, amount: number) {
  const { data: stats } = await supabase
    .from("user_stats")
    .select("total_xp, current_streak, longest_streak, last_activity_date")
    .eq("user_id", userId)
    .maybeSingle();

  const today = todayStr();
  const last: string | null = stats?.last_activity_date ?? null;

  let streak = stats?.current_streak ?? 0;
  if (last !== today) {
    streak = last === yesterdayStr() ? streak + 1 : 1;
  }
  const longest = Math.max(stats?.longest_streak ?? 0, streak);

  await supabase
    .from("user_stats")
    .update({
      total_xp: (stats?.total_xp ?? 0) + Math.max(0, amount),
      current_streak: streak,
      longest_streak: longest,
      last_activity_date: today,
    })
    .eq("user_id", userId);
}

type Achievement = {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  threshold: number;
  xp_reward: number;
};

/**
 * Evaluates all achievements for a user against their current metrics, grants
 * any newly-earned ones (and their reward XP), and returns the newly earned rows.
 */
export async function evaluateAchievements(
  supabase: AnySupabase,
  userId: string,
): Promise<Achievement[]> {
  const [
    catalogRes,
    earnedRes,
    statsRes,
    profileRes,
    lessonsRes,
    quizzesRes,
    perfectRes,
    convosRes,
    cardsRes,
  ] = await Promise.all([
    supabase.from("achievements").select("*").order("sort_order"),
    supabase.from("user_achievements").select("achievement_id").eq("user_id", userId),
    supabase
      .from("user_stats")
      .select("total_xp, current_streak")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("profiles").select("onboarding_completed").eq("id", userId).maybeSingle(),
    supabase
      .from("user_lesson_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("completed", true),
    supabase
      .from("user_quiz_attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase.from("user_quiz_attempts").select("id, score, total").eq("user_id", userId),
    supabase
      .from("tutor_conversations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("flashcards")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .not("last_reviewed_at", "is", null),
  ]);

  const catalog = (catalogRes.data ?? []) as Achievement[];
  const earnedIds = new Set(
    ((earnedRes.data ?? []) as { achievement_id: string }[]).map((r) => r.achievement_id),
  );

  const totalXp = statsRes.data?.total_xp ?? 0;
  const streak = statsRes.data?.current_streak ?? 0;
  const onboarded = profileRes.data?.onboarding_completed === true;
  const lessonsDone = lessonsRes.count ?? 0;
  const quizCount = quizzesRes.count ?? 0;
  const hasPerfect = ((perfectRes.data ?? []) as { score: number; total: number }[]).some(
    (a) => a.total > 0 && a.score === a.total,
  );
  const convoCount = convosRes.count ?? 0;
  const cardsReviewed = cardsRes.count ?? 0;

  const meets = (code: string, threshold: number): boolean => {
    switch (code) {
      case "first_steps":
        return onboarded;
      case "streak_3":
      case "streak_7":
      case "streak_30":
        return streak >= threshold;
      case "xp_100":
      case "xp_500":
      case "xp_2000":
        return totalXp >= threshold;
      case "lessons_1":
      case "lessons_10":
        return lessonsDone >= threshold;
      case "quiz_1":
        return quizCount >= threshold;
      case "quiz_perfect":
        return hasPerfect;
      case "tutor_1":
        return convoCount >= threshold;
      case "cards_50":
        return cardsReviewed >= threshold;
      default:
        return false;
    }
  };

  const newlyEarned: Achievement[] = [];
  for (const a of catalog) {
    if (earnedIds.has(a.id)) continue;
    if (!meets(a.code, a.threshold)) continue;

    const { error } = await supabase
      .from("user_achievements")
      .insert({ user_id: userId, achievement_id: a.id });
    if (!error) newlyEarned.push(a);
  }

  // Award reward XP for newly earned achievements (direct, to avoid re-trigger loops).
  const rewardTotal = newlyEarned.reduce((sum, a) => sum + (a.xp_reward ?? 0), 0);
  if (rewardTotal > 0) {
    const { data: s } = await supabase
      .from("user_stats")
      .select("total_xp")
      .eq("user_id", userId)
      .maybeSingle();
    await supabase
      .from("user_stats")
      .update({ total_xp: (s?.total_xp ?? 0) + rewardTotal })
      .eq("user_id", userId);
  }

  // Drop an in-app notification for each newly earned badge.
  if (newlyEarned.length > 0) {
    await supabase.from("notifications").insert(
      newlyEarned.map((a) => ({
        user_id: userId,
        type: "achievement",
        title: `Badge unlocked: ${a.title}`,
        body: `${a.description} +${a.xp_reward} XP`,
        icon: a.icon,
        link: "/achievements",
      })),
    );
  }

  return newlyEarned;
}
