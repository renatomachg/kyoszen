"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getRedSocial, REDES_SOCIALES as REDES } from "@/lib/redes-sociales";
import { RedLogo } from "@/components/RedLogo";
import InformeAdmin from "@/components/admin/InformeAdmin";

/* ─── Types ──────────────────────────────────────────── */
interface Version {
  id: number;
  version_num: number;
  caption: string;
  imagenes: string[];
  nota_visual?: string;
  es_activa: boolean;
  created_at: string;
}
interface Post {
  id: number;
  red_social: string;
  fecha_programada: string;
  estado: "pendiente" | "aprobado" | "cambios";
  titulo_interno: string;
  publicado: boolean;
  social_post_versions: Version[];
  social_comments: { id: number }[];
}
interface PageConfig {
  red_social: string;
  nombre_pagina: string;
  avatar_url: string | null;
}
interface ImportPieza {
  fecha: string;
  red_social: string;
  formato: string;
  titulo_interno: string;
  caption: string;
  nota_visual: string;
  ya_existe?: boolean;
  fecha_pasada?: boolean;
  seleccionada?: boolean;
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

function monthBounds(offset = 0) {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const last = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  return { desde: first.toISOString().slice(0, 10), hasta: last.toISOString().slice(0, 10), first, last };
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
  editMode,
  existingTitulo,
  existingFecha,
  existingRed,
}: {
  onClose: () => void;
  onSaved: () => void;
  defaultDate?: string;
  postId?: number;
  existingCaption?: string;
  existingImages?: string[];
  editMode?: boolean;          // editar la version activa en su lugar (no crea version ni manda correo)
  existingTitulo?: string;
  existingFecha?: string;
  existingRed?: string;
}) {
  const isNew = !postId;
  const hoy = new Date().toISOString().slice(0, 10);
  const [caption, setCaption] = useState(existingCaption ?? "");
  const [fecha, setFecha] = useState(existingFecha ?? defaultDate ?? hoy);
  const [titulo, setTitulo] = useState(existingTitulo ?? "");
  const [redSocial, setRedSocial] = useState(existingRed ?? "facebook");
  const [images, setImages] = useState<string[]>(existingImages ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  // muestra titulo/fecha/red al crear o al editar; en correccion (nueva version) solo texto+imagen
  const mostrarMeta = isNew || editMode;
  // bloquea fecha pasada al crear, o al editar solo si se MUEVE a una fecha pasada distinta de la original
  const fechaPasada = (isNew && fecha < hoy) || (!!editMode && fecha < hoy && fecha !== (existingFecha ?? ""));

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
    if (fechaPasada) { alert("No puedes programar una publicacion en una fecha pasada. Elige hoy o un dia futuro."); return; }
    setSaving(true);
    if (isNew) {
      await fetch("/api/admin/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha_programada: fecha, caption, imagenes: images, titulo_interno: titulo, red_social: redSocial }),
      });
    } else if (editMode) {
      // edicion en su lugar: actualiza la version activa + metadatos, sin crear version ni notificar al cliente
      await fetch(`/api/admin/social/posts/${postId}/versions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption, imagenes: images, titulo_interno: titulo, red_social: redSocial, fecha_programada: fecha }),
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
            {isNew ? "Nueva publicación" : editMode ? "Editar publicación" : `Subir corrección (versión ${(existingCaption ? 2 : 1) + 1})`}
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94A3B8" }}>×</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {mostrarMeta && (
            <>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#042E7B", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: 6 }}>Título interno (opcional)</label>
                <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Post vacante cajero semana 23"
                  style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#042E7B", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: 6 }}>Fecha programada</label>
                  <input type="date" value={fecha} min={isNew ? hoy : undefined} onChange={(e) => setFecha(e.target.value)}
                    style={{ width: "100%", border: `1.5px solid ${fechaPasada ? "#EF4444" : "#E2E8F0"}`, borderRadius: 10, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                  {fechaPasada && <p style={{ margin: "5px 0 0", fontSize: 11, color: "#EF4444", fontWeight: 600 }}>Fecha pasada — elige hoy o un dia futuro.</p>}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#042E7B", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: 6 }}>Red social</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    {Object.values(REDES).map((r) => (
                      <button key={r.id} type="button" onClick={() => setRedSocial(r.id)}
                        style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: `1.5px solid ${redSocial === r.id ? r.color : "#E2E8F0"}`, cursor: "pointer", fontSize: 12, fontWeight: 700,
                          background: redSocial === r.id ? r.color : "#fff", color: redSocial === r.id ? "#fff" : "#64748B", transition: "all .15s" }}>
                        {r.icono} {r.nombre}
                      </button>
                    ))}
                  </div>
                </div>
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
          <button onClick={save} disabled={!caption.trim() || saving || fechaPasada}
            style={{ flex: 2, padding: "11px 0", borderRadius: 12, border: "none", background: "#042E7B", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: !caption.trim() || saving || fechaPasada ? 0.5 : 1 }}>
            {saving ? "Guardando..." : isNew ? "Crear publicación" : editMode ? "Guardar cambios" : "Subir nueva versión"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Post detail panel ──────────────────────────────── */
function PostDetail({ post, config, onClose, onUpdated }: { post: Post; config: PageConfig; onClose: () => void; onUpdated: () => void }) {
  const red = getRedSocial(post.red_social);
  const active = post.social_post_versions.find((v) => v.es_activa) ?? post.social_post_versions[0];
  const old = post.social_post_versions.filter((v) => !v.es_activa).sort((a, b) => b.version_num - a.version_num);
  const anterior = old[0];
  const hayCorreccion = old.length > 0;
  const [showNewVersion, setShowNewVersion] = useState(false);
  const [comments, setComments] = useState<{ id: number; autor_nombre: string; autor_rol: string; contenido: string; created_at: string }[]>([]);
  const [slide, setSlide] = useState(0);
  const [viendoAnterior, setViendoAnterior] = useState(false);
  const mostrada = viendoAnterior && anterior ? anterior : active;

  useEffect(() => {
    fetch(`/api/revisor/posts/${post.id}/comments`).then((r) => r.json()).then(setComments);
  }, [post.id]);

  const [publicado, setPublicado] = useState(post.publicado);
  const [togglingPub, setTogglingPub] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const deletePost = async () => {
    if (!confirm("¿Eliminar esta publicación y todo su historial?")) return;
    await fetch(`/api/admin/social/posts/${post.id}`, { method: "DELETE" });
    onUpdated();
    onClose();
  };

  const togglePublicado = async () => {
    const sinImagen = (active?.imagenes?.length ?? 0) === 0;
    if (!publicado && sinImagen) {
      if (!confirm("Esta publicación no tiene imagen todavía. ¿Aun así quieres mostrarla al cliente?")) return;
    }
    setTogglingPub(true);
    await fetch(`/api/admin/social/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicado: !publicado }),
    });
    setPublicado(!publicado);
    setTogglingPub(false);
    onUpdated();
  };

  const est = ESTADO[post.estado];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 700, maxHeight: "90vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ background: "#042E7B", borderRadius: "20px 20px 0 0", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
              {red.logo
                ? <span style={{ background: "#fff", borderRadius: 5, padding: "2px 7px", display: "inline-flex", alignItems: "center" }}>
                    <img src={red.logo} alt={red.nombre} style={{ height: 10, display: "block" }} />
                  </span>
                : <RedLogo red_social={post.red_social} height={12} />}
              <span style={{ color: "rgba(255,255,255,.55)", fontSize: 11, fontWeight: 700, letterSpacing: ".3px" }}>{post.fecha_programada}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <p style={{ margin: 0, color: "#fff", fontWeight: 900, fontSize: 16 }}>{post.titulo_interno || "Sin título interno"}</p>
              <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 20, background: publicado ? "rgba(34,197,94,.2)" : "rgba(255,255,255,.15)", color: publicado ? "#86EFAC" : "rgba(255,255,255,.7)" }}>
                {publicado ? "● Visible para el cliente" : "● Borrador (solo tú)"}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {post.estado === "cambios" && (
              <button onClick={() => setShowNewVersion(true)}
                style={{ background: "#FFCC00", border: "none", borderRadius: 10, padding: "7px 14px", fontSize: 12, fontWeight: 700, color: "#042E7B", cursor: "pointer" }}>
                + Nueva versión
              </button>
            )}
            <button onClick={() => setShowEdit(true)}
              style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: 10, padding: "7px 14px", fontSize: 12, fontWeight: 800, color: "#fff", cursor: "pointer" }}>
              ✏️ Editar
            </button>
            <button onClick={togglePublicado} disabled={togglingPub}
              style={{ background: publicado ? "rgba(255,255,255,.15)" : "#22C55E", border: "none", borderRadius: 10, padding: "7px 14px", fontSize: 12, fontWeight: 800, color: "#fff", cursor: "pointer", opacity: togglingPub ? 0.6 : 1 }}>
              {togglingPub ? "..." : publicado ? "Ocultar al cliente" : "📤 Publicar al cliente"}
            </button>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: 10, width: 34, height: 34, color: "#fff", fontSize: 18, cursor: "pointer" }}>×</button>
          </div>
        </div>

        <div style={{ padding: 24, display: "flex", gap: 24, flexWrap: "wrap" }}>
          {/* Preview */}
          <div style={{ flex: "0 0 auto", maxWidth: 360, width: "100%" }}>
            {/* Badge de versión + toggle */}
            {hayCorreccion && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                {viendoAnterior ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#F1F5F9", color: "#64748B", fontSize: 11, fontWeight: 800, padding: "5px 10px", borderRadius: 20 }}>↩️ Versión anterior (v{anterior.version_num})</span>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#DCFCE7", color: "#166534", fontSize: 11, fontWeight: 800, padding: "5px 10px", borderRadius: 20 }}>✨ Nueva propuesta (v{active.version_num})</span>
                )}
                <button onClick={() => { setViendoAnterior(!viendoAnterior); setSlide(0); }}
                  style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 9, padding: "5px 10px", fontSize: 11, fontWeight: 700, color: "#042E7B", cursor: "pointer" }}>
                  {viendoAnterior ? "Ver nueva propuesta →" : "↩ Ver cómo estaba antes"}
                </button>
              </div>
            )}

            {mostrada && (
              <div style={{ position: "relative" }}>
                {hayCorreccion && !viendoAnterior && (
                  <>
                    <div style={{ position: "absolute", top: -7, left: 9, right: 9, height: 30, background: "#E8EDF5", borderRadius: "12px 12px 0 0", zIndex: 0 }} />
                    <div style={{ position: "absolute", top: -3.5, left: 4.5, right: 4.5, height: 30, background: "#F1F5F9", borderRadius: "12px 12px 0 0", zIndex: 0 }} />
                  </>
                )}
                <div style={{ position: "relative", zIndex: 1, background: "#fff", borderRadius: 12, boxShadow: hayCorreccion && !viendoAnterior ? "0 8px 22px rgba(4,46,123,.16)" : "0 1px 8px rgba(0,0,0,.1)", overflow: "hidden", border: viendoAnterior ? "1.5px dashed #CBD5E1" : "none" }}>
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
                  {mostrada.caption && <p style={{ margin: "0 14px 10px", fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{mostrada.caption}</p>}
                  {mostrada.imagenes?.length > 0 && (
                    <div style={{ position: "relative", background: "#F0F2F5", aspectRatio: "1/1" }}>
                      <img src={mostrada.imagenes[slide]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      {mostrada.imagenes.length > 1 && (
                        <span style={{ position: "absolute", top: 8, right: 10, background: "rgba(0,0,0,.55)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                          {slide + 1}/{mostrada.imagenes.length}
                        </span>
                      )}
                      {mostrada.imagenes.length > 1 && (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px", pointerEvents: "none" }}>
                          <button onClick={() => setSlide(Math.max(0, slide - 1))} style={{ pointerEvents: "all", background: "rgba(0,0,0,.4)", color: "#fff", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", fontSize: 14 }}>‹</button>
                          <button onClick={() => setSlide(Math.min(mostrada.imagenes.length - 1, slide + 1))} style={{ pointerEvents: "all", background: "rgba(0,0,0,.4)", color: "#fff", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", fontSize: 14 }}>›</button>
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ padding: "8px 14px", borderTop: "1px solid #E4E6EB", display: "flex" }}>
                    {["👍", "💬", "↗"].map((a) => <div key={a} style={{ flex: 1, textAlign: "center", fontSize: 13, color: "#65676B" }}>{a}</div>)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Comments */}
          <div style={{ flex: 1, minWidth: 220 }}>
            {/* Dirección visual / qué diseñar */}
            {active?.nota_visual && (
              <div style={{ background: "#FFFBEB", border: "1.5px solid #FDE68A", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
                <p style={{ margin: "0 0 5px", fontSize: 11, fontWeight: 800, color: "#92400E", textTransform: "uppercase", letterSpacing: ".4px" }}>🎨 Qué diseñar</p>
                <p style={{ margin: 0, fontSize: 12.5, color: "#78350F", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{active.nota_visual}</p>
              </div>
            )}

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
        <PostModal postId={post.id} existingCaption={active.caption} existingImages={[]}
          onClose={() => setShowNewVersion(false)} onSaved={() => { onUpdated(); onClose(); }} />
      )}

      {showEdit && active && (
        <PostModal
          postId={post.id}
          editMode
          existingCaption={active.caption}
          existingImages={active.imagenes ?? []}
          existingTitulo={post.titulo_interno ?? ""}
          existingFecha={post.fecha_programada}
          existingRed={post.red_social}
          onClose={() => setShowEdit(false)}
          onSaved={() => { onUpdated(); onClose(); }}
        />
      )}
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────── */
export default function RedesSocialesPage() {
  const [vista, setVista] = useState<"semana" | "mes">("semana");
  const [weekOffset, setWeekOffset] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [config, setConfig] = useState<PageConfig>({ red_social: "facebook", nombre_pagina: "Kyoszen", avatar_url: null });
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostDate, setNewPostDate] = useState<string | undefined>();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [tab, setTab] = useState<"calendario" | "importar" | "informe" | "config">("calendario");

  const [configForm, setConfigForm] = useState({ nombre_pagina: "Kyoszen", avatar_url: "" });
  const [savingConfig, setSavingConfig] = useState(false);
  const [configError, setConfigError] = useState("");
  const [configOk, setConfigOk] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);

  // Importador
  const [importTexto, setImportTexto] = useState("");
  const [importPiezas, setImportPiezas] = useState<ImportPieza[] | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importCreando, setImportCreando] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [importFileName, setImportFileName] = useState("");
  const importFileRef = useRef<HTMLInputElement>(null);

  const wb = weekBounds(weekOffset);
  const mb = monthBounds(weekOffset);
  const { desde, hasta, days } = wb;
  const monthRange = vista === "mes" ? mb : null;
  const queryDesde = vista === "semana" ? desde : mb.desde;
  const queryHasta = vista === "semana" ? hasta : mb.hasta;

  const cambiarVista = (nueva: "semana" | "mes") => {
    setVista(nueva);
    setWeekOffset(0);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    const [postsRes, cfgRes] = await Promise.all([
      fetch(`/api/admin/social/posts?desde=${queryDesde}&hasta=${queryHasta}`),
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
  }, [queryDesde, queryHasta]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Importador ──
  const handleImportFile = (file: File | null) => {
    if (!file) return;
    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const txt = (e.target?.result as string) ?? "";
      setImportTexto(txt);
    };
    reader.readAsText(file);
  };

  const analizarPlan = async () => {
    setImportLoading(true);
    setImportMsg("");
    setImportPiezas(null);
    try {
      const res = await fetch("/api/admin/social/importar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "analizar", texto: importTexto }),
      });
      const data = await res.json();
      if (!res.ok) { setImportMsg(data.error ?? "Error al analizar."); setImportLoading(false); return; }
      const hoy = new Date().toISOString().slice(0, 10);
      const marcadas: ImportPieza[] = (data.piezas as ImportPieza[]).map((p) => {
        const fecha_pasada = !!p.fecha && p.fecha < hoy;
        // se selecciona por defecto solo lo creable (no existente, no pasado)
        return { ...p, fecha_pasada, seleccionada: !p.ya_existe && !fecha_pasada };
      });
      setImportPiezas(marcadas);
    } catch {
      setImportMsg("Error de conexión al analizar el plan.");
    }
    setImportLoading(false);
  };

  const crearPiezas = async () => {
    if (!importPiezas) return;
    // solo las que el admin dejo seleccionadas, que no existan y que no sean fecha pasada
    const nuevas = importPiezas.filter(p => p.seleccionada && !p.ya_existe && !p.fecha_pasada);
    if (nuevas.length === 0) { setImportMsg("No hay publicaciones seleccionadas para crear."); return; }
    setImportCreando(true);
    setImportMsg("");
    try {
      const res = await fetch("/api/admin/social/importar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "crear", piezas: nuevas }),
      });
      const data = await res.json();
      if (!res.ok) { setImportMsg(data.error ?? "Error al crear."); setImportCreando(false); return; }
      const omit = data.omitidas ? ` ${data.omitidas} ya existían y se respetaron.` : "";
      setImportMsg(`✅ Se crearon ${data.creadas} publicaciones nuevas.${omit}${data.errores?.length ? ` (${data.errores.length} con error)` : ""}`);
      setImportPiezas(null);
      setImportTexto("");
      loadData();
    } catch {
      setImportMsg("Error de conexión al crear.");
    }
    setImportCreando(false);
  };

  const togglePieza = (i: number) => {
    setImportPiezas(prev => prev ? prev.map((p, j) => j === i ? { ...p, seleccionada: !p.seleccionada } : p) : prev);
  };

  const setTodasSeleccion = (valor: boolean) => {
    setImportPiezas(prev => prev ? prev.map(p => (p.ya_existe || p.fecha_pasada) ? p : { ...p, seleccionada: valor }) : prev);
  };

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
        {(["calendario", "importar", "informe", "config"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "8px 18px", borderRadius: 9, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .15s", background: tab === t ? "#fff" : "transparent", color: tab === t ? "#042E7B" : "#64748B", boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,.08)" : "none" }}>
            {t === "calendario" ? "📅 Calendario" : t === "importar" ? "📥 Importar plan" : t === "informe" ? "📊 Informe mensual" : "⚙️ Configuración"}
          </button>
        ))}
      </div>

      {/* ── Tab: Importar plan ── */}
      {tab === "importar" && (
        <div style={{ maxWidth: 760 }}>
          <div style={{ background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: 14, padding: "16px 18px", marginBottom: 20 }}>
            <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 800, color: "#1E40AF" }}>📥 Importa un plan de contenido completo</p>
            <p style={{ margin: 0, fontSize: 12.5, color: "#3B5BA5", lineHeight: 1.6 }}>
              Pega aquí el plan que generaste (texto o HTML). El sistema detecta cada publicación y crea los borradores en el calendario con su fecha, texto, hashtags y la nota de qué diseñar. Las imágenes las subes tú después.
            </p>
          </div>

          {!importPiezas ? (
            <>
              {/* Subir archivo HTML */}
              <div
                onClick={() => importFileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleImportFile(e.dataTransfer.files?.[0] ?? null); }}
                style={{ border: "2px dashed #BFDBFE", background: "#F8FBFF", borderRadius: 14, padding: "18px", textAlign: "center", cursor: "pointer", marginBottom: 14 }}
              >
                <span style={{ fontSize: 24 }}>📎</span>
                <p style={{ margin: "6px 0 2px", fontSize: 13, fontWeight: 700, color: "#042E7B" }}>
                  {importFileName ? `Archivo cargado: ${importFileName}` : "Sube el archivo HTML que descargaste"}
                </p>
                <p style={{ margin: 0, fontSize: 11.5, color: "#64748B" }}>Arrastra el archivo aquí o haz clic para seleccionarlo · .html o .txt</p>
                <input ref={importFileRef} type="file" accept=".html,.htm,.txt,text/html" style={{ display: "none" }}
                  onChange={e => handleImportFile(e.target.files?.[0] ?? null)} />
              </div>

              <p style={{ margin: "0 0 8px", fontSize: 11.5, color: "#94A3B8", textAlign: "center" }}>— o pega el contenido directamente —</p>

              <textarea
                value={importTexto}
                onChange={e => { setImportTexto(e.target.value); if (importFileName) setImportFileName(""); }}
                placeholder="Pega aquí el plan de contenido completo (el HTML o el texto del calendario)..."
                rows={10}
                style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 14, padding: "14px 16px", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box", marginBottom: 14 }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <button onClick={analizarPlan} disabled={importLoading || importTexto.trim().length < 30}
                  style={{ background: "#042E7B", border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 800, color: "#fff", cursor: "pointer", opacity: importLoading || importTexto.trim().length < 30 ? 0.5 : 1, display: "flex", alignItems: "center", gap: 8 }}>
                  {importLoading ? "Analizando plan..." : "Analizar plan ✨"}
                </button>
                {importMsg && <span style={{ fontSize: 13, fontWeight: 600, color: importMsg.startsWith("✅") ? "#166534" : "#DC2626" }}>{importMsg}</span>}
              </div>
              {importLoading && (
                <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 10 }}>Esto puede tomar 10-20 segundos mientras la IA lee el plan completo...</p>
              )}
            </>
          ) : (
            <>
              {/* Preview de piezas detectadas */}
              {(() => {
                const creables = importPiezas.filter(p => !p.ya_existe && !p.fecha_pasada);
                const seleccionadasCount = creables.filter(p => p.seleccionada).length;
                const existenCount = importPiezas.filter(p => p.ya_existe).length;
                const pasadasCount = importPiezas.filter(p => p.fecha_pasada && !p.ya_existe).length;
                const findeCount = creables.filter(p => p.fecha && [0, 6].includes(new Date(p.fecha + "T12:00:00").getDay())).length;
                return (
                  <>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 800, color: "#042E7B" }}>
                          {importPiezas.length} publicaciones detectadas
                        </p>
                        <p style={{ margin: 0, fontSize: 12, color: "#64748B" }}>
                          <strong style={{ color: "#166534" }}>{seleccionadasCount} seleccionadas</strong> de {creables.length} disponibles
                          {existenCount > 0 && <> · <strong style={{ color: "#94A3B8" }}>{existenCount} ya en el calendario</strong></>}
                          {pasadasCount > 0 && <> · <strong style={{ color: "#DC2626" }}>{pasadasCount} con fecha pasada (bloqueadas)</strong></>}
                          {findeCount > 0 && <> · <strong style={{ color: "#B45309" }}>{findeCount} en fin de semana</strong></>}
                        </p>
                      </div>
                      <button onClick={() => { setImportPiezas(null); setImportMsg(""); }}
                        style={{ background: "none", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "7px 14px", fontSize: 12, fontWeight: 700, color: "#64748B", cursor: "pointer" }}>
                        ← Volver a pegar
                      </button>
                    </div>

                    {creables.length > 0 && (
                      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                        <button onClick={() => setTodasSeleccion(true)}
                          style={{ background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: 9, padding: "6px 12px", fontSize: 11.5, fontWeight: 700, color: "#1E40AF", cursor: "pointer" }}>
                          ✓ Seleccionar todas
                        </button>
                        <button onClick={() => setTodasSeleccion(false)}
                          style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 9, padding: "6px 12px", fontSize: 11.5, fontWeight: 700, color: "#64748B", cursor: "pointer" }}>
                          Quitar todas
                        </button>
                      </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20, maxHeight: 460, overflowY: "auto" }}>
                      {importPiezas.map((p, i) => {
                        const bloqueada = p.ya_existe || p.fecha_pasada;
                        const activa = p.seleccionada && !bloqueada;
                        const finde = !!p.fecha && !bloqueada && [0, 6].includes(new Date(p.fecha + "T12:00:00").getDay());
                        return (
                        <div key={i} onClick={() => !bloqueada && togglePieza(i)}
                          style={{ background: bloqueada ? "#F8FAFC" : activa ? "#fff" : "#FAFBFC", border: `1.5px solid ${activa ? "#93C5FD" : "#E2E8F0"}`, borderRadius: 12, padding: "12px 14px", display: "flex", gap: 12, alignItems: "flex-start", opacity: bloqueada ? 0.6 : activa ? 1 : 0.7, cursor: bloqueada ? "default" : "pointer", transition: "all .12s" }}>
                          <div style={{ flexShrink: 0, paddingTop: 1 }}>
                            <input type="checkbox" checked={activa} disabled={bloqueada} readOnly
                              style={{ width: 17, height: 17, accentColor: "#042E7B", cursor: bloqueada ? "not-allowed" : "pointer" }} />
                          </div>
                          <div style={{ flexShrink: 0, textAlign: "center", minWidth: 54 }}>
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: p.fecha_pasada ? "#DC2626" : "#042E7B" }}>
                              {p.fecha ? new Date(p.fecha + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" }) : "—"}
                            </p>
                            <span style={{ display: "inline-flex", justifyContent: "center", marginTop: 4 }}><RedLogo red_social={p.red_social} height={9} /></span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1E293B" }}>{p.titulo_interno || "Sin título"}</p>
                              {p.ya_existe && <span style={{ fontSize: 10, fontWeight: 800, color: "#64748B", background: "#E2E8F0", padding: "2px 8px", borderRadius: 6, flexShrink: 0 }}>✓ Ya en calendario</span>}
                              {p.fecha_pasada && !p.ya_existe && <span style={{ fontSize: 10, fontWeight: 800, color: "#DC2626", background: "#FEE2E2", padding: "2px 8px", borderRadius: 6, flexShrink: 0 }}>✕ Fecha pasada</span>}
                              {finde && <span title="Cae en fin de semana — mejor entre semana" style={{ fontSize: 10, fontWeight: 800, color: "#B45309", background: "#FEF3C7", padding: "2px 8px", borderRadius: 6, flexShrink: 0 }}>⚠ Fin de semana</span>}
                            </div>
                            <p style={{ margin: 0, fontSize: 11.5, color: "#64748B", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.45 }}>{p.caption}</p>
                            <span style={{ display: "inline-block", marginTop: 5, fontSize: 10, fontWeight: 700, color: "#64748B", background: "#F1F5F9", padding: "2px 8px", borderRadius: 6 }}>{p.formato}</span>
                          </div>
                        </div>
                        );
                      })}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <button onClick={crearPiezas} disabled={importCreando || seleccionadasCount === 0}
                        style={{ background: "#042E7B", border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 800, color: "#fff", cursor: "pointer", opacity: importCreando || seleccionadasCount === 0 ? 0.5 : 1 }}>
                        {importCreando ? "Creando publicaciones..." : `Crear ${seleccionadasCount} publicaciones seleccionadas`}
                      </button>
                      {importMsg && <span style={{ fontSize: 13, fontWeight: 600, color: importMsg.startsWith("✅") ? "#166534" : "#DC2626" }}>{importMsg}</span>}
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* ── Tab: Calendario ── */}
      {tab === "calendario" && (
        <>
          {/* Nav + toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <button onClick={() => setWeekOffset(w => w - 1)}
              style={{ width: 36, height: 36, borderRadius: 10, background: "#fff", border: "1.5px solid #E2E8F0", cursor: "pointer", fontSize: 16, fontWeight: 700, color: "#042E7B" }}>‹</button>
            <div>
              <p style={{ margin: 0, fontWeight: 900, fontSize: 15, color: "#042E7B" }}>
                {vista === "semana"
                  ? (weekOffset === 0 ? "Esta semana" : weekOffset === -1 ? "Semana pasada" : `${weekOffset > 0 ? "+" : ""}${weekOffset} semanas`)
                  : (weekOffset === 0 ? "Este mes" : weekOffset === -1 ? "Mes pasado" : `${weekOffset > 0 ? "+" : ""}${weekOffset} meses`)}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#94A3B8", textTransform: "capitalize" }}>
                {vista === "semana" ? fmtWeek() : mb.first.toLocaleDateString("es-MX", { month: "long", year: "numeric" })}
              </p>
            </div>
            {weekOffset !== 0 && (
              <button onClick={() => setWeekOffset(0)}
                style={{ height: 32, padding: "0 12px", borderRadius: 8, background: "#042E7B", border: "none", cursor: "pointer", fontSize: 12, color: "#fff", fontWeight: 700 }}>Hoy</button>
            )}
            <button onClick={() => setWeekOffset(w => w + 1)}
              style={{ width: 36, height: 36, borderRadius: 10, background: "#fff", border: "1.5px solid #E2E8F0", cursor: "pointer", fontSize: 16, fontWeight: 700, color: "#042E7B" }}>›</button>

            {/* Toggle semana/mes */}
            <div style={{ marginLeft: "auto", display: "flex", background: "#F1F5F9", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: 3 }}>
              {(["semana", "mes"] as const).map(v => (
                <button key={v} onClick={() => cambiarVista(v)}
                  style={{ padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, textTransform: "capitalize",
                    background: vista === v ? "#042E7B" : "transparent", color: vista === v ? "#fff" : "#64748B", transition: "all .15s" }}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar grid */}
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
              <div style={{ width: 28, height: 28, border: "3px solid #042E7B", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            </div>
          ) : vista === "mes" ? (
            /* ── Vista mes: grid de todas las publicaciones ── */
            posts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 24px", background: "#F8FAFC", borderRadius: 16, border: "1.5px dashed #E2E8F0" }}>
                <span style={{ fontSize: 36 }}>📭</span>
                <p style={{ margin: "14px 0 4px", fontWeight: 700, color: "#042E7B", fontSize: 15 }}>Sin publicaciones este mes</p>
                <p style={{ margin: 0, color: "#94A3B8", fontSize: 13 }}>Usa &quot;+ Nueva publicación&quot; para agregar contenido.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14 }}>
                {[...posts].sort((a, b) => a.fecha_programada.localeCompare(b.fecha_programada)).map((p) => {
                  const v = p.social_post_versions.find((vv) => vv.es_activa) ?? p.social_post_versions[0];
                  const est = ESTADO[p.estado];
                  const commentCount = p.social_comments?.length ?? 0;
                  return (
                    <button key={p.id} onClick={() => setSelectedPost(p)}
                      style={{ background: "#fff", border: `1.5px solid ${p.estado === "cambios" ? "#FCA5A5" : p.estado === "aprobado" ? "#86EFAC" : "#E2E8F0"}`, borderRadius: 14, padding: 0, cursor: "pointer", overflow: "hidden", textAlign: "left", width: "100%" }}>
                      {v?.imagenes?.[0]
                        ? <img src={v.imagenes[0]} alt="" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" }} />
                        : <div style={{ width: "100%", aspectRatio: "1/1", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>📝</div>}
                      <div style={{ padding: "8px 10px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: "#042E7B" }}>
                            {new Date(p.fecha_programada + "T12:00:00").toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })}
                          </span>
                          <RedLogo red_social={p.red_social} height={9} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3, flexWrap: "wrap" }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: est.dot, flexShrink: 0 }} />
                          <span style={{ fontSize: 10, fontWeight: 700, color: est.color }}>{est.label}</span>
                          {!p.publicado && <span style={{ fontSize: 9, fontWeight: 800, color: "#854D0E", background: "#FEF9C3", padding: "1px 6px", borderRadius: 10 }}>Borrador</span>}
                        </div>
                        {v?.caption && <p style={{ margin: 0, fontSize: 11, color: "#64748B", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{v.caption}</p>}
                        {commentCount > 0 && <p style={{ margin: "3px 0 0", fontSize: 10, color: "#94A3B8" }}>💬 {commentCount}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )
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
                              <span style={{ marginLeft: "auto" }}><RedLogo red_social={p.red_social} height={8} /></span>
                            </div>
                            {!p.publicado && <span style={{ fontSize: 9, fontWeight: 800, color: "#854D0E", background: "#FEF9C3", padding: "1px 6px", borderRadius: 10, display: "inline-block", marginBottom: 3 }}>Borrador</span>}
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

      {/* ── Tab: Informe mensual ── */}
      {tab === "informe" && <InformeAdmin />}

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
