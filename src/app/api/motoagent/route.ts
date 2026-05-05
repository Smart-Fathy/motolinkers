// Streaming chat endpoint for the MotoAgent floating widget.
//
// Request body (JSON):
//   {
//     conversationId?: string  // first turn omits it; we create one
//     locale: "en" | "ar"
//     message: string
//   }
//
// Response: a `text/plain; charset=utf-8` stream of model token chunks.
// The client appends each chunk to the current assistant bubble. On
// success, the route also persists the user message + the full
// assistant reply back to motoagent_conversations.transcript and
// returns the conversation id via the X-Conversation-Id header.

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { readSession, setSessionCookies } from "@/lib/cookies";
import { cookies, headers } from "next/headers";
import {
  buildSystemPrompt,
  type MotoagentSettings,
} from "@/lib/motoagent/knowledge";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ChatBody {
  conversationId?: string;
  locale?: "en" | "ar";
  message?: string;
}

interface TranscriptMessage {
  role: "user" | "assistant";
  content: string;
  ts: string;
}

const TEXT_HEADERS: HeadersInit = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "no-store",
};

// Rough char-count cap on inbound messages so a runaway client can't
// blow the prompt budget. 4 KB is a generous user message ceiling.
const MAX_USER_MSG = 4 * 1024;

export async function POST(req: Request) {
  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }

  const message = String(body.message ?? "").trim();
  const locale: "en" | "ar" = body.locale === "ar" ? "ar" : "en";
  if (!message) {
    return NextResponse.json({ error: "empty-message" }, { status: 400 });
  }
  if (message.length > MAX_USER_MSG) {
    return NextResponse.json({ error: "message-too-long" }, { status: 413 });
  }

  // Cookies + session — recordPageEvent already does this; we mirror
  // the same dance so MotoAgent works on a fresh visit even if the
  // beacon hasn't fired.
  const cookieStore = await cookies();
  const headerStore = await headers();
  const session = readSession(cookieStore);
  setSessionCookies(cookieStore, session);
  const country = (headerStore.get("cf-ipcountry") ?? null)?.toUpperCase().slice(0, 2) ?? null;

  const supabase = createPublicClient();

  // Settings: fetch once per request. If the agent is disabled, hard
  // 503 so the widget hides itself on next reload.
  const settingsRes = await supabase
    .from("motoagent_settings")
    .select(
      "is_enabled, model, temperature, max_output_tokens, system_prompt_extra, daily_message_cap_per_session, per_minute_cap_per_session",
    )
    .eq("id", 1)
    .maybeSingle();
  if (settingsRes.error) {
    console.error("[motoagent] settings fetch error:", settingsRes.error);
    return NextResponse.json({ error: "settings-unavailable" }, { status: 500 });
  }
  const settings: MotoagentSettings | null =
    (settingsRes.data as unknown as MotoagentSettings | null) ?? null;
  if (!settings || !settings.is_enabled) {
    return NextResponse.json({ error: "disabled" }, { status: 503 });
  }

  // Rate limits — count messages from this session in the last
  // minute / day and bounce if over the configured caps.
  const oneMinAgo = new Date(Date.now() - 60_000).toISOString();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  const [perMinRes, perDayRes] = await Promise.all([
    supabase
      .from("motoagent_conversations")
      .select("id", { count: "exact", head: true })
      .eq("session_id", session.sessionId)
      .gte("last_message_at", oneMinAgo),
    supabase
      .from("motoagent_conversations")
      .select("message_count")
      .eq("session_id", session.sessionId)
      .gte("last_message_at", oneDayAgo),
  ]);
  if ((perMinRes.count ?? 0) > settings.per_minute_cap_per_session) {
    return NextResponse.json({ error: "rate-limit-minute" }, { status: 429 });
  }
  const dayCount = (perDayRes.data ?? []).reduce(
    (acc: number, r: { message_count: number }) => acc + (r.message_count ?? 0),
    0,
  );
  if (dayCount > settings.daily_message_cap_per_session) {
    return NextResponse.json({ error: "rate-limit-day" }, { status: 429 });
  }

  // Load or create the conversation row. We only honour conversationId
  // if it actually belongs to this session (defence-in-depth — RLS
  // already prevents cross-session reads).
  let conversationId: string | null = null;
  let transcript: TranscriptMessage[] = [];
  if (body.conversationId) {
    const convoRes = await supabase
      .from("motoagent_conversations")
      .select("id, session_id, transcript, message_count")
      .eq("id", body.conversationId)
      .maybeSingle();
    if (
      convoRes.data &&
      (convoRes.data as { session_id: string }).session_id === session.sessionId
    ) {
      conversationId = (convoRes.data as { id: string }).id;
      transcript = Array.isArray((convoRes.data as { transcript: unknown }).transcript)
        ? ((convoRes.data as { transcript: TranscriptMessage[] }).transcript)
        : [];
    }
  }

  const userMsg: TranscriptMessage = {
    role: "user",
    content: message,
    ts: new Date().toISOString(),
  };
  transcript = [...transcript, userMsg];

  if (!conversationId) {
    const insertRes = await supabase
      .from("motoagent_conversations")
      .insert({
        session_id: session.sessionId,
        locale,
        country,
        transcript,
        message_count: 1,
      })
      .select("id")
      .single();
    if (insertRes.error || !insertRes.data) {
      console.error("[motoagent] convo insert error:", insertRes.error);
      return NextResponse.json({ error: "convo-create-failed" }, { status: 500 });
    }
    conversationId = (insertRes.data as { id: string }).id;
  } else {
    await supabase
      .from("motoagent_conversations")
      .update({
        transcript,
        message_count: transcript.length,
        last_message_at: new Date().toISOString(),
      })
      .eq("id", conversationId);
  }

  // Build the prompt + call Workers AI.
  const systemPrompt = await buildSystemPrompt({
    locale,
    extras: settings.system_prompt_extra,
  });

  // Truncate the transcript we send to the model: keep the last 12
  // turns max so the prompt stays inside a reasonable budget even
  // for long conversations.
  const TURN_BUDGET = 12;
  const recentTranscript = transcript.slice(-TURN_BUDGET);

  const messagesForModel: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...recentTranscript.map((m) => ({ role: m.role, content: m.content })),
  ];

  const { env } = await getCloudflareContext({ async: true });
  const ai = (env as unknown as { AI?: WorkersAi }).AI;
  if (!ai) {
    console.error("[motoagent] AI binding missing");
    return NextResponse.json({ error: "ai-binding-missing" }, { status: 500 });
  }

  let aiStream: ReadableStream<Uint8Array> | null = null;
  try {
    const result = await ai.run(settings.model, {
      messages: messagesForModel,
      stream: true,
      temperature: settings.temperature,
      max_tokens: settings.max_output_tokens,
    });
    // Workers AI returns either a ReadableStream<Uint8Array> (when
    // stream:true) or an object with `.response`. Normalise to the
    // stream case here.
    if (result instanceof ReadableStream) {
      aiStream = result;
    } else if (
      typeof result === "object" &&
      result !== null &&
      "response" in result &&
      typeof (result as { response: unknown }).response === "string"
    ) {
      aiStream = wrapStaticString((result as { response: string }).response);
    } else {
      console.error("[motoagent] unexpected AI result shape:", result);
      return NextResponse.json({ error: "ai-bad-shape" }, { status: 500 });
    }
  } catch (e) {
    console.error("[motoagent] AI call threw:", e);
    return NextResponse.json({ error: "ai-call-failed" }, { status: 500 });
  }

  // Pipe the AI stream through to the client AND accumulate it for
  // persistence. Workers AI streams an SSE-shaped text stream of
  // `data: {"response": "tok"}` lines. We parse and re-emit the raw
  // tokens so the client can just append them to the bubble.
  const decoder = new TextDecoder();
  let accumulated = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = aiStream!.getReader();
      try {
        let buffered = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffered += decoder.decode(value, { stream: true });
          // SSE line-by-line — each line is `data: {...}` or empty.
          let newlineIdx;
          while ((newlineIdx = buffered.indexOf("\n")) !== -1) {
            const rawLine = buffered.slice(0, newlineIdx).trim();
            buffered = buffered.slice(newlineIdx + 1);
            if (!rawLine) continue;
            if (rawLine === "data: [DONE]") continue;
            if (!rawLine.startsWith("data:")) continue;
            try {
              const parsed = JSON.parse(rawLine.slice(5).trim()) as { response?: string };
              if (typeof parsed.response === "string" && parsed.response.length > 0) {
                accumulated += parsed.response;
                controller.enqueue(new TextEncoder().encode(parsed.response));
              }
            } catch {
              // skip malformed line
            }
          }
        }
      } catch (e) {
        console.error("[motoagent] stream pipe error:", e);
      } finally {
        controller.close();
        // Persist the assistant reply once streaming completes.
        if (accumulated && conversationId) {
          const finalTranscript: TranscriptMessage[] = [
            ...transcript,
            { role: "assistant", content: accumulated, ts: new Date().toISOString() },
          ];
          const updateRes = await supabase
            .from("motoagent_conversations")
            .update({
              transcript: finalTranscript,
              message_count: finalTranscript.length,
              last_message_at: new Date().toISOString(),
            })
            .eq("id", conversationId);
          if (updateRes.error) {
            console.error("[motoagent] final persist error:", updateRes.error);
          }
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...TEXT_HEADERS,
      "X-Conversation-Id": conversationId,
    },
  });
}

// ─── helpers ───────────────────────────────────────────────────────

interface WorkersAi {
  run(
    model: string,
    input: {
      messages: { role: "system" | "user" | "assistant"; content: string }[];
      stream?: boolean;
      temperature?: number;
      max_tokens?: number;
    },
  ): Promise<ReadableStream<Uint8Array> | { response: string }>;
}

function wrapStaticString(s: string): ReadableStream<Uint8Array> {
  // Wrap a plain string into the same SSE-shaped stream the client
  // parser expects. Used when the model returns a non-streaming
  // response by accident.
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ response: s })}\n\n`),
      );
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
}
