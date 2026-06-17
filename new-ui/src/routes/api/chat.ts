import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM = `You are Finexa, a premium AI financial coach inside a personal finance operating system.
Tone: warm, calm, confident, never preachy. Speak like a financial concierge — concise sentences, numbers in bold when helpful, 1–3 actionable suggestions max.
Context the user has connected: ~312 indexed transactions over the last 90 days, 4 active goals (Emergency Fund 68%, Tokyo Trip 42%, MacBook 89%, House DP 14%), monthly income ~$5,400, monthly expenses ~$3,168, savings rate ~41%, dining trending up 22% MoM.
When the user asks a financial question, ground answers in this context. If they ask something off-topic, gently redirect to money. Never invent specific account numbers or institution names. Use $ unless asked otherwise.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const { messages } = (await request.json()) as { messages: UIMessage[] };
        const gateway = createLovableAiGatewayProvider(key);

        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: SYSTEM,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse();
      },
    },
  },
});
