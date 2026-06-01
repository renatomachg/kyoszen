"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

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
  const [slide, setSlide] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<Comment[]>(post.social_comments ?? []);
  const [sending, setSending] = useState(false);
  const [estado, setEstado] = useState(post.estado);
  const [changingStatus, setChangingStatus] = useState<string | null>(null);

  const imgs = active?.imagenes ?? [];
  const est = ESTADO[estado];

  const submitComment = async () => {
    const text = comment.trim();
    if (!text || sending) return;
    setSending(true);
    const res = await fetch(`/api/revisor/posts/${post.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ autor_nombre: userName, autor_rol: "cliente", contenido: text }),
    });
    if (res.ok) {
      const data = await res.json();
      setComments(prev => [...prev, data]);
      setComment("");
    }
    setSending(false);
  };

  const changeStatus = async (newEstado: string) => {
    setChangingStatus(newEstado);
    await fetch(`/api/revisor/posts/${post.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: newEstado, revisor_nombre: userName }),
    });
    setEstado(newEstado as Post["estado"]);
    onStatusChange(post.id, newEstado);
    setChangingStatus(null);
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
            <p style={{ margin: "0 0 2px", color: "#FFCC00", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px" }}>
              Facebook · {fmtScheduledDate(post.fecha_programada)}
            </p>
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
            <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,.1)", overflow: "hidden" }}>
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
              {active.caption && <p style={{ margin: "0 14px 10px", fontSize: 14, color: "#050505", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{active.caption}</p>}
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

            {/* Version history */}
            {oldVersions.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <button onClick={() => setShowHistory(!showHistory)}
                  style={{ background: "none", border: "none", color: "#64748B", fontSize: 12, cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 6, padding: 0 }}>
                  <span style={{ display: "inline-block", transition: "transform .2s", transform: showHistory ? "rotate(90deg)" : "none" }}>▶</span>
                  Ver versiones anteriores ({oldVersions.length})
                </button>
                {showHistory && (
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                    {oldVersions.map(v => (
                      <div key={v.id} style={{ opacity: 0.5, border: "1.5px dashed #CBD5E1", borderRadius: 12, overflow: "hidden" }}>
                        <div style={{ background: "#F8FAFC", padding: "5px 12px", fontSize: 11, color: "#64748B", fontWeight: 700 }}>Versión {v.version_num}</div>
                        {v.imagenes?.[0] && <img src={v.imagenes[0]} alt="" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover" }} />}
                        {v.caption && <p style={{ margin: "6px 12px 8px", fontSize: 12, color: "#64748B" }}>{v.caption.slice(0, 100)}{v.caption.length > 100 ? "…" : ""}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: actions + comments */}
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Approval */}
            <div>
              <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: ".6px" }}>Tu revisión</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => changeStatus("aprobado")} disabled={changingStatus !== null}
                  style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13,
                    background: estado === "aprobado" ? "#166534" : "#DCFCE7", color: estado === "aprobado" ? "#fff" : "#166534",
                    opacity: changingStatus !== null ? 0.6 : 1, transition: "all .2s" }}>
                  {changingStatus === "aprobado" ? "..." : "✅ Aprobar"}
                </button>
                <button onClick={() => changeStatus("cambios")} disabled={changingStatus !== null}
                  style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13,
                    background: estado === "cambios" ? "#991B1B" : "#FEE2E2", color: estado === "cambios" ? "#fff" : "#991B1B",
                    opacity: changingStatus !== null ? 0.6 : 1, transition: "all .2s" }}>
                  {changingStatus === "cambios" ? "..." : "🔴 Pedir cambios"}
                </button>
              </div>
            </div>

            {/* Comments */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: ".6px" }}>
                Comentarios {comments.length > 0 && `(${comments.length})`}
              </p>
              {comments.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto" }}>
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
              )}
              {comments.length === 0 && (
                <p style={{ margin: 0, fontSize: 13, color: "#94A3B8" }}>Sin comentarios aún. Escribe el primero.</p>
              )}
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginTop: "auto" }}>
                <textarea value={comment} onChange={e => setComment(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                  placeholder="Escribe un comentario..." rows={3}
                  style={{ flex: 1, border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "10px 12px", fontSize: 13, resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.5 }} />
                <button onClick={submitComment} disabled={!comment.trim() || sending}
                  style={{ width: 42, height: 42, borderRadius: 12, background: "#042E7B", border: "none", color: "#fff", cursor: "pointer", fontSize: 18, opacity: !comment.trim() || sending ? 0.4 : 1, flexShrink: 0 }}>↑</button>
              </div>
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
  const commentCount = post.social_comments?.length ?? 0;
  const hasImage = (active?.imagenes?.length ?? 0) > 0;
  const isCarrusel = (active?.imagenes?.length ?? 0) > 1;

  return (
    <button onClick={onOpen} style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 16, overflow: "hidden", cursor: "pointer", textAlign: "left", width: "100%", transition: "all .2s", boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(4,46,123,.12)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "none"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 4px rgba(0,0,0,.06)"; }}>

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
        <div style={{ position: "absolute", top: 8, left: 8, background: est.bg, borderRadius: 20, padding: "3px 9px", display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: est.dot, display: "inline-block" }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: est.color }}>{est.label}</span>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "12px 14px" }}>
        <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#042E7B" }}>
          {fmtShortDate(post.fecha_programada)}
        </p>
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

/* ─── Main ───────────────────────────────────────────── */
export default function RevisorPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [config, setConfig] = useState<PageConfig>({ nombre_pagina: "Kyoszen", avatar_url: null });
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setCheckingAuth(false);
    });
  }, []);

  const { desde, hasta, mon, sun } = weekBounds(weekOffset);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const [postsRes, configRes] = await Promise.all([
      fetch(`/api/revisor/posts?desde=${desde}&hasta=${hasta}`),
      fetch("/api/admin/social/config"),
    ]);
    const [postsData, configData] = await Promise.all([postsRes.json(), configRes.json()]);
    setPosts(Array.isArray(postsData) ? postsData : []);
    const fb = Array.isArray(configData) ? configData.find((c: { red_social: string }) => c.red_social === "facebook") : null;
    if (fb) setConfig({ nombre_pagina: fb.nombre_pagina, avatar_url: fb.avatar_url });
    setLoading(false);
  }, [desde, hasta]);

  useEffect(() => { if (user) loadPosts(); }, [user, loadPosts]);

  const logout = async () => { await supabase.auth.signOut(); setUser(null); };

  const fmtWeekRange = () => {
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" };
    if (mon.getMonth() === sun.getMonth())
      return `${mon.getDate()} – ${sun.toLocaleDateString("es-MX", opts)}`;
    return `${mon.toLocaleDateString("es-MX", opts)} – ${sun.toLocaleDateString("es-MX", opts)}`;
  };

  const handleStatusChange = (id: number, estado: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, estado: estado as Post["estado"] } : p));
    if (selectedPost?.id === id) setSelectedPost(prev => prev ? { ...prev, estado: estado as Post["estado"] } : prev);
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
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12, color: "#64748B" }}>Hola, <strong>{userName}</strong></span>
            <button onClick={logout} style={{ background: "none", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "5px 12px", fontSize: 12, color: "#64748B", cursor: "pointer", fontWeight: 600 }}>Salir</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
        {/* Week navigation */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h2 style={{ margin: "0 0 3px", fontSize: 20, fontWeight: 900, color: "#042E7B" }}>
              {weekOffset === 0 ? "Esta semana" : weekOffset === -1 ? "Semana pasada" : weekOffset < 0 ? `Hace ${Math.abs(weekOffset)} semanas` : `En ${weekOffset} semanas`}
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>{fmtWeekRange()}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button onClick={() => setWeekOffset(w => w - 1)}
              style={{ width: 36, height: 36, borderRadius: 10, background: "#fff", border: "1.5px solid #E2E8F0", cursor: "pointer", fontSize: 16, color: "#042E7B", fontWeight: 700 }}>‹</button>
            {weekOffset !== 0 && (
              <button onClick={() => setWeekOffset(0)}
                style={{ height: 36, padding: "0 14px", borderRadius: 10, background: "#042E7B", border: "none", cursor: "pointer", fontSize: 12, color: "#fff", fontWeight: 700 }}>Hoy</button>
            )}
            <button onClick={() => setWeekOffset(w => w + 1)}
              style={{ width: 36, height: 36, borderRadius: 10, background: "#fff", border: "1.5px solid #E2E8F0", cursor: "pointer", fontSize: 16, color: "#042E7B", fontWeight: 700 }}>›</button>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: 32, height: 32, border: "3px solid #042E7B", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
            <p style={{ marginTop: 14, color: "#94A3B8", fontSize: 13 }}>Cargando publicaciones...</p>
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px", background: "#fff", borderRadius: 20, border: "1.5px dashed #E2E8F0" }}>
            <span style={{ fontSize: 40 }}>📭</span>
            <p style={{ margin: "16px 0 6px", fontWeight: 700, color: "#042E7B", fontSize: 16 }}>Sin publicaciones esta semana</p>
            <p style={{ margin: 0, color: "#94A3B8", fontSize: 13 }}>No hay contenido programado para revisar en este período.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {posts.map(post => (
              <PostCard key={post.id} post={post} onOpen={() => setSelectedPost(post)} />
            ))}
          </div>
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
