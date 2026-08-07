import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CefrLevel = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);
const Mode = z.enum(["conversation", "teacher"]);

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ mode: Mode.optional() }).parse(input ?? {}))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    let query = supabase
      .from("tutor_conversations")
      .select("id, title, language_code, level, mode, updated_at")
      .eq("user_id", userId);
    if (data.mode) query = query.eq("mode", data.mode);
    const { data: rows, error } = await query.order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        language_code: z.string().min(2),
        level: CefrLevel,
        mode: Mode.optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const mode = data.mode ?? "conversation";
    const { data: row, error } = await supabase
      .from("tutor_conversations")
      .insert({
        user_id: userId,
        language_code: data.language_code,
        level: data.level,
        mode,
        title: mode === "teacher" ? "New lesson" : "New conversation",
      })
      .select("id, title, language_code, level, mode, updated_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const getConversation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: conversation, error } = await supabase
      .from("tutor_conversations")
      .select("id, title, language_code, level, mode, updated_at")
      .eq("id", data.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!conversation) return null;

    const { data: rows, error: msgError } = await supabase
      .from("tutor_messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", data.id)
      .order("created_at", { ascending: true });
    if (msgError) throw new Error(msgError.message);

    const messages = (rows ?? [])
      .filter((r) => r.role === "user" || r.role === "assistant")
      .map((r) => ({
        id: r.id,
        role: r.role as "user" | "assistant",
        parts: [{ type: "text" as const, text: r.content }],
      }));

    return { conversation, messages };
  });

export const renameConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), title: z.string().min(1).max(80) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("tutor_conversations")
      .update({ title: data.title })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("tutor_conversations")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
