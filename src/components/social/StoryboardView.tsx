"use client";

export type Frame = { tc: string; tipo: string; overlay: string; escena: string; dice: string };
export type Storyboard = {
  audiencia?: string;
  duracion?: string;
  frames?: Frame[];
  cta?: string;
  hashtags?: string;
  nota_produccion?: string;
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
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700, color: "#0F172A" }}>🎬 Storyboard · {frames.length} cuadros</span>
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
          <span style={{ fontSize: 10, letterSpacing: ".07em", textTransform: "uppercase", color: "#92400E", fontWeight: 800, display: "block", marginBottom: 3 }}>🎬 Nota de producción (interno)</span>
          <p style={{ margin: 0, fontSize: 12, color: "#78350F", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{sb.nota_produccion}</p>
        </div>
      )}
    </div>
  );
}
