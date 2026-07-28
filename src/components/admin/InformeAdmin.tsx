"use client";

import { useEffect, useState, useCallback } from "react";
import { IconUI, type IconUIName } from "@/components/social/StoryboardView";

interface Metricas {
  fuente: string;
  publicaciones_total: number;
  publicaciones_aprobadas: number;
  publicaciones_por_red: Record<string, number>;
  whatsapp_clicks: number;
  vacante_vistas: number;
  vacante_aplicaciones: number;
  curso_informes: number;
  kyo_mensajes: number;
  contactos: number;
  aplicaciones: number;
  vs_anterior: { whatsapp_clicks: number | null; vacante_vistas: number | null; contactos: number | null };
  top_contenido: { titulo: string; red: string; comentarios: number; estado: string }[];
  interes_cursos: number;
  interes_vacantes: number;
}
interface Informe {
  id: number;
  periodo: string;
  periodo_label: string;
  metricas: Metricas;
  resumen: string;
  decisiones: string;
  propuestas: string;
  estado: string;
  fuente: string;
}

function mesActual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function Trend({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  const up = pct >= 0;
  return <span style={{ fontSize: 11, fontWeight: 800, color: up ? "#166534" : "#DC2626" }}>{up ? "▲" : "▼"} {Math.abs(pct)}%</span>;
}

export default function InformeAdmin() {
  const [informes, setInformes] = useState<Informe[]>([]);
  const [periodo, setPeriodo] = useState(mesActual());
  const [actual, setActual] = useState<Informe | null>(null);
  const [generando, setGenerando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState("");
  const [edit, setEdit] = useState({ resumen: "", decisiones: "", propuestas: "" });

  const cargar = useCallback(async () => {
    const r = await fetch("/api/admin/social/informe");
    const data = await r.json();
    setInformes(Array.isArray(data) ? data : []);
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  // Al cambiar el período, mostrar el informe existente si lo hay
  useEffect(() => {
    const ex = informes.find((i) => i.periodo === periodo);
    setActual(ex ?? null);
    if (ex) setEdit({ resumen: ex.resumen, decisiones: ex.decisiones, propuestas: ex.propuestas });
  }, [periodo, informes]);

  const generar = async () => {
    setGenerando(true); setMsg("");
    const r = await fetch("/api/admin/social/informe", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generar", periodo }),
    });
    const data = await r.json();
    setGenerando(false);
    if (!r.ok) { setMsg(data.error ?? "Error al generar."); return; }
    setActual(data);
    setEdit({ resumen: data.resumen, decisiones: data.decisiones, propuestas: data.propuestas });
    cargar();
  };

  const guardar = async () => {
    if (!actual) return;
    setGuardando(true); setMsg("");
    await fetch("/api/admin/social/informe", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "guardar", id: actual.id, ...edit }),
    });
    setGuardando(false); setMsg("Guardado");
    setTimeout(() => setMsg(""), 2500);
    cargar();
  };

  const togglePublicar = async () => {
    if (!actual) return;
    const action = actual.estado === "publicado" ? "despublicar" : "publicar";
    await fetch("/api/admin/social/informe", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, id: actual.id }),
    });
    await cargar();
    setActual((prev) => prev ? { ...prev, estado: action === "publicar" ? "publicado" : "borrador" } : prev);
  };

  const m = actual?.metricas;
  const lbl = "fontSize:11px;fontWeight:700;color:#64748B;textTransform:uppercase;letterSpacing:.5px";

  return (
    <div style={{ width: "100%", maxWidth: 1080 }}>
      {/* Selector + generar */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#042E7B", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>Mes del informe</label>
          <input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)}
            style={{ border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "9px 12px", fontSize: 13, outline: "none" }} />
        </div>
        <button onClick={generar} disabled={generando}
          style={{ background: "#042E7B", border: "none", borderRadius: 11, padding: "11px 20px", fontSize: 13, fontWeight: 800, color: "#fff", cursor: "pointer", opacity: generando ? 0.6 : 1, display: "inline-flex", alignItems: "center", gap: 6 }}>
          {generando ? "Generando con IA..." : <><IconUI name={actual ? "refresh" : "bars"} size={15} /> {actual ? "Regenerar informe" : "Generar informe del mes"}</>}
        </button>
        {actual && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 20, background: actual.estado === "publicado" ? "#DCFCE7" : "#FEF9C3", color: actual.estado === "publicado" ? "#166534" : "#854D0E" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: actual.estado === "publicado" ? "#16A34A" : "#D97706" }} />
            {actual.estado === "publicado" ? "Publicado (el cliente lo ve)" : "Borrador (solo tú lo ves)"}
          </span>
        )}
        {msg && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, color: msg === "Guardado" ? "#166534" : "#DC2626" }}>{msg === "Guardado" && <IconUI name="check" size={14} />}{msg}</span>}
      </div>

      {!actual ? (
        <div style={{ background: "#F8FAFC", border: "1.5px dashed #E2E8F0", borderRadius: 16, padding: "48px 24px", textAlign: "center" }}>
          <span style={{ width: 46, height: 46, borderRadius: 12, background: "#EFF6FF", color: "#042E7B", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><IconUI name="bars" size={25} /></span>
          <p style={{ margin: "14px 0 4px", fontWeight: 800, color: "#042E7B", fontSize: 15 }}>Genera el informe del mes</p>
          <p style={{ margin: 0, color: "#94A3B8", fontSize: 13 }}>La IA lee los datos reales del período y redacta decisiones y propuestas. Tú las revisas antes de publicarlas al cliente.</p>
        </div>
      ) : (
        <>
          {/* Métricas */}
          {m && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ margin: "0 0 10px", ...styleFrom(lbl) }}>Resultados de {actual.periodo_label} · fuente: datos del sitio</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
                <Card icon="phone" label="Clics a WhatsApp" value={m.whatsapp_clicks} trend={m.vs_anterior.whatsapp_clicks} joya />
                <Card icon="envelope" label="Contactos" value={m.contactos} trend={m.vs_anterior.contactos} joya />
                <Card icon="document" label="Aplicaciones" value={m.aplicaciones} />
                <Card icon="eye" label="Vistas vacantes" value={m.vacante_vistas} trend={m.vs_anterior.vacante_vistas} />
                <Card icon="graduation" label="Interés cursos" value={m.curso_informes} />
                <Card icon="chat" label="Mensajes a Kyo" value={m.kyo_mensajes} />
                <Card icon="calendar" label="Publicaciones" value={`${m.publicaciones_aprobadas}/${m.publicaciones_total}`} sub="aprobadas" />
              </div>
              {m.top_contenido.length > 0 && m.top_contenido[0].comentarios > 0 && (
                <p style={{ margin: "10px 0 0", fontSize: 12, color: "#64748B", display: "flex", alignItems: "center", gap: 5 }}>
                  <IconUI name="trophy" size={14} /> Más interacción: <strong>{m.top_contenido[0].titulo}</strong> ({m.top_contenido[0].comentarios} comentarios)
                </p>
              )}
            </div>
          )}

          {/* Editores */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Editor icon="clipboard" label="Resumen del mes" value={edit.resumen} onChange={(v) => setEdit({ ...edit, resumen: v })} rows={3} placeholder="Resumen general del mes..." />
            <Editor icon="target" label="Decisiones (qué hacer)" value={edit.decisiones} onChange={(v) => setEdit({ ...edit, decisiones: v })} rows={5} placeholder="- Decisión 1..." />
            <Editor icon="lightbulb" label="Propuestas para Kyoszen" value={edit.propuestas} onChange={(v) => setEdit({ ...edit, propuestas: v })} rows={4} placeholder="- Oportunidad 1..." />
          </div>

          {/* Acciones */}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={guardar} disabled={guardando}
              style={{ border: "1.5px solid #E2E8F0", background: "#fff", borderRadius: 11, padding: "11px 20px", fontSize: 13, fontWeight: 700, color: "#042E7B", cursor: "pointer" }}>
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
            <button onClick={togglePublicar}
              style={{ border: "none", background: actual.estado === "publicado" ? "#FEE2E2" : "#042E7B", color: actual.estado === "publicado" ? "#991B1B" : "#fff", borderRadius: 11, padding: "11px 24px", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
              {actual.estado === "publicado" ? "Quitar de la vista del cliente" : <><IconUI name="upload" size={15} /> Publicar al cliente</>}
            </button>
          </div>
          <p style={{ margin: "12px 0 0", fontSize: 11, color: "#94A3B8" }}>
            Tip: la IA genera un primer borrador con los datos reales. Edita los textos a tu estilo y publícalo cuando estés conforme — el cliente lo verá en su pestaña &quot;Mis resultados&quot;.
          </p>
        </>
      )}
    </div>
  );
}

function styleFrom(s: string): React.CSSProperties {
  const o: Record<string, string> = {};
  s.split(";").forEach((kv) => { const [k, v] = kv.split(":"); if (k && v) o[k.trim()] = v.trim(); });
  return o as React.CSSProperties;
}

function Card({ icon, label, value, trend, sub, joya }: { icon: IconUIName; label: string; value: number | string; trend?: number | null; sub?: string; joya?: boolean }) {
  return (
    <div style={{ background: joya ? "#EFF6FF" : "#fff", border: `1.5px solid ${joya ? "#BFDBFE" : "#E2E8F0"}`, borderRadius: 14, padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: joya ? "#1883FF" : "#64748B" }}><IconUI name={icon} size={17} /></span>
        {trend !== undefined && <Trend pct={trend} />}
      </div>
      <p style={{ margin: "8px 0 2px", fontSize: 24, fontWeight: 900, color: "#042E7B", lineHeight: 1 }}>{value}</p>
      <p style={{ margin: 0, fontSize: 11, color: "#64748B", fontWeight: 600 }}>{label}{sub ? ` (${sub})` : ""}</p>
    </div>
  );
}

function Editor({ icon, label, value, onChange, rows, placeholder }: { icon: IconUIName; label: string; value: string; onChange: (v: string) => void; rows: number; placeholder: string }) {
  return (
    <div>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: "#042E7B", marginBottom: 6 }}><IconUI name={icon} size={14} />{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder}
        style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "11px 14px", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box" }} />
    </div>
  );
}
