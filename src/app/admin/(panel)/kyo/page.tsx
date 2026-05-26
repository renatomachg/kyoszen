"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DEFAULT_INSTRUCCIONES } from "@/lib/assistant/system-prompt";

/* ─────────────────────────── Types ─────────────────────────── */

interface FAQ {
  id: number;
  pregunta: string;
  respuesta: string;
  orden: number;
  activo: boolean;
}

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

interface KyoConversacion {
  id: number;
  session_id: string;
  messages: ChatMsg[];
  ip: string | null;
  created_at: string;
  updated_at: string;
}

const EMPTY_FAQ = { pregunta: "", respuesta: "", orden: 0, activo: true };

/* ─────────────────────────── Styles ─────────────────────────── */

const field =
  "w-full border border-border rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-blue transition-colors bg-white";
const lbl =
  "block text-[11px] font-bold text-navy uppercase tracking-wide mb-1";

/* ═══════════════════════════ Component ═══════════════════════════ */

export default function AdminKyo() {
  const [tab, setTab] = useState<"prompt" | "faqs" | "conversaciones">("prompt");

  /* ── Prompt tab state ── */
  const [instrucciones, setInstrucciones] = useState("");
  const [savedInstrucciones, setSavedInstrucciones] = useState("");
  const [loadingPrompt, setLoadingPrompt] = useState(true);
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [promptSaved, setPromptSaved] = useState(false);

  /* ── Test chat state ── */
  const [testMessages, setTestMessages] = useState<ChatMsg[]>([]);
  const [testInput, setTestInput] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* ── Conversaciones tab state ── */
  const [convs, setConvs] = useState<KyoConversacion[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [expandedConv, setExpandedConv] = useState<number | null>(null);

  /* ── FAQ tab state ── */
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [form, setForm] = useState(EMPTY_FAQ);
  const [showForm, setShowForm] = useState(false);
  const [savingFaq, setSavingFaq] = useState(false);
  const [faqError, setFaqError] = useState("");

  /* ── Load prompt from Supabase on mount ── */
  useEffect(() => {
    supabase
      .from("kyo_config")
      .select("instrucciones")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        const val = data?.instrucciones || DEFAULT_INSTRUCCIONES;
        setInstrucciones(val);
        setSavedInstrucciones(val);
        setLoadingPrompt(false);
      });
  }, []);

  /* ── Load FAQs ── */
  const loadFaqs = async () => {
    const { data } = await supabase
      .from("kyo_faqs")
      .select("*")
      .order("orden")
      .order("id");
    setFaqs((data as FAQ[]) ?? []);
    setLoadingFaqs(false);
  };

  useEffect(() => {
    loadFaqs();
  }, []);

  /* ── Scroll chat to bottom ── */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [testMessages, testLoading]);

  /* ────────────────────── Conversaciones handlers ────────────────────── */

  const loadConvs = async () => {
    setLoadingConvs(true);
    const { data } = await supabase
      .from("kyo_conversaciones")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(100);
    setConvs((data as KyoConversacion[]) ?? []);
    setLoadingConvs(false);
  };

  useEffect(() => {
    if (tab === "conversaciones") loadConvs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  /* ────────────────────── Prompt handlers ────────────────────── */

  async function savePrompt() {
    setSavingPrompt(true);
    await supabase.from("kyo_config").upsert(
      { id: 1, instrucciones: instrucciones.trim(), updated_at: new Date().toISOString() },
      { onConflict: "id" }
    );
    setSavedInstrucciones(instrucciones.trim());
    setSavingPrompt(false);
    setPromptSaved(true);
    setTimeout(() => setPromptSaved(false), 3000);
  }

  function resetPrompt() {
    if (!confirm("¿Restaurar las instrucciones por defecto? Se perderan los cambios no guardados.")) return;
    setInstrucciones(DEFAULT_INSTRUCCIONES);
  }

  const promptDirty = instrucciones.trim() !== savedInstrucciones.trim();

  /* ────────────────────── Test chat handlers ────────────────────── */

  async function sendTest(e: React.FormEvent) {
    e.preventDefault();
    const text = testInput.trim();
    if (!text || testLoading) return;
    const userMsg: ChatMsg = { role: "user", content: text };
    const updated = [...testMessages, userMsg];
    setTestMessages(updated);
    setTestInput("");
    setTestLoading(true);
    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated,
          previewPrompt: instrucciones.trim() || undefined,
        }),
      });
      const data = await res.json();
      setTestMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content ?? "Sin respuesta." },
      ]);
    } catch {
      setTestMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error al conectar con el asistente." },
      ]);
    } finally {
      setTestLoading(false);
    }
  }

  /* ────────────────────── FAQ handlers ────────────────────── */

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FAQ);
    setFaqError("");
    setShowForm(true);
  }

  function openEdit(faq: FAQ) {
    setEditing(faq);
    setForm({
      pregunta: faq.pregunta,
      respuesta: faq.respuesta,
      orden: faq.orden,
      activo: faq.activo,
    });
    setFaqError("");
    setShowForm(true);
  }

  async function handleSaveFaq(e: React.FormEvent) {
    e.preventDefault();
    if (!form.pregunta.trim() || !form.respuesta.trim())
      return setFaqError("Pregunta y respuesta son obligatorias.");
    setSavingFaq(true);
    setFaqError("");
    const payload = {
      pregunta: form.pregunta.trim(),
      respuesta: form.respuesta.trim(),
      orden: form.orden,
      activo: form.activo,
    };
    const { error: err } = editing
      ? await supabase.from("kyo_faqs").update(payload).eq("id", editing.id)
      : await supabase.from("kyo_faqs").insert(payload);
    setSavingFaq(false);
    if (err) return setFaqError(err.message);
    setShowForm(false);
    loadFaqs();
  }

  const eliminarFaq = async (id: number, pregunta: string) => {
    if (!confirm(`¿Eliminar "${pregunta}"?`)) return;
    await supabase.from("kyo_faqs").delete().eq("id", id);
    setFaqs((prev) => prev.filter((f) => f.id !== id));
  };

  const toggleActivoFaq = async (id: number, activo: boolean) => {
    await supabase.from("kyo_faqs").update({ activo: !activo }).eq("id", id);
    setFaqs((prev) =>
      prev.map((f) => (f.id === id ? { ...f, activo: !activo } : f))
    );
  };

  /* ─────────────────────────── Render ─────────────────────────── */

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-navy mb-1">Asistente Kyo</h1>
        <p className="text-[13px] text-muted">
          Configura como se comporta Kyo y las preguntas frecuentes que usa para responder.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-bg border border-border rounded-xl p-1 w-fit">
        {(["prompt", "faqs", "conversaciones"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
              tab === t
                ? "bg-white text-navy shadow-sm"
                : "text-muted hover:text-navy"
            }`}
          >
            {t === "prompt" ? "Instrucciones" : t === "faqs" ? "Preguntas frecuentes" : "Conversaciones"}
          </button>
        ))}
      </div>

      {/* ═══════ TAB: INSTRUCCIONES ═══════ */}
      {tab === "prompt" && (
        <div className="space-y-6">
          {/* Info */}
          <div className="bg-blue/8 border border-blue/20 rounded-2xl p-4">
            <p className="text-[13px] text-navy font-semibold mb-1">
              ¿Como funciona?
            </p>
            <p className="text-[12.5px] text-muted leading-relaxed">
              Aqui defines la personalidad de Kyo, su flujo de conversacion y sus reglas. Los datos dinamicos (vacantes, cursos, FAQs) se agregan automaticamente al prompt. Los cambios se aplican al instante al guardar.
            </p>
          </div>

          {/* Textarea */}
          {loadingPrompt ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="bg-white border border-border rounded-2xl p-5">
              <label className={lbl}>Instrucciones del asistente</label>
              <textarea
                className={`${field} font-mono text-[12.5px] leading-relaxed`}
                rows={22}
                value={instrucciones}
                onChange={(e) => setInstrucciones(e.target.value)}
                placeholder="Escribe aqui como debe comportarse Kyo..."
              />
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={savePrompt}
                  disabled={savingPrompt || !promptDirty}
                  className="bg-navy text-white rounded-xl px-6 py-2.5 text-sm font-bold hover:bg-blue-dark transition-colors disabled:opacity-50"
                >
                  {savingPrompt ? "Guardando..." : promptSaved ? "✓ Guardado" : "Guardar instrucciones"}
                </button>
                <button
                  onClick={resetPrompt}
                  className="border border-border rounded-xl px-4 py-2.5 text-sm font-semibold text-muted hover:text-navy transition-colors"
                >
                  Restaurar por defecto
                </button>
                {promptDirty && (
                  <span className="text-[12px] text-yellow-600 font-medium">
                    · Cambios sin guardar
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Test chat */}
          <div className="bg-white border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <div>
                <p className="text-[13.5px] font-bold text-navy">
                  Probar asistente
                </p>
                <p className="text-[11.5px] text-muted mt-0.5">
                  Usa las instrucciones del area de arriba (aunque no hayas guardado).
                </p>
              </div>
              {testMessages.length > 0 && (
                <button
                  onClick={() => setTestMessages([])}
                  className="text-[12px] font-semibold text-muted hover:text-navy transition-colors"
                >
                  Nueva conversacion
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="h-72 overflow-y-auto px-5 py-4 space-y-3 bg-bg/40">
              {testMessages.length === 0 && (
                <p className="text-center text-[12.5px] text-muted pt-8">
                  Escribe un mensaje para probar como responde Kyo con las instrucciones actuales.
                </p>
              )}
              {testMessages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
                      m.role === "user"
                        ? "bg-navy text-white rounded-br-sm"
                        : "bg-white border border-border text-navy rounded-bl-sm shadow-sm"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {testLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendTest} className="flex gap-2 px-4 py-3 border-t border-border">
              <input
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="Escribe un mensaje de prueba..."
                className="flex-1 border border-border rounded-xl px-3.5 py-2 text-sm outline-none focus:border-blue transition-colors"
              />
              <button
                type="submit"
                disabled={!testInput.trim() || testLoading}
                className="bg-navy text-white rounded-xl px-4 py-2 text-sm font-bold hover:bg-blue-dark transition-colors disabled:opacity-50"
              >
                Enviar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══════ TAB: FAQS ═══════ */}
      {tab === "faqs" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] text-muted">
              {faqs.filter((f) => f.activo).length} activas · {faqs.length} total
            </p>
            <button
              onClick={openNew}
              className="bg-navy text-white rounded-xl px-5 py-2.5 text-[13px] font-bold hover:bg-blue-dark transition-colors"
            >
              + Nueva FAQ
            </button>
          </div>

          {/* Info */}
          <div className="bg-blue/8 border border-blue/20 rounded-2xl p-4 mb-5">
            <p className="text-[13px] text-navy font-semibold mb-1">¿Como funciona?</p>
            <p className="text-[12.5px] text-muted leading-relaxed">
              Las FAQs se agregan automaticamente al prompt de Kyo. Mientras mas completas y claras sean, mejor respondera el asistente.
            </p>
          </div>

          {/* Form */}
          {showForm && (
            <div className="bg-white border border-border rounded-2xl p-6 mb-5 shadow-sm">
              <h2 className="text-[15px] font-black text-navy mb-5">
                {editing ? "Editar FAQ" : "Nueva FAQ"}
              </h2>
              <form onSubmit={handleSaveFaq} className="space-y-4">
                <div>
                  <label className={lbl}>Pregunta *</label>
                  <input
                    className={field}
                    value={form.pregunta}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, pregunta: e.target.value }))
                    }
                    placeholder="¿Cuanto tiempo tarda el proceso de reclutamiento?"
                  />
                </div>
                <div>
                  <label className={lbl}>Respuesta *</label>
                  <textarea
                    className={field}
                    rows={4}
                    value={form.respuesta}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, respuesta: e.target.value }))
                    }
                    placeholder="Explicacion completa que Kyo usara para responder..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Orden (numero menor = primero)</label>
                    <input
                      className={field}
                      type="number"
                      min={0}
                      value={form.orden}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, orden: Number(e.target.value) }))
                      }
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-5">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({ ...f, activo: !f.activo }))
                      }
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        form.activo ? "bg-blue" : "bg-border"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          form.activo ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                    <span className="text-sm font-semibold text-navy">
                      {form.activo ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                </div>
                {faqError && <p className="text-red-600 text-sm">{faqError}</p>}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={savingFaq}
                    className="bg-navy text-white rounded-xl px-6 py-2.5 text-sm font-bold hover:bg-blue-dark transition-colors disabled:opacity-60"
                  >
                    {savingFaq
                      ? "Guardando..."
                      : editing
                      ? "Guardar cambios"
                      : "Agregar FAQ"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="border border-border rounded-xl px-6 py-2.5 text-sm font-semibold text-muted hover:text-navy transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* FAQ list */}
          {loadingFaqs ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
            </div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-16 text-muted text-sm bg-white border border-border rounded-2xl">
              No hay FAQs todavia. Agrega la primera para que Kyo empiece a responder mejor.
            </div>
          ) : (
            <div className="space-y-3">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className={`bg-white border rounded-2xl p-5 ${
                    faq.activo ? "border-border" : "border-border opacity-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-navy text-[13.5px] mb-1">
                        {faq.pregunta}
                      </p>
                      <p className="text-[12.5px] text-muted leading-relaxed line-clamp-2">
                        {faq.respuesta}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => toggleActivoFaq(faq.id, faq.activo)}
                        className={`relative w-9 h-5 rounded-full transition-colors ${
                          faq.activo ? "bg-blue" : "bg-border"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                            faq.activo ? "translate-x-4" : ""
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => openEdit(faq)}
                        className="text-[12px] font-semibold text-blue hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => eliminarFaq(faq.id, faq.pregunta)}
                        className="text-[12px] font-semibold text-red-500 hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════ TAB: CONVERSACIONES ═══════ */}
      {tab === "conversaciones" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-muted">Historial de conversaciones con el asistente Kyo. Se registran automáticamente.</p>
            <button
              onClick={loadConvs}
              className="text-[12px] font-semibold text-blue hover:underline"
            >
              Actualizar
            </button>
          </div>

          {loadingConvs ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
            </div>
          ) : convs.length === 0 ? (
            <div className="bg-white border border-border rounded-2xl p-10 text-center">
              <p className="text-muted text-[13px]">Aún no hay conversaciones registradas.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {convs.map((conv) => {
                const userMsgs = conv.messages.filter((m) => m.role === "user").length;
                const preview = conv.messages.find((m) => m.role === "user")?.content ?? "";
                const isOpen = expandedConv === conv.id;
                return (
                  <div key={conv.id} className="bg-white border border-border rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setExpandedConv(isOpen ? null : conv.id)}
                      className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-bg transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center shrink-0 text-[13px]">💬</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-navy truncate">{preview || "Sin mensajes"}</p>
                        <p className="text-[11px] text-muted mt-0.5">
                          {userMsgs} {userMsgs === 1 ? "mensaje" : "mensajes"} ·{" "}
                          {new Date(conv.updated_at).toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          {conv.ip ? ` · IP: ${conv.ip}` : ""}
                        </p>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {isOpen && (
                      <div className="border-t border-border px-5 py-4 space-y-3 bg-bg/50">
                        {conv.messages.map((m, i) => (
                          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] text-[12.5px] leading-relaxed rounded-xl px-3 py-2 ${
                              m.role === "user"
                                ? "bg-navy text-white rounded-tr-sm"
                                : "bg-white border border-border text-navy rounded-tl-sm"
                            }`}>
                              {m.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
