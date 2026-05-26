"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

const SUGERENCIAS = [
  { icon: "📈", text: "Analiza los datos y dime qué servicios le puedo ofrecer a Kyoszen" },
  { icon: "🔍", text: "¿Dónde está perdiendo conversiones el sitio?" },
  { icon: "🎓", text: "¿Qué cursos debería promover más y por qué?" },
  { icon: "💡", text: "Dame ideas de servicios digitales para venderle este mes" },
];

function newChatId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function formatDate(ts: string) {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

export default function EstrategaPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingChats, setLoadingChats] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Cargar chats desde Supabase al montar
  useEffect(() => {
    fetch("/api/admin/estratega/chats")
      .then((r) => r.json())
      .then((data: Chat[]) => {
        if (Array.isArray(data)) setChats(data);
      })
      .catch(() => {/* noop */})
      .finally(() => setLoadingChats(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, streamText, activeChatId]);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;
  const messages = activeChat?.messages ?? [];

  const createNewChat = useCallback(() => {
    setActiveChatId(null);
    setInput("");
    setStreamText("");
    textareaRef.current?.focus();
  }, []);

  const selectChat = useCallback((id: string) => {
    setActiveChatId(id);
    setStreamText("");
  }, []);

  const deleteChat = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (activeChatId === id) setActiveChatId(null);
    await fetch(`/api/admin/estratega/chats/${id}`, { method: "DELETE" });
  }, [activeChatId]);

  const saveChat = async (chat: { id: string; title: string; messages: Message[] }) => {
    await fetch("/api/admin/estratega/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chat),
    });
  };

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    let chatId = activeChatId;
    let currentMessages = messages;
    let isNew = false;

    if (!chatId) {
      chatId = newChatId();
      currentMessages = [];
      isNew = true;
    }

    const newMessages: Message[] = [...currentMessages, { role: "user", content }];
    const title = content.length > 50 ? content.slice(0, 50) + "…" : content;
    const now = new Date().toISOString();
    const chatTitle = isNew ? title : (activeChat?.title ?? title);

    setActiveChatId(chatId);
    setChats((prev) => {
      if (isNew) {
        const newChat: Chat = { id: chatId!, title, messages: newMessages, created_at: now, updated_at: now };
        return [newChat, ...prev];
      }
      return prev.map((c) => c.id === chatId ? { ...c, messages: newMessages, updated_at: now } : c);
    });

    await saveChat({ id: chatId!, title: chatTitle, messages: newMessages });

    setLoading(true);
    setStreamText("");

    try {
      const res = await fetch("/api/admin/estratega", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) throw new Error();

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let full = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          full += decoder.decode(value);
          setStreamText(full);
        }
      }

      const finalMessages: Message[] = [...newMessages, { role: "assistant", content: full }];
      const finalNow = new Date().toISOString();

      setChats((prev) =>
        prev.map((c) => c.id === chatId ? { ...c, messages: finalMessages, updated_at: finalNow } : c)
      );
      setStreamText("");

      await saveChat({ id: chatId!, title: chatTitle, messages: finalMessages });
    } catch {
      const errMessages: Message[] = [...newMessages, { role: "assistant", content: "Ocurrió un error. Inténtalo de nuevo." }];
      setChats((prev) =>
        prev.map((c) => c.id === chatId ? { ...c, messages: errMessages } : c)
      );
      setStreamText("");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const isEmpty = messages.length === 0 && !streamText;

  return (
    <div className="flex h-[calc(100vh-80px)] -m-6 overflow-hidden rounded-2xl border border-border bg-white">

      {/* ── Sidebar ── */}
      <aside className={`${sidebarOpen ? "w-64" : "w-0"} transition-all duration-200 bg-navy flex flex-col shrink-0 overflow-hidden`}>
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-yellow flex items-center justify-center">
              <span className="text-[13px]">📊</span>
            </div>
            <span className="text-white font-black text-[13px]">Estratega</span>
          </div>
          <button
            onClick={createNewChat}
            className="w-full flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-xl px-3 py-2.5 text-[12px] font-bold transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nueva consulta
          </button>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto py-2">
          {loadingChats ? (
            <div className="flex justify-center py-8">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            </div>
          ) : chats.length === 0 ? (
            <p className="text-white/30 text-[11px] text-center px-4 py-6">Aún no hay consultas guardadas</p>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => selectChat(chat.id)}
                className={`w-full text-left px-4 py-3 group transition-colors relative ${
                  activeChatId === chat.id ? "bg-white/15" : "hover:bg-white/8"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12px] text-white/80 font-semibold leading-snug line-clamp-2 flex-1">
                    {chat.title}
                  </p>
                  <button
                    onClick={(e) => deleteChat(chat.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 transition-all shrink-0 mt-0.5"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <p className="text-[10px] text-white/30 mt-0.5">{formatDate(chat.updated_at)}</p>
              </button>
            ))
          )}
        </div>

        <div className="p-3 border-t border-white/10">
          <p className="text-[10px] text-white/25 text-center">Historial sincronizado · Kyoszen</p>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-8 h-8 rounded-lg hover:bg-bg flex items-center justify-center text-muted transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="text-[13px] font-bold text-navy truncate">
            {activeChat ? activeChat.title : "Nueva consulta"}
          </span>
          <span className="ml-auto flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Datos en tiempo real
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-8 max-w-lg mx-auto">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-navy flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <h2 className="text-2xl font-black text-navy mb-2">Bienvenido al Estratega</h2>
                <p className="text-[13px] text-muted leading-relaxed">
                  Analizo los datos reales del sitio de Kyoszen y te propongo servicios concretos para ofrecer. Cada respuesta está basada en lo que está pasando en el sitio ahora.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                {SUGERENCIAS.map((s) => (
                  <button
                    key={s.text}
                    onClick={() => send(s.text)}
                    className="flex items-start gap-3 text-left bg-bg hover:bg-blue/5 border border-border hover:border-blue/30 rounded-xl px-4 py-3.5 transition-all group"
                  >
                    <span className="text-lg shrink-0">{s.icon}</span>
                    <span className="text-[12px] text-navy font-semibold leading-snug group-hover:text-blue transition-colors">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[13px]">📊</span>
                    </div>
                  )}
                  <div className={`max-w-[85%] text-[13px] leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-navy text-white rounded-2xl rounded-tr-sm px-4 py-3"
                      : "text-navy"
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}

              {streamText && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[13px]">📊</span>
                  </div>
                  <div className="max-w-[85%] text-[13px] leading-relaxed whitespace-pre-wrap text-navy">
                    {streamText}
                    <span className="inline-block w-1.5 h-4 bg-blue ml-0.5 animate-pulse rounded-sm align-middle" />
                  </div>
                </div>
              )}

              {loading && !streamText && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center shrink-0">
                    <span className="text-[13px]">📊</span>
                  </div>
                  <div className="flex items-center gap-1.5 py-3">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="w-2 h-2 rounded-full bg-blue/40 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-border shrink-0">
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-3 items-end bg-bg border border-border rounded-2xl px-4 py-3 focus-within:border-blue transition-colors">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Pregunta sobre los datos o pide ideas de servicios..."
                rows={1}
                className="flex-1 resize-none text-[13px] text-navy placeholder:text-muted outline-none leading-relaxed bg-transparent max-h-32"
                disabled={loading}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="w-9 h-9 bg-navy rounded-xl flex items-center justify-center shrink-0 hover:bg-blue transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-muted text-center mt-2">Enter para enviar · Shift+Enter para nueva línea</p>
          </div>
        </div>
      </div>
    </div>
  );
}
