"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type DragEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ESTADO_BLOQUE_UI,
  ESTADO_ETAPA_UI,
  type Archivo,
  type ModoEtapa,
  type Proyecto,
  type ProyectoBloque,
  type ProyectoComentario,
  type ProyectoEscena,
  type ProyectoEtapa,
} from "@/lib/proyectos";

type Progreso = { total: number; aprobado: number; cambios: number; pendiente: number };
type EtapaListado = ProyectoEtapa & { progreso: Progreso };
type ProyectoListado = Proyecto & {
  escenas_count: number;
  proyecto_etapas: EtapaListado[];
};
type BloqueDetalle = ProyectoBloque & { proyecto_comentarios: ProyectoComentario[] };
type EtapaDetalle = ProyectoEtapa & { proyecto_bloques: BloqueDetalle[] };
type ProyectoDetalle = Proyecto & {
  proyecto_escenas: ProyectoEscena[];
  proyecto_etapas: EtapaDetalle[];
};
type Pendiente = {
  id: string;
  updated_at: string;
  proyecto: { id: string; titulo: string };
  etapa: Pick<ProyectoEtapa, "tipo" | "nombre">;
  escena: Pick<ProyectoEscena, "numero" | "titulo"> | null;
  ultimo_comentario: Pick<ProyectoComentario, "autor_nombre" | "contenido" | "created_at"> | null;
};
type EscenaGuion = {
  numero: number;
  titulo: string;
  locucion: string;
  en_pantalla: string;
};
type GuionAnalizado = {
  titulo: string;
  folio: string;
  formato: string;
  duracion: string;
  escenas: EscenaGuion[];
};

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#1883FF] focus:ring-2 focus:ring-[#1883FF]/10 disabled:bg-slate-100 disabled:text-slate-500";

async function mensajeError(response: Response, respaldo: string) {
  const data: unknown = await response.json().catch(() => null);
  if (data && typeof data === "object" && "error" in data) {
    const error = (data as Record<string, unknown>).error;
    if (typeof error === "string") return error;
  }
  return respaldo;
}

function idDeRespuesta(data: unknown): string | null {
  if (!data || typeof data !== "object" || !("id" in data)) return null;
  return typeof (data as Record<string, unknown>).id === "string"
    ? (data as Record<string, unknown>).id as string
    : null;
}

function textoContenido(contenido: Record<string, unknown>, campo: "locucion" | "en_pantalla") {
  return typeof contenido[campo] === "string" ? contenido[campo] : "";
}

function progresoDe(etapa: EtapaDetalle): Progreso {
  return etapa.proyecto_bloques.reduce<Progreso>((progreso, bloque) => ({
    total: progreso.total + 1,
    aprobado: progreso.aprobado + (bloque.estado === "aprobado" ? 1 : 0),
    cambios: progreso.cambios + (bloque.estado === "cambios" ? 1 : 0),
    pendiente: progreso.pendiente + (bloque.estado === "pendiente" ? 1 : 0),
  }), { total: 0, aprobado: 0, cambios: 0, pendiente: 0 });
}

function ModalBase({ children, onClose, ancho = "max-w-3xl" }: {
  children: ReactNode;
  onClose: () => void;
  ancho?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4" onMouseDown={onClose}>
      <div className={`max-h-[94vh] w-full ${ancho} overflow-y-auto rounded-2xl bg-white shadow-2xl`} onMouseDown={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function CampoModo({ tipo, value, onChange }: {
  tipo: "Arte" | "Video";
  value: ModoEtapa;
  onChange: (modo: ModoEtapa) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-[#042E7B]">Modo de {tipo}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as ModoEtapa)} className={inputClass}>
        <option value="por_escena">Por escena</option>
        <option value="entregable_unico">Entregable único</option>
      </select>
    </label>
  );
}

function ModalManual({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (id: string) => Promise<void>;
}) {
  const [titulo, setTitulo] = useState("");
  const [area, setArea] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [folio, setFolio] = useState("");
  const [numeroEscenas, setNumeroEscenas] = useState(1);
  const [arte, setArte] = useState<ModoEtapa>("por_escena");
  const [video, setVideo] = useState<ModoEtapa>("por_escena");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const crear = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGuardando(true);
    setError("");
    try {
      const response = await fetch("/api/admin/proyectos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: titulo.trim(),
          area: area.trim() || undefined,
          descripcion: descripcion.trim() || undefined,
          folio: folio.trim() || undefined,
          modos: { arte, video },
          escenas: Array.from({ length: numeroEscenas }, (_, index) => ({
            numero: index + 1,
            titulo: `Escena ${index + 1}`,
          })),
        }),
      });
      if (!response.ok) throw new Error(await mensajeError(response, "No se pudo crear el proyecto."));
      const id = idDeRespuesta(await response.json());
      if (!id) throw new Error("El proyecto se creó, pero la respuesta no incluyó su identificador.");
      await onCreated(id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo crear el proyecto.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ModalBase onClose={onClose} ancho="max-w-2xl">
      <form onSubmit={crear}>
        <ModalHeader titulo="Nuevo proyecto" subtitulo="Configura las escenas y el flujo inicial." onClose={onClose} />
        <div className="grid gap-4 p-6 sm:grid-cols-2">
          <label className="block sm:col-span-2"><Etiqueta texto="Título *" /><input required value={titulo} onChange={(event) => setTitulo(event.target.value)} className={inputClass} /></label>
          <label className="block"><Etiqueta texto="Folio" /><input value={folio} onChange={(event) => setFolio(event.target.value)} className={inputClass} /></label>
          <label className="block"><Etiqueta texto="Área" /><input value={area} onChange={(event) => setArea(event.target.value)} className={inputClass} /></label>
          <label className="block sm:col-span-2"><Etiqueta texto="Descripción" /><textarea value={descripcion} onChange={(event) => setDescripcion(event.target.value)} rows={3} className={inputClass} /></label>
          <label className="block"><Etiqueta texto="Número de escenas" /><input type="number" min={1} max={20} value={numeroEscenas} onChange={(event) => setNumeroEscenas(Math.min(20, Math.max(1, Number(event.target.value) || 1)))} className={inputClass} /></label>
          <div className="hidden sm:block" />
          <CampoModo tipo="Arte" value={arte} onChange={setArte} />
          <CampoModo tipo="Video" value={video} onChange={setVideo} />
          {error && <p className="sm:col-span-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
        </div>
        <ModalFooter onClose={onClose} disabled={guardando || !titulo.trim()} texto={guardando ? "Creando…" : "Crear proyecto"} />
      </form>
    </ModalBase>
  );
}

function Etiqueta({ texto }: { texto: string }) {
  return <span className="mb-1.5 block text-xs font-bold text-[#042E7B]">{texto}</span>;
}

function ModalHeader({ titulo, subtitulo, onClose }: { titulo: string; subtitulo?: string; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
      <div><h2 className="text-xl font-black text-[#042E7B]">{titulo}</h2>{subtitulo && <p className="mt-1 text-xs text-slate-500">{subtitulo}</p>}</div>
      <button type="button" onClick={onClose} className="cursor-pointer text-2xl leading-none text-slate-400 hover:text-slate-700" aria-label="Cerrar">×</button>
    </div>
  );
}

function ModalFooter({ onClose, disabled, texto }: { onClose: () => void; disabled: boolean; texto: string }) {
  return (
    <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
      <button type="button" onClick={onClose} className="cursor-pointer rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100">Cancelar</button>
      <button type="submit" disabled={disabled} className="cursor-pointer rounded-xl bg-[#FFCC00] px-5 py-2.5 text-sm font-black text-[#042E7B] disabled:cursor-not-allowed disabled:opacity-50">{texto}</button>
    </div>
  );
}

function leerBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("No se pudo leer el PDF."));
    reader.onerror = () => reject(new Error("No se pudo leer el PDF."));
    reader.readAsDataURL(file);
  });
}

function esGuionAnalizado(data: unknown): data is GuionAnalizado {
  if (!data || typeof data !== "object") return false;
  const valor = data as Record<string, unknown>;
  return typeof valor.titulo === "string" && typeof valor.folio === "string" &&
    typeof valor.formato === "string" && typeof valor.duracion === "string" &&
    Array.isArray(valor.escenas) && valor.escenas.every((escena) => {
      if (!escena || typeof escena !== "object") return false;
      const item = escena as Record<string, unknown>;
      return typeof item.numero === "number" && typeof item.titulo === "string" &&
        typeof item.locucion === "string" && typeof item.en_pantalla === "string";
    });
}

function ModalImportador({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (id: string) => Promise<void>;
}) {
  const [texto, setTexto] = useState("");
  const [pdf, setPdf] = useState<File | null>(null);
  const [analizado, setAnalizado] = useState<GuionAnalizado | null>(null);
  const [arte, setArte] = useState<ModoEtapa>("por_escena");
  const [video, setVideo] = useState<ModoEtapa>("por_escena");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [arrastrando, setArrastrando] = useState(false);

  const soltarArchivo = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setArrastrando(false);
    const file = event.dataTransfer.files[0];
    if (!file) return;

    const nombre = file.name.toLowerCase();
    if (file.type === "application/pdf" || nombre.endsWith(".pdf")) {
      setError("");
      setPdf(file);
      return;
    }
    if (
      file.type.startsWith("text/") ||
      [".txt", ".md", ".markdown", ".html", ".rtf"].some((extension) => nombre.endsWith(extension))
    ) {
      setError("");
      setTexto(await file.text());
      return;
    }
    setError("Formato no soportado. Sube un PDF o pega/arrastra texto.");
  };

  const analizar = async () => {
    if (!pdf && !texto.trim()) return;
    setProcesando(true);
    setError("");
    try {
      const pdfBase64 = pdf ? await leerBase64(pdf) : undefined;
      const response = await fetch("/api/admin/proyectos/importar-guion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "analizar", texto: texto.trim() || undefined, pdfBase64 }),
      });
      if (!response.ok) throw new Error(await mensajeError(response, "No se pudo analizar el guion."));
      const data: unknown = await response.json();
      if (!esGuionAnalizado(data)) throw new Error("El análisis no devolvió un guion válido.");
      setAnalizado(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo analizar el guion.");
    } finally {
      setProcesando(false);
    }
  };

  const crear = async () => {
    if (!analizado) return;
    setProcesando(true);
    setError("");
    try {
      const response = await fetch("/api/admin/proyectos/importar-guion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "crear", datosParsed: analizado, modos: { arte, video } }),
      });
      if (!response.ok) throw new Error(await mensajeError(response, "No se pudo crear el proyecto."));
      const id = idDeRespuesta(await response.json());
      if (!id) throw new Error("El proyecto se creó, pero la respuesta no incluyó su identificador.");
      await onCreated(id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo crear el proyecto.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <ModalBase onClose={onClose} ancho="max-w-4xl">
      <ModalHeader titulo="Importar guion" subtitulo={analizado ? "Paso 2 de 2 · Revisa las escenas" : "Paso 1 de 2 · Carga el contenido"} onClose={onClose} />
      {!analizado ? (
        <div className="space-y-5 p-6">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setArrastrando(true);
            }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={(event) => void soltarArchivo(event)}
            className={`space-y-5 rounded-2xl border-2 border-dashed p-2 transition-colors ${
              arrastrando ? "border-[#1883FF] bg-blue-50" : "border-transparent"
            }`}
          >
            {arrastrando && <p className="text-center text-sm font-black text-[#1883FF]">Suelta el archivo aquí</p>}
            <label className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-[#1883FF]/30 bg-blue-50/40 px-5 py-8 text-center hover:border-[#1883FF]">
              <span className="text-3xl">📄</span><span className="mt-2 text-sm font-black text-[#042E7B]">{pdf?.name ?? "Seleccionar PDF"}</span>
              <span className="mt-1 text-xs text-slate-500">El archivo se procesa de forma segura.</span>
              <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => setPdf(event.target.files?.[0] ?? null)} />
            </label>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-400"><span className="h-px flex-1 bg-slate-200" />O PEGA EL TEXTO<span className="h-px flex-1 bg-slate-200" /></div>
            <textarea value={texto} onChange={(event) => setTexto(event.target.value)} rows={9} placeholder="Pega aquí el guion con sus escenas…" className={inputClass} />
          </div>
          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
          <div className="flex justify-end"><button type="button" onClick={() => void analizar()} disabled={procesando || (!pdf && !texto.trim())} className="cursor-pointer rounded-xl bg-[#FFCC00] px-5 py-2.5 text-sm font-black text-[#042E7B] disabled:opacity-50">{procesando ? "Analizando…" : "Analizar"}</button></div>
        </div>
      ) : (
        <div className="space-y-6 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label><Etiqueta texto="Título detectado" /><input value={analizado.titulo} onChange={(event) => setAnalizado({ ...analizado, titulo: event.target.value })} className={inputClass} /></label>
            <label><Etiqueta texto="Folio detectado" /><input value={analizado.folio} onChange={(event) => setAnalizado({ ...analizado, folio: event.target.value })} className={inputClass} /></label>
            <CampoModo tipo="Arte" value={arte} onChange={setArte} />
            <CampoModo tipo="Video" value={video} onChange={setVideo} />
          </div>
          <div>
            <h3 className="mb-3 text-sm font-black text-[#042E7B]">{analizado.escenas.length} escenas detectadas</h3>
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {analizado.escenas.map((escena, index) => <div key={`${escena.numero}-${index}`} className="rounded-xl border border-slate-200 p-3"><p className="text-sm font-black text-[#042E7B]">Escena {escena.numero} · {escena.titulo}</p><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{escena.locucion || "Sin locución"}</p></div>)}
            </div>
          </div>
          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
          <div className="flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-4"><button type="button" onClick={() => setAnalizado(null)} className="cursor-pointer rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100">← Volver</button><button type="button" onClick={() => void crear()} disabled={procesando || !analizado.titulo.trim()} className="cursor-pointer rounded-xl bg-[#FFCC00] px-5 py-2.5 text-sm font-black text-[#042E7B] disabled:opacity-50">{procesando ? "Creando…" : "Crear proyecto"}</button></div>
        </div>
      )}
    </ModalBase>
  );
}

function VistaArchivo({ archivo }: { archivo: Archivo }) {
  if (archivo.tipo.startsWith("image/")) return (
    // El proyecto requiere <img> para previsualizaciones de archivos subidos.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={archivo.url} alt={archivo.nombre} className="h-24 w-28 rounded-lg object-cover" />
  );
  if (archivo.tipo.startsWith("video/")) return <video src={archivo.url} controls className="h-24 w-36 rounded-lg bg-slate-950" />;
  return <a href={archivo.url} target="_blank" rel="noreferrer" className="max-w-48 truncate text-xs font-bold text-[#1883FF] hover:underline">{archivo.nombre}</a>;
}

function TarjetaBloque({ bloque, etapa, escena, proyectoId, soloLectura, onSaved }: {
  bloque: BloqueDetalle;
  etapa: EtapaDetalle;
  escena: ProyectoEscena | null;
  proyectoId: string;
  soloLectura: boolean;
  onSaved: () => Promise<void>;
}) {
  const [locucion, setLocucion] = useState(() => textoContenido(bloque.contenido, "locucion"));
  const [enPantalla, setEnPantalla] = useState(() => textoContenido(bloque.contenido, "en_pantalla"));
  const [nota, setNota] = useState(bloque.nota ?? "");
  const [archivos, setArchivos] = useState<Archivo[]>(bloque.archivos);
  const [accion, setAccion] = useState<"guardar" | "avisar" | "subir" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setLocucion(textoContenido(bloque.contenido, "locucion"));
    setEnPantalla(textoContenido(bloque.contenido, "en_pantalla"));
    setNota(bloque.nota ?? "");
    setArchivos(bloque.archivos);
    setError("");
  }, [bloque]);

  const subir = async (files: FileList | null) => {
    if (!files?.length) return;
    setAccion("subir");
    setError("");
    try {
      const nuevos: Archivo[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/admin/social/upload", { method: "POST", body: formData });
        if (!response.ok) throw new Error(await mensajeError(response, `No se pudo subir ${file.name}.`));
        const data: unknown = await response.json();
        const url = data && typeof data === "object" && "url" in data && typeof (data as Record<string, unknown>).url === "string" ? (data as Record<string, unknown>).url as string : null;
        if (!url) throw new Error(`La carga de ${file.name} no devolvió una URL.`);
        nuevos.push({ url, nombre: file.name, tipo: file.type, peso: file.size });
      }
      setArchivos((actuales) => [...actuales, ...nuevos]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron subir los archivos.");
    } finally {
      setAccion(null);
    }
  };

  const guardar = async (avisar: boolean) => {
    setAccion(avisar ? "avisar" : "guardar");
    setError("");
    try {
      const contenido = etapa.tipo === "guion" ? { ...bloque.contenido, locucion, en_pantalla: enPantalla } : bloque.contenido;
      const response = await fetch(`/api/admin/proyectos/${proyectoId}/bloques/${bloque.id}${avisar ? "/versions" : ""}`, {
        method: avisar ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido, nota: nota || null, archivos }),
      });
      if (!response.ok) throw new Error(await mensajeError(response, "No se pudo guardar el bloque."));
      await onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar el bloque.");
    } finally {
      setAccion(null);
    }
  };

  const ui = ESTADO_BLOQUE_UI[bloque.estado];
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div><h4 className="font-black text-[#042E7B]">{escena ? `Escena ${escena.numero} · ${escena.titulo}` : "Entregable único"}</h4><p className="mt-0.5 text-[10px] font-bold text-slate-400">Versión {bloque.version_num}</p></div>
        <span className="rounded-full border px-2.5 py-1 text-[10px] font-extrabold" style={{ color: ui.color, backgroundColor: ui.colorSuave, borderColor: ui.color }}>{ui.label}</span>
      </div>
      {etapa.tipo === "guion" ? <div className="grid gap-4 lg:grid-cols-2"><label><Etiqueta texto="Locución" /><textarea disabled={soloLectura} value={locucion} onChange={(event) => setLocucion(event.target.value)} rows={7} className={inputClass} /></label><label><Etiqueta texto="En pantalla" /><textarea disabled={soloLectura} value={enPantalla} onChange={(event) => setEnPantalla(event.target.value)} rows={7} className={inputClass} /></label></div> : <label><Etiqueta texto={etapa.tipo === "arte" ? "Nota / brief" : "Nota"} /><textarea disabled={soloLectura} value={nota} onChange={(event) => setNota(event.target.value)} rows={5} className={inputClass} /></label>}
      {etapa.tipo !== "guion" && <div className="mt-5"><div className="mb-2 flex items-center justify-between gap-2"><h5 className="text-xs font-black uppercase tracking-wider text-[#042E7B]">Archivos</h5>{!soloLectura && <label className="cursor-pointer rounded-lg border border-[#1883FF]/30 bg-white px-3 py-2 text-xs font-bold text-[#1883FF] hover:bg-blue-50">{accion === "subir" ? "Subiendo…" : "+ Subir"}<input type="file" multiple disabled={accion !== null} className="hidden" onChange={(event) => { void subir(event.target.files); event.currentTarget.value = ""; }} /></label>}</div>{archivos.length ? <div className="flex flex-wrap gap-3">{archivos.map((archivo, index) => <div key={`${archivo.url}-${index}`} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2"><VistaArchivo archivo={archivo} />{!soloLectura && <button type="button" onClick={() => setArchivos((actuales) => actuales.filter((_, itemIndex) => itemIndex !== index))} className="cursor-pointer px-1 text-lg text-red-500" aria-label={`Quitar ${archivo.nombre}`}>×</button>}</div>)}</div> : <p className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center text-xs text-slate-400">Sin archivos.</p>}</div>}
      <div className="mt-5"><h5 className="mb-2 text-xs font-black uppercase tracking-wider text-[#042E7B]">Comentarios</h5>{bloque.proyecto_comentarios.length ? <ul className="space-y-2">{bloque.proyecto_comentarios.map((comentario) => <li key={comentario.id} className="rounded-xl border border-slate-200 bg-white p-3"><div className="flex flex-wrap gap-2 text-[10px]"><strong className="text-[#042E7B]">{comentario.autor_nombre}</strong><span className="capitalize text-slate-400">{comentario.autor_rol}</span><time className="text-slate-400">{new Date(comentario.created_at).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}</time></div><p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{comentario.contenido}</p></li>)}</ul> : <p className="text-xs text-slate-400">Sin comentarios.</p>}</div>
      {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
      {!soloLectura && <div className="mt-5 flex flex-col justify-end gap-2 sm:flex-row">{bloque.estado !== "aprobado" && <button type="button" onClick={() => void guardar(false)} disabled={accion !== null} className="cursor-pointer rounded-xl border border-[#1883FF] bg-white px-4 py-2.5 text-sm font-black text-[#1883FF] disabled:opacity-50">{accion === "guardar" ? "Guardando…" : "Guardar"}</button>}<button type="button" onClick={() => void guardar(true)} disabled={accion !== null} className="cursor-pointer rounded-xl bg-[#FFCC00] px-4 py-2.5 text-sm font-black text-[#042E7B] disabled:opacity-50">{accion === "avisar" ? "Guardando y avisando…" : "📨 Guardar y avisar"}</button></div>}
    </article>
  );
}

function ModalDetalle({ proyectoId, onClose }: { proyectoId: string; onClose: () => void }) {
  const [proyecto, setProyecto] = useState<ProyectoDetalle | null>(null);
  const [etapaId, setEtapaId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState("");

  const cargar = useCallback(async (mantener?: string | null) => {
    setCargando(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/proyectos/${proyectoId}`);
      if (!response.ok) throw new Error(await mensajeError(response, "No se pudo cargar el proyecto."));
      const data = (await response.json()) as ProyectoDetalle;
      setProyecto(data);
      setEtapaId(data.proyecto_etapas.find(({ id }) => id === mantener)?.id ?? data.proyecto_etapas[0]?.id ?? null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cargar el proyecto.");
    } finally {
      setCargando(false);
    }
  }, [proyectoId]);

  useEffect(() => { void cargar(); }, [cargar]);
  const etapa = proyecto?.proyecto_etapas.find(({ id }) => id === etapaId) ?? null;
  const escenasPorId = useMemo(() => new Map((proyecto?.proyecto_escenas ?? []).map((escena) => [escena.id, escena])), [proyecto]);
  const bloques = useMemo(() => {
    if (!etapa) return [];
    const orden = new Map((proyecto?.proyecto_escenas ?? []).map((escena, index) => [escena.id, index]));
    return [...etapa.proyecto_bloques].sort((a, b) => (a.escena_id ? orden.get(a.escena_id) ?? 999 : -1) - (b.escena_id ? orden.get(b.escena_id) ?? 999 : -1));
  }, [etapa, proyecto]);

  const publicar = async () => {
    if (!proyecto) return;
    setActualizando(true); setError("");
    try {
      const response = await fetch(`/api/admin/proyectos/${proyecto.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicado: !proyecto.publicado }) });
      if (!response.ok) throw new Error(await mensajeError(response, "No se pudo actualizar la publicación."));
      await cargar(etapaId);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo actualizar la publicación."); }
    finally { setActualizando(false); }
  };
  const eliminar = async () => {
    if (!proyecto || !confirm(`¿Eliminar el proyecto “${proyecto.titulo}”? Esta acción no se puede deshacer.`)) return;
    setActualizando(true); setError("");
    try {
      const response = await fetch(`/api/admin/proyectos/${proyecto.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await mensajeError(response, "No se pudo eliminar el proyecto."));
      onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo eliminar el proyecto."); setActualizando(false); }
  };

  return (
    <ModalBase onClose={onClose} ancho="max-w-6xl">
      {cargando && !proyecto ? <div className="flex min-h-72 items-center justify-center"><Spinner /></div> : <>
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-black text-[#042E7B]">{proyecto?.titulo ?? "Proyecto"}</h2>{proyecto?.folio && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">{proyecto.folio}</span>}{proyecto && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold capitalize text-[#1883FF]">{proyecto.estado}</span>}</div>{proyecto?.area && <p className="mt-1 text-sm text-slate-500">{proyecto.area}</p>}</div><div className="flex shrink-0 flex-wrap gap-2">{proyecto && <button type="button" onClick={() => void publicar()} disabled={actualizando} className="cursor-pointer rounded-xl bg-[#1883FF] px-3.5 py-2 text-xs font-black text-white disabled:opacity-50">{proyecto.publicado ? "Ocultar" : "📤 Publicar al cliente"}</button>}<button type="button" onClick={() => void eliminar()} disabled={actualizando || !proyecto} className="cursor-pointer rounded-xl border border-red-200 px-3.5 py-2 text-xs font-bold text-red-600 disabled:opacity-50">Eliminar</button><button type="button" onClick={onClose} className="cursor-pointer px-1 text-2xl text-slate-400" aria-label="Cerrar">×</button></div></div>
        <div className="p-6">{error && <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}{proyecto && <div className="mb-6 flex gap-2 overflow-x-auto pb-1">{proyecto.proyecto_etapas.map((item) => { const ui = ESTADO_ETAPA_UI[item.estado]; const progreso = progresoDe(item); return <button key={item.id} type="button" onClick={() => setEtapaId(item.id)} className={`cursor-pointer whitespace-nowrap rounded-xl border px-3 py-2 text-left transition ${item.estado === "bloqueada" ? "opacity-55" : ""}`} style={{ color: ui.color, backgroundColor: ui.colorSuave, borderColor: item.id === etapaId ? ui.color : `${ui.color}44` }}><span className="block text-xs font-black">{item.estado === "bloqueada" ? "🔒 " : ""}{item.nombre}</span><span className="text-[10px] font-bold">{progreso.total > 0 ? `${progreso.aprobado}/${progreso.total}` : ui.label}</span></button>; })}</div>}{etapa && <section><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-lg font-black text-[#042E7B]">{etapa.nombre}</h3><p className="text-xs text-slate-500">{etapa.modo === "por_escena" ? "Un entregable por escena" : "Un entregable para toda la etapa"}{etapa.estado === "bloqueada" ? " · Solo lectura" : ""}</p></div></div><div className="space-y-4">{bloques.map((bloque) => <TarjetaBloque key={bloque.id} bloque={bloque} etapa={etapa} escena={bloque.escena_id ? escenasPorId.get(bloque.escena_id) ?? null : null} proyectoId={proyectoId} soloLectura={etapa.estado === "bloqueada"} onSaved={() => cargar(etapa.id)} />)}{bloques.length === 0 && <p className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">Esta etapa no tiene bloques activos.</p>}</div></section>}</div>
      </>}
    </ModalBase>
  );
}

function Spinner() { return <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1883FF] border-t-transparent" />; }

export default function ProyectosPage() {
  const [proyectos, setProyectos] = useState<ProyectoListado[]>([]);
  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [bandejaAbierta, setBandejaAbierta] = useState(true);
  const [modal, setModal] = useState<"manual" | "importar" | null>(null);
  const [proyectoAbierto, setProyectoAbierto] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true); setError("");
    try {
      const [proyectosResponse, pendientesResponse] = await Promise.all([fetch("/api/admin/proyectos"), fetch("/api/admin/proyectos/pendientes")]);
      if (!proyectosResponse.ok) throw new Error(await mensajeError(proyectosResponse, "No se pudieron cargar los proyectos."));
      if (!pendientesResponse.ok) throw new Error(await mensajeError(pendientesResponse, "No se pudo cargar la bandeja de pendientes."));
      const [lista, bandeja] = await Promise.all([proyectosResponse.json() as Promise<ProyectoListado[]>, pendientesResponse.json() as Promise<Pendiente[]>]);
      setProyectos(lista); setPendientes(bandeja);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo cargar el Centro de Proyectos."); }
    finally { setCargando(false); }
  }, []);
  useEffect(() => { void cargar(); }, [cargar]);
  const creado = async (id: string) => { setModal(null); await cargar(); setProyectoAbierto(id); };
  const cerrarDetalle = () => { setProyectoAbierto(null); void cargar(); };

  return (
    <div className="min-h-full bg-[#F8FAFC] p-6 lg:p-8"><div className="mx-auto max-w-7xl">
      <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-black tracking-tight text-[#042E7B] sm:text-3xl">Centro de Proyectos</h1><p className="mt-1.5 text-sm text-slate-500">Gestiona guion, arte y video con aprobación granular por escena.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setModal("importar")} className="cursor-pointer rounded-xl border border-[#1883FF]/25 bg-white px-4 py-2.5 text-sm font-black text-[#1883FF] hover:bg-blue-50">📥 Importar guion</button><button type="button" onClick={() => setModal("manual")} className="cursor-pointer rounded-xl bg-[#FFCC00] px-4 py-2.5 text-sm font-black text-[#042E7B]">+ Nuevo proyecto</button></div></header>
      {error && <p className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
      {!cargando && <section className="mb-7 overflow-hidden rounded-2xl border border-red-100 bg-white shadow-sm"><button type="button" onClick={() => setBandejaAbierta((abierta) => !abierta)} className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left"><span className="font-black text-[#042E7B]">🔴 Por corregir <span className="ml-1 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">{pendientes.length}</span></span><span className="text-sm text-slate-400">{bandejaAbierta ? "Ocultar" : "Mostrar"}</span></button>{bandejaAbierta && (pendientes.length ? <div className="divide-y divide-slate-100 border-t border-slate-100">{pendientes.map((pendiente) => <button key={pendiente.id} type="button" onClick={() => setProyectoAbierto(pendiente.proyecto.id)} className="block w-full cursor-pointer px-5 py-4 text-left hover:bg-red-50/40"><p className="text-sm font-black text-[#042E7B]">{pendiente.proyecto.titulo} <span className="font-semibold text-slate-400">· {pendiente.etapa.nombre} · {pendiente.escena ? `Escena ${pendiente.escena.numero}: ${pendiente.escena.titulo}` : "Entregable único"}</span></p>{pendiente.ultimo_comentario ? <p className="mt-1 line-clamp-2 text-sm text-slate-600"><strong>{pendiente.ultimo_comentario.autor_nombre}:</strong> {pendiente.ultimo_comentario.contenido}</p> : <p className="mt-1 text-xs italic text-slate-400">Sin comentario asociado.</p>}</button>)}</div> : <p className="border-t border-slate-100 px-5 py-4 text-sm font-semibold text-emerald-700">Sin cambios pendientes ✔</p>)}</section>}
      {cargando ? <div className="flex min-h-64 items-center justify-center"><Spinner /></div> : proyectos.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><div className="text-3xl">🎬</div><h2 className="mt-3 font-black text-[#042E7B]">Aún no hay proyectos</h2><p className="mt-1 text-sm text-slate-500">Crea uno manualmente o importa un guion.</p></div> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{proyectos.map((proyecto) => <button key={proyecto.id} type="button" onClick={() => setProyectoAbierto(proyecto.id)} className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#1883FF]/40 hover:shadow-md"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-black text-[#042E7B] group-hover:text-[#1883FF]">{proyecto.titulo}</h2>{proyecto.folio && <p className="mt-1 text-xs font-bold text-slate-400">{proyecto.folio}</p>}{proyecto.area && <p className="mt-1 truncate text-xs font-semibold text-slate-500">{proyecto.area}</p>}</div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${proyecto.publicado ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{proyecto.publicado ? "Publicado" : "Borrador"}</span></div><div className="my-5 flex flex-wrap gap-2">{proyecto.proyecto_etapas.map((etapa) => { const ui = ESTADO_ETAPA_UI[etapa.estado]; return <span key={etapa.id} className="rounded-full border px-2.5 py-1 text-[10px] font-extrabold" style={{ color: ui.color, backgroundColor: ui.colorSuave, borderColor: ui.color }}>{etapa.nombre}{etapa.progreso.total > 0 ? ` ${etapa.progreso.aprobado}/${etapa.progreso.total}` : ""}</span>; })}</div><div className="flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-xs text-slate-400">{proyecto.escenas_count} {proyecto.escenas_count === 1 ? "escena" : "escenas"}</span><span className="text-xs font-bold text-[#1883FF]">Ver detalle →</span></div></button>)}</div>}
    </div>{modal === "manual" && <ModalManual onClose={() => setModal(null)} onCreated={creado} />}{modal === "importar" && <ModalImportador onClose={() => setModal(null)} onCreated={creado} />}{proyectoAbierto && <ModalDetalle proyectoId={proyectoAbierto} onClose={cerrarDetalle} />}</div>
  );
}
