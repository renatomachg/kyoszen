"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

/* ─── Types ──────────────────────────────────────────── */
interface Version {
  id: number;
  version_num: number;
  caption: string;
  imagenes: string[];
  es_activa: boolean;
  created_at: string;
}
interface Post {
  id: number;
  red_social: string;
  fecha_programada: string;
  estado: "pendiente" | "aprobado" | "cambios";
  titulo_interno: string;
  social_post_versions: Version[];
  social_comments: { id: number }[];
}
interface PageConfig {
  red_social: string;
  nombre_pagina: string;
  avatar_url: string | null;
}

/* ─── Helpers ────────────────────────────────────────── */
const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function weekBounds(offset = 0) {
  const now = new Date();
  const day = now.getDay();
  const diffToMon = (day === 0 ? -6 : 1 - day) + offset * 7;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diffToMon);
  mon.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
  return {
    desde: days[0].toISOString().slice(0, 10),
    hasta: days[6].toISOString().slice(0, 10),
    days,
  };
}

function isoDate(d: Date) { return d.toISOString().slice(0, 10); }
function fmtDay(d: Date) { return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" }); }

const ESTADO: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  pendiente: { label: "Pendiente",  bg: "#FEF9C3", color: "#854D0E", dot: "#EAB308" },
  aprobado:  { label: "Aprobado",   bg: "#DCFCE7", color: "#166534", dot: "#22C55E" },
  cambios:   { label: "Cambios",    bg: "#FEE2E2", color: "#991B1B", dot: "#EF4444" },
};

/* ─── Upload helper — usa API route con service role ─── */
async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/social/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Upload failed");
  }
  const { url } = await res.json();
  return url;
}

/* ─── Modal: crear/nueva versión ────────────────────── */
function PostModal({
  onClose,
  onSaved,
  defaultDate,
  postId,
  existingCaption,
  existingImages,
}: {
  onClose: () => void;
  onSaved: () => void;
  defaultDate?: string;
  postId?: number;
  existingCaption?: string;
  existingImages?: string[];
}) {
  const isNew = !postId;
  const [caption, setCaption] = useState(existingCaption ?? "");
  const [fecha, setFecha] = useState(defaultDate ?? new Date().toISOString().slice(0, 10));
  const [titulo, setTitulo] = useState("");
  const [images, setImages] = useState<string[]>(existingImages ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      try { urls.push(await uploadImage(file)); } catch { /* noop */ }
    }
    setImages((prev) => [...prev, ...urls]);
    setUploading(false);
  };

  const save = async () => {
    if (!caption.trim()) return;
    setSaving(true);
    if (isNew) {
      await fetch("/api/admin/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha_programada: fecha, caption, imagenes: images, titulo_interno: titulo }),
      });
    } else {
      await fetch(`/api/admin/social/posts/${postId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption, imagenes: images }),
      });
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto", padding: 28 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: "#042E7B" }}>
            {isNew ? "Nueva publicación" : `Subir corrección (versión ${(existingCaption ? 2 : 1) + 1})`}
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94A3B8" }}>×</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {isNew && (
            <>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#042E7B", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: 6 }}>Título interno (opcional)</label>
                <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Post vacante cajero semana 23"
                  style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#042E7B", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: 6 }}>Fecha programada</label>
                <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
                  style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
            </>
          )}

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#042E7B", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: 6 }}>Caption / Texto del post</label>
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={5} placeholder="Escribe el texto que acompañará la publicación..."
              style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "9px 12px", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box" }} />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#042E7B", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: 6 }}>
              Imágenes {images.length > 0 && `(${images.length})`}
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              style={{ border: "2px dashed #E2E8F0", borderRadius: 12, padding: "20px", textAlign: "center", cursor: "pointer", background: "#F8FAFC" }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
            >
              {uploading ? <p style={{ margin: 0, color: "#94A3B8", fontSize: 13 }}>Subiendo...</p>
                : <p style={{ margin: 0, color: "#64748B", fontSize: 13 }}>Arrastra imágenes aquí o <span style={{ color: "#1883FF", fontWeight: 700 }}>selecciona</span><br/><span style={{ fontSize: 11, color: "#94A3B8" }}>JPG, PNG — una imagen o carrusel (múltiples)</span></p>}
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => handleFiles(e.target.files)} />
            </div>
            {images.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                {images.map((url, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <img src={url} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, border: "1.5px solid #E2E8F0" }} />
                    <button onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                      style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#EF4444", border: "none", color: "#fff", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "1.5px solid #E2E8F0", background: "#fff", fontSize: 13, fontWeight: 700, color: "#64748B", cursor: "pointer" }}>Cancelar</button>
          <button onClick={save} disabled={!caption.trim() || saving}
            style={{ flex: 2, padding: "11px 0", borderRadius: 12, border: "none", background: "#042E7B", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: !caption.trim() || saving ? 0.5 : 1 }}>
            {saving ? "Guardando..." : isNew ? "Crear publicación" : "Subir nueva versión"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Post detail panel ──────────────────────────────── */
function PostDetail({ post, config, onClose, onUpdated }: { post: Post; config: PageConfig; onClose: () => void; onUpdated: () => void }) {
  const active = post.social_post_versions.find((v) => v.es_activa) ?? post.social_post_versions[0];
  const old = post.social_post_versions.filter((v) => !v.es_activa).sort((a, b) => b.version_num - a.version_num);
  const [showNewVersion, setShowNewVersion] = useState(false);
  const [comments, setComments] = useState<{ id: number; autor_nombre: string; autor_rol: string; contenido: string; created_at: string }[]>([]);
  const [slide, setSlide] = useState(0);
  const [showOld, setShowOld] = useState(false);

  useEffect(() => {
    fetch(`/api/revisor/posts/${post.id}/comments`).then((r) => r.json()).then(setComments);
  }, [post.id]);

  const deletePost = async () => {
    if (!confirm("¿Eliminar esta publicación y todo su historial?")) return;
    await fetch(`/api/admin/social/posts/${post.id}`, { method: "DELETE" });
    onUpdated();
    onClose();
  };

  const est = ESTADO[post.estado];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 700, maxHeight: "90vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ background: "#042E7B", borderRadius: "20px 20px 0 0", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: "0 0 2px", color: "#FFCC00", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" }}>Facebook · {post.fecha_programada}</p>
            <p style={{ margin: 0, color: "#fff", fontWeight: 900, fontSize: 16 }}>{post.titulo_interno || "Sin título interno"}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {post.estado === "cambios" && (
              <button onClick={() => setShowNewVersion(true)}
                style={{ background: "#FFCC00", border: "none", borderRadius: 10, padding: "7px 14px", fontSize: 12, fontWeight: 700, color: "#042E7B", cursor: "pointer" }}>
                + Nueva versión
              </button>
            )}
            <button onClick={onClose} style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: 10, width: 34, height: 34, color: "#fff", fontSize: 18, cursor: "pointer" }}>×</button>
          </div>
        </div>

        <div style={{ padding: 24, display: "flex", gap: 24, flexWrap: "wrap" }}>
          {/* Preview */}
          <div style={{ flex: "0 0 auto", maxWidth: 360 }}>
            {active && (
              <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 8px rgba(0,0,0,.1)", overflow: "hidden" }}>
                <div style={{ background: est.bg, padding: "6px 12px", display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: est.dot, display: "inline-block" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: est.color }}>{est.label}</span>
                </div>
                <div style={{ padding: "12px 14px 8px", display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#042E7B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                    {config.avatar_url ? <img src={config.avatar_url} style={{ width: "100%", objectFit: "cover" }} alt="" /> : <span style={{ color: "#FFCC00", fontWeight: 900, fontSize: 12 }}>KZ</span>}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>{config.nombre_pagina}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#65676B" }}>Hoy · 🌐</p>
                  </div>
                </div>
                {active.caption && <p style={{ margin: "0 14px 10px", fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{active.caption}</p>}
                {active.imagenes?.length > 0 && (
                  <div style={{ position: "relative", background: "#F0F2F5", aspectRatio: "1/1" }}>
                    <img src={active.imagenes[slide]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    {active.imagenes.length > 1 && (
                      <span style={{ position: "absolute", top: 8, right: 10, background: "rgba(0,0,0,.55)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                        {slide + 1}/{active.imagenes.length}
                      </span>
                    )}
                    {active.imagenes.length > 1 && (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px", pointerEvents: "none" }}>
                        <button onClick={() => setSlide(Math.max(0, slide - 1))} style={{ pointerEvents: "all", background: "rgba(0,0,0,.4)", color: "#fff", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", fontSize: 14 }}>‹</button>
                        <button onClick={() => setSlide(Math.min(active.imagenes.length - 1, slide + 1))} style={{ pointerEvents: "all", background: "rgba(0,0,0,.4)", color: "#fff", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", fontSize: 14 }}>›</button>
                      </div>
                    )}
                  </div>
                )}
                <div style={{ padding: "8px 14px", borderTop: "1px solid #E4E6EB", display: "flex" }}>
                  {["👍", "💬", "↗"].map((a) => <div key={a} style={{ flex: 1, textAlign: "center", fontSize: 13, color: "#65676B" }}>{a}</div>)}
                </div>
              </div>
            )}

            {old.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <button onClick={() => setShowOld(!showOld)} style={{ background: "none", border: "none", color: "#64748B", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                  {showOld ? "▼" : "▶"} Versiones anteriores ({old.length})
                </button>
                {showOld && old.map((v) => (
                  <div key={v.id} style={{ marginTop: 8, opacity: 0.5, border: "1.5px dashed #CBD5E1", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ background: "#F8FAFC", padding: "4px 10px", fontSize: 11, color: "#64748B", fontWeight: 700 }}>v{v.version_num}</div>
                    {v.imagenes?.[0] && <img src={v.imagenes[0]} alt="" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover" }} />}
                    {v.caption && <p style={{ margin: "6px 10px", fontSize: 12, color: "#64748B" }}>{v.caption.slice(0, 100)}{v.caption.length > 100 ? "..." : ""}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <div style={{ flex: 1, minWidth: 220 }}>
            <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: ".5px" }}>
              Comentarios del cliente {comments.length > 0 && `(${comments.length})`}
            </p>
            {comments.length === 0 ? (
              <p style={{ color: "#94A3B8", fontSize: 13, margin: 0 }}>Sin comentarios aún.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto" }}>
                {comments.map((c) => (
                  <div key={c.id} style={{ padding: "10px 12px", borderRadius: 12, background: c.autor_rol === "admin" ? "#EFF6FF" : "#F8FAFC", borderLeft: `3px solid ${c.autor_rol === "admin" ? "#1883FF" : "#CBD5E1"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: c.autor_rol === "admin" ? "#1883FF" : "#042E7B" }}>{c.autor_nombre}</span>
                      <span style={{ fontSize: 11, color: "#94A3B8" }}>{new Date(c.created_at).toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: "#1E293B", lineHeight: 1.5 }}>{c.contenido}</p>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #E2E8F0" }}>
              <button onClick={deletePost} style={{ background: "none", border: "1.5px solid #FEE2E2", borderRadius: 10, padding: "7px 14px", fontSize: 12, fontWeight: 700, color: "#DC2626", cursor: "pointer" }}>
                Eliminar publicación
              </button>
            </div>
          </div>
        </div>
      </div>

      {showNewVersion && active && (
        <PostModal postId={post.id} existingCaption={active.caption} existingImages={active.imagenes}
          onClose={() => setShowNewVersion(false)} onSaved={() => { onUpdated(); onClose(); }} />
      )}
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────── */
export default function RedesSocialesPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [config, setConfig] = useState<PageConfig>({ red_social: "facebook", nombre_pagina: "Kyoszen", avatar_url: null });
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostDate, setNewPostDate] = useState<string | undefined>();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [tab, setTab] = useState<"calendario" | "config">("calendario");

  const [configForm, setConfigForm] = useState({ nombre_pagina: "Kyoszen", avatar_url: "" });
  const [savingConfig, setSavingConfig] = useState(false);
  const [configError, setConfigError] = useState("");
  const [configOk, setConfigOk] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);

  const { desde, hasta, days } = weekBounds(weekOffset);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [postsRes, cfgRes] = await Promise.all([
      fetch(`/api/admin/social/posts?desde=${desde}&hasta=${hasta}`),
      fetch("/api/admin/social/config"),
    ]);
    const [postsData, cfgData] = await Promise.all([postsRes.json(), cfgRes.json()]);
    setPosts(Array.isArray(postsData) ? postsData : []);
    const fb = Array.isArray(cfgData) ? cfgData.find((c: PageConfig) => c.red_social === "facebook") : null;
    if (fb) {
      setConfig(fb);
      setConfigForm({ nombre_pagina: fb.nombre_pagina, avatar_url: fb.avatar_url ?? "" });
    }
    setLoading(false);
  }, [desde, hasta]);

  useEffect(() => { loadData(); }, [loadData]);

  const saveConfig = async () => {
    setSavingConfig(true);
    setConfigError("");
    setConfigOk(false);
    let avatar_url = configForm.avatar_url;
    if (avatarFile) {
      try {
        avatar_url = await uploadImage(avatarFile);
      } catch (e) {
        setConfigError("Error al subir la imagen: " + (e instanceof Error ? e.message : "intenta de nuevo"));
        setSavingConfig(false);
        return;
      }
    }
    const res = await fetch("/api/admin/social/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ red_social: "facebook", nombre_pagina: configForm.nombre_pagina, avatar_url }),
    });
    setSavingConfig(false);
    if (!res.ok) { setConfigError("Error al guardar la configuración."); return; }
    setAvatarFile(null);
    setConfigOk(true);
    setTimeout(() => setConfigOk(false), 3000);
    loadData();
  };

  const fmtWeek = () => {
    const mon = days[0];
    const sun = days[6];
    if (mon.getMonth() === sun.getMonth()) return `${mon.getDate()} – ${sun.toLocaleDateString("es-MX", { day: "numeric", month: "long" })}`;
    return `${mon.toLocaleDateString("es-MX", { day: "numeric", month: "short" })} – ${sun.toLocaleDateString("es-MX", { day: "numeric", month: "short" })}`;
  };

  const postsByDay = (day: Date) => posts.filter((p) => p.fecha_programada === isoDate(day));

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 900, color: "#042E7B" }}>Redes Sociales</h1>
          <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>Calendario de publicaciones · aprobación de clientes</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a href="/revisor" target="_blank" style={{ background: "#F1F5F9", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, color: "#64748B", textDecoration: "none" }}>
            👁 Vista cliente
          </a>
          <button onClick={() => setShowNewPost(true)}
            style={{ background: "#042E7B", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            + Nueva publicación
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 24, background: "#F1F5F9", borderRadius: 12, padding: 4, width: "fit-content" }}>
        {(["calendario", "config"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "8px 18px", borderRadius: 9, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .15s", background: tab === t ? "#fff" : "transparent", color: tab === t ? "#042E7B" : "#64748B", boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,.08)" : "none" }}>
            {t === "calendario" ? "📅 Calendario" : "⚙️ Configuración"}
          </button>
        ))}
      </div>

      {/* ── Tab: Calendario ── */}
      {tab === "calendario" && (
        <>
          {/* Week nav */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <button onClick={() => setWeekOffset(w => w - 1)}
              style={{ width: 36, height: 36, borderRadius: 10, background: "#fff", border: "1.5px solid #E2E8F0", cursor: "pointer", fontSize: 16, fontWeight: 700, color: "#042E7B" }}>‹</button>
            <div>
              <p style={{ margin: 0, fontWeight: 900, fontSize: 15, color: "#042E7B" }}>
                {weekOffset === 0 ? "Esta semana" : weekOffset === -1 ? "Semana pasada" : `${weekOffset > 0 ? "+" : ""}${weekOffset} semanas`}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#94A3B8" }}>{fmtWeek()}</p>
            </div>
            {weekOffset !== 0 && (
              <button onClick={() => setWeekOffset(0)}
                style={{ height: 32, padding: "0 12px", borderRadius: 8, background: "#042E7B", border: "none", cursor: "pointer", fontSize: 12, color: "#fff", fontWeight: 700 }}>Hoy</button>
            )}
            <button onClick={() => setWeekOffset(w => w + 1)}
              style={{ width: 36, height: 36, borderRadius: 10, background: "#fff", border: "1.5px solid #E2E8F0", cursor: "pointer", fontSize: 16, fontWeight: 700, color: "#042E7B" }}>›</button>
          </div>

          {/* Calendar grid */}
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
              <div style={{ width: 28, height: 28, border: "3px solid #042E7B", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
              {/* Day headers */}
              {days.map((d, i) => {
                const isToday = isoDate(d) === isoDate(new Date());
                return (
                  <div key={i} style={{ textAlign: "center", paddingBottom: 8 }}>
                    <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" }}>{DAYS[i]}</p>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: isToday ? "#1883FF" : "#042E7B" }}>{d.getDate()}</p>
                    <p style={{ margin: 0, fontSize: 10, color: "#CBD5E1" }}>{d.toLocaleDateString("es-MX", { month: "short" })}</p>
                  </div>
                );
              })}

              {/* Day columns */}
              {days.map((d, i) => {
                const dayPosts = postsByDay(d);
                const isToday = isoDate(d) === isoDate(new Date());
                return (
                  <div key={i} style={{ minHeight: 180, background: isToday ? "#EFF6FF" : "#F8FAFC", borderRadius: 14, border: `1.5px solid ${isToday ? "#BFDBFE" : "#E2E8F0"}`, padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                    {dayPosts.map((p) => {
                      const v = p.social_post_versions.find((v) => v.es_activa) ?? p.social_post_versions[0];
                      const est = ESTADO[p.estado];
                      const commentCount = p.social_comments?.length ?? 0;
                      return (
                        <button key={p.id} onClick={() => setSelectedPost(p)}
                          style={{ background: "#fff", border: `1.5px solid ${p.estado === "cambios" ? "#FCA5A5" : p.estado === "aprobado" ? "#86EFAC" : "#E2E8F0"}`, borderRadius: 10, padding: 0, cursor: "pointer", overflow: "hidden", textAlign: "left", width: "100%" }}>
                          {v?.imagenes?.[0] && (
                            <img src={v.imagenes[0]} alt="" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" }} />
                          )}
                          <div style={{ padding: "6px 8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: est.dot, flexShrink: 0 }} />
                              <span style={{ fontSize: 10, fontWeight: 700, color: est.color }}>{est.label}</span>
                            </div>
                            {v?.caption && <p style={{ margin: 0, fontSize: 10, color: "#64748B", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{v.caption}</p>}
                            {commentCount > 0 && <p style={{ margin: "3px 0 0", fontSize: 10, color: "#94A3B8" }}>💬 {commentCount}</p>}
                          </div>
                        </button>
                      );
                    })}
                    <button
                      onClick={() => { setNewPostDate(isoDate(d)); setShowNewPost(true); }}
                      style={{ background: "none", border: "1.5px dashed #CBD5E1", borderRadius: 8, padding: "6px 0", fontSize: 11, color: "#94A3B8", cursor: "pointer", fontWeight: 600, marginTop: "auto" }}>
                      + Añadir
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Tab: Configuración ── */}
      {tab === "config" && (
        <div style={{ maxWidth: 480 }}>
          <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 20, padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 900, color: "#042E7B" }}>Página de Facebook</h3>
              <p style={{ margin: 0, fontSize: 12, color: "#64748B" }}>Nombre y avatar que aparecen en el mockup de revisión.</p>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#042E7B", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: 6 }}>Nombre de la página</label>
              <input value={configForm.nombre_pagina} onChange={(e) => setConfigForm((p) => ({ ...p, nombre_pagina: e.target.value }))}
                style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#042E7B", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: 6 }}>Avatar / Logo</label>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#042E7B", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {(avatarFile ? URL.createObjectURL(avatarFile) : configForm.avatar_url)
                    ? <img src={avatarFile ? URL.createObjectURL(avatarFile) : configForm.avatar_url!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ color: "#FFCC00", fontWeight: 900 }}>KZ</span>}
                </div>
                <button onClick={() => avatarRef.current?.click()}
                  style={{ border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, color: "#042E7B", background: "#F8FAFC", cursor: "pointer" }}>
                  Cambiar imagen
                </button>
                <input ref={avatarRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} />
              </div>
            </div>

            {configError && <p style={{ margin: 0, fontSize: 12, color: "#DC2626", fontWeight: 600 }}>{configError}</p>}
            <button onClick={saveConfig} disabled={savingConfig}
              style={{ background: configOk ? "#166534" : "#042E7B", border: "none", borderRadius: 12, padding: "12px 0", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", opacity: savingConfig ? 0.6 : 1, transition: "background .3s" }}>
              {savingConfig ? "Subiendo imagen..." : configOk ? "✓ Guardado" : "Guardar configuración"}
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showNewPost && (
        <PostModal defaultDate={newPostDate} onClose={() => { setShowNewPost(false); setNewPostDate(undefined); }} onSaved={loadData} />
      )}
      {selectedPost && (
        <PostDetail post={selectedPost} config={config} onClose={() => setSelectedPost(null)} onUpdated={loadData} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
