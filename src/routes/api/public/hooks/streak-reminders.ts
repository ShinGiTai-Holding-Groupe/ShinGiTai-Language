import { createFileRoute } from "@tanstack/react-router";

/**
 * Daily streak reminder job. Called by pg_cron.
 * Inserts a "keep your streak alive" notification for users who have an active
 * streak but have not practiced yet today. Authenticated via the Supabase
 * anon key in the `apikey` header (the /api/public/* prefix bypasses edge auth).
 */
export const Route = createFileRoute("/api/public/hooks/streak-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey =
          request.headers.get("apikey") ??
          request.headers.get("authorization")?.replace("Bearer ", "");
        if (!apikey || apikey !== process.env.SUPABASE_PUBLISHABLE_KEY) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const today = new Date().toISOString().slice(0, 10);

        // Users with an active streak who haven't practiced today.
        const { data: stale, error } = await supabaseAdmin
          .from("user_stats")
          .select("user_id, current_streak, last_activity_date")
          .gt("current_streak", 0)
          .or(`last_activity_date.is.null,last_activity_date.neq.${today}`)
          .limit(2000);

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const targets = (stale ?? []) as {
          user_id: string;
          current_streak: number;
          last_activity_date: string | null;
        }[];

        let inserted = 0;
        if (targets.length > 0) {
          // Avoid duplicate reminders: skip users who already got one today.
          const since = `${today}T00:00:00.000Z`;
          const { data: already } = await supabaseAdmin
            .from("notifications")
            .select("user_id")
            .eq("type", "streak")
            .gte("created_at", since);
          const sent = new Set(((already ?? []) as { user_id: string }[]).map((r) => r.user_id));

          const rows = targets
            .filter((t) => !sent.has(t.user_id))
            .map((t) => ({
              user_id: t.user_id,
              type: "streak",
              title: "Keep your streak alive! 🔥",
              body: `You're on a ${t.current_streak}-day streak. Practice today so you don't lose it.`,
              icon: "Flame",
              link: "/dashboard",
            }));

          if (rows.length > 0) {
            const { error: insErr } = await supabaseAdmin.from("notifications").insert(rows);
            if (insErr) {
              return new Response(JSON.stringify({ error: insErr.message }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
              });
            }
            inserted = rows.length;
          }
        }

        return new Response(JSON.stringify({ ok: true, reminded: inserted }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
