import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { buildSystemPrompt } from "@/lib/assistant/system-prompt";
import { TOOLS, executeTool } from "@/lib/assistant/tools";

// Cache the instrucciones from Supabase to avoid fetching on every message
let _cachedInstrucciones: string | null = null;
let _cacheExpiry = 0;

async function getStoredInstrucciones(): Promise<string | null> {
  if (_cachedInstrucciones && Date.now() < _cacheExpiry) return _cachedInstrucciones;
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await sb
      .from("kyo_config")
      .select("instrucciones")
      .eq("id", 1)
      .single();
    if (data?.instrucciones) {
      _cachedInstrucciones = data.instrucciones as string;
      _cacheExpiry = Date.now() + 60_000; // cache for 60 seconds
      return _cachedInstrucciones;
    }
  } catch {
    // Supabase unavailable — fall through to default
  }
  return null;
}

export const runtime = "nodejs";

const sbAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function saveConversation(
  sessionId: string,
  messages: ChatRequestMessage[],
  assistantReply: string,
  ip: string
) {
  try {
    const fullMessages = [
      ...messages,
      { role: "assistant" as const, content: assistantReply },
    ];
    await sbAdmin.from("kyo_conversaciones").upsert(
      {
        session_id: sessionId,
        messages: fullMessages,
        ip,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "session_id" }
    );
  } catch {
    /* noop — no romper el flujo si falla el log */
  }
}

// Simple in-memory rate limiter (per IP).
// In production with multiple instances, replace with Upstash Redis.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // messages
const RATE_WINDOW_MS = 60_000; // per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count += 1;
  return true;
}

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001";
const MAX_TOOL_ITERATIONS = 5;

interface ChatRequestMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatResponseMessage {
  role: "assistant";
  content: string;
  navigations: { path: string; reason?: string }[];
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "El asistente aun no esta configurado. Configura ANTHROPIC_API_KEY en las variables de entorno." },
      { status: 503 }
    );
  }

  // Rate limit by IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Demasiados mensajes, intenta de nuevo en un minuto." },
      { status: 429 }
    );
  }

  let body: { messages: ChatRequestMessage[]; previewPrompt?: string; sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "Faltan mensajes" }, { status: 400 });
  }

  // Keep only last 20 messages to cap context cost
  const history = body.messages.slice(-20);

  const client = new Anthropic({ apiKey });

  // Determine instrucciones: preview (draft from admin) > stored (Supabase) > default
  const instrucciones = body.previewPrompt ?? await getStoredInstrucciones() ?? undefined;

  // Tool-use loop: keep calling Claude while it requests tools.
  const conversation: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const navigations: { path: string; reason?: string }[] = [];
  let finalText = "";

  try {
    for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: buildSystemPrompt(instrucciones),
        tools: TOOLS,
        messages: conversation,
      });

      // Collect text from this turn
      const textBlocks = response.content.filter((b): b is Anthropic.TextBlock => b.type === "text");
      if (textBlocks.length > 0) {
        finalText = textBlocks.map((b) => b.text).join("\n");
      }

      // If Claude stopped without calling tools, we're done
      if (response.stop_reason !== "tool_use") {
        break;
      }

      // Execute each tool call and feed results back
      const toolUses = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );

      // Track navigation intents so the frontend can act
      for (const tu of toolUses) {
        if (tu.name === "navigate_to") {
          const input = tu.input as { path: string; reason?: string };
          navigations.push({ path: input.path, reason: input.reason });
        }
      }

      // Push assistant message with tool_use, then user message with tool_results
      conversation.push({ role: "assistant", content: response.content });
      conversation.push({
        role: "user",
        content: await Promise.all(
          toolUses.map(async (tu) => ({
            type: "tool_result" as const,
            tool_use_id: tu.id,
            content: await executeTool(tu.name, tu.input as Record<string, unknown>),
          }))
        ),
      });
    }
  } catch (err) {
    console.error("[assistant] Anthropic error:", err);
    return NextResponse.json(
      { error: "Error al conectar con el asistente. Intenta de nuevo." },
      { status: 500 }
    );
  }

  const replyContent = finalText || "Entendido, ¿en que mas te puedo ayudar?";

  // Guardar conversación en Supabase (fire-and-forget)
  if (body.sessionId) {
    saveConversation(body.sessionId, history, replyContent, ip);
  }

  const payload: ChatResponseMessage = {
    role: "assistant",
    content: replyContent,
    navigations,
  };

  return NextResponse.json(payload);
}
