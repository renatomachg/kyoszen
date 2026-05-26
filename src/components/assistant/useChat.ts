"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { logEvent } from "@/lib/analytics";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const STORAGE_KEY = "kyoszen_chat_history_v1";
const MAX_STORED = 30;

const INITIAL_GREETING: ChatMessage = {
  id: "greeting",
  role: "assistant",
  content: "Bienvenido a Kyoszen. Mi nombre es Kyo y estoy aqui para orientarte. ¿Me permite saber su nombre?",
  timestamp: 0,
};

function loadHistory(): ChatMessage[] {
  if (typeof window === "undefined") return [INITIAL_GREETING];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [INITIAL_GREETING];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return parsed.length > 0 ? parsed : [INITIAL_GREETING];
  } catch {
    return [INITIAL_GREETING];
  }
}

function saveHistory(messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED)));
  } catch {
    /* ignore quota errors */
  }
}

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let sid = sessionStorage.getItem("kyo_session_id");
  if (!sid) {
    sid = Date.now().toString(36) + Math.random().toString(36).slice(2);
    sessionStorage.setItem("kyo_session_id", sid);
  }
  return sid;
}

export function useChat() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  // Load persisted history on first mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    setMessages(loadHistory());
  }, []);

  // Persist history on change
  useEffect(() => {
    if (!initialized.current) return;
    saveHistory(messages);
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      // Log user message to analytics
      logEvent("kyo_mensaje", trimmed.slice(0, 300));

      setError(null);
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setIsLoading(true);

      try {
        const res = await fetch("/api/assistant/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
            sessionId: getSessionId(),
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "Error desconocido" }));
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }

        const data = (await res.json()) as {
          role: "assistant";
          content: string;
          navigations: { path: string; reason?: string }[];
        };

        const assistantMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.content,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        // Navigate to the first requested path, if any (don't fire multiple)
        if (data.navigations.length > 0) {
          const target = data.navigations[0];
          logEvent("kyo_navegacion", target.path);
          setTimeout(() => router.push(target.path), 700);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error al enviar el mensaje";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, router]
  );

  const reset = useCallback(() => {
    setMessages([INITIAL_GREETING]);
    setError(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return { messages, sendMessage, isLoading, error, reset };
}
