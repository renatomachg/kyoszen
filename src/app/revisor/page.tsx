"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { getRedSocial } from "@/lib/redes-sociales";
import { RedLogo } from "@/components/RedLogo";
import InformeCliente from "@/components/revisor/InformeCliente";

/* ─── Types ─────────────────────────────────────────── */
interface Version {
  id: number;
  version_num: number;
  caption: string;
  imagenes: string[];
  es_activa: boolean;
  created_at: string;
}
interface Comment {
  id: number;
  autor_nombre: string;
  autor_rol: string;
  contenido: string;
  created_at: string;
}
interface Post {
  id: number;
  red_social: string;
  fecha_programada: string;
  estado: "pendiente" | "aprobado" | "cambios";
  social_post_versions: Version[];
  social_comments: Comment[];
}
interface PageConfig {
  nombre_pagina: string;
  avatar_url: string | null;
}

/* ─── Helpers ────────────────────────────────────────── */
function weekBounds(offset = 0) {
  const now = new Date();
  const day = now.getDay();
  const diffToMon = (day === 0 ? -6 : 1 - day) + offset * 7;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diffToMon);
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { desde: mon.toISOString().slice(0, 10), hasta: sun.toISOString().slice(0, 10), mon, sun };
}

function monthBounds(offset = 0) {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const last = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  return { desde: first.toISOString().slice(0, 10), hasta: last.toISOString().slice(0, 10), mon: first, sun: last };
}

function fmtScheduledDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
}
function fmtShortDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}
function fmtCommentDate(d: string) {
  return new Date(d).toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function isoDate(d: Date) { return d.toISOString().slice(0, 10); }
const DAYS_SUN = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
function monthGrid(first: Date): (Date | null)[] {
  const year = first.getFullYear();
  const month = first.getMonth();
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const ESTADO: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  pendiente: { label: "Pendiente revisión", bg: "#FEF9C3", color: "#854D0E", dot: "#EAB308" },
  aprobado:  { label: "Aprobado",           bg: "#DCFCE7", color: "#166534", dot: "#22C55E" },
  cambios:   { label: "Cambios solicitados",bg: "#FEE2E2", color: "#991B1B", dot: "#EF4444" },
};

/* ─── Post Modal ─────────────────────────────────────── */
function PostModal({ post, config, userName, onClose, onStatusChange }: {
  post: Post;
  config: PageConfig;
  userName: string;
  onClose: () => void;
  onStatusChange: (id: number, estado: string) => void;
}) {
  const active = post.social_post_versions.find(v => v.es_activa) ?? post.social_post_versions[0];
  const oldVersions = post.social_post_versions.filter(v => !v.es_activa).sort((a, b) => b.version_num - a.version_num);
  const anterior = oldVersions[0]; // versión anterior más reciente
  const hayCorreccion = oldVersions.length > 0;
  const [slide, setSlide] = useState(0);
  const [viendoAnterior, setViendoAnterior] = useState(false);
  const [comments, setComments] = useState<Comment[]>(post.social_comments ?? []);
  const [estado, setEstado] = useState(post.estado);
  const [changingStatus, setChangingStatus] = useState<string | null>(null);

  // Versión que se muestra en el mockup (nueva por defecto, o la anterior si el cliente la pide)
  const mostrada = viendoAnterior && anterior ? anterior : active;
  const imgs = mostrada?.imagenes ?? [];
  const est = ESTADO[estado];
  const red = getRedSocial(post.red_social);

  const [showCambiosForm, setShowCambiosForm] = useState(false);
  const [cambiosTexto, setCambiosTexto] = useState("");
  const [enviandoCambios, setEnviandoCambios] = useState(false);

  const aprobar = async () => {
    setChangingStatus("aprobado");
    await fetch(`/api/revisor/posts/${post.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "aprobado", revisor_nombre: userName }),
    });
    setEstado("aprobado");
    onStatusChange(post.id, "aprobado");
    setChangingStatus(null);
  };

  const enviarCambios = async () => {
    if (!cambiosTexto.trim()) return;
    setEnviandoCambios(true);
    // Guardar comentario + cambiar estado juntos
    await Promise.all([
      fetch(`/api/revisor/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autor_nombre: userName, autor_rol: "cliente", contenido: cambiosTexto.trim() }),
      }),
      fetch(`/api/revisor/posts/${post.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "cambios", revisor_nombre: userName }),
      }),
    ]);
    const newComment = { id: Date.now(), autor_nombre: userName, autor_rol: "cliente", contenido: cambiosTexto.trim(), created_at: new Date().toISOString() };
    setComments(prev => [...prev, newComment]);
    setEstado("cambios");
    onStatusChange(post.id, "cambios");
    setCambiosTexto("");
    setShowCambiosForm(false);
    setEnviandoCambios(false);
  };

  if (!active) return null;

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(4,46,123,.55)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 860, maxHeight: "92vh", overflow: "auto", boxShadow: "0 32px 80px rgba(0,0,0,.3)" }}
      >
        {/* Modal header */}
        <div style={{ background: "#042E7B", borderRadius: "24px 24px 0 0", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              {red.logo
                ? <span style={{ background: "#fff", borderRadius: 6, padding: "3px 8px", display: "inline-flex", alignItems: "center" }}>
                    <img src={red.logo} alt={red.nombre} style={{ height: 11, display: "block" }} />
                  </span>
                : <RedLogo red_social={post.red_social} height={13} />}
              <span style={{ color: "rgba(255,255,255,.55)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" }}>
                {fmtScheduledDate(post.fecha_programada)}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: est.dot, display: "inline-block" }} />
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>{est.label}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: 10, width: 36, height: 36, color: "#fff", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
          {/* Left: FB mockup */}
          <div style={{ padding: 24, borderRight: "1px solid #F1F5F9" }}>

            {/* Badge de versión + toggle (solo si hay corrección) */}
            {hayCorreccion && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  {viendoAnterior ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#F1F5F9", color: "#64748B", fontSize: 12, fontWeight: 800, padding: "6px 12px", borderRadius: 20 }}>
                      ↩️ Versión anterior (v{anterior.version_num})
                    </span>
                  ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#DCFCE7", color: "#166534", fontSize: 12, fontWeight: 800, padding: "6px 12px", borderRadius: 20 }}>
                      ✨ Nueva propuesta (v{active.version_num})
                    </span>
                  )}
                  <button onClick={() => { setViendoAnterior(!viendoAnterior); setSlide(0); }}
                    style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "6px 12px", fontSize: 12, fontWeight: 700, color: "#042E7B", cursor: "pointer" }}>
                    {viendoAnterior ? "Ver nueva propuesta →" : "↩ Ver cómo estaba antes"}
                  </button>
                </div>
              </div>
            )}

            {/* Mockup con efecto de doble tarjeta cuando hay corrección */}
            <div style={{ position: "relative" }}>
              {hayCorreccion && !viendoAnterior && (
                <>
                  <div style={{ position: "absolute", top: -8, left: 10, right: 10, height: 40, background: "#E8EDF5", borderRadius: "12px 12px 0 0", zIndex: 0 }} />
                  <div style={{ position: "absolute", top: -4, left: 5, right: 5, height: 40, background: "#F1F5F9", borderRadius: "12px 12px 0 0", zIndex: 0 }} />
                </>
              )}
              <div data-tour="preview" style={{ position: "relative", zIndex: 1, background: "#fff", borderRadius: 12, boxShadow: hayCorreccion && !viendoAnterior ? "0 8px 24px rgba(4,46,123,.18)" : "0 2px 12px rgba(0,0,0,.1)", overflow: "hidden", border: viendoAnterior ? "1.5px dashed #CBD5E1" : "none" }}>
                {/* FB post header */}
                <div style={{ padding: "12px 14px 8px", display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#042E7B", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {config.avatar_url
                      ? <img src={config.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ color: "#FFCC00", fontWeight: 900, fontSize: 14 }}>KZ</span>}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#050505" }}>{config.nombre_pagina}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#65676B" }}>{fmtScheduledDate(post.fecha_programada)} · 🌐</p>
                  </div>
                </div>
                {mostrada.caption && <p style={{ margin: "0 14px 10px", fontSize: 14, color: "#050505", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{mostrada.caption}</p>}
                {imgs.length > 0 && (
                  <div style={{ position: "relative", background: "#F0F2F5", aspectRatio: "1/1" }}>
                    <img src={imgs[slide]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    {imgs.length > 1 && (
                      <>
                        <button onClick={() => setSlide(Math.max(0, slide - 1))} disabled={slide === 0}
                          style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,.5)", color: "#fff", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 16, opacity: slide === 0 ? 0.3 : 1 }}>‹</button>
                        <button onClick={() => setSlide(Math.min(imgs.length - 1, slide + 1))} disabled={slide === imgs.length - 1}
                          style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,.5)", color: "#fff", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 16, opacity: slide === imgs.length - 1 ? 0.3 : 1 }}>›</button>
                        <span style={{ position: "absolute", top: 10, right: 12, background: "rgba(0,0,0,.55)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20 }}>{slide + 1}/{imgs.length}</span>
                      </>
                    )}
                  </div>
                )}
                <div style={{ padding: "8px 14px", borderTop: "1px solid #E4E6EB", display: "flex" }}>
                  {["👍 Me gusta", "💬 Comentar", "↗ Compartir"].map(a => (
                    <div key={a} style={{ flex: 1, textAlign: "center", fontSize: 13, color: "#65676B", fontWeight: 600 }}>{a}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Nota cuando ve la anterior */}
            {hayCorreccion && viendoAnterior && (
              <p style={{ margin: "12px 0 0", fontSize: 12, color: "#94A3B8", textAlign: "center" }}>
                Esta es la versión que comentaste. Toca &quot;Ver nueva propuesta&quot; para ver los cambios.
              </p>
            )}
          </div>

          {/* Right: actions + comments */}
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Paso de decisión */}
            <div data-tour="acciones">
              <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 800, color: "#042E7B" }}>
                ¿Apruebas esta publicación?
              </p>

              {!showCambiosForm ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button onClick={aprobar} disabled={changingStatus !== null || enviandoCambios}
                    style={{ width: "100%", padding: "14px 0", borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 15,
                      background: estado === "aprobado" ? "#166534" : "#DCFCE7", color: estado === "aprobado" ? "#fff" : "#166534",
                      opacity: changingStatus !== null ? 0.6 : 1, transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    {changingStatus === "aprobado" ? "Guardando..." : estado === "aprobado" ? "✅ Aprobada" : "✅ Aprobar"}
                  </button>
                  <button onClick={() => setShowCambiosForm(true)} disabled={changingStatus !== null}
                    style={{ width: "100%", padding: "14px 0", borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 15,
                      background: estado === "cambios" ? "#991B1B" : "#FEE2E2", color: estado === "cambios" ? "#fff" : "#991B1B",
                      transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    {estado === "cambios" ? "🔴 Cambios solicitados" : "✏️ Necesito cambios"}
                  </button>
                </div>
              ) : (
                /* Formulario de cambios */
                <div style={{ background: "#FEF2F2", border: "1.5px solid #FECACA", borderRadius: 14, padding: 16 }}>
                  <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 800, color: "#991B1B" }}>
                    ✏️ ¿Qué necesitas cambiar?
                  </p>
                  <p style={{ margin: "0 0 10px", fontSize: 12, color: "#B45454", lineHeight: 1.5 }}>
                    Escribe los cambios que quieres y los recibiremos al instante.
                  </p>
                  <textarea value={cambiosTexto} onChange={e => setCambiosTexto(e.target.value)} autoFocus
                    placeholder="Ej: Cambiar el color del fondo a azul, corregir la fecha, el texto debe decir..."
                    rows={4}
                    style={{ width: "100%", border: "1.5px solid #FCA5A5", borderRadius: 10, padding: "10px 12px", fontSize: 13, resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box", marginBottom: 10 }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setShowCambiosForm(false); setCambiosTexto(""); }}
                      style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1.5px solid #E2E8F0", background: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13, color: "#64748B" }}>
                      Cancelar
                    </button>
                    <button onClick={enviarCambios} disabled={!cambiosTexto.trim() || enviandoCambios}
                      style={{ flex: 2, padding: "11px 0", borderRadius: 10, border: "none", background: "#DC2626", cursor: "pointer", fontWeight: 800, fontSize: 13, color: "#fff", opacity: !cambiosTexto.trim() || enviandoCambios ? 0.5 : 1 }}>
                      {enviandoCambios ? "Enviando..." : "Enviar cambios →"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Historial de comentarios */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid #F1F5F9", paddingTop: 16 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: ".6px" }}>
                Historial de comentarios {comments.length > 0 && `(${comments.length})`}
              </p>
              {comments.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto" }}>
                  {comments.map(c => (
                    <div key={c.id} style={{ padding: "10px 12px", borderRadius: 12,
                      background: c.autor_rol === "admin" ? "#EFF6FF" : "#F8FAFC",
                      borderLeft: `3px solid ${c.autor_rol === "admin" ? "#1883FF" : "#CBD5E1"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: c.autor_rol === "admin" ? "#1883FF" : "#042E7B" }}>
                          {c.autor_nombre}{c.autor_rol === "admin" ? " · Admin" : ""}
                        </span>
                        <span style={{ fontSize: 11, color: "#94A3B8" }}>{fmtCommentDate(c.created_at)}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: "#1E293B", lineHeight: 1.5 }}>{c.contenido}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: 12, color: "#94A3B8" }}>Aún no hay comentarios en esta publicación.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Post Card (compact grid) ───────────────────────── */
function PostCard({ post, onOpen }: { post: Post; onOpen: () => void }) {
  const active = post.social_post_versions.find(v => v.es_activa) ?? post.social_post_versions[0];
  const est = ESTADO[post.estado];
  const red = getRedSocial(post.red_social);
  const commentCount = post.social_comments?.length ?? 0;
  const hasImage = (active?.imagenes?.length ?? 0) > 0;
  const isCarrusel = (active?.imagenes?.length ?? 0) > 1;
  // Tiene corrección si hay más de una versión y está pendiente de revisar de nuevo
  const hayCorreccion = post.social_post_versions.length > 1 && post.estado === "pendiente";

  return (
    <div style={{ position: "relative", paddingTop: hayCorreccion ? 7 : 0 }}>
      {/* Capas detrás (efecto doble tarjeta) cuando hay nueva propuesta */}
      {hayCorreccion && (
        <>
          <div style={{ position: "absolute", top: 0, left: 9, right: 9, height: 26, background: "#C9DEFF", borderRadius: "16px 16px 0 0", zIndex: 0 }} />
          <div style={{ position: "absolute", top: 3.5, left: 4.5, right: 4.5, height: 26, background: "#E3EEFF", borderRadius: "16px 16px 0 0", zIndex: 0 }} />
        </>
      )}
      <button onClick={onOpen} style={{ position: "relative", zIndex: 1, background: "#fff", border: hayCorreccion ? "1.5px solid #1883FF" : "1.5px solid #E2E8F0", borderRadius: 16, overflow: "hidden", cursor: "pointer", textAlign: "left", width: "100%", transition: "all .2s", boxShadow: hayCorreccion ? "0 4px 16px rgba(24,131,255,.18)" : "0 1px 4px rgba(0,0,0,.06)" }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(4,46,123,.12)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "none"; (e.currentTarget as HTMLButtonElement).style.boxShadow = hayCorreccion ? "0 4px 16px rgba(24,131,255,.18)" : "0 1px 4px rgba(0,0,0,.06)"; }}>

      {/* Image */}
      <div style={{ position: "relative", aspectRatio: "1/1", background: "#F1F5F9", overflow: "hidden" }}>
        {hasImage
          ? <img src={active!.imagenes[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 32 }}>📝</span>
            </div>
        }
        {isCarrusel && (
          <span style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,.6)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 7px", borderRadius: 20 }}>
            📎 {active!.imagenes.length}
          </span>
        )}
        {/* Status overlay */}
        <div style={{ position: "absolute", top: 8, left: 8, background: hayCorreccion ? "#DBEAFE" : est.bg, borderRadius: 20, padding: "3px 9px", display: "flex", alignItems: "center", gap: 5 }}>
          {hayCorreccion
            ? <span style={{ fontSize: 10, fontWeight: 800, color: "#1E40AF" }}>✨ Nueva propuesta</span>
            : <>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: est.dot, display: "inline-block" }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: est.color }}>{est.label}</span>
              </>}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#042E7B" }}>
            {fmtShortDate(post.fecha_programada)}
          </p>
          <RedLogo red_social={post.red_social} height={11} />
        </div>
        {active?.caption && (
          <p style={{ margin: "0 0 8px", fontSize: 12, color: "#64748B", lineHeight: 1.45, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {active.caption}
          </p>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: "#94A3B8" }}>
            {commentCount > 0 ? `💬 ${commentCount} comentario${commentCount > 1 ? "s" : ""}` : "Sin comentarios"}
          </span>
          <span style={{ fontSize: 11, color: "#1883FF", fontWeight: 700 }}>Ver →</span>
        </div>
      </div>
      </button>
    </div>
  );
}

/* ─── Login ──────────────────────────────────────────── */
function LoginView({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError("Correo o contraseña incorrectos."); return; }
    onLogin();
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #042E7B 0%, #1883FF 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 24, padding: "40px 36px", width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img
            src="https://xwzggymwdrvxpwvuefqf.supabase.co/storage/v1/object/public/media/brand/kyoszen-icon.png"
            alt="Kyoszen"
            style={{ width: 64, height: 64, borderRadius: 16, display: "block", margin: "0 auto 16px", objectFit: "cover" }}
          />
          <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 900, color: "#042E7B" }}>Revisor de contenido</h1>
          <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>Kyoszen · Aprobación de publicaciones</p>
        </div>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#042E7B", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>Correo</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "11px 14px", fontSize: 14, outline: "none", boxSizing: "border-box" }} placeholder="tu@correo.com" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#042E7B", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "11px 14px", fontSize: 14, outline: "none", boxSizing: "border-box" }} placeholder="••••••••" />
          </div>
          {error && <p style={{ margin: 0, fontSize: 12, color: "#DC2626", textAlign: "center" }}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{ background: "#042E7B", color: "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 4, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Guía de uso (tour con coach marks) ─────────────── */
interface PasoTour {
  emoji: string;
  titulo: string;
  texto: string;
  selector: string | null;  // null = tarjeta centrada
  requiereModal?: boolean;   // abre una publicación de ejemplo
}

const GUIA_PASOS: PasoTour[] = [
  {
    emoji: "👋",
    titulo: "¡Bienvenido a tu Revisor!",
    texto: "Aquí revisas el contenido que vamos a publicar en tus redes antes de que salga al aire. Te mostramos en 30 segundos cómo funciona.",
    selector: null,
  },
  {
    emoji: "📊",
    titulo: "Tu resumen del mes",
    texto: "Aquí ves de un vistazo cuántas publicaciones están aprobadas, pendientes y con cambios.",
    selector: "[data-tour='stats']",
  },
  {
    emoji: "🗓️",
    titulo: "Ver por semana o por mes",
    texto: "Cambia entre ver solo lo de esta semana o todo el mes completo. Usa las flechas ‹ › para navegar.",
    selector: "[data-tour='toggle']",
  },
  {
    emoji: "🗂️",
    titulo: "Aquí están tus publicaciones",
    texto: "Cada tarjeta es una publicación programada. Haz clic en cualquiera para abrirla y revisarla. Te mostramos qué hay adentro...",
    selector: "[data-tour='grid']",
  },
  {
    emoji: "👀",
    titulo: "Así se verá la publicación",
    texto: "Al abrir una, verás exactamente cómo lucirá en la red social: la imagen, el texto y todo. Revísala con calma.",
    selector: "[data-tour='preview']",
    requiereModal: true,
  },
  {
    emoji: "✅",
    titulo: "Aprobar o pedir cambios",
    texto: "Aquí decides: toca «Aprobar» si te gusta tal cual, o «Necesito cambios» si quieres ajustar algo. Si pides cambios, escribes qué necesitas y lo recibimos al instante.",
    selector: "[data-tour='acciones']",
    requiereModal: true,
  },
  {
    emoji: "❔",
    titulo: "¿Se te olvidó algo?",
    texto: "No te preocupes. Puedes volver a abrir esta guía cuando quieras desde este botón.",
    selector: "[data-tour='guia']",
  },
  {
    emoji: "🎉",
    titulo: "¡Listo, eso es todo!",
    texto: "Ya sabes lo esencial. Empieza revisando tu primera publicación. ¡Gracias por tu tiempo!",
    selector: null,
  },
];

function GuiaUso({ onClose, onAbrirEjemplo, onCerrarEjemplo, hayPosts }: {
  onClose: () => void;
  onAbrirEjemplo: () => void;
  onCerrarEjemplo: () => void;
  hayPosts: boolean;
}) {
  const [paso, setPaso] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const actual = GUIA_PASOS[paso];
  const esUltimo = paso === GUIA_PASOS.length - 1;

  // Controlar modal de ejemplo + medir el elemento resaltado
  useEffect(() => {
    // Abrir o cerrar la publicación de ejemplo según el paso
    if (actual.requiereModal && hayPosts) onAbrirEjemplo();
    else onCerrarEjemplo();

    if (!actual.selector) { setRect(null); return; }
    const delay = actual.requiereModal ? 480 : 320;
    const medir = () => {
      const el = document.querySelector(actual.selector!) as HTMLElement | null;
      if (!el) { setRect(null); return; }
      if (!actual.requiereModal) el.scrollIntoView({ behavior: "smooth", block: "center" });
      setRect(el.getBoundingClientRect());
    };
    const t = setTimeout(medir, delay);
    window.addEventListener("resize", medir);
    window.addEventListener("scroll", medir, true);
    return () => { clearTimeout(t); window.removeEventListener("resize", medir); window.removeEventListener("scroll", medir, true); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paso]);

  // Al cerrar el tour, cerrar también el modal de ejemplo
  const cerrar = () => { onCerrarEjemplo(); onClose(); };

  const PAD = 8;
  const TT_W = Math.min(340, typeof window !== "undefined" ? window.innerWidth - 24 : 340);
  const TT_H = 210; // altura estimada del tooltip

  // Calcular posición del tooltip respecto al elemento (sin que se salga de pantalla)
  let ttStyle: React.CSSProperties = {};
  let arrow: { pos: number; side: "top" | "bottom" | "left" | "right" } | null = null;

  if (rect) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(val, max));
    const left = clamp(rect.left + rect.width / 2 - TT_W / 2, 12, vw - TT_W - 12);
    const spaceBelow = vh - rect.bottom;
    const spaceAbove = rect.top;
    const spaceRight = vw - rect.right;
    const spaceLeft = rect.left;

    if (spaceBelow > TT_H + 28) {
      // Cabe debajo
      ttStyle = { top: rect.bottom + PAD + 14, left };
      arrow = { pos: rect.left + rect.width / 2 - left, side: "top" };
    } else if (spaceAbove > TT_H + 28) {
      // Cabe arriba
      ttStyle = { top: rect.top - PAD - 14 - TT_H, left };
      arrow = { pos: rect.left + rect.width / 2 - left, side: "bottom" };
    } else if (spaceRight > TT_W + 28) {
      // Elemento alto: a la derecha (se ve completo a la izquierda)
      const top = clamp(rect.top + rect.height / 2 - TT_H / 2, 16, vh - TT_H - 16);
      ttStyle = { top, left: rect.right + PAD + 14 };
      arrow = { pos: rect.top + rect.height / 2 - top, side: "left" };
    } else if (spaceLeft > TT_W + 28) {
      // Elemento alto: a la izquierda
      const top = clamp(rect.top + rect.height / 2 - TT_H / 2, 16, vh - TT_H - 16);
      ttStyle = { top, left: rect.left - PAD - 14 - TT_W };
      arrow = { pos: rect.top + rect.height / 2 - top, side: "right" };
    } else {
      // Sin espacio: flota centrado, sin flecha
      ttStyle = { top: clamp(vh / 2 - TT_H / 2, 16, vh - TT_H - 16), left };
      arrow = null;
    }
  }

  return (
    <>
      {/* Overlay oscuro con recorte del elemento (spotlight) */}
      {rect ? (
        <div style={{
          position: "fixed",
          top: rect.top - PAD, left: rect.left - PAD,
          width: rect.width + PAD * 2, height: rect.height + PAD * 2,
          borderRadius: 14,
          boxShadow: "0 0 0 9999px rgba(4,46,123,.7)",
          border: "2.5px solid #1883FF",
          zIndex: 300, pointerEvents: "none", transition: "all .3s ease",
        }} />
      ) : (
        <div style={{ position: "fixed", inset: 0, background: "rgba(4,46,123,.7)", backdropFilter: "blur(2px)", zIndex: 300 }} />
      )}

      {/* Tooltip / tarjeta */}
      {rect ? (
        /* Coach mark posicionado */
        <div style={{ position: "fixed", width: TT_W, zIndex: 301, ...ttStyle }}>
          {/* Flecha */}
          {arrow && (
            <div style={{
              position: "absolute",
              ...(arrow.side === "top" || arrow.side === "bottom"
                ? { left: Math.max(16, Math.min(arrow.pos - 7, TT_W - 30)), [arrow.side]: -7 }
                : { top: Math.max(16, Math.min(arrow.pos - 7, TT_H - 30)), [arrow.side]: -7 }),
              width: 14, height: 14, background: "#fff",
              transform: "rotate(45deg)",
            } as React.CSSProperties} />
          )}
          <div style={{ background: "#fff", borderRadius: 18, padding: "20px 22px", boxShadow: "0 20px 50px rgba(0,0,0,.3)", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 24 }}>{actual.emoji}</span>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#042E7B" }}>{actual.titulo}</h3>
            </div>
            <p style={{ margin: "0 0 16px", fontSize: 13.5, color: "#475569", lineHeight: 1.6 }}>{actual.texto}</p>
            <TourControls paso={paso} total={GUIA_PASOS.length} esUltimo={esUltimo} onClose={cerrar} setPaso={setPaso} />
          </div>
        </div>
      ) : (
        /* Tarjeta centrada (bienvenida / final) */
        <div style={{ position: "fixed", inset: 0, zIndex: 301, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, pointerEvents: "none" }}>
          <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 420, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,.35)", pointerEvents: "auto" }}>
            <div style={{ background: "linear-gradient(135deg, #042E7B 0%, #1883FF 100%)", padding: "32px 28px 26px", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 8, lineHeight: 1 }}>{actual.emoji}</div>
              <h2 style={{ margin: 0, color: "#fff", fontSize: 20, fontWeight: 900 }}>{actual.titulo}</h2>
            </div>
            <div style={{ padding: "24px 28px 26px" }}>
              <p style={{ margin: "0 0 20px", fontSize: 14, color: "#475569", lineHeight: 1.65, textAlign: "center" }}>{actual.texto}</p>
              <TourControls paso={paso} total={GUIA_PASOS.length} esUltimo={esUltimo} onClose={cerrar} setPaso={setPaso} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TourControls({ paso, total, esUltimo, onClose, setPaso }: {
  paso: number; total: number; esUltimo: boolean; onClose: () => void; setPaso: React.Dispatch<React.SetStateAction<number>>;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 16 }}>
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} onClick={() => setPaso(i)}
            style={{ width: i === paso ? 20 : 7, height: 7, borderRadius: 20, background: i === paso ? "#1883FF" : "#E2E8F0", cursor: "pointer", transition: "all .25s" }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {paso > 0 ? (
          <button onClick={() => setPaso(p => p - 1)}
            style={{ flex: 1, padding: "11px 0", borderRadius: 11, border: "1.5px solid #E2E8F0", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#64748B" }}>Atrás</button>
        ) : (
          <button onClick={onClose}
            style={{ flex: 1, padding: "11px 0", borderRadius: 11, border: "none", background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#94A3B8" }}>Saltar</button>
        )}
        <button onClick={() => esUltimo ? onClose() : setPaso(p => p + 1)}
          style={{ flex: 2, padding: "11px 0", borderRadius: 11, border: "none", background: "#042E7B", cursor: "pointer", fontSize: 13, fontWeight: 800, color: "#fff" }}>
          {esUltimo ? "¡Entendido!" : "Siguiente →"}
        </button>
      </div>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────── */
export default function RevisorPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [statsMonth, setStatsMonth] = useState({ aprobados: 0, pendientes: 0, cambios: 0, total: 0 });
  const [config, setConfig] = useState<PageConfig>({ nombre_pagina: "Kyoszen", avatar_url: null });
  const [vista, setVista] = useState<"semana" | "mes">("semana");
  const [seccion, setSeccion] = useState<"publicaciones" | "resultados">("publicaciones");
  const [periodOffset, setPeriodOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showGuia, setShowGuia] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setCheckingAuth(false);
    });
  }, []);

  // Mostrar la guía solo la primera vez
  useEffect(() => {
    if (!user) return;
    try {
      if (!localStorage.getItem("kyoszen_revisor_guia_vista")) {
        setShowGuia(true);
        localStorage.setItem("kyoszen_revisor_guia_vista", "1");
      }
    } catch { /* noop */ }
  }, [user]);

  const { desde, hasta, mon, sun } = vista === "semana" ? weekBounds(periodOffset) : monthBounds(periodOffset);

  const cambiarVista = (nueva: "semana" | "mes") => {
    setVista(nueva);
    setPeriodOffset(0);
  };

  const loadPosts = useCallback(async () => {
    setLoading(true);
    // Mes actual para stats
    const now = new Date();
    const mesDesde = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const mesHasta = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

    const [postsRes, configRes, mesRes] = await Promise.all([
      fetch(`/api/revisor/posts?desde=${desde}&hasta=${hasta}`),
      fetch("/api/admin/social/config"),
      fetch(`/api/revisor/posts?desde=${mesDesde}&hasta=${mesHasta}`),
    ]);
    const [postsData, configData, mesData] = await Promise.all([postsRes.json(), configRes.json(), mesRes.json()]);
    setPosts(Array.isArray(postsData) ? postsData : []);
    const fb = Array.isArray(configData) ? configData.find((c: { red_social: string }) => c.red_social === "facebook") : null;
    if (fb) setConfig({ nombre_pagina: fb.nombre_pagina, avatar_url: fb.avatar_url });
    if (Array.isArray(mesData)) {
      setStatsMonth({
        aprobados: mesData.filter((p: Post) => p.estado === "aprobado").length,
        pendientes: mesData.filter((p: Post) => p.estado === "pendiente").length,
        cambios: mesData.filter((p: Post) => p.estado === "cambios").length,
        total: mesData.length,
      });
    }
    setLoading(false);
  }, [desde, hasta]);

  useEffect(() => { if (user) loadPosts(); }, [user, loadPosts]);

  const logout = async () => { await supabase.auth.signOut(); setUser(null); };

  const fmtRange = () => {
    if (vista === "mes") {
      return mon.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
    }
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" };
    if (mon.getMonth() === sun.getMonth())
      return `${mon.getDate()} – ${sun.toLocaleDateString("es-MX", opts)}`;
    return `${mon.toLocaleDateString("es-MX", opts)} – ${sun.toLocaleDateString("es-MX", opts)}`;
  };

  const tituloPeriodo = () => {
    if (vista === "semana") {
      return periodOffset === 0 ? "Esta semana" : periodOffset === -1 ? "Semana pasada" : periodOffset < 0 ? `Hace ${Math.abs(periodOffset)} semanas` : `En ${periodOffset} semanas`;
    }
    return periodOffset === 0 ? "Este mes" : periodOffset === -1 ? "Mes pasado" : periodOffset < 0 ? `Hace ${Math.abs(periodOffset)} meses` : `En ${periodOffset} meses`;
  };

  const handleStatusChange = (id: number, estado: string) => {
    setPosts(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, estado: estado as Post["estado"] } : p);
      return updated;
    });
    if (selectedPost?.id === id) setSelectedPost(prev => prev ? { ...prev, estado: estado as Post["estado"] } : prev);
    // Actualizar stats del mes en tiempo real
    setStatsMonth(prev => {
      const oldEstado = posts.find(p => p.id === id)?.estado;
      if (!oldEstado || oldEstado === estado) return prev;
      return {
        ...prev,
        aprobados: prev.aprobados + (estado === "aprobado" ? 1 : 0) - (oldEstado === "aprobado" ? 1 : 0),
        pendientes: prev.pendientes + (estado === "pendiente" ? 1 : 0) - (oldEstado === "pendiente" ? 1 : 0),
        cambios: prev.cambios + (estado === "cambios" ? 1 : 0) - (oldEstado === "cambios" ? 1 : 0),
      };
    });
  };

  if (checkingAuth) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: "3px solid #042E7B", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!user) return <LoginView onLogin={() => supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))} />;

  const userName = user.user_metadata?.nombre ?? user.email?.split("@")[0] ?? "Cliente";

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9" }}>
      {/* Header */}
      <header style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: "#042E7B", borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {config.avatar_url
                ? <img src={config.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ color: "#FFCC00", fontWeight: 900, fontSize: 12 }}>KZ</span>}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 900, fontSize: 14, color: "#042E7B", lineHeight: 1 }}>{config.nombre_pagina}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#94A3B8" }}>Revisor de contenido</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button data-tour="guia" onClick={() => setShowGuia(true)} title="Ver guía de uso"
              style={{ background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: 8, padding: "5px 12px", fontSize: 12, color: "#1883FF", cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 13 }}>❔</span> Guía de uso
            </button>
            <span style={{ fontSize: 12, color: "#64748B" }}>Hola, <strong>{userName}</strong></span>
            <button onClick={logout} style={{ background: "none", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "5px 12px", fontSize: 12, color: "#64748B", cursor: "pointer", fontWeight: 600 }}>Salir</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 32px" }}>
        {/* Pestañas de sección */}
        <div style={{ display: "flex", gap: 2, marginBottom: 24, background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: 4, width: "fit-content" }}>
          {([["publicaciones", "📋 Publicaciones"], ["resultados", "📊 Análisis"]] as const).map(([k, label]) => (
            <button key={k} onClick={() => setSeccion(k)}
              style={{ padding: "8px 18px", borderRadius: 9, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .15s",
                background: seccion === k ? "#042E7B" : "transparent", color: seccion === k ? "#fff" : "#64748B" }}>
              {label}
            </button>
          ))}
        </div>

        {seccion === "resultados" ? (
          <InformeCliente />
        ) : (
        <>
        {/* Stats del mes */}
        <div data-tour="stats" style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { label: "Total del mes", value: statsMonth.total, bg: "#F1F5F9", color: "#042E7B", dot: "#94A3B8", emoji: "📅" },
            { label: "Aprobados", value: statsMonth.aprobados, bg: "#DCFCE7", color: "#166534", dot: "#22C55E", emoji: "✅" },
            { label: "Pendientes", value: statsMonth.pendientes, bg: "#FEF9C3", color: "#854D0E", dot: "#EAB308", emoji: "🕐" },
            { label: "Con cambios", value: statsMonth.cambios, bg: "#FEE2E2", color: "#991B1B", dot: "#EF4444", emoji: "🔴" },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 50, padding: "8px 16px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>{s.emoji}</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: 12, color: s.color, opacity: .7 }}>{s.label}</span>
            </div>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#94A3B8" }}>
              {new Date().toLocaleDateString("es-MX", { month: "long", year: "numeric" })}
            </span>
          </div>
        </div>

        {/* Navigation + toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: "0 0 3px", fontSize: 20, fontWeight: 900, color: "#042E7B" }}>{tituloPeriodo()}</h2>
            <p style={{ margin: 0, fontSize: 13, color: "#64748B", textTransform: "capitalize" }}>{fmtRange()}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Toggle semana/mes */}
            <div data-tour="toggle" style={{ display: "flex", background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: 3 }}>
              {(["semana", "mes"] as const).map(v => (
                <button key={v} onClick={() => cambiarVista(v)}
                  style={{ padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, textTransform: "capitalize",
                    background: vista === v ? "#042E7B" : "transparent", color: vista === v ? "#fff" : "#64748B", transition: "all .15s" }}>
                  {v}
                </button>
              ))}
            </div>
            {/* Navegación */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button onClick={() => setPeriodOffset(w => w - 1)}
                style={{ width: 36, height: 36, borderRadius: 10, background: "#fff", border: "1.5px solid #E2E8F0", cursor: "pointer", fontSize: 16, color: "#042E7B", fontWeight: 700 }}>‹</button>
              {periodOffset !== 0 && (
                <button onClick={() => setPeriodOffset(0)}
                  style={{ height: 36, padding: "0 14px", borderRadius: 10, background: "#042E7B", border: "none", cursor: "pointer", fontSize: 12, color: "#fff", fontWeight: 700 }}>Hoy</button>
              )}
              <button onClick={() => setPeriodOffset(w => w + 1)}
                style={{ width: 36, height: 36, borderRadius: 10, background: "#fff", border: "1.5px solid #E2E8F0", cursor: "pointer", fontSize: 16, color: "#042E7B", fontWeight: 700 }}>›</button>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div data-tour="grid">
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ width: 32, height: 32, border: "3px solid #042E7B", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
              <p style={{ marginTop: 14, color: "#94A3B8", fontSize: 13 }}>Cargando publicaciones...</p>
            </div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 24px", background: "#fff", borderRadius: 20, border: "1.5px dashed #E2E8F0" }}>
              <span style={{ fontSize: 40 }}>📭</span>
              <p style={{ margin: "16px 0 6px", fontWeight: 700, color: "#042E7B", fontSize: 16 }}>Sin publicaciones {vista === "semana" ? "esta semana" : "este mes"}</p>
              <p style={{ margin: 0, color: "#94A3B8", fontSize: 13 }}>No hay contenido programado para revisar en este período.</p>
            </div>
          ) : vista === "mes" ? (
            /* Calendario real del mes (dom→sáb, semanas por fila) */
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
              {DAYS_SUN.map((d) => (
                <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".4px", paddingBottom: 4 }}>{d}</div>
              ))}
              {monthGrid(mon).map((d, i) => {
                if (!d) return <div key={i} style={{ minHeight: 116, borderRadius: 12, background: "#F8FAFC" }} />;
                const iso = isoDate(d);
                const isToday = iso === isoDate(new Date());
                const dayPosts = posts.filter((p) => p.fecha_programada === iso);
                return (
                  <div key={i} style={{ minHeight: 116, background: isToday ? "#EFF6FF" : "#fff", border: `1.5px solid ${isToday ? "#BFDBFE" : "#EAEEF3"}`, borderRadius: 12, padding: 6, display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: isToday ? "#1883FF" : "#475569", marginBottom: 1 }}>{d.getDate()}</span>
                    {dayPosts.map((post) => {
                      const active = post.social_post_versions.find((vv) => vv.es_activa) ?? post.social_post_versions[0];
                      const est = ESTADO[post.estado];
                      const hayCorreccion = post.social_post_versions.length > 1 && post.estado === "pendiente";
                      return (
                        <button key={post.id} onClick={() => setSelectedPost(post)}
                          style={{ display: "flex", gap: 5, alignItems: "center", width: "100%", textAlign: "left", background: hayCorreccion ? "#EFF6FF" : "#fff", border: `1px solid ${hayCorreccion ? "#1883FF" : "#EEF1F6"}`, borderLeft: `3px solid ${hayCorreccion ? "#1883FF" : est.dot}`, borderRadius: 8, padding: 4, cursor: "pointer", overflow: "hidden" }}>
                          {active?.imagenes?.[0]
                            ? <img src={active.imagenes[0]} alt="" style={{ width: 30, height: 30, borderRadius: 6, objectFit: "cover", flexShrink: 0, display: "block" }} />
                            : <div style={{ width: 30, height: 30, borderRadius: 6, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>📝</div>}
                          <span style={{ flex: 1, minWidth: 0, fontSize: 10, fontWeight: 600, color: "#475569", lineHeight: 1.25, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                            {active?.caption || "Publicación"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
              {posts.map(post => (
                <PostCard key={post.id} post={post} onOpen={() => setSelectedPost(post)} />
              ))}
            </div>
          )}
        </div>
        </>
        )}
      </main>

      {/* Modal */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          config={config}
          userName={userName}
          onClose={() => setSelectedPost(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Guía de uso */}
      {showGuia && (
        <GuiaUso
          onClose={() => setShowGuia(false)}
          hayPosts={posts.length > 0}
          onAbrirEjemplo={() => { if (posts.length > 0 && !selectedPost) setSelectedPost(posts[0]); }}
          onCerrarEjemplo={() => setSelectedPost(null)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
