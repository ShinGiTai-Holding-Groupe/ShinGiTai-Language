import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import tutorImg from "@/assets/hero-tutor.jpg";

export const Route = createFileRoute("/_authenticated/tutor/")({
  component: TutorEmpty,
});

function TutorEmpty() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
      <img
        src={tutorImg}
        alt="AI tutor"
        className="mb-6 h-28 w-28 rounded-3xl object-cover shadow-elegant"
      />
      <h2 className="text-2xl font-bold tracking-tight">Your AI conversation tutor</h2>
      <p className="mt-2 max-w-md text-muted-foreground">
        Practice real conversations in any language. The tutor adapts to your level, corrects your
        mistakes, and keeps you talking. Pick a conversation on the left or start a new one.
      </p>
      <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
        <MessageCircle className="h-4 w-4" /> Select or create a conversation to begin
      </div>
    </div>
  );
}
