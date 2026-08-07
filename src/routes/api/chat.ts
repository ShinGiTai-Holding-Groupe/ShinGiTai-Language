import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async () =>
        new Response(
          "Language AI is unavailable until the accepted OdynAI Hikari application contract is consumable.",
          { status: 503 },
        ),
    },
  },
});
