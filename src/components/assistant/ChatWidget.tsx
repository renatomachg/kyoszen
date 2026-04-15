"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useChat, type ChatMessage } from "./useChat";
import KyoLogo from "./KyoLogo";

const SUGGESTED_QUESTIONS = [
  "¿Que cursos de liderazgo tienen?",
  "Muestrame vacantes en CDMX",
  "¿Como contrato personal?",
  "¿Que incluye el curso de NOM-035?",
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, sendMessage, isLoading, error, reset } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
  };

  const handleSuggestion = (q: string) => {
    sendMessage(q);
  };

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Cerrar chat" : "Abrir chat"}
        className="fixed bottom-5 right-5 z-[60] w-16 h-16 rounded-full bg-blue-btn text-white shadow-2xl flex items-center justify-center hover:bg-blue-dark transition-all duration-200 hover:scale-105"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.svg
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </motion.svg>
          ) : (
            <motion.div
              key="logo"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-center justify-center"
            >
              <KyoLogo size={34} />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-5 z-[60] w-[min(92vw,380px)] h-[min(78vh,560px)] bg-white rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-navy text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center">
                  <KyoLogo size={22} />
                </div>
                <div>
                  <div className="text-[14px] font-extrabold leading-none">Kyo</div>
                  <div className="text-[10.5px] text-white/60 mt-0.5">Asistente de Kyoszen · en linea</div>
                </div>
              </div>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={reset}
                  className="text-[10.5px] text-white/60 hover:text-yellow font-semibold uppercase tracking-wider"
                >
                  Reiniciar
                </button>
              )}
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 bg-[#F8FAFC] space-y-3">
              {messages.length === 0 && !isLoading && (
                <Welcome onPick={handleSuggestion} />
              )}
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
              {isLoading && <TypingDots />}
              {error && (
                <div className="bg-red-50 text-red-700 text-[12px] p-3 rounded-lg border border-red-200">
                  {error}
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="shrink-0 border-t border-border bg-white p-3">
              <div className="flex items-center gap-2 bg-[#F8FAFC] rounded-full pl-4 pr-1 py-1 border border-border focus-within:border-blue-mid transition-colors">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe tu pregunta..."
                  disabled={isLoading}
                  className="flex-1 bg-transparent border-none outline-none text-[13px] text-navy placeholder:text-muted py-2"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="bg-navy text-white rounded-full w-9 h-9 flex items-center justify-center shrink-0 hover:bg-blue-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Enviar"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
              <p className="text-[10px] text-muted text-center mt-2">
                Kyo puede cometer errores. Confirma info importante en{" "}
                <a href="/contacto" className="text-blue hover:underline">
                  contacto
                </a>
                .
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Welcome({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="py-4">
      <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
        <div className="flex items-start gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-bg flex items-center justify-center shrink-0 border border-border">
            <KyoLogo size={18} />
          </div>
          <div>
            <div className="text-[12px] font-extrabold text-navy">Hola, soy Kyo 👋</div>
            <p className="text-[12.5px] text-muted leading-relaxed mt-1">
              Puedo ayudarte a encontrar cursos, vacantes, y guiarte por el sitio. ¿En que te ayudo?
            </p>
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onPick(q)}
            className="w-full text-left bg-white rounded-xl px-3 py-2.5 border border-border text-[12px] text-navy hover:border-blue-mid hover:bg-blue-soft/30 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-navy text-white rounded-br-sm"
            : "bg-white text-navy border border-border rounded-bl-sm shadow-sm"
        }`}
      >
        {message.content}
      </div>
    </motion.div>
  );
}

function TypingDots() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex justify-start"
    >
      <div className="bg-white border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1.5 items-center h-3">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-muted"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
