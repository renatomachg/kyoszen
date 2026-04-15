"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useChat, type ChatMessage } from "./useChat";
import KyoLogo from "./KyoLogo";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, sendMessage, isLoading, error, reset } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

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

  return (
    <>
      {/* Floating button - 3D gradient + idle animation + contrast disc */}
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Cerrar chat" : "Abrir chat"}
        className="fixed bottom-5 right-5 z-[60] w-[68px] h-[68px] rounded-full flex items-center justify-center group"
        style={{
          background: "radial-gradient(circle at 30% 25%, #4989C8 0%, #0041C4 50%, #001A66 100%)",
          boxShadow:
            "0 10px 28px rgba(0, 65, 196, 0.45), 0 4px 12px rgba(0, 26, 102, 0.35), inset 0 1.5px 2px rgba(255,255,255,0.35), inset 0 -3px 6px rgba(0,0,0,0.25)",
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        animate={
          open
            ? { rotate: 0 }
            : {
                rotate: [0, -8, 8, -4, 4, 0],
                y: [0, -2, 0, -1, 0],
              }
        }
        transition={{
          rotate: { duration: 1.6, repeat: Infinity, repeatDelay: 5.4, ease: "easeInOut" },
          y: { duration: 1.6, repeat: Infinity, repeatDelay: 5.4, ease: "easeInOut" },
        }}
      >
        {/* Subtle pulsing halo - attention grabber when closed */}
        {!open && (
          <motion.span
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(73,137,200,0.45) 0%, transparent 70%)" }}
            animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
          />
        )}

        <AnimatePresence mode="wait">
          {open ? (
            <motion.svg
              key="close"
              initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.22 }}
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="relative z-[1]"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </motion.svg>
          ) : (
            <motion.div
              key="logo"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-[1] w-[50px] h-[50px] rounded-full bg-white flex items-center justify-center"
              style={{
                boxShadow:
                  "inset 0 2px 3px rgba(255,255,255,0.9), inset 0 -2px 4px rgba(0,0,0,0.1), 0 2px 6px rgba(0,26,102,0.3)",
              }}
            >
              <KyoLogo size={32} className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-5 z-[60] w-[min(92vw,380px)] h-[min(78vh,580px)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)" }}
          >
            {/* Header - clean minimal */}
            <div className="px-5 pt-5 pb-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <KyoLogo size={22} />
                <div className="text-[14px] font-extrabold text-navy">Kyo · Asistente</div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-muted hover:text-navy p-1 rounded-full"
                aria-label="Cerrar"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pb-3 space-y-4">
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
              {isLoading && <TypingIndicator />}
              {error && (
                <div className="bg-red-50 text-red-700 text-[12px] p-3 rounded-lg border border-red-200">
                  {error}
                </div>
              )}
              {/* Reset button - subtle at the bottom when there's history */}
              {messages.length > 2 && !isLoading && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={reset}
                    className="text-[11px] text-muted hover:text-navy font-medium"
                  >
                    Nueva conversacion
                  </button>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="shrink-0 px-4 pb-4 pt-2">
              <div className="flex items-center gap-2 bg-[#F3F4F7] rounded-full pl-4 pr-1 py-1 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-btn/20 transition-all">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  disabled={isLoading}
                  className="flex-1 bg-transparent border-none outline-none text-[13.5px] text-navy placeholder:text-muted py-2.5"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="bg-blue-btn text-white rounded-full w-9 h-9 flex items-center justify-center shrink-0 hover:bg-blue-dark disabled:bg-[#D8D3F0] disabled:cursor-not-allowed transition-colors"
                  aria-label="Enviar"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex justify-end"
      >
        <div className="max-w-[80%] bg-[#E8F0FE] text-navy rounded-2xl rounded-br-md px-4 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-end gap-2 justify-start"
    >
      <div className="w-7 h-7 rounded-full bg-white border border-border flex items-center justify-center shrink-0 mb-0.5">
        <KyoLogo size={16} />
      </div>
      <div className="max-w-[80%] bg-[#F3F4F7] text-navy rounded-2xl rounded-bl-md px-4 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap">
        {message.content}
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-end gap-2 justify-start"
    >
      <div className="w-7 h-7 rounded-full bg-white border border-border flex items-center justify-center shrink-0 mb-0.5">
        <KyoLogo size={16} />
      </div>
      <div className="bg-[#F3F4F7] rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex gap-1.5 items-center h-3">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF]"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
