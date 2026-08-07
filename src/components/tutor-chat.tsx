import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  AlertCircle,
  Volume2,
  VolumeX,
  Square,
  Loader2,
  MessageCircle,
  UserRound,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { TeacherAvatar } from "@/components/teacher-avatar";
import { TeacherAvatarPicker } from "@/components/teacher-avatar-picker";
import { useSpeak } from "@/lib/use-speak";

function textOf(m: UIMessage): string {
  return m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

function formatLanguageCode(code: string) {
  return code.trim().toUpperCase() || "LANGUAGE";
}

function lessonPhaseLabel(messageCount: number, isBusy: boolean) {
  if (isBusy) return "Teacher is responding";
  if (messageCount === 0) return "Ready to begin";
  if (messageCount < 4) return "Warm-up";
  return "In progress";
}

function teacherFlowHint(messageCount: number, isBusy: boolean) {
  if (isBusy) {
    return {
      label: "Teacher turn",
      body: "Wait for the response before sending the next answer.",
    };
  }

  if (messageCount === 0) {
    return {
      label: "Step 1",
      body: "Send the starter message to begin the guided lesson.",
    };
  }

  if (messageCount < 4) {
    return {
      label: "Step 2",
      body: "Answer briefly, then let the teacher correct one thing at a time.",
    };
  }

  return {
    label: "Step 3",
    body: "Continue practice or ask for a recap when you feel ready.",
  };
}

function teacherStarterPrompt(languageLabel: string, level: string) {
  return `Let's start my ${languageLabel} ${level} lesson. Give me a short explanation, then one small exercise.`;
}

function teacherReviewPrompt(languageLabel: string, level: string) {
  return `Review my ${languageLabel} ${level} lesson. Summarize what I did well, correct my biggest mistake, and give me one next step.`;
}

function teacherExercisePrompt(languageLabel: string, level: string) {
  return `Give me one ${languageLabel} ${level} exercise now. Keep it short, then wait for my answer before correcting it.`;
}

function teacherInputPlaceholder(messageCount: number, isBusy: boolean) {
  if (isBusy) return "Wait for the teacher response…";
  if (messageCount === 0) return "Paste the starter message or ask what to learn first…";
  if (messageCount < 4) return "Answer in one or two short sentences…";
  return "Reply, ask for examples, or request a harder exercise…";
}

function teacherInputHint(messageCount: number) {
  if (messageCount === 0) return "Start simple. The teacher will adjust after your first answer.";
  if (messageCount < 4) return "Short answers are okay — corrections come after each step.";
  return "You can ask for pronunciation help, grammar notes, or a quick recap anytime.";
}

function teacherVoiceHelper(autoSpeak: boolean, speaking: boolean, loading: boolean) {
  if (loading) return "Preparing the teacher voice…";
  if (speaking) return "Teacher is speaking. You can stop playback anytime.";
  if (autoSpeak) return "Voice is on. New teacher replies will play automatically.";
  return "Voice is off. Use Listen on any teacher reply when you want audio.";
}

function teacherErrorRecoveryCopy(errorMessage: string) {
  if (errorMessage.includes("429")) {
    return {
      title: "Teacher is cooling down",
      body: "Too many requests were sent at once. Wait a moment, then send the same answer again.",
      tip: "Small retry tip: keep your next message short so the lesson can recover quickly.",
    };
  }

  if (errorMessage.includes("402")) {
    return {
      title: "AI credits need attention",
      body: "The teacher could not continue because AI credits appear to be exhausted.",
      tip: "Your lesson is still here, so you can continue after credits are restored.",
    };
  }

  return {
    title: "Teacher response failed",
    body: "The lesson did not get a response. Your chat was not cleared, so you can try again with the same answer.",
    tip: "If it happens twice, ask for a shorter explanation or a simpler exercise.",
  };
}

function teacherMessageContentClass(role: UIMessage["role"]) {
  if (role === "assistant") {
    return "w-full rounded-2xl border border-border bg-card px-4 py-3 shadow-soft";
  }

  return "max-w-[88%] leading-6";
}

const teacherMessageResponseClass = "leading-7 [&_li]:my-1 [&_ol]:my-2 [&_p]:my-2 [&_ul]:my-2";

export function TutorChatWindow({
  conversationId,
  initialMessages,
  title,
  languageCode,
  level,
  mode,
  avatarVariant,
}: {
  conversationId: string;
  initialMessages: UIMessage[];
  title: string;
  languageCode: string;
  level: string;
  mode: "conversation" | "teacher";
  avatarVariant?: string | null;
}) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { speak, stop, activeId, loadingId } = useSpeak();
  const [autoSpeak, setAutoSpeak] = useState(mode === "teacher");
  const lastSpokenRef = useRef<string | null>(null);
  const isTeacher = mode === "teacher";

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: async ({ messages }) => {
          const { data } = await supabase.auth.getSession();
          return {
            headers: {
              Authorization: `Bearer ${data.session?.access_token ?? ""}`,
            },
            body: { messages, conversationId },
          };
        },
      }),
    [conversationId],
  );

  const { messages, sendMessage, status, error } = useChat({
    id: conversationId,
    messages: initialMessages,
    transport,
    onError: (e) => {
      const msg = e?.message ?? "";
      if (msg.includes("429")) toast.error("Too many requests. Please wait a moment.");
      else if (msg.includes("402")) toast.error("AI credits exhausted. Please add credits.");
      else toast.error("Something went wrong. Please try again.");
    },
    onFinish: () => {
      void queryClient.invalidateQueries({ queryKey: ["tutor-conversations"] });
      void queryClient.invalidateQueries({ queryKey: ["tutor-conversation", conversationId] });
      inputRef.current?.focus();
    },
  });

  const isBusy = status === "submitted" || status === "streaming";
  const safeTitle = title.trim() || (isTeacher ? "Guided lesson" : "Conversation practice");
  const safeLevel = level.trim() || "A1";
  const languageLabel = formatLanguageCode(languageCode);
  const phaseLabel = lessonPhaseLabel(messages.length, isBusy);
  const lessonFlowHint = teacherFlowHint(messages.length, isBusy);
  const starterPrompt = teacherStarterPrompt(languageLabel, safeLevel);
  const reviewPrompt = teacherReviewPrompt(languageLabel, safeLevel);
  const exercisePrompt = teacherExercisePrompt(languageLabel, safeLevel);
  const lastMessage = messages[messages.length - 1];
  const lastMessageIsAssistant = lastMessage?.role === "assistant";
  const shouldShowExercisePrompt =
    isTeacher &&
    messages.length >= 2 &&
    messages.length < 6 &&
    status === "ready" &&
    lastMessageIsAssistant;
  const shouldShowReviewPrompt =
    isTeacher && messages.length >= 6 && status === "ready" && lastMessageIsAssistant;
  const inputPlaceholder = isTeacher
    ? teacherInputPlaceholder(messages.length, isBusy)
    : "Type your message…";
  const inputHint = teacherInputHint(messages.length);
  const recoveryCopy = teacherErrorRecoveryCopy(error?.message ?? "");

  useEffect(() => {
    inputRef.current?.focus();
  }, [conversationId]);

  // Auto-speak the latest assistant reply when voice is enabled.
  useEffect(() => {
    if (!autoSpeak) return;
    if (status !== "ready") return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") return;
    if (last.id === lastSpokenRef.current) return;
    const text = textOf(last);
    if (!text) return;
    lastSpokenRef.current = last.id;
    void speak(last.id, text);
  }, [messages, status, autoSpeak, speak]);

  const handleSubmit = (message: { text: string; files: unknown[] }, event: FormEvent) => {
    event.preventDefault();
    const text = message.text.trim();
    if (!text || isBusy) return;
    void sendMessage({ text });
  };

  const speaking = activeId !== null;
  const voiceLoading = loadingId !== null;
  const voiceHelper = teacherVoiceHelper(autoSpeak, speaking, voiceLoading);
  const HeaderIcon = MessageCircle;

  return (
    <div className="flex h-full w-full flex-col">
      <header className="border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {isTeacher ? (
              <TeacherAvatar
                variant={avatarVariant}
                speaking={speaking}
                className="h-12 w-12 shrink-0"
              />
            ) : (
              <HeaderIcon className="h-5 w-5 shrink-0 text-primary" />
            )}
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h1 className="truncate text-base font-semibold">{safeTitle}</h1>
                {isTeacher && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    <BookOpen className="h-3.5 w-3.5" /> Guided lesson
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">
                {languageLabel} · Level {safeLevel} · {phaseLabel}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {isTeacher && (
              <TeacherAvatarPicker
                trigger={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Change teacher avatar"
                  >
                    <UserRound className="h-4 w-4" />
                  </Button>
                }
              />
            )}
            <Button
              type="button"
              variant={autoSpeak ? "soft" : "ghost"}
              size="sm"
              aria-label={autoSpeak ? "Turn teacher voice off" : "Turn teacher voice on"}
              aria-pressed={autoSpeak}
              title={voiceHelper}
              onClick={() => {
                if (autoSpeak) stop();
                setAutoSpeak((v) => !v);
              }}
            >
              {autoSpeak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              <span className="hidden sm:inline">{autoSpeak ? "Voice on" : "Voice off"}</span>
            </Button>
          </div>
        </div>

        {isTeacher && (
          <>
            <div className="mt-3 rounded-2xl border border-border bg-card/80 px-3 py-2 text-xs shadow-soft">
              <p className="font-semibold text-foreground">{lessonFlowHint.label}</p>
              <p className="mt-0.5 text-muted-foreground">{lessonFlowHint.body}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border bg-card px-2.5 py-1">
                Follow the teacher prompt
              </span>
              <span className="rounded-full border border-border bg-card px-2.5 py-1">
                Answer in short steps
              </span>
              <span className="rounded-full border border-border bg-card px-2.5 py-1">
                Ask for examples anytime
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
              {voiceHelper}
            </p>
          </>
        )}
      </header>

      <Conversation className="flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl">
          {messages.length === 0 &&
            (isTeacher ? (
              <div className="mx-auto max-w-xl py-10 text-center">
                <p className="text-sm font-semibold text-foreground">Ready for your first step?</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Send the starter message below and the teacher will begin with a short
                  explanation, one small exercise, and corrections after your answer.
                </p>
                <div className="mt-5 rounded-2xl border border-border bg-card p-4 text-left shadow-soft">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Starter message
                  </p>
                  <p className="mt-2 text-sm text-foreground">{starterPrompt}</p>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  You can also ask for easier examples, slower pacing, or more speaking practice at
                  any time.
                </p>
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Say hello to start practicing! Try writing a greeting in your target language.
              </div>
            ))}
          {messages.map((m) => {
            const text = textOf(m);
            return (
              <Message from={m.role} key={m.id} className={isTeacher ? "max-w-full" : undefined}>
                <MessageContent
                  className={isTeacher ? teacherMessageContentClass(m.role) : undefined}
                >
                  <MessageResponse className={isTeacher ? teacherMessageResponseClass : undefined}>
                    {text}
                  </MessageResponse>
                </MessageContent>
                {m.role === "assistant" && text && (
                  <MessageActions>
                    <MessageAction
                      tooltip={activeId === m.id ? "Stop teacher voice" : "Listen to teacher reply"}
                      onClick={() => (activeId === m.id ? stop() : speak(m.id, text))}
                    >
                      {loadingId === m.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : activeId === m.id ? (
                        <Square className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </MessageAction>
                  </MessageActions>
                )}
              </Message>
            );
          })}
          {shouldShowExercisePrompt && (
            <div className="mx-auto my-5 max-w-xl rounded-2xl border border-border bg-card p-4 text-left shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Need the next exercise?
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Use this when the explanation is clear and you want one focused task instead of more
                theory.
              </p>
              <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-sm text-foreground">
                {exercisePrompt}
              </p>
            </div>
          )}
          {shouldShowReviewPrompt && (
            <div className="mx-auto my-5 max-w-xl rounded-2xl border border-border bg-card p-4 text-left shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Ready for a lesson review?
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                The teacher has enough context now. Ask for a recap while the latest correction is
                still fresh.
              </p>
              <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-sm text-foreground">
                {reviewPrompt}
              </p>
            </div>
          )}
          {status === "submitted" && (
            <Message from="assistant">
              <MessageContent>
                <Shimmer>Thinking…</Shimmer>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border p-3">
        <PromptInput onSubmit={handleSubmit} className="mx-auto max-w-3xl">
          <PromptInputTextarea ref={inputRef} placeholder={inputPlaceholder} disabled={isBusy} />
          <PromptInputFooter className="items-center justify-between gap-3">
            {isTeacher && <p className="min-w-0 text-xs text-muted-foreground">{inputHint}</p>}
            <PromptInputSubmit status={status} disabled={isBusy} />
          </PromptInputFooter>
        </PromptInput>
        {error &&
          (isTeacher ? (
            <div
              role="alert"
              className="mx-auto mt-3 flex max-w-3xl gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-left"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-destructive">{recoveryCopy.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{recoveryCopy.body}</p>
                <p className="mt-2 text-xs font-medium text-foreground">{recoveryCopy.tip}</p>
              </div>
            </div>
          ) : (
            <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-destructive" role="alert">
              Failed to get a response. Please try again.
            </p>
          ))}
      </div>
    </div>
  );
}
