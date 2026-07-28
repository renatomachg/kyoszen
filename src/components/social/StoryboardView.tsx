"use client";

import { useState, type ReactNode } from "react";

export type IconUIName =
  | "archive"
  | "bars"
  | "calendar"
  | "chat"
  | "check"
  | "clipboard"
  | "cloud"
  | "document"
  | "download"
  | "envelope"
  | "eye"
  | "gear"
  | "globe"
  | "graduation"
  | "hand"
  | "image"
  | "lightbulb"
  | "lock"
  | "paperclip"
  | "pencil"
  | "phone"
  | "refresh"
  | "share"
  | "target"
  | "tool"
  | "trophy"
  | "upload"
  | "video"
  | "warning";

export function IconUI({ name, size = 16 }: { name: IconUIName; size?: number }) {
  const paths: Record<IconUIName, ReactNode> = {
    archive: <><path d="M3.75 5.25h16.5v15H3.75z" /><path d="M2.25 3h19.5v4.5H2.25zM9 11.25h6" /></>,
    bars: <path d="M3 20.25h18M5.25 17.25v-6h3v6h-3zm5.25 0V6.75h3v10.5h-3zm5.25 0V3.75h3v13.5h-3z" />,
    calendar: <><rect x="3" y="5.25" width="18" height="15.75" rx="2" /><path d="M7.5 3v4.5M16.5 3v4.5M3 9.75h18" /></>,
    chat: <path d="M8.625 9.75h6.75m-6.75 3h4.5M21 12a8.25 8.25 0 01-8.25 8.25 8.7 8.7 0 01-3.375-.675L3 21l1.425-5.625A8.25 8.25 0 1121 12z" />,
    check: <path d="M5.25 12.75l4.5 4.5 9-10.5" />,
    clipboard: <><path d="M9 5.25H6.75A2.25 2.25 0 004.5 7.5v12a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25v-12A2.25 2.25 0 0016.5 5.25H15" /><rect x="9" y="2.25" width="6" height="4.5" rx="1.5" /></>,
    cloud: <path d="M7.5 18.75h10.125a4.125 4.125 0 00.75-8.181A6.375 6.375 0 006.38 8.455 4.875 4.875 0 007.5 18.75z" />,
    document: <path d="M14.25 3.75H6.75A2.25 2.25 0 004.5 6v12a2.25 2.25 0 002.25 2.25h10.5A2.25 2.25 0 0019.5 18V9m-5.25-5.25L19.5 9m-5.25-5.25V9h5.25M8.25 13.5h7.5m-7.5 3h7.5" />,
    download: <path d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5M4.5 20.25h15" />,
    envelope: <><rect x="3" y="5.25" width="18" height="13.5" rx="2" /><path d="M3.75 6.75L12 13.5l8.25-6.75" /></>,
    eye: <><path d="M2.25 12s3.75-6 9.75-6 9.75 6 9.75 6-3.75 6-9.75 6-9.75-6-9.75-6z" /><circle cx="12" cy="12" r="2.25" /></>,
    gear: <><circle cx="12" cy="12" r="3" /><path d="M19.5 13.5v-3l-2.1-.6a6.5 6.5 0 00-.6-1.45l1.05-1.9-2.4-2.4-1.9 1.05a6.5 6.5 0 00-1.45-.6L10.5 2.5h-3L6.9 4.6a6.5 6.5 0 00-1.45.6l-1.9-1.05-2.4 2.4 1.05 1.9a6.5 6.5 0 00-.6 1.45l-2.1.6v3l2.1.6c.15.5.35.98.6 1.45l-1.05 1.9 2.4 2.4 1.9-1.05c.47.25.95.45 1.45.6l.6 2.1h3l.6-2.1c.5-.15.98-.35 1.45-.6l1.9 1.05 2.4-2.4-1.05-1.9c.25-.47.45-.95.6-1.45l2.1-.6z" transform="translate(3 0) scale(.75)" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.25 2.4 3.375 5.4 3.375 9S14.25 18.6 12 21M12 3C9.75 5.4 8.625 8.4 8.625 12S9.75 18.6 12 21" /></>,
    graduation: <path d="M2.25 9L12 3.75 21.75 9 12 14.25 2.25 9zm3.75 2.25v5.25c3.75 2.5 8.25 2.5 12 0v-5.25M21.75 9v6" />,
    hand: <path d="M7.5 11.25V6.75a1.5 1.5 0 013 0v3-5.25a1.5 1.5 0 013 0v5.25-4.5a1.5 1.5 0 013 0v5.25-3a1.5 1.5 0 013 0v5.25c0 5.25-3 8.25-7.5 8.25-3.75 0-5.25-2.25-7.5-5.25L3 13.5a1.5 1.5 0 012.25-2l2.25 1.75z" />,
    image: <><rect x="3" y="4.5" width="18" height="15" rx="2" /><circle cx="8.25" cy="9" r="1.5" /><path d="M3.75 17.25l5.25-5.25 3.75 3 2.25-2.25 5.25 4.5" /></>,
    lightbulb: <path d="M9 18h6m-5.25 3h4.5M8.25 15.75a6 6 0 117.5 0c-.75.75-1.125 1.5-1.125 2.25h-5.25c0-.75-.375-1.5-1.125-2.25z" />,
    lock: <><rect x="4.5" y="10.5" width="15" height="10.5" rx="2" /><path d="M8.25 10.5V7.125a3.75 3.75 0 017.5 0V10.5" /></>,
    paperclip: <path d="M8.25 12.75l6.9-6.9a3 3 0 114.25 4.25l-8.5 8.5a4.5 4.5 0 01-6.36-6.36l8.13-8.13" />,
    pencil: <path d="M4.5 19.5l4.125-.75 10.5-10.5a2.121 2.121 0 00-3-3l-10.5 10.5L4.5 19.5zm10.125-12.75l3 3" />,
    phone: <path d="M8.25 3.75l2.1 4.2-2.25 1.8a15.2 15.2 0 006.15 6.15l1.8-2.25 4.2 2.1-.75 4.5c-8.7.75-16.5-7.05-15.75-15.75l4.5-.75z" />,
    refresh: <path d="M20.25 6.75v4.5h-4.5M3.75 17.25v-4.5h4.5M5.25 9a7.5 7.5 0 0112.75-2.25l2.25 2.25M18.75 15a7.5 7.5 0 01-12.75 2.25L3.75 15" />,
    share: <path d="M13.5 6l3.75-3.75L21 6m-3.75-3.75v12M12 5.25H6A2.25 2.25 0 003.75 7.5v11.25A2.25 2.25 0 006 21h10.5a2.25 2.25 0 002.25-2.25v-1.5" />,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5.25" /><circle cx="12" cy="12" r="1.5" /></>,
    tool: <path d="M14.25 6.75a4.5 4.5 0 00-5.82 5.82L3.75 17.25a2.121 2.121 0 003 3l4.68-4.68a4.5 4.5 0 005.82-5.82l-2.7 2.7-3-3 2.7-2.7z" />,
    trophy: <path d="M8.25 3.75h7.5v3.75a3.75 3.75 0 01-7.5 0V3.75zm0 1.5H4.5v1.5a4.5 4.5 0 004.5 4.5m6.75-6h3.75v1.5a4.5 4.5 0 01-4.5 4.5M12 11.25v5.25m-3.75 3.75h7.5M9.75 16.5h4.5" />,
    upload: <path d="M12 21V9m0 0l-4.5 4.5M12 9l4.5 4.5M4.5 3.75h15" />,
    video: <><rect x="3" y="5.25" width="13.5" height="13.5" rx="2" /><path d="M16.5 10.125l4.5-2.625v9l-4.5-2.625v-3.75z" /></>,
    warning: <><path d="M10.7 4.2L2.9 18a1.5 1.5 0 001.3 2.25h15.6A1.5 1.5 0 0021.1 18L13.3 4.2a1.5 1.5 0 00-2.6 0z" /><path d="M12 9v4.5m0 3h.01" /></>,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {paths[name]}
    </svg>
  );
}

export type Frame = { tc: string; tipo: string; overlay: string; escena: string; dice: string };

// Propuesta = lo que ve y aprueba el CLIENTE (pitch limpio, sin detalle técnico)
export type Propuesta = {
  subtitulo?: string;
  por_que?: string;
  linea_diseno?: string[];
  copy?: string[];
  caption?: string;
};

// Guía técnica = solo ADMIN (prompts Higgsfield + montaje CapCut)
export type MontajeBeat = { beat?: string; texto?: string; color?: string; nota?: string };
export type GuiaTecnica = {
  prompt?: string;
  linea_hablada?: string;
  montaje?: MontajeBeat[];
  caption?: string;
  hashtags?: string;
  cta_tecnica?: string;
};

export type Storyboard = {
  audiencia?: string;
  duracion?: string;
  frames?: Frame[];
  cta?: string;
  hashtags?: string;
  nota_produccion?: string;
  propuesta?: Propuesta | null;    // cliente
  guia_tecnica?: GuiaTecnica | null; // admin
  archivado?: ArchivadoVideo | null; // video respaldado en Drive + carátula
};

// Metadata cuando el video ya se respaldó en Drive y se liberó de Storage
export type ArchivadoVideo = {
  drive_url: string;
  drive_file_id: string;
  poster_url: string | null;
  archivado_en: string;
  peso_mb?: number;
};

const TIPO: Record<string, { tc: string; tcText: string; screen: string; overlay: string }> = {
  hook:   { tc: "#F59E0B", tcText: "#3a2700", screen: "linear-gradient(160deg,#fff3da 0%,#ffe6b3 100%)", overlay: "#7a4a00" },
  cta:    { tc: "#10B981", tcText: "#06301f", screen: "linear-gradient(160deg,#d6f7ec 0%,#a8ecd4 100%)", overlay: "#06502f" },
  normal: { tc: "#042E7B", tcText: "#ffffff", screen: "linear-gradient(160deg,#E3F2FF 0%,#cfe4ff 100%)", overlay: "#042E7B" },
};

export default function StoryboardView({
  sb,
  caption,
  showProduccion = false,
}: {
  sb: Storyboard | null | undefined;
  caption?: string;
  showProduccion?: boolean;
}) {
  const frames = sb?.frames ?? [];

  return (
    <div>
      {/* meta */}
      {(sb?.audiencia || sb?.duracion) && (
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 12, fontSize: 12, color: "#64748B" }}>
          {sb?.audiencia && <span><b style={{ color: "#042E7B" }}>Audiencia:</b> {sb.audiencia}</span>}
          {sb?.duracion && <span><b style={{ color: "#042E7B" }}>Duración:</b> {sb.duracion}</span>}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700, color: "#0F172A" }}><IconUI name="video" size={14} /> Storyboard · {frames.length} cuadros</span>
        </div>
      )}

      {/* filmstrip de cuadros 9:16 */}
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8, scrollSnapType: "x proximity" }}>
        {frames.map((f, i) => {
          const t = TIPO[f.tipo] ?? TIPO.normal;
          return (
            <div key={i} style={{ flex: "0 0 152px", width: 152, border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden", background: "#fff", display: "flex", flexDirection: "column", scrollSnapAlign: "start" }}>
              <div style={{ background: t.tc, color: t.tcText, fontSize: 10.5, fontWeight: 800, letterSpacing: ".04em", padding: "5px 8px", textAlign: "center" }}>{f.tc || `Cuadro ${i + 1}`}</div>
              <div style={{ aspectRatio: "9/16", background: t.screen, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: 9, textAlign: "center" }}>
                <div style={{ fontWeight: 800, fontSize: 12.5, color: t.overlay, lineHeight: 1.25, whiteSpace: "pre-line", textShadow: "0 1px 0 rgba(255,255,255,.6)" }}>{f.overlay}</div>
                {f.escena && <div style={{ position: "absolute", bottom: 6, left: 6, right: 6, fontSize: 9, color: "#1b4a8c", background: "rgba(255,255,255,.78)", borderRadius: 6, padding: "3px 5px", lineHeight: 1.2 }}>{f.escena}</div>}
              </div>
              {f.dice && (
                <div style={{ padding: "8px 9px", fontSize: 11.5, color: "#0F172A", borderTop: "1px solid #E2E8F0", lineHeight: 1.35 }}>
                  <span style={{ fontSize: 9, letterSpacing: ".06em", textTransform: "uppercase", color: "#94A3B8", fontWeight: 800, display: "block", marginBottom: 2 }}>Dice</span>
                  {f.dice}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* caption */}
      {caption && (
        <div style={{ marginTop: 14, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 12px" }}>
          <span style={{ fontSize: 10, letterSpacing: ".07em", textTransform: "uppercase", color: "#1883FF", fontWeight: 800, display: "block", marginBottom: 4 }}>Caption</span>
          <p style={{ margin: 0, fontSize: 13, color: "#0F172A", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{caption}</p>
        </div>
      )}

      {/* cta + hashtags */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
        {sb?.cta && (
          <div style={{ flex: "1 1 200px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "9px 12px" }}>
            <span style={{ fontSize: 10, letterSpacing: ".07em", textTransform: "uppercase", color: "#166534", fontWeight: 800, display: "block", marginBottom: 3 }}>CTA</span>
            <p style={{ margin: 0, fontSize: 12.5, color: "#0F172A" }}>{sb.cta}</p>
          </div>
        )}
        {sb?.hashtags && (
          <div style={{ flex: "1 1 200px", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "9px 12px" }}>
            <span style={{ fontSize: 10, letterSpacing: ".07em", textTransform: "uppercase", color: "#1E40AF", fontWeight: 800, display: "block", marginBottom: 3 }}>Hashtags</span>
            <p style={{ margin: 0, fontSize: 12.5, color: "#1883FF", fontWeight: 600 }}>{sb.hashtags}</p>
          </div>
        )}
      </div>

      {/* nota de produccion (solo admin) */}
      {showProduccion && sb?.nota_produccion && (
        <div style={{ marginTop: 10, background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "9px 12px" }}>
          <span style={{ fontSize: 10, letterSpacing: ".07em", textTransform: "uppercase", color: "#92400E", fontWeight: 800, display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}><IconUI name="video" size={12} /> Nota de producción (interno)</span>
          <p style={{ margin: 0, fontSize: 12, color: "#78350F", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{sb.nota_produccion}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Propuesta (vista del CLIENTE) ─────────────────────
   Pitch limpio: por qué el video, línea de diseño, mensaje. */
export function PropuestaView({ prop, caption }: { prop: Propuesta | null | undefined; caption?: string }) {
  if (!prop) return null;
  const cap = caption || prop.caption;
  return (
    <div>
      {prop.subtitulo && (
        <p style={{ margin: "0 0 14px", fontSize: 14.5, color: "#475569", lineHeight: 1.5 }}>{prop.subtitulo}</p>
      )}

      {prop.por_que && (
        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderLeft: "4px solid #10B981", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
          <span style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "#10B981", fontWeight: 800, display: "block", marginBottom: 6 }}>Por qué este video</span>
          <p style={{ margin: 0, fontSize: 14, color: "#0F172A", lineHeight: 1.6 }}>{prop.por_que}</p>
        </div>
      )}

      {!!prop.linea_diseno?.length && (
        <div style={{ marginBottom: 14 }}>
          <span style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "#1883FF", fontWeight: 800, display: "block", marginBottom: 8 }}>Línea de diseño</span>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {prop.linea_diseno.map((d, i) => (
              <li key={i} style={{ fontSize: 14, color: "#0F172A", padding: "8px 0 8px 22px", position: "relative", borderBottom: i < prop.linea_diseno!.length - 1 ? "1px dashed #E2E8F0" : "none", lineHeight: 1.45 }}>
                <span style={{ position: "absolute", left: 0, top: 9, color: "#1883FF", fontSize: 11 }}>◆</span>{d}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!!prop.copy?.length && (
        <div style={{ background: "#fff", border: "1px dashed #b9d4fb", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
          <span style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "#004EE0", fontWeight: 800, display: "block", marginBottom: 8 }}>Mensaje</span>
          {prop.copy.map((c, i) => (
            <p key={i} style={{ margin: "6px 0", fontSize: 14, color: "#0F172A", paddingLeft: 16, position: "relative", lineHeight: 1.45 }}>
              <span style={{ position: "absolute", left: 0, color: "#1883FF", fontWeight: 800 }}>›</span>{c}
            </p>
          ))}
        </div>
      )}

      {cap && (
        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 12px" }}>
          <span style={{ fontSize: 10, letterSpacing: ".07em", textTransform: "uppercase", color: "#1883FF", fontWeight: 800, display: "block", marginBottom: 4 }}>Texto de la publicación</span>
          <p style={{ margin: 0, fontSize: 13, color: "#0F172A", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{cap}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Guía técnica (solo ADMIN) ─────────────────────────
   Prompt Higgsfield copiable + tabla de montaje CapCut. */
function CopyBox({ label, text, dark = false }: { label: string; text: string; dark?: boolean }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try { await navigator.clipboard.writeText(text); setCopiado(true); setTimeout(() => setCopiado(false), 1500); } catch { /* noop */ }
  };
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 10.5, letterSpacing: ".06em", textTransform: "uppercase", color: dark ? "#1E40AF" : "#475569", fontWeight: 800 }}>{label}</span>
        <button onClick={copiar} style={{ background: copiado ? "#16A34A" : "#fff", border: `1.5px solid ${copiado ? "#16A34A" : "#E2E8F0"}`, borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: copiado ? "#fff" : "#042E7B", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
          {copiado ? <><IconUI name="check" size={12} /> Copiado</> : "Copiar"}
        </button>
      </div>
      <pre style={{ margin: 0, background: dark ? "#0f172a" : "#F8FAFC", color: dark ? "#e2e8f0" : "#0F172A", border: dark ? "none" : "1px solid #E2E8F0", borderRadius: 10, padding: "12px 14px", fontFamily: "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace", fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap", overflowX: "auto" }}>{text}</pre>
    </div>
  );
}

const COLOR_NOMBRE: Record<string, string> = {
  "#F59E0B": "Ámbar", "#042E7B": "Azul profundo", "#004EE0": "Azul", "#1883FF": "Azul brillante", "#10B981": "Verde",
};

export function GuiaTecnicaView({ guia }: { guia: GuiaTecnica | null | undefined }) {
  if (!guia) return null;
  const tieneAlgo = guia.prompt || guia.linea_hablada || guia.montaje?.length || guia.caption || guia.hashtags || guia.cta_tecnica;
  if (!tieneAlgo) return null;
  return (
    <div>
      <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "8px 12px", marginBottom: 14, fontSize: 11.5, color: "#92400E", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
        <IconUI name="lock" size={14} /> Documento interno de producción · no lo ve el cliente
      </div>

      {guia.prompt && <CopyBox label="Prompt Higgsfield · clip principal" text={guia.prompt} dark />}
      {guia.linea_hablada && <CopyBox label="Línea hablada" text={guia.linea_hablada} />}

      {!!guia.montaje?.length && (
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 10.5, letterSpacing: ".06em", textTransform: "uppercase", color: "#475569", fontWeight: 800, display: "block", marginBottom: 6 }}>Montaje · texto por beat (CapCut)</span>
          <div style={{ border: "1px solid #E2E8F0", borderRadius: 10, overflow: "hidden", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  {["Beat", "Texto en pantalla", "Color", "Nota"].map((h) => (
                    <th key={h} style={{ background: "#042E7B", color: "#fff", fontSize: 10, letterSpacing: ".04em", textTransform: "uppercase", padding: "7px 9px", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {guia.montaje.map((m, i) => (
                  <tr key={i} style={{ background: i % 2 ? "#F8FAFC" : "#fff" }}>
                    <td style={{ padding: "7px 9px", borderTop: "1px solid #E2E8F0", fontWeight: 700, color: "#042E7B", whiteSpace: "nowrap" }}>{m.beat}</td>
                    <td style={{ padding: "7px 9px", borderTop: "1px solid #E2E8F0", color: "#0F172A" }}>{m.texto}</td>
                    <td style={{ padding: "7px 9px", borderTop: "1px solid #E2E8F0", whiteSpace: "nowrap" }}>
                      {m.color ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <span style={{ width: 13, height: 13, borderRadius: 3, background: m.color, border: "1px solid rgba(0,0,0,.1)", display: "inline-block" }} />
                          <span style={{ fontSize: 11, color: "#475569" }}>{COLOR_NOMBRE[m.color?.toUpperCase?.() ?? ""] ?? m.color}</span>
                        </span>
                      ) : "—"}
                    </td>
                    <td style={{ padding: "7px 9px", borderTop: "1px solid #E2E8F0", color: "#64748B" }}>{m.nota}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {guia.caption && (
          <div style={{ flex: "1 1 220px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "9px 12px" }}>
            <span style={{ fontSize: 10, letterSpacing: ".07em", textTransform: "uppercase", color: "#1883FF", fontWeight: 800, display: "block", marginBottom: 3 }}>Caption</span>
            <p style={{ margin: 0, fontSize: 12.5, color: "#0F172A", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{guia.caption}</p>
          </div>
        )}
        {guia.hashtags && (
          <div style={{ flex: "1 1 220px", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "9px 12px" }}>
            <span style={{ fontSize: 10, letterSpacing: ".07em", textTransform: "uppercase", color: "#1E40AF", fontWeight: 800, display: "block", marginBottom: 3 }}>Hashtags</span>
            <p style={{ margin: 0, fontSize: 12.5, color: "#1883FF", fontWeight: 600 }}>{guia.hashtags}</p>
          </div>
        )}
      </div>

      {guia.cta_tecnica && (
        <p style={{ margin: "10px 0 0", fontSize: 12, color: "#64748B", lineHeight: 1.5 }}><b style={{ color: "#0F172A" }}>CTA técnica:</b> {guia.cta_tecnica}</p>
      )}
    </div>
  );
}
