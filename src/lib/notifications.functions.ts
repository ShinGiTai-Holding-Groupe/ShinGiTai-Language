import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  icon: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

/** Lists the current user's notifications (newest first). */
export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ items: NotificationRow[]; unread: number }> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, title, body, icon, link, is_read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    const items = (data ?? []) as NotificationRow[];
    return { items, unread: items.filter((n) => !n.is_read).length };
  });

/** Marks one notification (or all when no id) as read. */
export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid().optional() }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    let q = supabase.from("notifications").update({ is_read: true }).eq("user_id", userId);
    if (data.id) q = q.eq("id", data.id);
    else q = q.eq("is_read", false);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Clears all of the current user's notifications. */
export const clearNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("notifications").delete().eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
