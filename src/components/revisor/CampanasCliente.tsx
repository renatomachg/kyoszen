"use client";

import { useCallback, useEffect, useState } from "react";
import { IconUI, type IconUIName } from "@/components/ui/IconUI";
import { RedLogo } from "@/components/RedLogo";
import { getRedSocial } from "@/lib/redes-sociales";
import {
  ESTADOS_CAMPANA,
  esEnCurso,
  flujoDeCampana,
  statsAnuncios,
  tieneFormulario,
  type Campana,
  type CampanaAnuncio,
  type CampanaComentario,
  type EstadoCampana,
  type PreguntaFormulario,
} from "@/lib/campanas";

interface PageConfig {
  nombre_pagina: string;
  avatar_url: string | null;
}

const C = {
  navy: "#042E7B",
  blue: "#1883FF",
  blueDark: "#0A4ECC",
  ink: "#1E293B",
  body: "#475569",
  muted: "#64748B",
  faint: "#94A3B8",
  hair: "#E6EBF5",
  wash: "#F1F5F9",
  blueWash: "#EAF2FF",
};

const CSS = `
.camp-datos { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.camp-flujo { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
.camp-anuncios { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.camp-modal-cols { display: grid; grid-template-columns: 1.05fr .95fr; }
.camp-modal-der { border-left: 1px solid #F1F5F9; }
@media (max-width: 1080px) {
  .camp-datos { grid-template-columns: repeat(2, 1fr); }
  .camp-flujo { grid-template-columns: repeat(1, 1fr); }
  .camp-anuncios { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 760px) {
  .camp-datos { grid-template-columns: 1fr; }
  .camp-anuncios { grid-template-columns: 1fr; }
  .camp-modal-cols { grid-template-columns: 1fr; }
  .camp-modal-der { border-left: none; border-top: 1px solid #F1F5F9; }
}
`;

function fmtComentario(d: string) {
  return new Date(d).toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/* ─── Píldora de estado ───────────────────────────────── */
function PillEstado({ estado, size = "md" }: { estado: EstadoCampana; size?: "sm" | "md" }) {
  const e = ESTADOS_CAMPANA[estado];
  const s = size === "sm";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, background: e.bg, color: e.color,
      borderRadius: 50, padding: s ? "4px 10px" : "6px 13px", fontSize: s ? 11 : 12, fontWeight: 800,
    }}>
      <span style={{ width: s ? 6 : 7, height: s ? 6 : 7, borderRadius: "50%", background: e.dot }} />
      {e.label}
    </span>
  );
}

/* ─── Distintivo de campaña que ya está corriendo ─────── */
function PillAlAire({ size = "md" }: { size?: "sm" | "md" }) {
  const s = size === "sm";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, background: "#DCFCE7", color: "#166534",
      borderRadius: 50, padding: s ? "4px 10px" : "6px 13px", fontSize: s ? 11 : 12, fontWeight: 800,
    }}>
      <span style={{ width: s ? 6 : 7, height: s ? 6 : 7, borderRadius: "50%", background: "#22C55E" }} />
      Al aire
    </span>
  );
}

/* ─── Dato del encabezado de campaña ──────────────────── */
function Dato({ icono, label, children }: { icono: IconUIName; label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.hair}`, borderRadius: 14, padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
        <span style={{ width: 26, height: 26, borderRadius: 8, background: C.blueWash, color: C.blueDark, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <IconUI name={icono} size={14} />
        </span>
        <span style={{ fontSize: 10.5, fontWeight: 800, color: C.faint, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</span>
      </div>
      <div style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.5, fontWeight: 600 }}>{children}</div>
    </div>
  );
}

/* ─── Simulación del formulario que llena el candidato ── */
function CampoSimulado({ pregunta, index }: { pregunta: PreguntaFormulario; index: number }) {
  const placeholder =
    pregunta.tipo === "telefono" ? "55 0000 0000"
    : pregunta.tipo === "numero" ? "00"
    : "Escribe tu respuesta";

  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 700, color: "#050505", lineHeight: 1.45 }}>
        <span style={{ color: C.faint, fontWeight: 800, marginRight: 6 }}>{index + 1}.</span>
        {pregunta.pregunta}
      </p>
      {pregunta.nota && (
        <p style={{ margin: "0 0 7px 18px", fontSize: 11.5, color: "#65676B", fontStyle: "italic" }}>{pregunta.nota}</p>
      )}
      <div style={{ marginLeft: 18, marginTop: 7 }}>
        {pregunta.tipo === "opcion" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(pregunta.opciones ?? []).map(op => (
              <div key={op} style={{ display: "flex", alignItems: "center", gap: 9, background: "#F0F2F5", borderRadius: 8, padding: "9px 12px" }}>
                <span style={{ width: 15, height: 15, borderRadius: "50%", border: "2px solid #BCC0C4", flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, color: "#050505" }}>{op}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: "#F0F2F5", borderRadius: 8, padding: "11px 12px", border: "1px solid #E4E6EB" }}>
            <span style={{ fontSize: 12.5, color: "#8A8D91" }}>{placeholder}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function FormularioSimulado({ anuncio, config }: { anuncio: CampanaAnuncio; config: PageConfig }) {
  const [pantalla, setPantalla] = useState<"preguntas" | "confirmacion">("preguntas");
  const preguntas = anuncio.formulario?.preguntas ?? [];
  const confirmacion = anuncio.formulario?.pantalla_confirmacion;

  return (
    <div>
      {/* Stepper de pantallas */}
      <div style={{ display: "flex", gap: 3, background: C.wash, border: `1px solid ${C.hair}`, borderRadius: 10, padding: 3, marginBottom: 14 }}>
        {([
          ["preguntas", `Preguntas (${preguntas.length})`],
          ["confirmacion", "Confirmación"],
        ] as const).map(([k, label]) => (
          <button key={k} onClick={() => setPantalla(k)}
            style={{ flex: 1, padding: "7px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 800,
              background: pantalla === k ? "#fff" : "transparent", color: pantalla === k ? C.navy : C.muted,
              boxShadow: pantalla === k ? "0 1px 3px rgba(4,46,123,.12)" : "none" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Marco del formulario (así se ve dentro de Facebook) */}
      <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${C.hair}`, boxShadow: "0 2px 12px rgba(0,0,0,.07)", overflow: "hidden" }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid #E4E6EB", display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.navy, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {config.avatar_url
              ? <img src={config.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ color: "#FFCC00", fontWeight: 900, fontSize: 11 }}>KZ</span>}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12.5, fontWeight: 800, color: "#050505" }}>{config.nombre_pagina}</p>
            <p style={{ margin: 0, fontSize: 11, color: "#65676B" }}>Formulario dentro de Facebook</p>
          </div>
        </div>

        <div style={{ padding: "16px 16px 18px", maxHeight: 420, overflowY: "auto" }}>
          {pantalla === "preguntas" ? (
            <>
              {anuncio.formulario?.intro && (
                <p style={{ margin: "0 0 14px", fontSize: 12.5, color: "#65676B", lineHeight: 1.55 }}>{anuncio.formulario.intro}</p>
              )}
              {preguntas.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: C.faint }}>Este anuncio todavía no tiene preguntas cargadas.</p>
              ) : (
                preguntas.map((p, i) => <CampoSimulado key={i} pregunta={p} index={i} />)
              )}
              <button onClick={() => setPantalla("confirmacion")}
                style={{ width: "100%", marginTop: 6, padding: "12px 0", borderRadius: 8, border: "none", background: "#1877F2", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
                Enviar
              </button>
              <p style={{ margin: "10px 0 0", fontSize: 11, color: C.faint, textAlign: "center" }}>
                Toca &quot;Enviar&quot; para ver la pantalla que le aparece al candidato.
              </p>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "10px 4px" }}>
              <span style={{ width: 48, height: 48, borderRadius: "50%", background: "#DCFCE7", color: "#166534", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <IconUI name="check" size={24} />
              </span>
              <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 900, color: "#050505" }}>¡Listo, ya quedó tu registro!</p>
              {confirmacion ? (
                <p style={{ margin: 0, fontSize: 13, color: "#1E293B", lineHeight: 1.65, textAlign: "left", whiteSpace: "pre-wrap", background: "#F7F9FC", borderRadius: 10, padding: "14px 16px", border: `1px solid ${C.hair}` }}>
                  {confirmacion}
                </p>
              ) : (
                <p style={{ margin: 0, fontSize: 13, color: C.faint }}>Falta cargar la pantalla de confirmación.</p>
              )}
              <button onClick={() => setPantalla("preguntas")}
                style={{ marginTop: 14, background: "none", border: "none", color: C.blueDark, fontSize: 12.5, fontWeight: 800, cursor: "pointer", textDecoration: "underline" }}>
                ← Volver a las preguntas
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Mockup del anuncio en Facebook ──────────────────── */
function AnuncioMockup({ anuncio, config, plataforma }: { anuncio: CampanaAnuncio; config: PageConfig; plataforma: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,.1)", overflow: "hidden", border: `1px solid ${C.hair}` }}>
      <div style={{ padding: "12px 14px 8px", display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.navy, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {config.avatar_url
            ? <img src={config.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ color: "#FFCC00", fontWeight: 900, fontSize: 14 }}>KZ</span>}
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#050505" }}>{config.nombre_pagina}</p>
          <p style={{ margin: 0, fontSize: 12, color: "#65676B" }}>Publicidad · 🌐</p>
        </div>
      </div>

      {anuncio.texto_principal && (
        <p style={{ margin: "0 14px 10px", fontSize: 14, color: "#050505", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
          {anuncio.texto_principal}
        </p>
      )}

      {anuncio.imagen_url ? (
        <img src={anuncio.imagen_url} alt={anuncio.puesto} style={{ width: "100%", display: "block", background: "#F0F2F5" }} />
      ) : (
        <div style={{ background: "#F0F2F5", aspectRatio: "1/1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: C.faint, borderTop: "1px solid #E4E6EB", borderBottom: "1px solid #E4E6EB" }}>
          <IconUI name="image" size={26} />
          <span style={{ fontSize: 12.5, fontWeight: 700 }}>Arte pendiente de subir</span>
        </div>
      )}

      {/* Tarjeta de enlace con el botón de acción */}
      <div style={{ background: "#F0F2F5", padding: "10px 14px", display: "flex", alignItems: "center", gap: 12, borderTop: "1px solid #E4E6EB" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ margin: 0, fontSize: 10.5, color: "#65676B", textTransform: "uppercase", letterSpacing: ".04em" }}>
            {plataforma === "facebook" ? "FACEBOOK.COM" : plataforma.toUpperCase()}
          </p>
          {anuncio.titulo && <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 800, color: "#050505", lineHeight: 1.3 }}>{anuncio.titulo}</p>}
          {anuncio.descripcion && <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#65676B", lineHeight: 1.35 }}>{anuncio.descripcion}</p>}
        </div>
        <span style={{ background: "#E4E6EB", color: "#050505", borderRadius: 6, padding: "9px 14px", fontSize: 13, fontWeight: 800, whiteSpace: "nowrap", flexShrink: 0 }}>
          {anuncio.cta}
        </span>
      </div>

      <div style={{ padding: "8px 14px", borderTop: "1px solid #E4E6EB", display: "flex" }}>
        {["👍 Me gusta", "💬 Comentar", "↗ Compartir"].map(a => (
          <div key={a} style={{ flex: 1, textAlign: "center", fontSize: 13, color: "#65676B", fontWeight: 600 }}>{a}</div>
        ))}
      </div>
    </div>
  );
}

/* ─── Modal de un anuncio ─────────────────────────────── */
function AnuncioModal({ anuncio, campana, config, userName, onClose, onStatusChange }: {
  anuncio: CampanaAnuncio;
  campana: Campana;
  config: PageConfig;
  userName: string;
  onClose: () => void;
  onStatusChange: (anuncioId: number, estado: EstadoCampana, comentario?: CampanaComentario) => void;
}) {
  const [vista, setVista] = useState<"anuncio" | "formulario">("anuncio");
  const conFormulario = tieneFormulario(anuncio);
  const enCurso = esEnCurso(campana);
  const [estado, setEstado] = useState<EstadoCampana>(anuncio.estado);
  const [comments, setComments] = useState<CampanaComentario[]>(anuncio.campana_comentarios ?? []);
  const [guardando, setGuardando] = useState(false);
  const [showCambios, setShowCambios] = useState(false);
  const [cambiosTexto, setCambiosTexto] = useState("");
  const [comentarioTexto, setComentarioTexto] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aprobar = async () => {
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch(`/api/revisor/campanas/anuncios/${anuncio.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "aprobado", revisor_nombre: userName }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "No se pudo guardar");
      setEstado("aprobado");
      onStatusChange(anuncio.id, "aprobado");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  };

  const enviarCambios = async () => {
    const texto = cambiosTexto.trim();
    if (!texto) return;
    setGuardando(true);
    setError(null);
    try {
      const [resStatus, resComment] = await Promise.all([
        fetch(`/api/revisor/campanas/anuncios/${anuncio.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: "cambios", revisor_nombre: userName, comentario: texto }),
        }),
        // notificar:false → el correo del cambio de estado ya lleva este texto
        fetch(`/api/revisor/campanas/anuncios/${anuncio.id}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ autor_nombre: userName, autor_rol: "cliente", contenido: texto, notificar: false }),
        }),
      ]);
      if (!resStatus.ok || !resComment.ok) throw new Error("No se pudo enviar. Inténtalo de nuevo.");

      const nuevo: CampanaComentario = await resComment.json();
      setComments(prev => [...prev, nuevo]);
      setEstado("cambios");
      onStatusChange(anuncio.id, "cambios", nuevo);
      setCambiosTexto("");
      setShowCambios(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar");
    } finally {
      setGuardando(false);
    }
  };

  /* Campaña ya corriendo: el comentario es opcional y no cambia ningún estado. */
  const enviarComentario = async () => {
    const texto = comentarioTexto.trim();
    if (!texto) return;
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch(`/api/revisor/campanas/anuncios/${anuncio.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autor_nombre: userName, autor_rol: "cliente", contenido: texto }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "No se pudo enviar");
      const nuevo: CampanaComentario = await res.json();
      setComments(prev => [...prev, nuevo]);
      onStatusChange(anuncio.id, anuncio.estado, nuevo);
      setComentarioTexto("");
      setEnviado(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar");
    } finally {
      setGuardando(false);
    }
  };

  const est = ESTADOS_CAMPANA[estado];

  return (
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(4,46,123,.55)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 940, maxHeight: "92vh", overflow: "auto", boxShadow: "0 32px 80px rgba(0,0,0,.3)" }}>

        {/* Encabezado */}
        <div style={{ background: C.navy, borderRadius: "24px 24px 0 0", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10, gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <RedLogo red_social={campana.plataforma} height={12} />
              <span style={{ color: "rgba(255,255,255,.55)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" }}>
                Anuncio de campaña
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ color: "#fff", fontSize: 16, fontWeight: 900 }}>{anuncio.puesto}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: enCurso ? "#22C55E" : est.dot }} />
                <span style={{ color: "rgba(255,255,255,.85)", fontSize: 12.5, fontWeight: 700 }}>
                  {enCurso ? "Publicado en Facebook" : est.label}
                </span>
              </span>
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: 10, width: 36, height: 36, color: "#fff", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
        </div>

        <div className="camp-modal-cols">
          {/* Izquierda: anuncio / formulario */}
          <div style={{ padding: 24 }}>
            {conFormulario ? (
              <div style={{ display: "flex", gap: 3, background: C.wash, border: `1px solid ${C.hair}`, borderRadius: 10, padding: 3, marginBottom: 16 }}>
                {([
                  ["anuncio", "Lo que ve en Facebook", "image"],
                  ["formulario", "Lo que llena", "clipboard"],
                ] as const).map(([k, label, icono]) => (
                  <button key={k} onClick={() => setVista(k)}
                    style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 800,
                      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
                      background: vista === k ? "#fff" : "transparent", color: vista === k ? C.navy : C.muted,
                      boxShadow: vista === k ? "0 1px 3px rgba(4,46,123,.12)" : "none" }}>
                    <IconUI name={icono as IconUIName} size={14} />{label}
                  </button>
                ))}
              </div>
            ) : (
              <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 800, color: C.faint, textTransform: "uppercase", letterSpacing: ".06em" }}>
                {enCurso ? "Así se está viendo en Facebook" : "Así se va a ver en Facebook"}
              </p>
            )}

            {conFormulario && vista === "formulario"
              ? <FormularioSimulado anuncio={anuncio} config={config} />
              : <AnuncioMockup anuncio={anuncio} config={config} plataforma={campana.plataforma} />}

            {!conFormulario && (
              <div style={{ marginTop: 14, background: "#F7F9FC", border: `1px solid ${C.hair}`, borderRadius: 12, padding: "13px 15px" }}>
                <p style={{ margin: "0 0 5px", fontSize: 12.5, fontWeight: 800, color: C.navy }}>
                  Este anuncio no lleva formulario
                </p>
                <p style={{ margin: 0, fontSize: 12.5, color: C.body, lineHeight: 1.55 }}>
                  La información completa va en la imagen. Quien toca &quot;{anuncio.cta}&quot; llega a la publicación,
                  donde puede guardarla, compartirla o escribirnos.
                </p>
              </div>
            )}
          </div>

          {/* Derecha: decisión + comentarios */}
          <div className="camp-modal-der" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
            {enCurso ? (
              /* Campaña al aire: nada que aprobar, solo comentar si quiere */
              <div>
                <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 14, padding: "13px 15px", marginBottom: 14 }}>
                  <p style={{ margin: "0 0 5px", fontSize: 12.5, fontWeight: 800, color: "#166534", display: "flex", alignItems: "center", gap: 7 }}>
                    <IconUI name="check" size={15} /> Este anuncio ya está corriendo
                  </p>
                  <p style={{ margin: 0, fontSize: 12.5, color: "#15803D", lineHeight: 1.55 }}>
                    No necesitas aprobar nada. Te lo mostramos para que veas exactamente qué está saliendo publicado.
                  </p>
                </div>

                <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 800, color: C.navy }}>
                  ¿Nos quieres dejar un comentario?
                </p>
                <p style={{ margin: "0 0 10px", fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
                  Opcional. Si ves algo que quieras ajustar para la próxima campaña, escríbelo aquí y nos llega directo.
                </p>
                <textarea value={comentarioTexto} onChange={e => { setComentarioTexto(e.target.value); setEnviado(false); }} rows={4}
                  placeholder="Ej: para la siguiente, subamos el sueldo del anuncio de Vigilante."
                  style={{ width: "100%", border: `1.5px solid ${C.hair}`, borderRadius: 10, padding: "10px 12px", fontSize: 13, resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box", marginBottom: 10 }} />
                <button onClick={enviarComentario} disabled={!comentarioTexto.trim() || guardando}
                  style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "none", background: C.navy, color: "#fff", fontSize: 13.5, fontWeight: 800,
                    cursor: !comentarioTexto.trim() || guardando ? "default" : "pointer", opacity: !comentarioTexto.trim() || guardando ? 0.5 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <IconUI name="send" size={15} />{guardando ? "Enviando..." : "Enviar comentario"}
                </button>
                {enviado && (
                  <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "#166534", fontWeight: 700 }}>
                    Listo, tu comentario ya nos llegó.
                  </p>
                )}
                {error && (
                  <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "#B91C1C", fontWeight: 700 }}>{error}</p>
                )}
              </div>
            ) : (
            <div>
              <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 800, color: C.navy }}>
                ¿Apruebas este anuncio?
              </p>

              {!showCambios ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button onClick={aprobar} disabled={guardando}
                    style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: "1px solid #16A34A", cursor: "pointer", fontWeight: 800, fontSize: 14,
                      background: estado === "aprobado" ? "#15803D" : "#16A34A", color: "#fff", opacity: guardando ? 0.6 : 1,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <IconUI name="check" size={18} />{estado === "aprobado" ? "Aprobado" : "Aprobar"}
                  </button>
                  <button onClick={() => setShowCambios(true)} disabled={guardando}
                    style={{ width: "100%", padding: "13px 16px", borderRadius: 12, cursor: "pointer", fontWeight: 800, fontSize: 14,
                      border: `1px solid ${estado === "cambios" ? "#DC2626" : C.hair}`,
                      background: estado === "cambios" ? "#FEF2F2" : "#fff", color: estado === "cambios" ? "#B91C1C" : C.body,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <IconUI name="comment" size={17} />{estado === "cambios" ? "Cambios solicitados" : "Necesito cambios"}
                  </button>
                </div>
              ) : (
                <div style={{ background: "#FEF2F2", border: "1.5px solid #FECACA", borderRadius: 14, padding: 16 }}>
                  <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 800, color: "#991B1B" }}>¿Qué necesitas cambiar?</p>
                  <p style={{ margin: "0 0 10px", fontSize: 12, color: "#B45454", lineHeight: 1.5 }}>
                    Puede ser el arte, el texto, el sueldo, una pregunta del formulario o la pantalla de confirmación.
                  </p>
                  <textarea value={cambiosTexto} onChange={e => setCambiosTexto(e.target.value)} autoFocus rows={4}
                    placeholder="Ej: en la pregunta 3 pedir 2 años de experiencia, no 1."
                    style={{ width: "100%", border: "1.5px solid #FCA5A5", borderRadius: 10, padding: "10px 12px", fontSize: 13, resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box", marginBottom: 10 }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setShowCambios(false); setCambiosTexto(""); }}
                      style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: `1.5px solid ${C.hair}`, background: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13, color: C.muted }}>
                      Cancelar
                    </button>
                    <button onClick={enviarCambios} disabled={!cambiosTexto.trim() || guardando}
                      style={{ flex: 2, padding: "11px 0", borderRadius: 10, border: "none", background: "#DC2626", cursor: "pointer", fontWeight: 800, fontSize: 13, color: "#fff", opacity: !cambiosTexto.trim() || guardando ? 0.5 : 1 }}>
                      {guardando ? "Enviando..." : "Enviar cambios →"}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "#B91C1C", fontWeight: 700 }}>{error}</p>
              )}
            </div>
            )}

            {/* Ficha rápida del anuncio */}
            <div style={{ background: "#F7F9FC", border: `1px solid ${C.hair}`, borderRadius: 12, padding: "13px 15px" }}>
              <p style={{ margin: "0 0 9px", fontSize: 10.5, fontWeight: 800, color: C.faint, textTransform: "uppercase", letterSpacing: ".06em" }}>
                Resumen del anuncio
              </p>
              {[
                ["Título", anuncio.titulo],
                ["Descripción", anuncio.descripcion],
                ["Botón", anuncio.cta],
                ["Formulario", conFormulario
                  ? `${anuncio.formulario?.preguntas?.length ?? 0} preguntas`
                  : "Sin formulario"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 10, padding: "4px 0", fontSize: 12.5 }}>
                  <span style={{ color: C.muted, minWidth: 118, flexShrink: 0 }}>{k}</span>
                  <span style={{ color: C.ink, fontWeight: 700 }}>{v || "—"}</span>
                </div>
              ))}
            </div>

            {/* Hilo de comentarios */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, borderTop: `1px solid ${C.wash}`, paddingTop: 16 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".6px" }}>
                Historial de comentarios {comments.length > 0 && `(${comments.length})`}
              </p>
              {comments.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto" }}>
                  {comments.map(c => (
                    <div key={c.id} style={{ padding: "10px 12px", borderRadius: 12,
                      background: c.autor_rol === "admin" ? "#EFF6FF" : "#F8FAFC",
                      borderLeft: `3px solid ${c.autor_rol === "admin" ? C.blue : "#CBD5E1"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: c.autor_rol === "admin" ? C.blue : C.navy }}>
                          {c.autor_nombre}{c.autor_rol === "admin" ? " · Kyoszen" : ""}
                        </span>
                        <span style={{ fontSize: 11, color: C.faint, flexShrink: 0 }}>{fmtComentario(c.created_at)}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: C.ink, lineHeight: 1.5 }}>{c.contenido}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: 12, color: C.faint }}>Aún no hay comentarios en este anuncio.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Tarjeta de anuncio ──────────────────────────────── */
function AnuncioCard({ anuncio, enCurso, onOpen }: { anuncio: CampanaAnuncio; enCurso: boolean; onOpen: () => void }) {
  const est = enCurso
    ? { label: "Al aire", bg: "#DCFCE7", color: "#166534", dot: "#22C55E" }
    : ESTADOS_CAMPANA[anuncio.estado];
  const numComentarios = anuncio.campana_comentarios?.length ?? 0;

  return (
    <button onClick={onOpen}
      style={{ textAlign: "left", background: "#fff", border: `1px solid ${C.hair}`, borderRadius: 16, overflow: "hidden", cursor: "pointer", padding: 0, boxShadow: "0 1px 3px rgba(4,46,123,.05)", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "relative", background: C.wash, aspectRatio: "1/1", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {anuncio.imagen_url ? (
          <img src={anuncio.imagen_url} alt={anuncio.puesto} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: C.faint }}>
            <IconUI name="image" size={24} />
            <span style={{ fontSize: 12, fontWeight: 700 }}>Arte pendiente</span>
          </div>
        )}
        <span style={{ position: "absolute", top: 10, left: 10, background: est.bg, color: est.color, borderRadius: 50, padding: "5px 11px", fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: est.dot }} />
          {est.label}
        </span>
      </div>

      <div style={{ padding: "14px 16px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
        <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 900, color: C.navy }}>{anuncio.puesto}</p>
        {anuncio.titulo && (
          <p style={{ margin: "0 0 10px", fontSize: 12.5, color: C.body, lineHeight: 1.45 }}>{anuncio.titulo}</p>
        )}
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {(anuncio.formulario?.preguntas?.length ?? 0) > 0 && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, color: C.muted, fontWeight: 700 }}>
              <IconUI name="clipboard" size={13} />{anuncio.formulario!.preguntas.length} preguntas
            </span>
          )}
          {numComentarios > 0 && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, color: C.muted, fontWeight: 700 }}>
              <IconUI name="comment" size={13} />{numComentarios}
            </span>
          )}
          <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 800, color: C.blueDark, display: "inline-flex", alignItems: "center", gap: 4 }}>
            {enCurso ? "Ver" : "Revisar"} <IconUI name="chevron-right" size={13} />
          </span>
        </div>
      </div>
    </button>
  );
}

/* ─── Detalle de una campaña ──────────────────────────── */
function CampanaDetalle({ campana, config, userName, onStatusChange, onVolver }: {
  campana: Campana;
  config: PageConfig;
  userName: string;
  onStatusChange: (anuncioId: number, estado: EstadoCampana, comentario?: CampanaComentario) => void;
  onVolver?: () => void;
}) {
  const [abierto, setAbierto] = useState<CampanaAnuncio | null>(null);
  const anuncios = campana.campana_anuncios ?? [];
  const enCurso = esEnCurso(campana);
  const stats = statsAnuncios(anuncios);
  const flujo = flujoDeCampana(campana);
  const hayFormularios = anuncios.some(tieneFormulario);
  const seg = campana.segmentacion ?? {};
  const red = getRedSocial(campana.plataforma);

  // Mantener sincronizado el anuncio abierto con la lista
  const anuncioAbierto = abierto ? anuncios.find(a => a.id === abierto.id) ?? abierto : null;

  return (
    <div>
      {onVolver && (
        <button onClick={onVolver}
          style={{ background: "none", border: "none", color: C.muted, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 14, padding: 0 }}>
          <IconUI name="arrow-left" size={15} /> Todas las campañas
        </button>
      )}

      {/* Encabezado */}
      <div style={{ background: C.navy, borderRadius: 20, padding: "24px 28px", marginBottom: 18, color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8, flexWrap: "wrap" }}>
              <span style={{ background: "#fff", borderRadius: 6, padding: "4px 9px", display: "inline-flex", alignItems: "center" }}>
                <RedLogo red_social={campana.plataforma} height={11} />
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,.55)", textTransform: "uppercase", letterSpacing: ".07em" }}>
                Campaña de {campana.tipo === "vacantes" ? "vacantes" : campana.tipo}
              </span>
            </div>
            <h2 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 900, lineHeight: 1.2 }}>{campana.nombre}</h2>
            {campana.cliente_final && (
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,.7)" }}>
                Cliente final: <strong style={{ color: "#fff" }}>{campana.cliente_final}</strong>
                {campana.publica_desde ? ` · Se publica desde: ${campana.publica_desde}` : ""}
              </p>
            )}
          </div>

          {/* Estado: campaña al aire, o avance de la revisión */}
          {enCurso ? (
            <div style={{ background: "rgba(34,197,94,.16)", border: "1px solid rgba(134,239,172,.4)", borderRadius: 14, padding: "12px 16px", minWidth: 190 }}>
              <p style={{ margin: "0 0 7px", fontSize: 10.5, fontWeight: 800, color: "rgba(255,255,255,.6)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                Estado de la campaña
              </p>
              <p style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 900, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#4ADE80", flexShrink: 0 }} />
                Corriendo en Facebook
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,.7)", lineHeight: 1.5 }}>
                {stats.total} anuncio{stats.total === 1 ? "" : "s"} publicado{stats.total === 1 ? "" : "s"}
                {campana.fecha_difusion ? ` · ${campana.fecha_difusion}` : ""}
              </p>
            </div>
          ) : (
            <div style={{ background: "rgba(255,255,255,.1)", borderRadius: 14, padding: "12px 16px", minWidth: 180 }}>
              <p style={{ margin: "0 0 8px", fontSize: 10.5, fontWeight: 800, color: "rgba(255,255,255,.55)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                Avance de tu revisión
              </p>
              <p style={{ margin: "0 0 9px", fontSize: 19, fontWeight: 900 }}>
                {stats.aprobados} <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.6)" }}>de {stats.total} aprobados</span>
              </p>
              <div style={{ height: 6, borderRadius: 50, background: "rgba(255,255,255,.18)", overflow: "hidden" }}>
                <div style={{ width: `${stats.total ? (stats.aprobados / stats.total) * 100 : 0}%`, height: "100%", background: "#FFCC00", borderRadius: 50, transition: "width .3s" }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* A quién le llega */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 900, color: C.navy }}>
          {enCurso ? "A quién le está llegando" : "A quién le va a llegar"}
        </h3>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: C.muted }}>
          {enCurso
            ? "Así quedó configurada la campaña que está corriendo."
            : "Así queda configurada la campaña antes de salir al aire."}
        </p>
        <div className="camp-datos">
          <Dato icono="location" label="Zonas">
            {seg.ubicaciones?.length ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {seg.ubicaciones.map(u => (
                  <span key={u} style={{ background: C.blueWash, color: C.blueDark, borderRadius: 6, padding: "3px 8px", fontSize: 12, fontWeight: 700 }}>{u}</span>
                ))}
              </div>
            ) : "—"}
            {seg.ancla && <p style={{ margin: "8px 0 0", fontSize: 11.5, color: C.muted, fontWeight: 500, lineHeight: 1.45 }}>{seg.ancla}</p>}
          </Dato>
          <Dato icono="users" label="Edad y alcance">
            {seg.edad ?? "—"}
            {seg.publico_estimado && (
              <p style={{ margin: "6px 0 0", fontSize: 12, color: C.muted, fontWeight: 500, lineHeight: 1.45 }}>
                Público estimado: {seg.publico_estimado}
              </p>
            )}
          </Dato>
          <Dato icono="chart" label="Inversión">
            {campana.presupuesto_texto ?? "—"}
          </Dato>
          <Dato icono="target" label="Meta">
            {campana.meta_texto ?? "—"}
          </Dato>
          <Dato icono="send" label="Difusión">
            {campana.fecha_difusion ?? "—"}
          </Dato>
          <Dato icono="calendar" label="Reclutamiento presencial">
            {campana.fechas_reclutamiento ?? "—"}
          </Dato>
          <Dato icono="location" label="Sede">
            {campana.sede_texto ?? "—"}
          </Dato>
          <Dato icono="clipboard" label="Objetivo">
            {campana.objetivo ?? "—"}
          </Dato>
        </div>
      </div>

      {/* Recorrido del candidato */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 900, color: C.navy }}>El recorrido del candidato</h3>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: C.muted }}>
          Desde que ve el anuncio hasta que llega al reclutamiento.
        </p>
        <div className="camp-flujo">
          {flujo.map((paso, i) => (
            <div key={i} style={{ background: "#fff", border: `1px solid ${C.hair}`, borderRadius: 14, padding: "15px 16px", position: "relative", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
                <span style={{ width: 30, height: 30, borderRadius: 9, background: C.navy, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <IconUI name={paso.icono} size={15} />
                </span>
                <span style={{ fontSize: 10.5, fontWeight: 900, color: C.faint, letterSpacing: ".08em" }}>
                  PASO {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <p style={{ margin: "0 0 6px", fontSize: 13.5, fontWeight: 800, color: C.navy, lineHeight: 1.35 }}>{paso.titulo}</p>
              <p style={{ margin: 0, fontSize: 12, color: C.body, lineHeight: 1.5 }}>{paso.detalle}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Anuncios */}
      <div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: C.navy }}>
            {enCurso ? `Los anuncios al aire (${anuncios.length})` : `Los anuncios (${anuncios.length})`}
          </h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {enCurso ? (
              anuncios.length > 0 && <PillAlAire size="sm" />
            ) : (
              <>
                {stats.pendientes > 0 && <PillEstado estado="pendiente" size="sm" />}
                {stats.cambios > 0 && <PillEstado estado="cambios" size="sm" />}
                {stats.total > 0 && stats.aprobados === stats.total && <PillEstado estado="aprobado" size="sm" />}
              </>
            )}
          </div>
        </div>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: C.muted }}>
          {enCurso ? (
            <>
              Ábrelos para ver exactamente el arte, el texto
              {hayFormularios ? " y el formulario que llena el candidato" : " y cómo se ven publicados"}.
              No hay nada que aprobar: si quieres, déjanos un comentario dentro de cada uno.
            </>
          ) : (
            <>
              Cada anuncio se aprueba por separado. Ábrelo para ver el arte, el texto
              {hayFormularios ? " y el formulario que llena el candidato" : " y cómo se va a ver publicado"}.
            </>
          )}
        </p>

        {anuncios.length === 0 ? (
          <div style={{ background: "#fff", border: `1px dashed ${C.hair}`, borderRadius: 16, padding: "40px 20px", textAlign: "center", color: C.faint }}>
            <IconUI name="image" size={26} />
            <p style={{ margin: "10px 0 0", fontSize: 13.5, fontWeight: 700 }}>Todavía no hay anuncios cargados en esta campaña.</p>
          </div>
        ) : (
          <div className="camp-anuncios">
            {anuncios.map(a => (
              <AnuncioCard key={a.id} anuncio={a} enCurso={enCurso} onOpen={() => setAbierto(a)} />
            ))}
          </div>
        )}

        {red.nombre && (
          <p style={{ margin: "16px 0 0", fontSize: 11.5, color: C.faint, lineHeight: 1.6 }}>
            Los anuncios se publican desde la página de {red.nombre} de Kyoszen.{" "}
            {hayFormularios
              ? "Los registros llegan directo a nuestro equipo para contactarlos y confirmarles la cita."
              : "Esta campaña busca alcance: lleva la vacante a más gente de la zona, y el candidato se presenta directo al reclutamiento."}
          </p>
        )}
      </div>

      {anuncioAbierto && (
        <AnuncioModal
          anuncio={anuncioAbierto}
          campana={campana}
          config={config}
          userName={userName}
          onClose={() => setAbierto(null)}
          onStatusChange={onStatusChange}
        />
      )}
    </div>
  );
}

/* ─── Componente principal ────────────────────────────── */
export default function CampanasCliente({ userName, config }: { userName: string; config: PageConfig }) {
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [loading, setLoading] = useState(true);
  const [seleccionada, setSeleccionada] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/revisor/campanas");
      const data = await res.json();
      setCampanas(Array.isArray(data) ? data : []);
    } catch {
      setCampanas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleStatusChange = (anuncioId: number, estado: EstadoCampana, comentario?: CampanaComentario) => {
    setCampanas(prev => prev.map(c => ({
      ...c,
      campana_anuncios: (c.campana_anuncios ?? []).map(a =>
        a.id === anuncioId
          ? { ...a, estado, campana_comentarios: comentario ? [...(a.campana_comentarios ?? []), comentario] : a.campana_comentarios }
          : a
      ),
    })));
  };

  if (loading) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center", color: C.faint, fontSize: 13.5 }}>
        Cargando campañas...
      </div>
    );
  }

  if (campanas.length === 0) {
    return (
      <>
        <style>{CSS}</style>
        <div style={{ background: "#fff", border: `1px solid ${C.hair}`, borderRadius: 20, padding: "56px 24px", textAlign: "center" }}>
          <span style={{ width: 52, height: 52, borderRadius: 14, background: C.blueWash, color: C.blueDark, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <IconUI name="target" size={24} />
          </span>
          <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 900, color: C.navy }}>Todavía no hay campañas por revisar</h3>
          <p style={{ margin: 0, fontSize: 13.5, color: C.muted, lineHeight: 1.6, maxWidth: 460, marginInline: "auto" }}>
            Aquí van a aparecer las campañas pagadas de Facebook: a quién le llega el anuncio, cuánto se invierte,
            el arte, el texto y el formulario que llena el candidato. Te avisamos por correo en cuanto haya una lista.
          </p>
        </div>
      </>
    );
  }

  const actual = seleccionada != null
    ? campanas.find(c => c.id === seleccionada)
    : campanas.length === 1 ? campanas[0] : null;

  return (
    <>
      <style>{CSS}</style>
      {actual ? (
        <CampanaDetalle
          campana={actual}
          config={config}
          userName={userName}
          onStatusChange={handleStatusChange}
          onVolver={campanas.length > 1 ? () => setSeleccionada(null) : undefined}
        />
      ) : (
        <div>
          <h2 style={{ margin: "0 0 3px", fontSize: 20, fontWeight: 900, color: C.navy }}>Campañas</h2>
          <p style={{ margin: "0 0 18px", fontSize: 13.5, color: C.muted }}>
            {campanas.every(esEnCurso)
              ? "Anuncios pagados en redes. Entra a una campaña para ver a quién le llega y cómo se están viendo los anuncios."
              : "Anuncios pagados en redes. Entra a una campaña para ver a quién le llega y aprobar cada anuncio."}
          </p>
          <div className="camp-anuncios">
            {campanas.map(c => {
              const st = statsAnuncios(c.campana_anuncios ?? []);
              const cEnCurso = esEnCurso(c);
              return (
                <button key={c.id} onClick={() => setSeleccionada(c.id)}
                  style={{ textAlign: "left", background: "#fff", border: `1px solid ${C.hair}`, borderRadius: 16, padding: "18px 20px", cursor: "pointer", boxShadow: "0 1px 3px rgba(4,46,123,.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <RedLogo red_social={c.plataforma} height={11} />
                    {cEnCurso ? <PillAlAire size="sm" /> : <PillEstado estado={c.estado} size="sm" />}
                  </div>
                  <p style={{ margin: "0 0 4px", fontSize: 15.5, fontWeight: 900, color: C.navy, lineHeight: 1.3 }}>{c.nombre}</p>
                  {c.cliente_final && <p style={{ margin: "0 0 12px", fontSize: 12.5, color: C.muted }}>{c.cliente_final}</p>}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11.5, color: C.muted, fontWeight: 700 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <IconUI name="image" size={13} />{st.total} anuncios
                    </span>
                    {cEnCurso ? (
                      c.fecha_difusion && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <IconUI name="calendar" size={13} />{c.fecha_difusion}
                        </span>
                      )
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <IconUI name="check" size={13} />{st.aprobados} aprobados
                      </span>
                    )}
                    <span style={{ marginLeft: "auto", color: C.blueDark, display: "inline-flex", alignItems: "center", gap: 4 }}>
                      Abrir <IconUI name="chevron-right" size={13} />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
