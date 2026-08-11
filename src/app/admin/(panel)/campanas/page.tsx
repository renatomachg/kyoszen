"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconUI } from "@/components/ui/IconUI";
import { RedLogo } from "@/components/RedLogo";
import ImportarCampana from "@/components/admin/ImportarCampana";
import ConfirmModal, { type ConfirmModalProps } from "@/components/ui/ConfirmModal";
import {
  ESTADOS_CAMPANA,
  MODOS_CAMPANA,
  esEnCurso,
  fmtDinero,
  fmtNumero,
  statsAnuncios,
  sumarResultados,
  tieneResultados,
  type Campana,
  type CampanaAnuncio,
  type ModoCampana,
  type PreguntaFormulario,
  type ResultadosCampana,
  type TipoPregunta,
} from "@/lib/campanas";

const C = {
  navy: "#042E7B",
  blue: "#1883FF",
  blueDark: "#0A4ECC",
  yellow: "#FFCC00",
  ink: "#1E293B",
  body: "#475569",
  muted: "#64748B",
  faint: "#94A3B8",
  hair: "#E6EBF5",
  wash: "#F1F5F9",
  blueWash: "#EAF2FF",
};

const input: React.CSSProperties = {
  width: "100%", border: `1.5px solid ${C.hair}`, borderRadius: 10, padding: "9px 11px",
  fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box", color: C.ink,
};

function Campo({ label, children, ancho }: { label: string; children: React.ReactNode; ancho?: string }) {
  return (
    <div style={{ gridColumn: ancho }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: C.faint, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 5 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

/* ─── Resultados de Meta ──────────────────────────────── */
const CAMPOS_RESULTADO: [keyof ResultadosCampana, string][] = [
  ["alcance", "Alcance (personas)"],
  ["impresiones", "Impresiones"],
  ["clics", "Clics"],
  ["clics_enlace", "Clics al enlace"],
  ["gastado", "Gastado (MXN)"],
  ["interacciones", "Interacciones"],
];

function ResultadosEditor({ resultados, onChange }: {
  resultados: ResultadosCampana | null | undefined;
  onChange: (r: ResultadosCampana) => void;
}) {
  const r = resultados ?? {};
  const set = (patch: Partial<ResultadosCampana>) =>
    onChange({ ...r, ...patch, fuente: "manual", moneda: r.moneda ?? "MXN", actualizado_en: new Date().toISOString() });

  const numero = (campo: keyof ResultadosCampana) => {
    const v = r[campo];
    return typeof v === "number" ? String(v) : "";
  };

  return (
    <div style={{ background: "#F8FAFC", border: `1px solid ${C.hair}`, borderRadius: 12, padding: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 10 }}>
        <Campo label="Desde">
          <input type="date" value={r.desde ?? ""} onChange={e => set({ desde: e.target.value })} style={{ ...input, padding: "8px 9px" }} />
        </Campo>
        <Campo label="Hasta">
          <input type="date" value={r.hasta ?? ""} onChange={e => set({ hasta: e.target.value })} style={{ ...input, padding: "8px 9px" }} />
        </Campo>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {CAMPOS_RESULTADO.map(([campo, label]) => (
          <Campo key={campo} label={label}>
            <input
              type="number" min="0" step={campo === "gastado" ? "0.01" : "1"}
              value={numero(campo)}
              onChange={e => set({ [campo]: e.target.value === "" ? undefined : Number(e.target.value) } as Partial<ResultadosCampana>)}
              style={{ ...input, padding: "8px 9px" }}
            />
          </Campo>
        ))}
      </div>
      {r.actualizado_en && (
        <p style={{ margin: "10px 0 0", fontSize: 11.5, color: C.faint }}>
          Último corte: {new Date(r.actualizado_en).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}
          {r.fuente === "meta" ? " · traído de Meta" : " · capturado a mano"}
        </p>
      )}
    </div>
  );
}

/** Vista rápida de los números, sin editar. */
function ResumenResultados({ resultados }: { resultados: ResultadosCampana }) {
  const datos: [string, string][] = [
    ["Alcance", fmtNumero(resultados.alcance)],
    ["Impresiones", fmtNumero(resultados.impresiones)],
    ["Clics", fmtNumero(resultados.clics)],
    ["Gastado", fmtDinero(resultados.gastado, resultados.moneda ?? "MXN")],
  ];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {datos.map(([k, v]) => (
        <span key={k} style={{ background: C.blueWash, color: C.navy, borderRadius: 8, padding: "6px 11px", fontSize: 12, fontWeight: 800 }}>
          {k}: {v}
        </span>
      ))}
    </div>
  );
}

/* ─── Editor de preguntas del formulario ──────────────── */
function PreguntasEditor({ preguntas, onChange }: {
  preguntas: PreguntaFormulario[];
  onChange: (p: PreguntaFormulario[]) => void;
}) {
  const set = (i: number, patch: Partial<PreguntaFormulario>) =>
    onChange(preguntas.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  const mover = (i: number, dir: -1 | 1) => {
    const destino = i + dir;
    if (destino < 0 || destino >= preguntas.length) return;
    const copia = [...preguntas];
    [copia[i], copia[destino]] = [copia[destino], copia[i]];
    onChange(copia);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {preguntas.map((p, i) => (
        <div key={i} style={{ background: "#F8FAFC", border: `1px solid ${C.hair}`, borderRadius: 12, padding: 12 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 900, color: C.faint, paddingTop: 10, minWidth: 16 }}>{i + 1}.</span>
            <textarea value={p.pregunta} onChange={e => set(i, { pregunta: e.target.value })} rows={2}
              style={{ ...input, resize: "vertical" }} placeholder="Texto de la pregunta" />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <button onClick={() => mover(i, -1)} disabled={i === 0} title="Subir"
                style={{ border: `1px solid ${C.hair}`, background: "#fff", borderRadius: 7, width: 28, height: 24, cursor: i === 0 ? "default" : "pointer", color: C.muted, opacity: i === 0 ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconUI name="chevron-up" size={13} />
              </button>
              <button onClick={() => mover(i, 1)} disabled={i === preguntas.length - 1} title="Bajar"
                style={{ border: `1px solid ${C.hair}`, background: "#fff", borderRadius: 7, width: 28, height: 24, cursor: i === preguntas.length - 1 ? "default" : "pointer", color: C.muted, opacity: i === preguntas.length - 1 ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconUI name="chevron-down" size={13} />
              </button>
              <button onClick={() => onChange(preguntas.filter((_, idx) => idx !== i))} title="Eliminar"
                style={{ border: "1px solid #FECACA", background: "#FEF2F2", borderRadius: 7, width: 28, height: 24, cursor: "pointer", color: "#B91C1C", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconUI name="trash" size={13} />
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 8, marginLeft: 24 }}>
            <select value={p.tipo} onChange={e => set(i, { tipo: e.target.value as TipoPregunta })} style={{ ...input, padding: "8px 9px" }}>
              <option value="opcion">Opción múltiple</option>
              <option value="texto">Texto libre</option>
              <option value="telefono">Teléfono</option>
              <option value="numero">Número</option>
            </select>
            {p.tipo === "opcion" ? (
              <input value={(p.opciones ?? []).join(" · ")}
                onChange={e => set(i, { opciones: e.target.value.split("·").map(s => s.trim()).filter(Boolean) })}
                placeholder="Opciones separadas por ·" style={{ ...input, padding: "8px 9px" }} />
            ) : (
              <input value={p.nota ?? ""} onChange={e => set(i, { nota: e.target.value })}
                placeholder="Nota opcional debajo de la pregunta" style={{ ...input, padding: "8px 9px" }} />
            )}
          </div>
        </div>
      ))}

      <button onClick={() => onChange([...preguntas, { pregunta: "", tipo: "opcion", opciones: ["Sí", "No"] }])}
        style={{ alignSelf: "flex-start", background: "#fff", border: `1.5px dashed ${C.hair}`, borderRadius: 10, padding: "9px 14px", fontSize: 12.5, fontWeight: 800, color: C.blueDark, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
        <IconUI name="plus" size={14} /> Agregar pregunta
      </button>
    </div>
  );
}

/* ─── Editor de un anuncio ────────────────────────────── */
function AnuncioEditor({ anuncio, enCurso, onSaved }: { anuncio: CampanaAnuncio; enCurso: boolean; onSaved: () => void }) {
  const [borrador, setBorrador] = useState<CampanaAnuncio>(anuncio);
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [respuesta, setRespuesta] = useState("");
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setBorrador(anuncio); }, [anuncio]);

  const set = (patch: Partial<CampanaAnuncio>) => setBorrador(b => ({ ...b, ...patch }));

  const subirArte = async (file: File) => {
    setSubiendo(true);
    setAviso(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/social/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo subir");
      set({ imagen_url: data.url });
      setAviso("Arte cargado. Guarda para que lo vea el cliente.");
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "No se pudo subir el arte");
    } finally {
      setSubiendo(false);
    }
  };

  const guardar = async (avisar: boolean) => {
    setGuardando(true);
    setAviso(null);
    try {
      const res = await fetch(`/api/admin/campanas/anuncios/${anuncio.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          puesto: borrador.puesto,
          imagen_url: borrador.imagen_url,
          texto_principal: borrador.texto_principal,
          titulo: borrador.titulo,
          descripcion: borrador.descripcion,
          cta: borrador.cta,
          formulario: borrador.formulario,
          resultados: borrador.resultados ?? null,
          avisar,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "No se pudo guardar");
      setAviso(avisar ? "Guardado y avisado al cliente." : "Guardado.");
      onSaved();
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  };

  const responder = async () => {
    const texto = respuesta.trim();
    if (!texto) return;
    setGuardando(true);
    try {
      const res = await fetch(`/api/admin/campanas/anuncios/${anuncio.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autor_nombre: "Kyoszen", contenido: texto }),
      });
      if (!res.ok) throw new Error("No se pudo enviar el comentario");
      setRespuesta("");
      onSaved();
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "No se pudo enviar");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    setBorrando(true);
    try {
      const res = await fetch(`/api/admin/campanas/anuncios/${anuncio.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAviso(data.error ?? "No se pudo eliminar");
        return;
      }
      setConfirmarBorrado(false);
      onSaved();
    } finally {
      setBorrando(false);
    }
  };

  const est = ESTADOS_CAMPANA[anuncio.estado];
  const comentarios = anuncio.campana_comentarios ?? [];

  return (
    <div style={{ background: "#fff", border: `1px solid ${C.hair}`, borderRadius: 16, padding: 18, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: C.navy }}>{anuncio.puesto}</h4>
        {enCurso ? (
          <span style={{ background: "#DCFCE7", color: "#166534", borderRadius: 50, padding: "4px 11px", fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E" }} />Al aire
          </span>
        ) : (
          <span style={{ background: est.bg, color: est.color, borderRadius: 50, padding: "4px 11px", fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: est.dot }} />{est.label}
          </span>
        )}
        {comentarios.length > 0 && (
          <span style={{ fontSize: 11.5, color: C.muted, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}>
            <IconUI name="comment" size={13} />{comentarios.length}
          </span>
        )}
        <button onClick={() => setConfirmarBorrado(true)} disabled={guardando} title="Eliminar este anuncio"
          style={{ marginLeft: "auto", background: "#fff", border: "1.5px solid #FECACA", borderRadius: 9, padding: "6px 11px", fontSize: 12, fontWeight: 800, color: "#B91C1C", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <IconUI name="trash" size={13} /> Eliminar anuncio
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 18, alignItems: "start" }}>
        {/* Arte */}
        <div>
          <div style={{ background: C.wash, border: `1px solid ${C.hair}`, borderRadius: 12, aspectRatio: "1/1", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
            {borrador.imagen_url
              ? <img src={borrador.imagen_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ color: C.faint, display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
                  <IconUI name="image" size={22} /><span style={{ fontSize: 12, fontWeight: 700 }}>Sin arte</span>
                </div>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) void subirArte(f); e.target.value = ""; }} />
          <button onClick={() => fileRef.current?.click()} disabled={subiendo}
            style={{ width: "100%", background: "#fff", border: `1.5px solid ${C.hair}`, borderRadius: 10, padding: "9px 0", fontSize: 12.5, fontWeight: 800, color: C.navy, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <IconUI name="upload" size={14} />{subiendo ? "Subiendo..." : borrador.imagen_url ? "Cambiar arte" : "Subir arte"}
          </button>
        </div>

        {/* Contenido */}
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Campo label="Puesto">
              <input value={borrador.puesto} onChange={e => set({ puesto: e.target.value })} style={input} />
            </Campo>
            <Campo label="Botón (CTA)">
              <input value={borrador.cta} onChange={e => set({ cta: e.target.value })} style={input} />
            </Campo>
          </div>
          <Campo label="Texto principal">
            <textarea value={borrador.texto_principal ?? ""} onChange={e => set({ texto_principal: e.target.value })} rows={5}
              style={{ ...input, resize: "vertical", lineHeight: 1.5 }} />
          </Campo>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Campo label="Título">
              <input value={borrador.titulo ?? ""} onChange={e => set({ titulo: e.target.value })} style={input} />
            </Campo>
            <Campo label="Descripción">
              <input value={borrador.descripcion ?? ""} onChange={e => set({ descripcion: e.target.value })} style={input} />
            </Campo>
          </div>

          <Campo label={`Preguntas del formulario (${borrador.formulario?.preguntas?.length ?? 0})`}>
            <PreguntasEditor
              preguntas={borrador.formulario?.preguntas ?? []}
              onChange={preguntas => set({ formulario: { ...(borrador.formulario ?? { preguntas: [] }), preguntas } })}
            />
          </Campo>

          <Campo label="Pantalla de confirmación">
            <textarea value={borrador.formulario?.pantalla_confirmacion ?? ""}
              onChange={e => set({ formulario: { ...(borrador.formulario ?? { preguntas: [] }), pantalla_confirmacion: e.target.value } })}
              rows={5} style={{ ...input, resize: "vertical", lineHeight: 1.5 }} />
          </Campo>

          <Campo label="Resultados de este anuncio">
            <ResultadosEditor resultados={borrador.resultados} onChange={resultados => set({ resultados })} />
          </Campo>

          <div style={{ display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={() => guardar(false)} disabled={guardando}
              style={{ background: "#fff", border: `1.5px solid ${C.hair}`, borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 800, color: C.navy, cursor: "pointer" }}>
              {guardando ? "Guardando..." : "Guardar"}
            </button>
            {!enCurso && (
              <button onClick={() => guardar(true)} disabled={guardando}
                style={{ background: C.yellow, border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 900, color: C.navy, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7 }}>
                <IconUI name="send" size={14} /> Guardar y avisar al cliente
              </button>
            )}
            {enCurso && (
              <span style={{ fontSize: 12, color: C.faint, lineHeight: 1.5 }}>
                Esta campaña ya está corriendo: el cliente solo la ve, no se le pide aprobación.
              </span>
            )}
            {aviso && <span style={{ fontSize: 12.5, color: C.muted, fontWeight: 700 }}>{aviso}</span>}
          </div>

          {/* Hilo */}
          {comentarios.length > 0 && (
            <div style={{ borderTop: `1px solid ${C.wash}`, paddingTop: 12 }}>
              <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 800, color: C.faint, textTransform: "uppercase", letterSpacing: ".05em" }}>
                Comentarios
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 10 }}>
                {comentarios.map(c => (
                  <div key={c.id} style={{ background: c.autor_rol === "admin" ? "#EFF6FF" : "#F8FAFC", borderLeft: `3px solid ${c.autor_rol === "admin" ? C.blue : "#CBD5E1"}`, borderRadius: 10, padding: "9px 12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: c.autor_rol === "admin" ? C.blue : C.navy }}>
                        {c.autor_nombre}{c.autor_rol === "admin" ? " · Kyoszen" : ""}
                      </span>
                      <span style={{ fontSize: 11, color: C.faint }}>
                        {new Date(c.created_at).toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12.5, color: C.ink, lineHeight: 1.5 }}>{c.contenido}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={respuesta} onChange={e => setRespuesta(e.target.value)} placeholder="Responder al cliente..."
                  onKeyDown={e => { if (e.key === "Enter") void responder(); }} style={input} />
                <button onClick={responder} disabled={!respuesta.trim() || guardando}
                  style={{ background: C.navy, border: "none", borderRadius: 10, padding: "0 16px", fontSize: 12.5, fontWeight: 800, color: "#fff", cursor: "pointer", opacity: !respuesta.trim() ? 0.5 : 1 }}>
                  Enviar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        abierto={confirmarBorrado}
        tono="peligro"
        titulo={`Eliminar el anuncio "${anuncio.puesto}"`}
        descripcion="Se quita del portal del cliente y deja de contar para el avance de la campaña."
        puntos={[
          "El arte, el texto y el formulario de este anuncio",
          ...(comentarios.length > 0
            ? [`${comentarios.length} comentario${comentarios.length === 1 ? "" : "s"} del cliente`]
            : []),
        ]}
        nota="Esto no se puede deshacer. No afecta nada en Meta."
        confirmarLabel="Eliminar anuncio"
        cargando={borrando}
        onConfirmar={eliminar}
        onCancelar={() => setConfirmarBorrado(false)}
      />
    </div>
  );
}

/* ─── Datos de la campaña ─────────────────────────────── */
function CampanaEditor({ campana, onSaved }: { campana: Campana; onSaved: () => void }) {
  const [b, setB] = useState(campana);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => { setB(campana); }, [campana]);

  const set = (patch: Partial<Campana>) => setB(prev => ({ ...prev, ...patch }));
  const setSeg = (patch: Partial<Campana["segmentacion"]>) =>
    setB(prev => ({ ...prev, segmentacion: { ...prev.segmentacion, ...patch } }));

  const guardar = async () => {
    setGuardando(true);
    setAviso(null);
    try {
      const res = await fetch(`/api/admin/campanas/${campana.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: b.nombre, cliente_final: b.cliente_final, objetivo: b.objetivo, modo: b.modo ?? "revision",
          publica_desde: b.publica_desde, segmentacion: b.segmentacion,
          presupuesto_texto: b.presupuesto_texto, fecha_difusion: b.fecha_difusion,
          fechas_reclutamiento: b.fechas_reclutamiento, meta_texto: b.meta_texto,
          sede_texto: b.sede_texto, nota_interna: b.nota_interna, resultados: b.resultados ?? null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "No se pudo guardar");
      setAviso("Guardado.");
      onSaved();
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ background: "#fff", border: `1px solid ${C.hair}`, borderRadius: 16, padding: 18, marginBottom: 18 }}>
      {/* Modo: define si el cliente aprueba o solo la ve */}
      <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 900, color: C.navy }}>¿Qué le pedimos al cliente?</h4>
      <p style={{ margin: "0 0 10px", fontSize: 12.5, color: C.muted }}>
        Cambia lo que ve en su portal: los botones de aprobación, o solo el anuncio con una caja de comentario.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {(Object.keys(MODOS_CAMPANA) as ModoCampana[]).map(m => {
          const activo = (b.modo ?? "revision") === m;
          return (
            <button key={m} onClick={() => set({ modo: m })}
              style={{ textAlign: "left", background: activo ? C.blueWash : "#fff", border: `1.5px solid ${activo ? C.blue : C.hair}`, borderRadius: 12, padding: "12px 14px", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ width: 15, height: 15, borderRadius: "50%", border: `2px solid ${activo ? C.blue : "#CBD5E1"}`, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {activo && <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.blue }} />}
                </span>
                <span style={{ fontSize: 13, fontWeight: 900, color: C.navy }}>{MODOS_CAMPANA[m].label}</span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: C.body, lineHeight: 1.5, paddingLeft: 23 }}>
                {MODOS_CAMPANA[m].descripcion}
              </p>
            </button>
          );
        })}
      </div>

      <h4 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 900, color: C.navy }}>Datos que ve el cliente</h4>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <Campo label="Nombre de la campaña" ancho="span 2">
          <input value={b.nombre} onChange={e => set({ nombre: e.target.value })} style={input} />
        </Campo>
        <Campo label="Cliente final">
          <input value={b.cliente_final ?? ""} onChange={e => set({ cliente_final: e.target.value })} style={input} />
        </Campo>
        <Campo label="Zonas (separadas por coma)" ancho="span 2">
          <input value={(b.segmentacion?.ubicaciones ?? []).join(", ")}
            onChange={e => setSeg({ ubicaciones: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
            style={input} />
        </Campo>
        <Campo label="Edad">
          <input value={b.segmentacion?.edad ?? ""} onChange={e => setSeg({ edad: e.target.value })} style={input} />
        </Campo>
        <Campo label="Anclaje" ancho="span 2">
          <input value={b.segmentacion?.ancla ?? ""} onChange={e => setSeg({ ancla: e.target.value })} style={input} />
        </Campo>
        <Campo label="Público estimado">
          <input value={b.segmentacion?.publico_estimado ?? ""} onChange={e => setSeg({ publico_estimado: e.target.value })} style={input} />
        </Campo>
        <Campo label="Inversión">
          <input value={b.presupuesto_texto ?? ""} onChange={e => set({ presupuesto_texto: e.target.value })} style={input} />
        </Campo>
        <Campo label="Difusión">
          <input value={b.fecha_difusion ?? ""} onChange={e => set({ fecha_difusion: e.target.value })} style={input} />
        </Campo>
        <Campo label="Reclutamiento presencial">
          <input value={b.fechas_reclutamiento ?? ""} onChange={e => set({ fechas_reclutamiento: e.target.value })} style={input} />
        </Campo>
        <Campo label="Sede" ancho="span 2">
          <input value={b.sede_texto ?? ""} onChange={e => set({ sede_texto: e.target.value })} style={input} />
        </Campo>
        <Campo label="Meta">
          <input value={b.meta_texto ?? ""} onChange={e => set({ meta_texto: e.target.value })} style={input} />
        </Campo>
        <Campo label="Objetivo" ancho="span 2">
          <input value={b.objetivo ?? ""} onChange={e => set({ objetivo: e.target.value })} style={input} />
        </Campo>
        <Campo label="Se publica desde">
          <input value={b.publica_desde ?? ""} onChange={e => set({ publica_desde: e.target.value })} style={input} />
        </Campo>
        <Campo label="Nota interna (el cliente NO la ve)" ancho="span 3">
          <textarea value={b.nota_interna ?? ""} onChange={e => set({ nota_interna: e.target.value })} rows={2}
            style={{ ...input, resize: "vertical", background: "#FFFBEB", borderColor: "#FDE68A" }} />
        </Campo>
      </div>
      {/* Resultados de Meta que ve el cliente */}
      <div style={{ marginTop: 20 }}>
        <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 900, color: C.navy }}>Resultados de la campaña</h4>
        <p style={{ margin: "0 0 10px", fontSize: 12.5, color: C.muted }}>
          Los números que el cliente ve en “Cómo va la campaña”. Cópialos del administrador de anuncios de Meta.
          {b.meta_id && <> ID en Meta: <span style={{ fontFamily: "monospace", color: C.body }}>{b.meta_id}</span>.</>}
        </p>
        <ResultadosEditor resultados={b.resultados} onChange={resultados => set({ resultados })} />
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 14 }}>
        <button onClick={guardar} disabled={guardando}
          style={{ background: C.navy, border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 800, color: "#fff", cursor: "pointer" }}>
          {guardando ? "Guardando..." : "Guardar datos"}
        </button>
        {aviso && <span style={{ fontSize: 12.5, color: C.muted, fontWeight: 700 }}>{aviso}</span>}
      </div>
    </div>
  );
}

/* ─── Página ──────────────────────────────────────────── */
export default function CampanasAdminPage() {
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [loading, setLoading] = useState(true);
  const [abierta, setAbierta] = useState<number | null>(null);
  const [publicando, setPublicando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogo, setDialogo] = useState<
    Omit<ConfirmModalProps, "abierto" | "onCancelar" | "cargando"> | null
  >(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/campanas");
      const data = await res.json();
      setCampanas(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const cerrarDialogo = () => { setDialogo(null); setPublicando(false); };

  const togglePublicado = async (c: Campana) => {
    // Ocultar no necesita confirmación: es reversible y no manda correos
    if (c.publicado) { await aplicarPublicado(c, false); return; }

    const num = c.campana_anuncios?.length ?? 0;
    const sinArte = (c.campana_anuncios ?? []).filter(a => !a.imagen_url).length;
    const enCurso = esEnCurso(c);

    setDialogo({
      tono: "primario",
      icono: "send",
      titulo: `Publicar "${c.nombre}" al cliente`,
      descripcion: enCurso
        ? "El cliente va a poder verla desde su portal. No se le piden aprobaciones: la campaña ya está corriendo."
        : "El cliente va a poder verla y aprobar cada anuncio desde su portal.",
      puntos: [
        enCurso
          ? `${num} anuncio${num === 1 ? "" : "s"} al aire, solo para que los vea`
          : `${num} anuncio${num === 1 ? "" : "s"} listos para revisión`,
        "Se avisa por correo a los revisores activos",
      ],
      aviso: sinArte > 0
        ? `${sinArte} de ${num} anuncios todavía no tienen arte. El cliente los verá como "Arte pendiente".`
        : undefined,
      confirmarLabel: "Publicar al cliente",
      onConfirmar: () => aplicarPublicado(c, true),
    });
  };

  const aplicarPublicado = async (c: Campana, publicado: boolean) => {
    setPublicando(true);
    try {
      const res = await fetch(`/api/admin/campanas/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicado }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "No se pudo cambiar la publicación");
        return;
      }
      setDialogo(null);
      await load();
    } finally {
      setPublicando(false);
    }
  };

  const agregarAnuncio = (campanaId: number) => {
    setDialogo({
      tono: "primario",
      icono: "plus",
      titulo: "Agregar un anuncio",
      descripcion: "Se crea vacío y lo llenas abajo: arte, texto, título y formulario.",
      input: { label: "¿Qué puesto anuncia?", placeholder: "Ej: Almacenista" },
      confirmarLabel: "Agregar anuncio",
      onConfirmar: async puesto => {
        setPublicando(true);
        try {
          const res = await fetch(`/api/admin/campanas/${campanaId}/anuncios`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ puesto }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setError(data.error ?? "No se pudo agregar el anuncio");
            return;
          }
          setDialogo(null);
          await load();
        } finally {
          setPublicando(false);
        }
      },
    });
  };

  const eliminarCampana = (c: Campana) => {
    const num = c.campana_anuncios?.length ?? 0;
    const comentarios = (c.campana_anuncios ?? []).reduce((n, a) => n + (a.campana_comentarios?.length ?? 0), 0);

    setDialogo({
      tono: "peligro",
      titulo: `Eliminar la campaña "${c.nombre}"`,
      descripcion: "Se borra del aprobador junto con todo lo que cuelga de ella.",
      puntos: [
        `${num} anuncio${num === 1 ? "" : "s"} con su arte, texto y formulario`,
        ...(comentarios > 0 ? [`${comentarios} comentario${comentarios === 1 ? "" : "s"} del cliente`] : []),
      ],
      aviso: c.publicado
        ? "Esta campaña está publicada: el cliente la está viendo en este momento."
        : undefined,
      // Si el cliente ya la ve, exigir que se escriba la palabra
      confirmarEscribiendo: c.publicado ? "ELIMINAR" : undefined,
      nota: "Esto no se puede deshacer. No afecta nada en Meta: tus campañas, formularios y anuncios del administrador de anuncios siguen igual.",
      confirmarLabel: "Eliminar campaña",
      onConfirmar: async () => {
        setPublicando(true);
        try {
          const res = await fetch(`/api/admin/campanas/${c.id}`, { method: "DELETE" });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setError(data.error ?? "No se pudo eliminar la campaña");
            return;
          }
          if (abierta === c.id) setAbierta(null);
          setDialogo(null);
          await load();
        } finally {
          setPublicando(false);
        }
      },
    });
  };

  const actual = campanas.find(c => c.id === abierta) ?? null;

  if (loading) {
    return <div style={{ padding: 40, color: C.faint, fontSize: 13.5 }}>Cargando campañas...</div>;
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 22, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 900, color: C.navy }}>Campañas</h1>
          <p style={{ margin: 0, fontSize: 13.5, color: C.muted }}>
            Anuncios pagados que el cliente aprueba en su portal, uno por uno.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => setImportando(true)}
            style={{ background: C.yellow, border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 12.5, fontWeight: 900, color: C.navy, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7 }}>
            <IconUI name="upload" size={14} /> Importar campaña
          </button>
          <a href="/revisor?tab=campanas" target="_blank" rel="noreferrer"
            style={{ background: "#fff", border: `1.5px solid ${C.hair}`, borderRadius: 10, padding: "9px 14px", fontSize: 12.5, fontWeight: 800, color: C.navy, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7 }}>
            <IconUI name="eye" size={14} /> Ver como cliente
          </a>
        </div>
      </div>

      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "12px 15px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "#991B1B", flexShrink: 0 }}><IconUI name="x" size={15} /></span>
          <p style={{ margin: 0, fontSize: 13, color: "#991B1B", fontWeight: 700, flex: 1 }}>{error}</p>
          <button onClick={() => setError(null)}
            style={{ background: "none", border: "none", color: "#B91C1C", fontSize: 17, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
      )}

      {importando && (
        <ImportarCampana
          campanas={campanas}
          onCerrar={() => setImportando(false)}
          onCreada={async id => { await load(); setAbierta(id); }}
        />
      )}

      {campanas.length === 0 && !importando && (
        <div style={{ background: "#fff", border: `1px dashed ${C.hair}`, borderRadius: 16, padding: "48px 20px", textAlign: "center", color: C.faint }}>
          <IconUI name="target" size={26} />
          <p style={{ margin: "10px 0 0", fontSize: 13.5, fontWeight: 700 }}>Todavía no hay campañas.</p>
        </div>
      )}

      {/* Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {campanas.map(c => {
          const st = statsAnuncios(c.campana_anuncios ?? []);
          const est = ESTADOS_CAMPANA[c.estado];
          const enCurso = esEnCurso(c);
          const esActual = abierta === c.id;
          const anunciosDe = c.campana_anuncios ?? [];
          const resumen = tieneResultados(c.resultados)
            ? c.resultados!
            : anunciosDe.some(a => tieneResultados(a.resultados))
              ? sumarResultados(anunciosDe)
              : null;
          return (
            <div key={c.id} style={{ background: "#fff", border: `1px solid ${esActual ? C.blue : C.hair}`, borderRadius: 16, overflow: "hidden", boxShadow: esActual ? "0 4px 18px rgba(24,131,255,.12)" : "0 1px 3px rgba(4,46,123,.05)" }}>
              <div style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <RedLogo red_social={c.plataforma} height={13} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: C.navy }}>{c.nombre}</p>
                    {!c.publicado && (
                      <span style={{ background: C.wash, color: C.muted, borderRadius: 6, padding: "3px 8px", fontSize: 10.5, fontWeight: 900, letterSpacing: ".05em" }}>BORRADOR</span>
                    )}
                    {enCurso ? (
                      <span style={{ background: "#DCFCE7", color: "#166534", borderRadius: 50, padding: "3px 10px", fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E" }} />
                        En curso · sin aprobación
                      </span>
                    ) : (
                      <span style={{ background: est.bg, color: est.color, borderRadius: 50, padding: "3px 10px", fontSize: 11, fontWeight: 800 }}>{est.label}</span>
                    )}
                  </div>
                  <p style={{ margin: "3px 0 0", fontSize: 12.5, color: C.muted }}>
                    {c.cliente_final ?? "—"} · {enCurso ? (
                      <>{st.total} anuncio{st.total === 1 ? "" : "s"} al aire{c.fecha_difusion ? ` · ${c.fecha_difusion}` : ""}</>
                    ) : (
                      <>{st.aprobados} de {st.total} anuncios aprobados</>
                    )}
                    {!enCurso && st.cambios > 0 && <span style={{ color: "#B91C1C", fontWeight: 800 }}> · {st.cambios} con cambios</span>}
                  </p>
                  {resumen && (
                    <div style={{ marginTop: 8 }}>
                      <ResumenResultados resultados={resumen} />
                    </div>
                  )}
                </div>
                <button onClick={() => togglePublicado(c)} disabled={publicando}
                  style={{ background: c.publicado ? "#fff" : C.yellow, border: c.publicado ? `1.5px solid ${C.hair}` : "none", borderRadius: 10, padding: "9px 14px", fontSize: 12.5, fontWeight: 900, color: C.navy, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7 }}>
                  <IconUI name={c.publicado ? "eye" : "send"} size={14} />
                  {c.publicado ? "Ocultar al cliente" : "Publicar al cliente"}
                </button>
                <button onClick={() => setAbierta(esActual ? null : c.id)}
                  style={{ background: "#fff", border: `1.5px solid ${C.hair}`, borderRadius: 10, padding: "9px 14px", fontSize: 12.5, fontWeight: 800, color: C.navy, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  {esActual ? "Cerrar" : "Editar"} <IconUI name={esActual ? "chevron-up" : "chevron-down"} size={13} />
                </button>
                <button onClick={() => eliminarCampana(c)} disabled={publicando} title="Eliminar campaña"
                  style={{ background: "#fff", border: "1.5px solid #FECACA", borderRadius: 10, width: 38, height: 38, color: "#B91C1C", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <IconUI name="trash" size={15} />
                </button>
              </div>

              {esActual && actual && (
                <div style={{ background: "#F8FAFC", borderTop: `1px solid ${C.hair}`, padding: 18 }}>
                  <CampanaEditor campana={actual} onSaved={load} />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: C.navy }}>
                      Anuncios ({actual.campana_anuncios?.length ?? 0})
                    </h4>
                    <button onClick={() => agregarAnuncio(actual.id)}
                      style={{ background: "#fff", border: `1.5px dashed ${C.hair}`, borderRadius: 10, padding: "8px 14px", fontSize: 12.5, fontWeight: 800, color: C.blueDark, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <IconUI name="plus" size={14} /> Agregar anuncio
                    </button>
                  </div>
                  {(actual.campana_anuncios ?? []).map(a => (
                    <AnuncioEditor key={a.id} anuncio={a} enCurso={enCurso} onSaved={load} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {dialogo && (
        <ConfirmModal abierto {...dialogo} cargando={publicando} onCancelar={cerrarDialogo} />
      )}
    </div>
  );
}
