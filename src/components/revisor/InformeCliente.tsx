"use client";

import { useEffect, useState } from "react";

interface Metricas {
  publicaciones_total: number;
  publicaciones_aprobadas: number;
  whatsapp_clicks: number;
  vacante_vistas: number;
  vacante_aplicaciones: number;
  curso_informes: number;
  kyo_mensajes: number;
  contactos: number;
  aplicaciones: number;
  vs_anterior: { whatsapp_clicks: number | null; vacante_vistas: number | null; contactos: number | null };
}
interface Informe {
  periodo: string;
  periodo_label: string;
  metricas: Metricas;
  resumen: string;
  decisiones: string;
  propuestas: string;
  updated_at: string;
}

/* Paleta tintada hacia el navy de marca (sin #000 ni #fff puros) */
const C = {
  navy: "#06245F",
  navyDeep: "#0A1A3A",
  ink: "#16223D",
  body: "#33415C",
  muted: "#67738C",
  faint: "#9AA4BA",
  hair: "#E5E9F2",
  bone: "#FBFCFE",
  blue: "#1883FF",
  gold: "#FFC400",
  pos: "#15803D",
  neg: "#C0392B",
};

function Delta({ pct, onDark }: { pct: number | null; onDark?: boolean }) {
  if (pct === null) return <span style={{ fontSize: 11, color: onDark ? "rgba(255,255,255,.4)" : C.faint, fontWeight: 600 }}>sin base previa</span>;
  const up = pct >= 0;
  return (
    <span style={{ fontSize: 11.5, fontWeight: 700, color: up ? C.pos : C.neg, fontVariantNumeric: "tabular-nums", letterSpacing: ".2px" }}>
      {up ? "+" : ""}{pct}% <span style={{ color: onDark ? "rgba(255,255,255,.4)" : C.faint, fontWeight: 500 }}>vs. mes ant.</span>
    </span>
  );
}

function lista(texto: string) {
  return texto.split("\n").map((l) => l.replace(/^[-•✦→\d.]+\s*/, "").trim()).filter(Boolean);
}

export default function InformeCliente() {
  const [informes, setInformes] = useState<Informe[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/revisor/informe").then((r) => r.json()).then((d) => {
      setInformes(Array.isArray(d) ? d : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ textAlign: "center", padding: "80px 0" }}>
      <div style={{ width: 30, height: 30, border: `2.5px solid ${C.navy}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (informes.length === 0) return (
    <div style={{ textAlign: "center", padding: "80px 24px", background: C.bone, borderRadius: 18, border: `1px solid ${C.hair}`, maxWidth: 820, margin: "0 auto" }}>
      <span style={{ width: 48, height: 48, borderRadius: 12, background: "#EAF2FF", color: "#042E7B", display: "grid", placeItems: "center", margin: "0 auto" }}>
        <svg aria-hidden="true" width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      </span>
      <p style={{ margin: "16px 0 6px", fontWeight: 800, color: C.navy, fontSize: 16 }}>Tu primer informe está en camino</p>
      <p style={{ margin: 0, color: C.faint, fontSize: 13 }}>Cada mes verás aquí cómo van tus redes: qué funcionó y los siguientes pasos.</p>
    </div>
  );

  const inf = informes[idx];
  const m = inf.metricas;
  const fechaGen = new Date(inf.updated_at).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });

  const principal = { label: "Clics a WhatsApp", value: m.whatsapp_clicks, trend: m.vs_anterior.whatsapp_clicks, nota: "Intención de contacto directo, el indicador que más se acerca a una venta." };
  const apoyoConversion = [
    { label: "Contactos nuevos", value: m.contactos, trend: m.vs_anterior.contactos },
    { label: "Aplicaciones a vacantes", value: m.aplicaciones, trend: null },
    { label: "Solicitudes de cursos", value: m.curso_informes, trend: null },
  ];
  const alcance = [
    { label: "Vistas de vacantes", value: m.vacante_vistas, trend: m.vs_anterior.vacante_vistas },
    { label: "Mensajes al asistente", value: m.kyo_mensajes, trend: null },
    { label: "Publicaciones aprobadas", value: m.publicaciones_aprobadas, trend: null },
  ];
  const decisiones = inf.decisiones ? lista(inf.decisiones) : [];
  const propuestas = inf.propuestas ? lista(inf.propuestas) : [];

  return (
    <div className="inf-wrap" style={{ margin: "0 auto", color: C.ink, fontVariantNumeric: "tabular-nums" }}>
      <style>{`
        .inf-wrap { max-width: 1080px; }
        .inf-portada { padding: 40px 44px 36px; }
        .inf-cuerpo { padding: 36px 44px 40px; }
        .inf-hero { display: grid; grid-template-columns: minmax(0,1.1fr) minmax(0,1fr); gap: 36px; align-items: center; margin-bottom: 18px; }
        .inf-alcance { display: grid; grid-template-columns: repeat(3,1fr); border: 1px solid ${C.hair}; border-radius: 12px; overflow: hidden; margin-bottom: 34px; background: #fff; }
        .inf-alcance > div { border-right: 1px solid ${C.hair}; }
        .inf-alcance > div:last-child { border-right: none; }
        .inf-title { font-size: 38px; }
        @media (max-width: 860px) {
          .inf-portada { padding: 30px 26px 28px; }
          .inf-cuerpo { padding: 28px 26px 32px; }
          .inf-hero { grid-template-columns: 1fr; gap: 26px; }
          .inf-alcance { grid-template-columns: 1fr; }
          .inf-alcance > div { border-right: none; border-bottom: 1px solid ${C.hair}; }
          .inf-alcance > div:last-child { border-bottom: none; }
          .inf-title { font-size: 30px; }
        }
        @media (max-width: 480px) {
          .inf-portada { padding: 24px 18px 22px; }
          .inf-cuerpo { padding: 22px 18px 26px; }
          .inf-title { font-size: 26px; }
        }
      `}</style>
      <div style={{ background: C.bone, borderRadius: 20, overflow: "hidden", border: `1px solid ${C.hair}`, boxShadow: "0 1px 2px rgba(6,36,95,.04), 0 12px 32px rgba(6,36,95,.06)" }}>

        {/* ───────── Portada ───────── */}
        <div className="inf-portada" style={{ background: C.navyDeep, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.5, background: `repeating-linear-gradient(125deg, transparent 0 22px, rgba(24,131,255,.05) 22px 23px)` }} />
          <div style={{ position: "absolute", top: -60, right: -50, width: 220, height: 220, transform: "rotate(45deg)", border: "1px solid rgba(255,196,0,.18)", borderRadius: 28 }} />
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
              <div>
                <p style={{ margin: "0 0 14px", fontSize: 10.5, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "2.4px" }}>
                  Informe de desempeño · Redes sociales
                </p>
                <h1 className="inf-title" style={{ margin: 0, fontWeight: 800, color: "#F4F7FE", letterSpacing: "-1px", lineHeight: 1, textTransform: "capitalize" }}>
                  {inf.periodo_label}
                </h1>
              </div>
              {informes.length > 1 && (
                <select value={idx} onChange={(e) => setIdx(Number(e.target.value))}
                  style={{ background: "rgba(255,255,255,.08)", color: "#F4F7FE", border: "1px solid rgba(255,255,255,.18)", borderRadius: 9, padding: "8px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                  {informes.map((i, n) => <option key={i.periodo} value={n} style={{ color: C.navy }}>{i.periodo_label}</option>)}
                </select>
              )}
            </div>

            <div style={{ display: "flex", gap: 40, marginTop: 30, paddingTop: 22, borderTop: "1px solid rgba(255,255,255,.1)" }}>
              {[["Preparado para", "Kyoszen · Capital Humano"], ["Generado", fechaGen], ["Cobertura", "Facebook"]].map(([k, v]) => (
                <div key={k}>
                  <p style={{ margin: 0, fontSize: 9.5, color: "rgba(255,255,255,.45)", textTransform: "uppercase", letterSpacing: "1.4px", fontWeight: 700 }}>{k}</p>
                  <p style={{ margin: "5px 0 0", fontSize: 13, color: "#DCE5F5", fontWeight: 600, textTransform: k === "Generado" ? "capitalize" : "none" }}>{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="inf-cuerpo">

          {/* ───────── 01 · Indicador estrella + conversión ───────── */}
          <SecHead n="01" titulo="El resultado que más vale" />
          <div className="inf-hero">
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span style={{ fontSize: 72, fontWeight: 800, color: C.navy, lineHeight: 0.9, letterSpacing: "-3px" }}>{principal.value}</span>
                <div style={{ paddingBottom: 6 }}><Delta pct={principal.trend} /></div>
              </div>
              <p style={{ margin: "14px 0 6px", fontSize: 15, fontWeight: 800, color: C.ink }}>{principal.label}</p>
              <p style={{ margin: 0, fontSize: 13, color: C.muted, lineHeight: 1.6, maxWidth: "34ch" }}>{principal.nota}</p>
            </div>
            <div>
              <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, color: C.faint, textTransform: "uppercase", letterSpacing: "1.4px" }}>Otras señales de negocio</p>
              {apoyoConversion.map((s, i) => (
                <div key={s.label} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "12px 0", borderTop: i === 0 ? "none" : `1px solid ${C.hair}` }}>
                  <span style={{ fontSize: 13, color: C.body, fontWeight: 500 }}>{s.label}</span>
                  <span style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    {s.trend !== null && <Delta pct={s.trend} />}
                    <span style={{ fontSize: 22, fontWeight: 800, color: C.ink, minWidth: 32, textAlign: "right" }}>{s.value}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ───────── 02 · Alcance / actividad ───────── */}
          <SecHead n="02" titulo="Actividad y alcance" />
          <div className="inf-alcance">
            {alcance.map((s) => (
              <div key={s.label} style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: C.navy, lineHeight: 1, letterSpacing: "-1px" }}>{s.value}</span>
                  {s.trend !== null && <Delta pct={s.trend} />}
                </div>
                <p style={{ margin: "9px 0 0", fontSize: 11.5, color: C.muted, fontWeight: 600 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* ───────── 03 · Lectura del mes ───────── */}
          {inf.resumen && (
            <>
              <SecHead n="03" titulo="Lectura del mes" />
              <p style={{ margin: "0 0 34px", fontSize: 17, color: C.ink, lineHeight: 1.65, fontWeight: 450, maxWidth: "68ch" }}>{inf.resumen}</p>
            </>
          )}

          {/* ───────── 04 · Plan de acción ───────── */}
          {decisiones.length > 0 && (
            <>
              <SecHead n="04" titulo="Plan de acción" />
              <div style={{ marginBottom: 34 }}>
                {decisiones.map((d, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: 16, alignItems: "start", padding: "16px 0", borderTop: i === 0 ? "none" : `1px solid ${C.hair}` }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: C.faint, lineHeight: 1.3, fontVariantNumeric: "tabular-nums" }}>{String(i + 1).padStart(2, "0")}</span>
                    <p style={{ margin: 0, fontSize: 14.5, color: C.body, lineHeight: 1.6 }}>{d}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ───────── 05 · Oportunidades ───────── */}
          {propuestas.length > 0 && (
            <>
              <SecHead n="05" titulo="Oportunidades de negocio" />
              <div style={{ background: C.navyDeep, borderRadius: 16, padding: "26px 28px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -40, right: -30, width: 130, height: 130, transform: "rotate(45deg)", border: "1px solid rgba(255,196,0,.16)", borderRadius: 20 }} />
                <p style={{ margin: "0 0 18px", fontSize: 10.5, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "1.8px", position: "relative" }}>Para crecer el negocio de Kyoszen</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 18, position: "relative" }}>
                  {propuestas.map((d, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "26px 1fr", gap: 12, alignItems: "start" }}>
                      <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,196,0,.16)", color: C.gold, fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
                      <p style={{ margin: 0, fontSize: 14, color: "#E2E9F6", lineHeight: 1.6 }}>{d}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ───────── Pie ───────── */}
          <div style={{ marginTop: 32, paddingTop: 18, borderTop: `1px solid ${C.hair}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <p style={{ margin: 0, fontSize: 11, color: C.faint, maxWidth: "60ch", lineHeight: 1.5 }}>
              Indicadores medidos en kyoszen.com durante el período. La próxima fase incorpora alcance y crecimiento de seguidores directo de Facebook.
            </p>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: C.navy, letterSpacing: "1.5px" }}>KYOSZEN</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SecHead({ n, titulo }: { n: string; titulo: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
      <span style={{ fontSize: 11, fontWeight: 800, color: C.gold, letterSpacing: "1.5px", fontVariantNumeric: "tabular-nums" }}>{n}</span>
      <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.navy, textTransform: "uppercase", letterSpacing: "1px" }}>{titulo}</h3>
      <div style={{ flex: 1, height: 1, background: C.hair }} />
    </div>
  );
}
