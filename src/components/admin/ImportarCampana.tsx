"use client";

import { useRef, useState, type DragEvent } from "react";
import { IconUI } from "@/components/ui/IconUI";
import type { Campana, FormularioAnuncio, Segmentacion } from "@/lib/campanas";

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

interface CampanaPropuesta {
  nombre?: string;
  cliente_final?: string;
  plataforma?: string;
  tipo?: string;
  objetivo?: string;
  publica_desde?: string;
  segmentacion?: Segmentacion;
  presupuesto_texto?: string;
  fecha_difusion?: string;
  fechas_reclutamiento?: string;
  meta_texto?: string;
  sede_texto?: string;
  nota_interna?: string;
}

interface AnuncioPropuesto {
  puesto?: string;
  texto_principal?: string;
  titulo?: string;
  descripcion?: string;
  cta?: string;
  formulario?: FormularioAnuncio;
  seleccionado: boolean;
}

interface Captura {
  nombre: string;
  media_type: string;
  data: string;   // base64 sin el prefijo
  preview: string;
}

/** Reduce la captura antes de mandarla: más rápido y evita cuerpos gigantes. */
function prepararImagen(file: File): Promise<Captura> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`No se pudo leer ${file.name}`));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error(`No se pudo abrir ${file.name}`));
      img.onload = () => {
        const maxLado = 1600;
        const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("No se pudo procesar la imagen"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        resolve({
          nombre: file.name,
          media_type: "image/jpeg",
          data: dataUrl.split(",")[1],
          preview: dataUrl,
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function ImportarCampana({ campanas, onCreada, onCerrar }: {
  campanas: Campana[];
  onCreada: (campanaId: number) => void;
  onCerrar: () => void;
}) {
  const [texto, setTexto] = useState("");
  const [capturas, setCapturas] = useState<Captura[]>([]);
  const [archivoNombre, setArchivoNombre] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<{ texto: string; detalle?: string; ayuda?: boolean } | null>(null);
  const [destino, setDestino] = useState<"nueva" | number>("nueva");

  const [propuesta, setPropuesta] = useState<CampanaPropuesta | null>(null);
  const [anuncios, setAnuncios] = useState<AnuncioPropuesto[]>([]);

  const imgRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setTexto(""); setCapturas([]); setArchivoNombre(null);
    setPropuesta(null); setAnuncios([]); setMsg(null); setError(null); setDestino("nueva");
  };

  /* ── Entradas ─────────────────────────────────────── */
  const agregarImagenes = async (files: File[]) => {
    const imgs = files.filter(f => f.type.startsWith("image/"));
    if (imgs.length === 0) return;
    setError(null);
    try {
      const nuevas = await Promise.all(imgs.map(prepararImagen));
      setCapturas(prev => [...prev, ...nuevas].slice(0, 12));
    } catch (e) {
      setError({ texto: e instanceof Error ? e.message : "No se pudieron leer las capturas" });
    }
  };

  const leerDocumento = async (file: File) => {
    setError(null);
    try {
      const esPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      let contenido: string;
      if (esPdf) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/social/extract-pdf", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "No se pudo leer el PDF");
        contenido = data.text ?? "";
      } else {
        contenido = await file.text();
      }
      if (!contenido.trim()) throw new Error("El archivo no trae texto (¿es un PDF escaneado?)");
      setTexto(prev => (prev ? `${prev}\n\n${contenido}` : contenido));
      setArchivoNombre(file.name);
    } catch (e) {
      setError({ texto: e instanceof Error ? e.message : "No se pudo leer el archivo" });
    }
  };

  const onDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const imgs = files.filter(f => f.type.startsWith("image/"));
    const docs = files.filter(f => !f.type.startsWith("image/"));
    if (imgs.length) await agregarImagenes(imgs);
    for (const d of docs) await leerDocumento(d);
  };

  /* ── Analizar ─────────────────────────────────────── */
  const analizar = async () => {
    if (!texto.trim() && capturas.length === 0) {
      setError({ texto: "Pega el brief o sube al menos una captura." });
      return;
    }
    setCargando(true);
    setError(null);
    setMsg(capturas.length > 0 ? "Leyendo las capturas..." : "Leyendo el brief...");
    setPropuesta(null); setAnuncios([]);
    try {
      const res = await fetch("/api/admin/campanas/importar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "analizar",
          texto,
          imagenes: capturas.map(c => ({ media_type: c.media_type, data: c.data })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError({
          texto: data.error ?? "No se pudo analizar",
          detalle: data.detalle,
          ayuda: data.sin_campana === true,
        });
        return;
      }

      setPropuesta(data.campana ?? {});
      setAnuncios((data.anuncios ?? []).map((a: AnuncioPropuesto) => ({ ...a, seleccionado: true })));
    } catch {
      setError({ texto: "No se pudo conectar con el servidor. Vuelve a intentarlo." });
    } finally {
      setMsg(null);
      setCargando(false);
    }
  };

  /* ── Crear ────────────────────────────────────────── */
  const crear = async () => {
    const elegidos = anuncios.filter(a => a.seleccionado);
    if (elegidos.length === 0) {
      setError({ texto: "Selecciona al menos un anuncio." });
      return;
    }
    setCargando(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/campanas/importar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "crear",
          campana: propuesta,
          anuncios: elegidos.map(a => ({ ...a, seleccionado: undefined })),
          campana_id: destino === "nueva" ? null : destino,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError({ texto: data.error ?? "No se pudo crear" });
        return;
      }
      reset();
      onCerrar();
      onCreada(data.campana_id);
    } catch {
      setError({ texto: "No se pudo conectar con el servidor. Vuelve a intentarlo." });
    } finally {
      setCargando(false);
    }
  };

  const seleccionados = anuncios.filter(a => a.seleccionado).length;

  return (
    <div style={{ background: "#fff", border: `1.5px solid ${C.blue}`, borderRadius: 18, padding: 20, marginBottom: 20, boxShadow: "0 4px 20px rgba(24,131,255,.1)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: "0 0 3px", fontSize: 16, fontWeight: 900, color: C.navy }}>Importar campaña</h3>
          <p style={{ margin: 0, fontSize: 12.5, color: C.muted, lineHeight: 1.5 }}>
            Pega el brief, arrastra capturas de pantalla o sube un PDF. Se lee todo y te lo muestro antes de crear nada.
          </p>
        </div>
        <button onClick={() => { reset(); onCerrar(); }}
          style={{ background: C.wash, border: "none", borderRadius: 9, width: 30, height: 30, color: C.muted, fontSize: 17, cursor: "pointer", flexShrink: 0 }}>×</button>
      </div>

      {!propuesta ? (
        <>
          {/* Zona de arrastre */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            style={{
              border: `2px dashed ${dragOver ? C.blue : C.hair}`,
              background: dragOver ? C.blueWash : "#F8FAFC",
              borderRadius: 14, padding: "18px 16px", marginBottom: 12, transition: "all .15s",
            }}
          >
            <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={7}
              placeholder="Pega aquí el brief de la campaña (es la vía más exacta)..."
              style={{ ...input, resize: "vertical", lineHeight: 1.5, background: "#fff", marginBottom: 12 }} />

            <div style={{ display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center" }}>
              <input ref={imgRef} type="file" accept="image/*" multiple style={{ display: "none" }}
                onChange={e => { void agregarImagenes(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
              <input ref={docRef} type="file" accept=".pdf,.html,.htm,.txt,.md" style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) void leerDocumento(f); e.target.value = ""; }} />

              <button onClick={() => imgRef.current?.click()}
                style={{ background: "#fff", border: `1.5px solid ${C.hair}`, borderRadius: 10, padding: "8px 13px", fontSize: 12.5, fontWeight: 800, color: C.navy, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <IconUI name="image" size={14} /> Subir capturas
              </button>
              <button onClick={() => docRef.current?.click()}
                style={{ background: "#fff", border: `1.5px solid ${C.hair}`, borderRadius: 10, padding: "8px 13px", fontSize: 12.5, fontWeight: 800, color: C.navy, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <IconUI name="document" size={14} /> Subir PDF / HTML
              </button>
              <span style={{ fontSize: 11.5, color: C.faint }}>
                …o arrastra los archivos aquí
              </span>
            </div>

            {archivoNombre && (
              <p style={{ margin: "10px 0 0", fontSize: 12, color: C.muted, display: "inline-flex", alignItems: "center", gap: 6 }}>
                <IconUI name="check" size={13} /> Se cargó el texto de <strong>{archivoNombre}</strong>
              </p>
            )}

            {capturas.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                {capturas.map((c, i) => (
                  <div key={i} style={{ position: "relative", width: 74, height: 74, borderRadius: 10, overflow: "hidden", border: `1px solid ${C.hair}` }}>
                    <img src={c.preview} alt={c.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button onClick={() => setCapturas(prev => prev.filter((_, idx) => idx !== i))}
                      style={{ position: "absolute", top: 3, right: 3, background: "rgba(4,46,123,.8)", border: "none", borderRadius: 6, width: 19, height: 19, color: "#fff", fontSize: 12, cursor: "pointer", lineHeight: 1 }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "13px 15px", marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                <span style={{ color: "#B45309", flexShrink: 0, marginTop: 1 }}><IconUI name="search" size={15} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, color: "#92400E", fontWeight: 800, lineHeight: 1.5 }}>{error.texto}</p>
                  {error.detalle && (
                    <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "#B45309", lineHeight: 1.5 }}>
                      Lo que subiste parece ser: {error.detalle}
                    </p>
                  )}
                  {error.ayuda && (
                    <div style={{ marginTop: 10, background: "#fff", border: `1px solid ${C.hair}`, borderRadius: 10, padding: "10px 12px" }}>
                      <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 800, color: C.faint, textTransform: "uppercase", letterSpacing: ".05em" }}>
                        Un brief que sí funciona trae
                      </p>
                      {[
                        "Un anuncio por puesto, con su texto principal, título y botón",
                        "Las preguntas del formulario, con sus opciones",
                        "La pantalla de confirmación que ve el candidato",
                        "A quién le llega: zonas, edad, inversión y fechas",
                      ].map(p => (
                        <div key={p} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "2px 0" }}>
                          <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.blue, marginTop: 7, flexShrink: 0 }} />
                          <span style={{ fontSize: 12.5, color: C.body, lineHeight: 1.5 }}>{p}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => setError(null)}
                  style={{ background: "none", border: "none", color: "#B45309", fontSize: 17, cursor: "pointer", lineHeight: 1, flexShrink: 0 }}>×</button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={analizar} disabled={cargando}
              style={{ background: C.navy, border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 13, fontWeight: 900, color: "#fff", cursor: cargando ? "default" : "pointer", opacity: cargando ? 0.6 : 1, display: "inline-flex", alignItems: "center", gap: 8 }}>
              <IconUI name="search" size={15} /> {cargando ? "Analizando..." : "Analizar"}
            </button>
            <span style={{ fontSize: 12, color: C.faint }}>Analizar solo lee. No se crea nada hasta que lo confirmes.</span>
            {msg && <span style={{ fontSize: 12.5, color: C.body, fontWeight: 700 }}>{msg}</span>}
          </div>
        </>
      ) : (
        /* ── Vista previa ──────────────────────────────── */
        <>
          <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "11px 14px", marginBottom: 14 }}>
            <p style={{ margin: 0, fontSize: 12.5, color: "#166534", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 7 }}>
              <IconUI name="check" size={14} /> Leí {anuncios.length} anuncio{anuncios.length === 1 ? "" : "s"}. Revisa y confirma.
            </p>
          </div>

          {/* Destino */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: C.faint, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 5 }}>
              Dónde van estos anuncios
            </label>
            <select value={String(destino)} onChange={e => setDestino(e.target.value === "nueva" ? "nueva" : Number(e.target.value))}
              style={{ ...input, maxWidth: 420 }}>
              <option value="nueva">Crear campaña nueva{propuesta.nombre ? ` — "${propuesta.nombre}"` : ""}</option>
              {campanas.map(c => (
                <option key={c.id} value={c.id}>Agregar a: {c.nombre}</option>
              ))}
            </select>
          </div>

          {/* Datos leídos de la campaña */}
          {destino === "nueva" && (
            <div style={{ background: "#F8FAFC", border: `1px solid ${C.hair}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 800, color: C.faint, textTransform: "uppercase", letterSpacing: ".05em" }}>
                Datos de la campaña
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>Nombre</label>
                  <input value={propuesta.nombre ?? ""} onChange={e => setPropuesta({ ...propuesta, nombre: e.target.value })} style={{ ...input, marginTop: 3 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>Cliente final</label>
                  <input value={propuesta.cliente_final ?? ""} onChange={e => setPropuesta({ ...propuesta, cliente_final: e.target.value })} style={{ ...input, marginTop: 3 }} />
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 11 }}>
                {([
                  ["Zonas", (propuesta.segmentacion?.ubicaciones ?? []).join(", ")],
                  ["Edad", propuesta.segmentacion?.edad],
                  ["Público", propuesta.segmentacion?.publico_estimado],
                  ["Inversión", propuesta.presupuesto_texto],
                  ["Difusión", propuesta.fecha_difusion],
                  ["Reclutamiento", propuesta.fechas_reclutamiento],
                  ["Meta", propuesta.meta_texto],
                  ["Sede", propuesta.sede_texto],
                ] as const).filter(([, v]) => v).map(([k, v]) => (
                  <span key={k} style={{ background: "#fff", border: `1px solid ${C.hair}`, borderRadius: 8, padding: "6px 10px", fontSize: 11.5, color: C.body }}>
                    <strong style={{ color: C.navy }}>{k}:</strong> {v}
                  </span>
                ))}
              </div>
              {propuesta.nota_interna && (
                <p style={{ margin: "11px 0 0", fontSize: 11.5, color: "#92400E", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "8px 11px", lineHeight: 1.5 }}>
                  <strong>Nota interna</strong> (el cliente no la ve): {propuesta.nota_interna}
                </p>
              )}
            </div>
          )}

          {/* Anuncios */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: C.faint, textTransform: "uppercase", letterSpacing: ".05em" }}>
              Anuncios ({seleccionados} de {anuncios.length} seleccionados)
            </p>
            <button onClick={() => {
              const todos = seleccionados !== anuncios.length;
              setAnuncios(prev => prev.map(a => ({ ...a, seleccionado: todos })));
            }}
              style={{ background: "none", border: "none", color: C.blueDark, fontSize: 12, fontWeight: 800, cursor: "pointer", textDecoration: "underline" }}>
              {seleccionados === anuncios.length ? "Quitar todas" : "Seleccionar todas"}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 16 }}>
            {anuncios.map((a, i) => (
              <div key={i} style={{ background: a.seleccionado ? "#fff" : "#F8FAFC", border: `1.5px solid ${a.seleccionado ? C.hair : "#EDF1F7"}`, borderRadius: 12, padding: 13, opacity: a.seleccionado ? 1 : 0.6 }}>
                <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                  <input type="checkbox" checked={a.seleccionado}
                    onChange={e => setAnuncios(prev => prev.map((x, idx) => idx === i ? { ...x, seleccionado: e.target.checked } : x))}
                    style={{ marginTop: 3, width: 16, height: 16, cursor: "pointer", flexShrink: 0 }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <input value={a.puesto ?? ""} onChange={e => setAnuncios(prev => prev.map((x, idx) => idx === i ? { ...x, puesto: e.target.value } : x))}
                      style={{ ...input, fontWeight: 900, color: C.navy, marginBottom: 7 }} />
                    {a.titulo && <p style={{ margin: "0 0 4px", fontSize: 12.5, color: C.ink, fontWeight: 700 }}>{a.titulo}</p>}
                    {a.texto_principal && (
                      <p style={{ margin: "0 0 7px", fontSize: 12, color: C.body, lineHeight: 1.5, whiteSpace: "pre-wrap", maxHeight: 88, overflow: "hidden" }}>
                        {a.texto_principal}
                      </p>
                    )}
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 11.5, color: C.muted, fontWeight: 700 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <IconUI name="clipboard" size={13} />{a.formulario?.preguntas?.length ?? 0} preguntas
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <IconUI name="mouse-pointer" size={13} />{a.cta || "Registrarte"}
                      </span>
                      {a.formulario?.pantalla_confirmacion
                        ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#166534" }}><IconUI name="check" size={13} />con confirmación</span>
                        : <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#B45309" }}><IconUI name="x" size={13} />sin confirmación</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={() => { setPropuesta(null); setAnuncios([]); }}
              style={{ background: "#fff", border: `1.5px solid ${C.hair}`, borderRadius: 10, padding: "11px 16px", fontSize: 13, fontWeight: 800, color: C.muted, cursor: "pointer" }}>
              ← Volver
            </button>
            <button onClick={crear} disabled={cargando || seleccionados === 0}
              style={{ background: C.yellow, border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 13, fontWeight: 900, color: C.navy, cursor: "pointer", opacity: cargando || seleccionados === 0 ? 0.5 : 1, display: "inline-flex", alignItems: "center", gap: 8 }}>
              <IconUI name="plus" size={15} />
              {cargando ? "Creando..." : destino === "nueva" ? "Crear campaña" : `Agregar ${seleccionados} anuncio${seleccionados === 1 ? "" : "s"}`}
            </button>
            <span style={{ fontSize: 12, color: C.faint }}>Nace en borrador — el cliente no la ve hasta que la publiques.</span>
            {error && <span style={{ fontSize: 12.5, color: "#B91C1C", fontWeight: 700 }}>{error.texto}</span>}
          </div>
        </>
      )}
    </div>
  );
}
