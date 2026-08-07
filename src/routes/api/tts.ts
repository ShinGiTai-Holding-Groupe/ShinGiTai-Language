import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async () =>
        new Response(
          "Speech generation is unavailable until an accepted OdynAI application contract is available.",
          { status: 503 },
        ),
    },
  },
});
