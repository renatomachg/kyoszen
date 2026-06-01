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

function fmtDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

const ESTADO_LABEL: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  pendiente: { label: "Pendiente revisión", bg: "#FEF9C3", color: "#854D0E", dot: "#EAB308" },
  aprobado:  { label: "Aprobado",           bg: "#DCFCE7", color: "#166534", dot: "#22C55E" },
  cambios:   { label: "Cambios solicitados",bg: "#FEE2E2", color: "#991B1B", dot: "#EF4444" },
};

/* ─── FB Mockup ─────────────────────────────────────── */
function FbMockup({ version, config, estado }: { version: Version; config: PageConfig; estado: string }) {
  const [slide, setSlide] = useState(0);
  const imgs = version.imagenes ?? [];
  const est = ESTADO_LABEL[estado] ?? ESTADO_LABEL.pendiente;

  return (
    <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.12)", overflow: "hidden", maxWidth: 500, width: "100%" }}>
      {/* Estado badge */}
      <div style={{ background: est.bg, padding: "7px 14px", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: est.dot, display: "inline-block", flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: est.color }}>{est.label}</span>
      </div>

      {/* FB header */}
      <div style={{ padding: "12px 14px 8px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#042E7B", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {config.avatar_url
            ? <img src={config.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ color: "#FFCC00", fontWeight: 900, fontSize: 14 }}>KZ</span>
          }
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#050505" }}>{config.nombre_pagina}</p>
          <p style={{ margin: 0, fontSize: 12, color: "#65676B" }}>
            {fmtDate(version.created_at)} · 🌐
          </p>
        </div>
      </div>

      {/* Caption */}
      {version.caption && (
        <p style={{ margin: "0 14px 10px", fontSize: 14, color: "#050505", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{version.caption}</p>
      )}

      {/* Image(s) */}
      {imgs.length > 0 && (
        <div style={{ position: "relative", background: "#F0F2F5", aspectRatio: "1/1", overflow: "hidden" }}>
          <img
            src={imgs[slide]}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          {imgs.length > 1 && (
            <>
              <button onClick={() => setSlide(Math.max(0, slide - 1))} disabled={slide === 0}
                style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,.5)", color: "#fff", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", opacity: slide === 0 ? 0.3 : 1 }}>‹</button>
              <button onClick={() => setSlide(Math.min(imgs.length - 1, slide + 1))} disabled={slide === imgs.length - 1}
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,.5)", color: "#fff", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", opacity: slide === imgs.length - 1 ? 0.3 : 1 }}>›</button>
              <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5 }}>
                {imgs.map((_, i) => (
                  <span key={i} onClick={() => setSlide(i)} style={{ width: 7, height: 7, borderRadius: "50%", background: i === slide ? "#fff" : "rgba(255,255,255,.5)", cursor: "pointer" }} />
                ))}
              </div>
              <span style={{ position: "absolute", top: 10, right: 12, background: "rgba(0,0,0,.55)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20 }}>
                {slide + 1}/{imgs.length}
              </span>
            </>
          )}
        </div>
      )}

      {/* FB actions bar */}
      <div style={{ padding: "8px 14px", borderTop: "1px solid #E4E6EB", display: "flex", gap: 0 }}>
        {["👍 Me gusta", "💬 Comentar", "↗ Compartir"].map((a) => (
          <div key={a} style={{ flex: 1, textAlign: "center", padding: "6px 0", fontSize: 13, color: "#65676B", fontWeight: 600 }}>{a}</div>
        ))}
      </div>
    </div>
  );
}

/* ─── Post Card ──────────────────────────────────────── */
function PostCard({ post, config, userName }: { post: Post; config: PageConfig; userName: string }) {
  const activeVersion = post.social_post_versions.find((v) => v.es_activa) ?? post.social_post_versions[0];
  const oldVersions = post.social_post_versions.filter((v) => !v.es_activa).sort((a, b) => b.version_num - a.version_num);
  const [showHistory, setShowHistory] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<Comment[]>(post.social_comments ?? []);
  const [sending, setSending] = useState(false);
  const [estado, setEstado] = useState(post.estado);
  const [changingStatus, setChangingStatus] = useState<string | null>(null);

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
      setComments((prev) => [...prev, data]);
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
    setChangingStatus(null);
  };

  if (!activeVersion) return null;

  return (
    <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,.07)", overflow: "hidden", marginBottom: 32 }}>
      {/* Date header */}
      <div style={{ background: "#042E7B", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>📅</span>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>
            {fmtDate(post.fecha_programada)}
          </span>
        </div>
        <span style={{ background: "#FFCC00", color: "#042E7B", fontSize: 11, fontWeight: 900, padding: "3px 10px", borderRadius: 20 }}>
          Facebook
        </span>
      </div>

      <div style={{ padding: "24px 24px 0", display: "flex", gap: 24, flexWrap: "wrap" }}>
        {/* Left: mockup */}
        <div style={{ flex: "0 0 auto" }}>
          <FbMockup version={activeVersion} config={config} estado={estado} />

          {/* Version history */}
          {oldVersions.length > 0 && (
            <div style={{ marginTop: 12, maxWidth: 500 }}>
              <button
                onClick={() => setShowHistory(!showHistory)}
                style={{ background: "none", border: "none", color: "#65676B", fontSize: 12, cursor: "pointer", fontWeight: 600, padding: "4px 0", display: "flex", alignItems: "center", gap: 6 }}
              >
                <span style={{ transition: "transform .2s", display: "inline-block", transform: showHistory ? "rotate(90deg)" : "none" }}>▶</span>
                Ver versiones anteriores ({oldVersions.length})
              </button>
              {showHistory && (
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 12 }}>
                  {oldVersions.map((v) => (
                    <div key={v.id} style={{ opacity: 0.55, border: "1.5px dashed #CBD5E1", borderRadius: 12, overflow: "hidden" }}>
                      <div style={{ background: "#F8FAFC", padding: "6px 12px", fontSize: 11, color: "#64748B", fontWeight: 700 }}>
                        Versión {v.version_num} · {new Date(v.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                      </div>
                      <FbMockup version={v} config={config} estado="pendiente" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: actions + comments */}
        <div style={{ flex: 1, minWidth: 260, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Approval buttons */}
          <div>
            <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: ".5px" }}>Tu revisión</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => changeStatus("aprobado")}
                disabled={changingStatus !== null}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13,
                  background: estado === "aprobado" ? "#166534" : "#DCFCE7",
                  color: estado === "aprobado" ? "#fff" : "#166534",
                  opacity: changingStatus !== null ? 0.6 : 1,
                  transition: "all .2s",
                }}
              >
                {changingStatus === "aprobado" ? "..." : "✅ Aprobar"}
              </button>
              <button
                onClick={() => changeStatus("cambios")}
                disabled={changingStatus !== null}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13,
                  background: estado === "cambios" ? "#991B1B" : "#FEE2E2",
                  color: estado === "cambios" ? "#fff" : "#991B1B",
                  opacity: changingStatus !== null ? 0.6 : 1,
                  transition: "all .2s",
                }}
              >
                {changingStatus === "cambios" ? "..." : "🔴 Pedir cambios"}
              </button>
            </div>
          </div>

          {/* Comments thread */}
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: ".5px" }}>
              Comentarios {comments.length > 0 && `(${comments.length})`}
            </p>
            {comments.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12, maxHeight: 240, overflowY: "auto" }}>
                {comments.map((c) => (
                  <div key={c.id} style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    background: c.autor_rol === "admin" ? "#EFF6FF" : "#F8FAFC",
                    borderLeft: `3px solid ${c.autor_rol === "admin" ? "#1883FF" : "#CBD5E1"}`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: c.autor_rol === "admin" ? "#1883FF" : "#042E7B" }}>
                        {c.autor_nombre} {c.autor_rol === "admin" && "· Admin"}
                      </span>
                      <span style={{ fontSize: 11, color: "#94A3B8" }}>{fmtTime(c.created_at)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: "#1E293B", lineHeight: 1.5 }}>{c.contenido}</p>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                placeholder="Escribe un comentario..."
                rows={2}
                style={{
                  flex: 1, border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "10px 12px",
                  fontSize: 13, resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.5,
                }}
              />
              <button
                onClick={submitComment}
                disabled={!comment.trim() || sending}
                style={{
                  width: 40, height: 40, borderRadius: 12, background: "#042E7B", border: "none",
                  color: "#fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center",
                  justifyContent: "center", opacity: !comment.trim() || sending ? 0.4 : 1, flexShrink: 0,
                }}
              >↑</button>
            </div>
          </div>
        </div>
      </div>
      <div style={{ height: 24 }} />
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
          <div style={{ width: 52, height: 52, background: "#042E7B", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <span style={{ color: "#FFCC00", fontWeight: 900, fontSize: 18 }}>KZ</span>
          </div>
          <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 900, color: "#042E7B" }}>Revisor de contenido</h1>
          <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>Kyoszen · Aprobación de publicaciones</p>
        </div>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#042E7B", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>Correo</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "11px 14px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              placeholder="tu@correo.com"
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#042E7B", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "11px 14px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              placeholder="••••••••"
            />
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

  // Check auth
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

  useEffect(() => {
    if (user) loadPosts();
  }, [user, loadPosts]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const fmtWeekRange = () => {
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" };
    if (mon.getMonth() === sun.getMonth()) {
      return `${mon.getDate()} – ${sun.toLocaleDateString("es-MX", opts)}`;
    }
    return `${mon.toLocaleDateString("es-MX", opts)} – ${sun.toLocaleDateString("es-MX", opts)}`;
  };

  if (checkingAuth) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #042E7B", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!user) return <LoginView onLogin={() => supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))} />;

  const userName = user.user_metadata?.nombre ?? user.email?.split("@")[0] ?? "Cliente";

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9" }}>
      {/* Header */}
      <header style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: "#042E7B", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#FFCC00", fontWeight: 900, fontSize: 12 }}>KZ</span>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 900, fontSize: 14, color: "#042E7B", lineHeight: 1 }}>Kyoszen</p>
              <p style={{ margin: 0, fontSize: 11, color: "#94A3B8" }}>Revisor de contenido</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12, color: "#64748B" }}>Hola, <strong>{userName}</strong></span>
            <button onClick={logout} style={{ background: "none", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "5px 12px", fontSize: 12, color: "#64748B", cursor: "pointer", fontWeight: 600 }}>
              Salir
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
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
                style={{ height: 36, padding: "0 12px", borderRadius: 10, background: "#042E7B", border: "none", cursor: "pointer", fontSize: 12, color: "#fff", fontWeight: 700 }}>Hoy</button>
            )}
            <button onClick={() => setWeekOffset(w => w + 1)}
              style={{ width: 36, height: 36, borderRadius: 10, background: "#fff", border: "1.5px solid #E2E8F0", cursor: "pointer", fontSize: 16, color: "#042E7B", fontWeight: 700 }}>›</button>
          </div>
        </div>

        {/* Posts */}
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
          posts.map((post) => (
            <PostCard key={post.id} post={post} config={config} userName={userName} />
          ))
        )}
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
