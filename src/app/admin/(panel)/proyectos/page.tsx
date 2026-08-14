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
  tieneEntregable,
  type Archivo,
  type Espacio,
  type EspacioArchivo,
  type EspacioCarpeta,
  type EspacioComentario,
  type ModoEtapa,
  type Proyecto,
  type ProyectoBloque,
  type ProyectoComentario,
  type ProyectoEscena,
  type ProyectoEtapa,
  type TipoEspacio,
} from "@/lib/proyectos";
import TableroAdmin from "@/components/admin/TableroAdmin";
import { IconUI } from "@/components/ui/IconUI";
import { supabase } from "@/lib/supabase";
import { fetchAdmin } from "@/lib/admin-fetch";


type Progreso = { total: number; aprobado: number; cambios: number; pendiente: number; conMaterial?: number };
type EtapaListado = ProyectoEtapa & { progreso: Progreso };
type ProyectoListado = Proyecto & {
  escenas_count: number;
  proyecto_etapas: EtapaListado[];
};
type EspacioListado = Espacio & {
  proyectos_count: number;
  archivos_count: number;
  tarjetas_count: number;
};
type InvitacionCuestionario = {
  token: string;
  invitado_nombre: string;
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
type AccesoProyectos = {
  esAdmin: boolean;
  proyectos: string[];
  /** Con quién se firma la entrega interna. */
  nombre: string;
};

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#1883FF] focus:ring-2 focus:ring-[#1883FF]/10 disabled:bg-slate-100 disabled:text-slate-500";

type IconoLineaNombre =
  | "carpeta"
  | "carpeta-mas"
  | "documento"
  | "subir"
  | "bloqueo"
  | "enviar";

function IconoLinea({ nombre, className = "h-5 w-5" }: {
  nombre: IconoLineaNombre;
  className?: string;
}) {
  const paths: Record<IconoLineaNombre, string> = {
    carpeta: "M3.75 6.75h5.086a1.5 1.5 0 011.06.44l1.414 1.414a1.5 1.5 0 001.061.25h7.879v8.625a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V6.75z",
    "carpeta-mas": "M12 13.5v4.5m2.25-2.25h-4.5M3.75 6.75h5.086a1.5 1.5 0 011.06.44l1.414 1.414a1.5 1.5 0 001.061.25h7.879v8.625a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V6.75z",
    documento: "M14.25 3.75H6.75a1.5 1.5 0 00-1.5 1.5v13.5a1.5 1.5 0 001.5 1.5h10.5a1.5 1.5 0 001.5-1.5V8.25m-4.5-4.5l4.5 4.5m-4.5-4.5v4.5h4.5M8.25 13.5h7.5m-7.5 3h5.25",
    subir: "M12 16.5V6m0 0L8.25 9.75M12 6l3.75 3.75M6 18.75h12a2.25 2.25 0 002.25-2.25v-1.125M3.75 15.375V16.5A2.25 2.25 0 006 18.75",
    bloqueo: "M16.5 10.5V7.875a4.5 4.5 0 00-9 0V10.5m-.75 0h10.5a1.5 1.5 0 011.5 1.5v7.5a1.5 1.5 0 01-1.5 1.5H6.75a1.5 1.5 0 01-1.5-1.5V12a1.5 1.5 0 011.5-1.5z",
    enviar: "M6 12 3.27 3.125A59.769 59.769 0 0121.485 12 59.768 59.768 0 013.27 20.875L5.999 12zm0 0h7.5",
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={paths[nombre]} />
    </svg>
  );
}

function IconoEspacio({ tipo, className = "h-6 w-6" }: {
  tipo: TipoEspacio;
  className?: string;
}) {
  const paths: Record<TipoEspacio, string> = {
    aprobacion: "M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z",
    archivos: "M2.25 12.75V12a2.25 2.25 0 012.25-2.25h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.06-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z",
    tablero: "M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z",
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={paths[tipo]} />
    </svg>
  );
}

function MosaicoEspacio({ tipo, grande = false }: { tipo: TipoEspacio; grande?: boolean }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-xl bg-[#EAF2FF] text-[#042E7B] ${grande ? "h-12 w-12" : "h-[46px] w-[46px]"}`}>
      <IconoEspacio tipo={tipo} className={grande ? "h-7 w-7" : "h-6 w-6"} />
    </span>
  );
}

function PuntoEstado({ color }: { color: string }) {
  return <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />;
}

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
    // Escenas que ya tienen algo entregado, aunque nadie las haya aprobado
    conMaterial: (progreso.conMaterial ?? 0) + (tieneEntregable(bloque, etapa.tipo) ? 1 : 0),
  }), { total: 0, aprobado: 0, cambios: 0, pendiente: 0, conMaterial: 0 });
}

/** Desglose en palabras de cómo va una etapa, para el encabezado. */
function resumenEtapa(progreso: Progreso): string {
  const material = progreso.conMaterial ?? 0;
  const vacias = progreso.total - material;
  const partes = [`${progreso.total} escena${progreso.total === 1 ? "" : "s"}`];
  if (material > 0) partes.push(`${material} con material`);
  if (progreso.aprobado > 0) partes.push(`${progreso.aprobado} aprobada${progreso.aprobado === 1 ? "" : "s"}`);
  if (progreso.cambios > 0) partes.push(`${progreso.cambios} con cambios pedidos`);
  if (vacias > 0) partes.push(`${vacias} sin empezar`);
  return partes.join(" · ");
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
      const response = await fetchAdmin("/api/admin/proyectos", {
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

function ModalHeader({ titulo, subtitulo, onClose, icono }: { titulo: string; subtitulo?: string; onClose: () => void; icono?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
      <div className="flex min-w-0 items-center gap-3">
        {icono}
        <div><h2 className="text-xl font-black text-[#042E7B]">{titulo}</h2>{subtitulo && <p className="mt-1 text-xs text-slate-500">{subtitulo}</p>}</div>
      </div>
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
      const response = await fetchAdmin("/api/admin/proyectos/importar-guion", {
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
      const response = await fetchAdmin("/api/admin/proyectos/importar-guion", {
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
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF2FF] text-[#042E7B]"><IconoLinea nombre="documento" className="h-6 w-6" /></span>
              <span className="mt-2 text-sm font-black text-[#042E7B]">{pdf?.name ?? "Seleccionar PDF"}</span>
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

function TarjetaBloque({ bloque, etapa, escena, proyectoId, soloLectura, esAdmin, autorNombre, onSaved }: {
  bloque: BloqueDetalle;
  etapa: EtapaDetalle;
  escena: ProyectoEscena | null;
  proyectoId: string;
  soloLectura: boolean;
  /** El admin manda al cliente; un colaborador solo entrega para revisión interna. */
  esAdmin: boolean;
  autorNombre: string;
  onSaved: () => Promise<void>;
}) {
  const [locucion, setLocucion] = useState(() => textoContenido(bloque.contenido, "locucion"));
  const [enPantalla, setEnPantalla] = useState(() => textoContenido(bloque.contenido, "en_pantalla"));
  const [nota, setNota] = useState(bloque.nota ?? "");
  const [archivos, setArchivos] = useState<Archivo[]>(bloque.archivos);
  const [accion, setAccion] = useState<"guardar" | "avisar" | "subir" | "decidir" | "comentar" | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [error, setError] = useState("");
  const [comentario, setComentario] = useState("");
  const [pidiendoCambios, setPidiendoCambios] = useState(false);
  const [motivoCambios, setMotivoCambios] = useState("");

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
        const response = await fetchAdmin("/api/admin/social/upload", { method: "POST", body: formData });
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
      const response = await fetchAdmin(`/api/admin/proyectos/${proyectoId}/bloques/${bloque.id}${avisar ? "/versions" : ""}`, {
        method: avisar ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contenido,
          nota: nota || null,
          archivos,
          // El admin libera al cliente; el colaborador entrega para revisión interna
          destino: esAdmin ? "cliente" : "interno",
          autor_nombre: autorNombre,
        }),
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
  const entregado = bloque.entrega_estado === "entregado";
  // El arte lo aprueba Kyoszen. Un colaborador entrega, pero no aprueba lo suyo.
  const puedoAprobar = esAdmin && etapa.aprobador === "admin" && !soloLectura;
  const listoParaAprobar = tieneEntregable({ contenido: bloque.contenido, archivos }, etapa.tipo);
  // Si ya hay comentarios en la escena, pedir cambios no obliga a repetirlos
  const yaHayComentarios = bloque.proyecto_comentarios.length > 0;

  const decidir = async (nuevo: "aprobado" | "cambios", motivo?: string) => {
    setAccion("decidir");
    setError("");
    try {
      const response = await fetchAdmin(`/api/admin/proyectos/${proyectoId}/bloques/${bloque.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevo, comentario: motivo }),
      });
      if (!response.ok) throw new Error(await mensajeError(response, "No se pudo actualizar la escena."));
      setPidiendoCambios(false);
      setMotivoCambios("");
      await onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo actualizar la escena.");
    } finally {
      setAccion(null);
    }
  };

  const comentar = async () => {
    const contenido = comentario.trim();
    if (!contenido) return;
    setAccion("comentar");
    setError("");
    try {
      const response = await fetchAdmin(`/api/admin/proyectos/${proyectoId}/bloques/${bloque.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido, autor_nombre: autorNombre }),
      });
      if (!response.ok) throw new Error(await mensajeError(response, "No se pudo enviar el comentario."));
      setComentario("");
      await onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo enviar el comentario.");
    } finally {
      setAccion(null);
    }
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div><h4 className="font-black text-[#042E7B]">{escena ? `Escena ${escena.numero} · ${escena.titulo}` : "Entregable único"}</h4><p className="mt-0.5 text-[10px] font-bold text-slate-400">Versión {bloque.version_num}</p></div>
        <div className="flex flex-wrap items-center gap-2">
          {!esAdmin && bloque.estado === "cambios" && (
            <span className="flex items-center gap-1.5 rounded-full border border-[#FECACA] bg-[#FEF2F2] px-2.5 py-1 text-[10px] font-extrabold text-[#B91C1C]">
              <PuntoEstado color="#EF4444" />Te pidieron cambios · lee el comentario
            </span>
          )}
          {(esAdmin || bloque.estado !== "cambios") && entregado && (
            <span className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-extrabold text-amber-700">
              <PuntoEstado color="#D97706" />
              {esAdmin
                ? `${bloque.entrega_nombre ?? "Un colaborador"} entregó · por revisar`
                : "Enviado a revisión · el cliente aún no lo ve"}
            </span>
          )}
          {(esAdmin || bloque.estado !== "cambios") && !entregado && !bloque.visible_cliente && (
            <span className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-extrabold text-slate-500">
              <PuntoEstado color="#94A3B8" />Borrador · el cliente no lo ve
            </span>
          )}
          {(esAdmin || (!entregado && bloque.estado !== "cambios")) && (
            <span className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-extrabold" style={{ color: ui.color }}><PuntoEstado color={ui.color} />{ui.label}</span>
          )}
        </div>
      </div>
      {etapa.tipo === "guion" ? <div className="grid gap-4 lg:grid-cols-2"><label><Etiqueta texto="Locución" /><textarea disabled={soloLectura} value={locucion} onChange={(event) => setLocucion(event.target.value)} rows={7} className={inputClass} /></label><label><Etiqueta texto="En pantalla" /><textarea disabled={soloLectura} value={enPantalla} onChange={(event) => setEnPantalla(event.target.value)} rows={7} className={inputClass} /></label></div> : <label><Etiqueta texto={etapa.tipo === "arte" ? "Nota / brief" : "Nota"} /><textarea disabled={soloLectura} value={nota} onChange={(event) => setNota(event.target.value)} rows={5} className={inputClass} /></label>}
      {etapa.tipo !== "guion" && (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h5 className="text-xs font-black uppercase tracking-wider text-[#042E7B]">Archivos</h5>
            {!soloLectura && (
              <label className="cursor-pointer rounded-lg border border-[#1883FF]/30 bg-white px-3 py-2 text-xs font-bold text-[#1883FF] hover:bg-blue-50">
                {accion === "subir" ? "Subiendo…" : "+ Subir"}
                <input type="file" multiple disabled={accion !== null} className="hidden" onChange={(event) => { void subir(event.target.files); event.currentTarget.value = ""; }} />
              </label>
            )}
          </div>

          {/* Toda la caja es zona de arrastre */}
          <div
            onDragOver={soloLectura ? undefined : (event) => { event.preventDefault(); }}
            onDragEnter={soloLectura ? undefined : (event) => { event.preventDefault(); setArrastrando(true); }}
            onDragLeave={soloLectura ? undefined : (event) => {
              // Solo apagar el resaltado al salir de la caja, no al cruzar sus hijos
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setArrastrando(false);
            }}
            onDrop={soloLectura ? undefined : (event) => {
              event.preventDefault();
              setArrastrando(false);
              void subir(event.dataTransfer.files);
            }}
            className={`rounded-xl border-2 border-dashed p-4 transition ${
              arrastrando ? "border-[#1883FF] bg-[#EAF2FF]" : "border-slate-200 bg-white"
            }`}
          >
            {archivos.length ? (
              <div className="flex flex-wrap gap-3">
                {archivos.map((archivo, index) => (
                  <div key={`${archivo.url}-${index}`} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2">
                    <VistaArchivo archivo={archivo} />
                    {!soloLectura && (
                      <button type="button" onClick={() => setArchivos((actuales) => actuales.filter((_, itemIndex) => itemIndex !== index))} className="cursor-pointer px-1 text-lg text-red-500" aria-label={`Quitar ${archivo.nombre}`}>×</button>
                    )}
                  </div>
                ))}
                {!soloLectura && (
                  <p className="w-full pt-1 text-center text-[11px] text-slate-400">
                    {arrastrando ? "Suelta para agregarlos" : "Arrastra más archivos aquí para agregarlos"}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-center text-xs font-semibold text-slate-400">
                {soloLectura
                  ? "Sin archivos."
                  : arrastrando
                    ? "Suelta aquí tus archivos"
                    : "Arrastra aquí tus archivos, o usa “+ Subir”"}
              </p>
            )}
            {accion === "subir" && (
              <p className="pt-2 text-center text-[11px] font-bold text-[#1883FF]">Subiendo…</p>
            )}
          </div>
        </div>
      )}
      <div className="mt-5">
        <h5 className="mb-2 text-xs font-black uppercase tracking-wider text-[#042E7B]">Comentarios</h5>
        {bloque.proyecto_comentarios.length ? (
          <ul className="space-y-2">
            {bloque.proyecto_comentarios.map((item) => (
              <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex flex-wrap gap-2 text-[10px]">
                  <strong className="text-[#042E7B]">{item.autor_rol === "admin" ? "Kyoszen" : item.autor_nombre}</strong>
                  <span className="capitalize text-slate-400">{item.autor_rol}</span>
                  <time className="text-slate-400">{new Date(item.created_at).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}</time>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{item.contenido}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-400">Sin comentarios.</p>
        )}
        <div className="mt-3 space-y-2">
          <textarea value={comentario} onChange={(event) => setComentario(event.target.value)} rows={3} placeholder="Escribe un comentario…" className={inputClass} />
          <button type="button" onClick={() => void comentar()} disabled={accion !== null || !comentario.trim()} className="cursor-pointer rounded-xl bg-[#042E7B] px-4 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40">
            {accion === "comentar" ? "Enviando…" : "Enviar comentario"}
          </button>
        </div>
      </div>
      {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
      {/* El visto bueno del arte: lo das tú, no el cliente */}
      {puedoAprobar && (
        <div className="mt-5 rounded-2xl border border-[#1883FF]/25 bg-[#F5F9FF] p-4">
          <p className="mb-1 text-xs font-black uppercase tracking-wider text-[#042E7B]">Tu visto bueno</p>
          <p className="mb-3 text-xs leading-relaxed text-slate-600">
            Esta etapa la apruebas tú. El cliente la ve en su portal como avance, pero no la aprueba.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={() => void decidir("aprobado")}
              disabled={accion !== null || !listoParaAprobar || bloque.estado === "aprobado"}
              title={!listoParaAprobar ? "Todavía no hay nada entregado en esta escena" : undefined}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-4 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40">
              {bloque.estado === "aprobado" ? "Aprobada" : accion === "decidir" ? "Guardando…" : "Aprobar escena"}
            </button>
            <button type="button" onClick={() => setPidiendoCambios(true)}
              disabled={accion !== null || bloque.estado === "cambios"}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-black text-red-600 disabled:opacity-40">
              {bloque.estado === "cambios" ? "Cambios pedidos" : "Pedir cambios a Rosita"}
            </button>
          </div>
          {pidiendoCambios && (
            <div className="mt-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4">
              <p className="text-sm font-black text-[#B91C1C]">¿Qué hay que cambiar?</p>
              {yaHayComentarios && (
                <p className="mt-1 text-xs leading-relaxed text-[#B45454]">
                  Esta escena ya tiene comentarios y los va a leer. Puedes mandarlo así,
                  o escribir aquí algo más si quieres.
                </p>
              )}
              <textarea autoFocus value={motivoCambios} onChange={(event) => setMotivoCambios(event.target.value)} rows={3} placeholder={yaHayComentarios ? "Opcional: agrega algo más…" : "Ej: el logo se ve muy chico, súbelo tantito y usa el azul de la marca."} className={`${inputClass} mt-2`} />
              <div className="mt-3 flex justify-end gap-2">
                <button type="button" onClick={() => { setPidiendoCambios(false); setMotivoCambios(""); }} disabled={accion !== null} className="cursor-pointer rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-white/70 disabled:opacity-40">Cancelar</button>
                <button type="button" onClick={() => void decidir("cambios", motivoCambios.trim())} disabled={accion !== null || (!motivoCambios.trim() && !yaHayComentarios)} className="cursor-pointer rounded-xl bg-[#B91C1C] px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40">{accion === "decidir" ? "Enviando…" : "Enviar"}</button>
              </div>
            </div>
          )}
          {!listoParaAprobar && (
            <p className="mt-2 text-[11px] font-semibold text-amber-700">
              No puedes aprobarla vacía: falta que se suba el archivo.
            </p>
          )}
        </div>
      )}

      {!soloLectura && (
        <div className="mt-5 flex flex-col items-end justify-end gap-2 sm:flex-row sm:items-center">
          {bloque.estado !== "aprobado" && (
            <button type="button" onClick={() => void guardar(false)} disabled={accion !== null} className="w-full cursor-pointer rounded-xl border border-[#1883FF] bg-white px-4 py-2.5 text-sm font-black text-[#1883FF] disabled:opacity-50 sm:w-auto">
              {accion === "guardar" ? "Guardando…" : esAdmin ? "Guardar" : "Guardar sin enviar"}
            </button>
          )}
          <button type="button" onClick={() => void guardar(true)} disabled={accion !== null} className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#FFCC00] px-4 py-2.5 text-sm font-black text-[#042E7B] disabled:opacity-50 sm:w-auto">
            <IconoLinea nombre="enviar" className="h-4 w-4" />
            {accion === "avisar"
              ? "Enviando…"
              : esAdmin ? "Guardar y avisar al cliente" : "Enviar a revisión"}
          </button>
        </div>
      )}
      {!soloLectura && !esAdmin && (
        <p className="mt-2 text-right text-[11px] leading-relaxed text-slate-500">
          <strong className="text-slate-600">Guardar sin enviar</strong>: sigues trabajando, nadie recibe aviso.{" "}
          <strong className="text-slate-600">Enviar a revisión</strong>: le avisa a Renato para que lo revise. El cliente no lo ve hasta que él lo apruebe.
        </p>
      )}
    </article>
  );
}

function ModalDetalle({ proyectoId, esAdmin, autorNombre, onClose }: {
  proyectoId: string;
  esAdmin: boolean;
  autorNombre: string;
  onClose: () => void;
}) {
  const [proyecto, setProyecto] = useState<ProyectoDetalle | null>(null);
  const [etapaId, setEtapaId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [enviandoCliente, setEnviandoCliente] = useState(false);
  const [avisoEnvio, setAvisoEnvio] = useState("");
  const [error, setError] = useState("");

  const cargar = useCallback(async (mantener?: string | null) => {
    setCargando(true);
    setError("");
    try {
      const response = await fetchAdmin(`/api/admin/proyectos/${proyectoId}`);
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

  // Escenas que un colaborador entregó y siguen esperando el visto bueno del admin
  const porRevisar = useMemo(
    () => bloques.filter((bloque) => bloque.entrega_estado === "entregado"),
    [bloques]
  );

  const enviarAlCliente = async () => {
    if (!proyecto || !etapa) return;
    setEnviandoCliente(true); setError(""); setAvisoEnvio("");
    try {
      const response = await fetchAdmin(`/api/admin/proyectos/${proyecto.id}/etapas/${etapa.id}/enviar-cliente`, { method: "POST" });
      if (!response.ok) throw new Error(await mensajeError(response, "No se pudo enviar al cliente."));
      const data = (await response.json()) as { enviados: number; notificado: boolean };
      setAvisoEnvio(
        data.notificado
          ? `Listo: ${data.enviados} escena${data.enviados === 1 ? "" : "s"} al cliente. Ya le llegó el correo.`
          : `Listo: ${data.enviados} escena${data.enviados === 1 ? "" : "s"} liberada${data.enviados === 1 ? "" : "s"}. El proyecto está en borrador, así que no se mandó correo.`
      );
      await cargar(etapaId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo enviar al cliente.");
    } finally {
      setEnviandoCliente(false);
    }
  };

  const publicar = async () => {
    if (!proyecto) return;
    setActualizando(true); setError("");
    try {
      const response = await fetchAdmin(`/api/admin/proyectos/${proyecto.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicado: !proyecto.publicado }) });
      if (!response.ok) throw new Error(await mensajeError(response, "No se pudo actualizar la publicación."));
      await cargar(etapaId);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo actualizar la publicación."); }
    finally { setActualizando(false); }
  };
  const eliminar = async () => {
    if (!proyecto || !confirm(`¿Eliminar el proyecto “${proyecto.titulo}”? Esta acción no se puede deshacer.`)) return;
    setActualizando(true); setError("");
    try {
      const response = await fetchAdmin(`/api/admin/proyectos/${proyecto.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await mensajeError(response, "No se pudo eliminar el proyecto."));
      onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo eliminar el proyecto."); setActualizando(false); }
  };

  return (
    <ModalBase onClose={onClose} ancho="max-w-6xl">
      {cargando && !proyecto ? <div className="flex min-h-72 items-center justify-center"><Spinner /></div> : <>
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-black text-[#042E7B]">{proyecto?.titulo ?? "Proyecto"}</h2>{proyecto?.folio && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">{proyecto.folio}</span>}{proyecto && <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold capitalize text-[#1883FF]"><PuntoEstado color="#1883FF" />{proyecto.estado}</span>}</div>{proyecto?.area && <p className="mt-1 text-sm text-slate-500">{proyecto.area}</p>}</div><div className="flex shrink-0 flex-wrap gap-2">{proyecto && <button type="button" onClick={() => void publicar()} disabled={actualizando} className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#FFCC00] px-3.5 py-2 text-xs font-black text-[#042E7B] disabled:opacity-50"><IconoLinea nombre="subir" className="h-4 w-4" />{proyecto.publicado ? "Ocultar" : "Publicar al cliente"}</button>}<button type="button" onClick={() => void eliminar()} disabled={actualizando || !proyecto} className="cursor-pointer rounded-xl border border-red-200 px-3.5 py-2 text-xs font-bold text-red-600 disabled:opacity-50">Eliminar</button><button type="button" onClick={onClose} className="cursor-pointer px-1 text-2xl text-slate-400" aria-label="Cerrar">×</button></div></div>
        <div className="p-6">{error && <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}{proyecto && <div className="mb-6 flex gap-2 overflow-x-auto pb-1">{proyecto.proyecto_etapas.map((item) => { const ui = ESTADO_ETAPA_UI[item.estado]; const progreso = progresoDe(item); return <button key={item.id} type="button" onClick={() => setEtapaId(item.id)} className={`cursor-pointer whitespace-nowrap rounded-xl border px-3 py-2 text-left transition ${item.estado === "bloqueada" ? "opacity-55" : ""}`} style={{ color: ui.color, backgroundColor: ui.colorSuave, borderColor: item.id === etapaId ? ui.color : `${ui.color}44` }}><span className="flex items-center gap-1.5 text-xs font-black">{item.estado === "bloqueada" && <IconoLinea nombre="bloqueo" className="h-3.5 w-3.5" />}{item.nombre}</span><span className="text-[10px] font-bold">{progreso.total > 0 ? `${progreso.aprobado}/${progreso.total}` : ui.label}</span>{(progreso.conMaterial ?? 0) > 0 && <span className="block text-[9.5px] font-bold opacity-75">{progreso.conMaterial} con material</span>}</button>; })}</div>}{etapa && <section><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-lg font-black text-[#042E7B]">{etapa.nombre}</h3><p className="text-xs text-slate-500">{etapa.modo === "por_escena" ? "Un entregable por escena" : "Un entregable para toda la etapa"}{etapa.estado === "bloqueada" ? " · Solo lectura" : ""}</p>{progresoDe(etapa).total > 0 && <p className="mt-1 text-xs font-semibold text-[#042E7B]">{resumenEtapa(progresoDe(etapa))}</p>}</div>
          {esAdmin && porRevisar.length > 0 && (
            <button type="button" onClick={() => void enviarAlCliente()} disabled={enviandoCliente} className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#FFCC00] px-4 py-2.5 text-sm font-black text-[#042E7B] disabled:opacity-50">
              <IconoLinea nombre="enviar" className="h-4 w-4" />
              {enviandoCliente ? "Enviando…" : `Enviar al cliente (${porRevisar.length})`}
            </button>
          )}
        </div>

        {/* Cómo funciona esto, para quien entrega */}
        {!esAdmin && etapa.estado !== "bloqueada" && (
          <ol className="mb-4 flex flex-col gap-2 rounded-2xl border border-[#1883FF]/25 bg-[#EAF2FF] p-4 text-xs text-[#042E7B] sm:flex-row sm:items-center">
            {[
              "Sube tus archivos en la escena",
              "Aprieta \"Enviar a revisión\"",
              "Renato lo revisa y se lo manda al cliente",
            ].map((paso, indice) => (
              <li key={paso} className="flex flex-1 items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#042E7B] text-[10px] font-black text-white">{indice + 1}</span>
                <span className="font-bold leading-snug">{paso}</span>
              </li>
            ))}
          </ol>
        )}

        {esAdmin && porRevisar.length > 0 && (
          <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">
            {porRevisar[0].entrega_nombre ?? "Un colaborador"} entregó {porRevisar.length} escena{porRevisar.length === 1 ? "" : "s"} y está esperando tu revisión. El cliente todavía no las ve.
          </p>
        )}
        {avisoEnvio && <p className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">{avisoEnvio}</p>}

        <div className="space-y-4">{bloques.map((bloque) => <TarjetaBloque key={bloque.id} bloque={bloque} etapa={etapa} escena={bloque.escena_id ? escenasPorId.get(bloque.escena_id) ?? null : null} proyectoId={proyectoId} soloLectura={etapa.estado === "bloqueada"} esAdmin={esAdmin} autorNombre={autorNombre} onSaved={() => cargar(etapa.id)} />)}{bloques.length === 0 && <p className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">Esta etapa no tiene bloques activos.</p>}</div></section>}</div>
      </>}
    </ModalBase>
  );
}

function Spinner() { return <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1883FF] border-t-transparent" />; }

function pesoLegible(peso: number | null) {
  if (peso === null) return "Peso no disponible";
  if (peso < 1024) return `${peso} B`;
  if (peso < 1024 * 1024) return `${(peso / 1024).toFixed(1)} KB`;
  return `${(peso / 1024 / 1024).toFixed(1)} MB`;
}

function esPdfEspacio(archivo: Pick<EspacioArchivo, "tipo" | "nombre">) {
  return archivo.tipo === "application/pdf" || archivo.nombre.toLowerCase().endsWith(".pdf");
}

function extensionEspacio(nombre: string) {
  const extension = nombre.split(".").pop();
  return extension && extension !== nombre ? extension.toUpperCase() : "ARCHIVO";
}

function urlMiniaturaPdf(url: string) {
  return `${url.split("#")[0]}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`;
}

function SwitchAprobacion({
  activo,
  onChange,
  disabled = false,
  texto = "Requiere aprobación",
}: {
  activo: boolean;
  onChange: (activo: boolean) => void;
  disabled?: boolean;
  texto?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      disabled={disabled}
      onClick={() => onChange(!activo)}
      className="group flex w-full cursor-pointer items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:opacity-55"
    >
      <span className="flex items-center gap-2 text-xs font-black text-[#042E7B]">
        <IconUI name={activo ? "check" : "sparkle-off"} size={15} />
        {texto}
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full border transition ${activo ? "border-[#E5B800] bg-[#FFCC00]" : "border-slate-300 bg-slate-200"}`}>
        <span className={`absolute top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white text-[#042E7B] shadow-sm transition-transform ${activo ? "translate-x-5" : "translate-x-0.5"}`}>
          {activo && <IconUI name="check" size={11} />}
        </span>
      </span>
    </button>
  );
}

function GestorArchivos({ espacio, onClose, onUpdated }: {
  espacio: EspacioListado;
  onClose: () => void;
  onUpdated: () => Promise<void>;
}) {
  const [archivos, setArchivos] = useState<EspacioArchivo[]>([]);
  const [carpetas, setCarpetas] = useState<EspacioCarpeta[]>([]);
  const [carpetaId, setCarpetaId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const [error, setError] = useState("");
  const [archivoAbierto, setArchivoAbierto] = useState<string | null>(null);
  const [comentarios, setComentarios] = useState<EspacioComentario[]>([]);
  const [comentario, setComentario] = useState("");
  const [accion, setAccion] = useState<string | null>(null);
  const [requiereAprobacionSubida, setRequiereAprobacionSubida] = useState(true);

  const cargarContenido = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const carpetaQuery = carpetaId ? encodeURIComponent(carpetaId) : "root";
      const [archivosResponse, carpetasResponse] = await Promise.all([
        fetchAdmin(`/api/admin/proyectos/espacios/${espacio.id}/archivos?carpeta=${carpetaQuery}`),
        fetchAdmin(`/api/admin/proyectos/espacios/${espacio.id}/carpetas`),
      ]);
      if (!archivosResponse.ok) {
        throw new Error(await mensajeError(archivosResponse, "No se pudieron cargar los archivos."));
      }
      if (!carpetasResponse.ok) {
        throw new Error(await mensajeError(carpetasResponse, "No se pudieron cargar las carpetas."));
      }
      const [archivosData, carpetasData] = await Promise.all([
        archivosResponse.json() as Promise<{ archivos?: EspacioArchivo[] }>,
        carpetasResponse.json() as Promise<{ carpetas?: EspacioCarpeta[] }>,
      ]);
      setArchivos(Array.isArray(archivosData.archivos) ? archivosData.archivos : []);
      setCarpetas(Array.isArray(carpetasData.carpetas) ? carpetasData.carpetas : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cargar el contenido.");
    } finally {
      setCargando(false);
    }
  }, [carpetaId, espacio.id]);

  useEffect(() => { void cargarContenido(); }, [cargarContenido]);

  useEffect(() => {
    if (!archivoAbierto) return;
    const cerrarConEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setArchivoAbierto(null);
    };
    window.addEventListener("keydown", cerrarConEscape);
    return () => window.removeEventListener("keydown", cerrarConEscape);
  }, [archivoAbierto]);

  const carpetasActuales = useMemo(
    () => carpetas.filter(({ parent_id }) => parent_id === carpetaId),
    [carpetaId, carpetas]
  );
  const breadcrumb = useMemo(() => {
    const porId = new Map(carpetas.map((carpeta) => [carpeta.id, carpeta]));
    const ruta: EspacioCarpeta[] = [];
    const visitadas = new Set<string>();
    let actual = carpetaId;
    while (actual && !visitadas.has(actual)) {
      visitadas.add(actual);
      const carpeta = porId.get(actual);
      if (!carpeta) break;
      ruta.unshift(carpeta);
      actual = carpeta.parent_id;
    }
    return ruta;
  }, [carpetaId, carpetas]);

  const crearCarpeta = async () => {
    const nombre = prompt("Nombre de la nueva carpeta:");
    if (!nombre?.trim()) return;
    setAccion("crear-carpeta");
    setError("");
    try {
      const response = await fetchAdmin(`/api/admin/proyectos/espacios/${espacio.id}/carpetas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim(), parent_id: carpetaId }),
      });
      if (!response.ok) throw new Error(await mensajeError(response, "No se pudo crear la carpeta."));
      await cargarContenido();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo crear la carpeta.");
    } finally {
      setAccion(null);
    }
  };

  const renombrarCarpeta = async (carpeta: EspacioCarpeta) => {
    const nombre = prompt("Nuevo nombre de la carpeta:", carpeta.nombre);
    if (!nombre?.trim() || nombre.trim() === carpeta.nombre) return;
    setAccion(carpeta.id);
    setError("");
    try {
      const response = await fetchAdmin(`/api/admin/proyectos/espacios/${espacio.id}/carpetas/${carpeta.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim() }),
      });
      if (!response.ok) throw new Error(await mensajeError(response, "No se pudo renombrar la carpeta."));
      await cargarContenido();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo renombrar la carpeta.");
    } finally {
      setAccion(null);
    }
  };

  const eliminarCarpeta = async (carpeta: EspacioCarpeta) => {
    if (!confirm(`¿Eliminar la carpeta “${carpeta.nombre}” y sus subcarpetas? Los archivos que contengan subirán a la raíz.`)) return;
    setAccion(carpeta.id);
    setError("");
    try {
      const response = await fetchAdmin(`/api/admin/proyectos/espacios/${espacio.id}/carpetas/${carpeta.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(await mensajeError(response, "No se pudo eliminar la carpeta."));
      await cargarContenido();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo eliminar la carpeta.");
    } finally {
      setAccion(null);
    }
  };

  const subir = async (lista: FileList | File[]) => {
    const files = Array.from(lista);
    if (files.length === 0) return;
    setSubiendo(true);
    setError("");
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        if (carpetaId) formData.append("carpeta_id", carpetaId);
        formData.append("requiere_aprobacion", String(requiereAprobacionSubida));
        const response = await fetchAdmin(`/api/admin/proyectos/espacios/${espacio.id}/archivos`, {
          method: "POST",
          body: formData,
        });
        if (!response.ok) throw new Error(await mensajeError(response, `No se pudo subir ${file.name}.`));
      }
      await Promise.all([cargarContenido(), onUpdated()]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron subir los archivos.");
    } finally {
      setSubiendo(false);
    }
  };

  const guardarNota = async (archivo: EspacioArchivo, nota: string) => {
    setAccion(archivo.id);
    setError("");
    try {
      const response = await fetchAdmin(`/api/admin/proyectos/espacios/${espacio.id}/archivos/${archivo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nota }),
      });
      if (!response.ok) throw new Error(await mensajeError(response, "No se pudo guardar la nota."));
      await cargarContenido();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar la nota.");
    } finally {
      setAccion(null);
    }
  };

  const eliminar = async (archivo: EspacioArchivo) => {
    if (!confirm(`¿Eliminar “${archivo.nombre}”? Esta acción no se puede deshacer.`)) return;
    setAccion(archivo.id);
    setError("");
    try {
      const response = await fetchAdmin(`/api/admin/proyectos/espacios/${espacio.id}/archivos/${archivo.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(await mensajeError(response, "No se pudo eliminar el archivo."));
      if (archivoAbierto === archivo.id) setArchivoAbierto(null);
      await Promise.all([cargarContenido(), onUpdated()]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo eliminar el archivo.");
    } finally {
      setAccion(null);
    }
  };

  const cargarComentarios = async (archivoId: string) => {
    setArchivoAbierto(archivoId);
    setComentarios([]);
    setComentario("");
    setError("");
    const response = await fetch(`/api/revisor/proyectos/espacios/${espacio.id}/archivos/${archivoId}/comments`);
    if (!response.ok) {
      setError(await mensajeError(response, "No se pudieron cargar los comentarios."));
      return;
    }
    const data = await response.json() as { comentarios?: EspacioComentario[] };
    setComentarios(Array.isArray(data.comentarios) ? data.comentarios : []);
  };

  const publicarComentario = async () => {
    if (!archivoAbierto || !comentario.trim()) return;
    setAccion(`comentario-${archivoAbierto}`);
    setError("");
    try {
      const response = await fetch(`/api/revisor/proyectos/espacios/${espacio.id}/archivos/${archivoAbierto}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido: comentario.trim(), autor_nombre: "Kyoszen", autor_rol: "admin" }),
      });
      if (!response.ok) throw new Error(await mensajeError(response, "No se pudo publicar el comentario."));
      setComentario("");
      await cargarComentarios(archivoAbierto);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo publicar el comentario.");
    } finally {
      setAccion(null);
    }
  };

  const moverArchivo = async (archivo: EspacioArchivo, destino: string | null) => {
    if (destino === archivo.carpeta_id) return;
    setAccion(archivo.id);
    setError("");
    try {
      const response = await fetchAdmin(`/api/admin/proyectos/espacios/${espacio.id}/archivos/${archivo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carpeta_id: destino }),
      });
      if (!response.ok) throw new Error(await mensajeError(response, "No se pudo mover el archivo."));
      if (archivoAbierto === archivo.id) setArchivoAbierto(null);
      await cargarContenido();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo mover el archivo.");
    } finally {
      setAccion(null);
    }
  };

  const cambiarRequiereAprobacion = async (archivo: EspacioArchivo, activo: boolean) => {
    const anterior = archivo.requiere_aprobacion !== false;
    setArchivos((actuales) => actuales.map((item) => (
      item.id === archivo.id ? { ...item, requiere_aprobacion: activo } : item
    )));
    setAccion(`aprobacion-${archivo.id}`);
    setError("");
    try {
      const response = await fetchAdmin(`/api/admin/proyectos/espacios/${espacio.id}/archivos/${archivo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requiere_aprobacion: activo }),
      });
      if (!response.ok) {
        throw new Error(await mensajeError(response, "No se pudo cambiar la aprobación del archivo."));
      }
      const actualizado = await response.json() as EspacioArchivo;
      setArchivos((actuales) => actuales.map((item) => (
        item.id === archivo.id ? actualizado : item
      )));
    } catch (cause) {
      setArchivos((actuales) => actuales.map((item) => (
        item.id === archivo.id ? { ...item, requiere_aprobacion: anterior } : item
      )));
      setError(cause instanceof Error ? cause.message : "No se pudo cambiar la aprobación del archivo.");
    } finally {
      setAccion(null);
    }
  };

  const archivoSeleccionado = archivos.find(({ id }) => id === archivoAbierto) ?? null;

  return (
    <ModalBase onClose={onClose} ancho="max-w-6xl">
      <ModalHeader titulo={espacio.nombre} subtitulo="Sube, organiza y consulta la revisión de los entregables." onClose={onClose} icono={<MosaicoEspacio tipo={espacio.tipo} />} />
      <div className="space-y-5 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Ruta de carpetas" className="flex min-w-0 flex-wrap items-center gap-1 text-sm">
            <button type="button" onClick={() => setCarpetaId(null)} className={`cursor-pointer rounded-lg px-2 py-1 font-black ${carpetaId === null ? "bg-blue-50 text-[#042E7B]" : "text-[#1883FF] hover:bg-blue-50"}`}>Raíz</button>
            {breadcrumb.map((carpeta) => (
              <span key={carpeta.id} className="flex min-w-0 items-center gap-1">
                <span className="text-slate-300">›</span>
                <button type="button" onClick={() => setCarpetaId(carpeta.id)} className={`max-w-48 cursor-pointer truncate rounded-lg px-2 py-1 font-black ${carpeta.id === carpetaId ? "bg-blue-50 text-[#042E7B]" : "text-[#1883FF] hover:bg-blue-50"}`}>{carpeta.nombre}</button>
              </span>
            ))}
          </nav>
          <button type="button" onClick={() => void crearCarpeta()} disabled={accion === "crear-carpeta"} className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#FFCC00] px-4 py-2.5 text-sm font-black text-[#042E7B] disabled:opacity-50"><IconoLinea nombre="carpeta-mas" className="h-4 w-4" />Nueva carpeta</button>
        </div>
        <div
          onDragOver={(event) => { event.preventDefault(); setArrastrando(true); }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={(event) => {
            event.preventDefault();
            setArrastrando(false);
            void subir(event.dataTransfer.files);
          }}
          className={`rounded-2xl border-2 border-dashed px-5 py-6 transition ${arrastrando ? "border-[#1883FF] bg-blue-50" : "border-slate-300 bg-slate-50 hover:border-[#1883FF]"}`}
        >
          <label className="flex cursor-pointer flex-col items-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF2FF] text-[#042E7B]"><IconoLinea nombre="subir" className="h-6 w-6" /></span>
            <span className="mt-2 text-sm font-black text-[#042E7B]">{subiendo ? "Subiendo archivos…" : "Arrastra archivos aquí o haz clic para seleccionar"}</span>
            <span className="mt-1 text-xs text-slate-500">Se guardarán en {breadcrumb.at(-1)?.nombre ?? "Raíz"}, sin compresión.</span>
            <input type="file" multiple disabled={subiendo} className="hidden" onChange={(event) => event.target.files && void subir(event.target.files)} />
          </label>
          <div className="mx-auto mt-5 max-w-sm rounded-xl border border-[#DCE7FA] bg-white px-3.5 py-3 shadow-sm">
            <SwitchAprobacion
              activo={requiereAprobacionSubida}
              onChange={setRequiereAprobacionSubida}
              disabled={subiendo}
              texto="Requiere aprobación del cliente"
            />
          </div>
        </div>
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
        {cargando ? <div className="flex min-h-48 items-center justify-center"><Spinner /></div> : carpetasActuales.length === 0 && archivos.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 py-14 text-center text-sm text-slate-500">Esta carpeta está vacía.</p>
        ) : (
          <div className="grid items-start gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 230px), 1fr))" }}>
            {carpetasActuales.map((carpeta) => (
              <article key={carpeta.id} className="rounded-2xl border border-[#E6EBF5] bg-white p-4 shadow-[0_1px_2px_rgba(4,46,123,.05)] transition hover:-translate-y-0.5 hover:border-[#BFD5FF] hover:shadow-[0_14px_30px_-16px_rgba(4,46,123,.22)]">
                <button type="button" onClick={() => setCarpetaId(carpeta.id)} className="flex w-full cursor-pointer items-center gap-3 text-left">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF2FF] text-[#042E7B]"><IconoLinea nombre="carpeta" className="h-6 w-6" /></span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black text-[#042E7B]">{carpeta.nombre}</span>
                    <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-[#1883FF]">Abrir carpeta</span>
                  </span>
                </button>
                <div className="mt-4 flex justify-end gap-2 border-t border-[#E6EBF5] pt-3">
                  <button type="button" disabled={accion === carpeta.id} onClick={() => void renombrarCarpeta(carpeta)} className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#1883FF] hover:bg-blue-50 disabled:opacity-50">Renombrar</button>
                  <button type="button" disabled={accion === carpeta.id} onClick={() => void eliminarCarpeta(carpeta)} className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">Eliminar</button>
                </div>
              </article>
            ))}
            {archivos.map((archivo) => {
              const ui = ESTADO_BLOQUE_UI[archivo.estado];
              const esPdf = esPdfEspacio(archivo);
              const requiereAprobacion = archivo.requiere_aprobacion !== false;
              return (
                <article key={archivo.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <button type="button" onClick={() => void cargarComentarios(archivo.id)} className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-slate-100" style={{ aspectRatio: "1 / 1.294" }}>
                    {archivo.tipo?.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={archivo.url} alt={archivo.nombre} loading="lazy" className="h-full w-full object-contain object-center" />
                    ) : esPdf ? (
                      <iframe src={urlMiniaturaPdf(archivo.url)} title={`Vista previa de ${archivo.nombre}`} loading="lazy" tabIndex={-1} className="pointer-events-none h-full w-full border-0 bg-slate-100" />
                    ) : (
                      <span className="flex flex-col items-center text-[#042E7B]" aria-hidden="true"><IconoLinea nombre="documento" className="h-12 w-12" /><span className="mt-2 block text-[10px] font-black text-slate-500">{extensionEspacio(archivo.nombre)}</span></span>
                    )}
                  </button>
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0"><p className="truncate text-sm font-black text-[#042E7B]" title={archivo.nombre}>{archivo.nombre}</p><p className="mt-0.5 text-[10px] font-semibold text-slate-400">{pesoLegible(archivo.peso)}</p></div>
                      {requiereAprobacion ? (
                        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-50 px-2 py-1 text-[10px] font-extrabold" style={{ color: ui.color }}><PuntoEstado color={ui.color} />{ui.label}</span>
                      ) : (
                        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-extrabold text-slate-500"><IconUI name="sparkle-off" size={12} />Sin aprobación</span>
                      )}
                    </div>
                    <div className="rounded-xl border border-[#E6EBF5] bg-[#F8FAFC] px-3 py-2.5">
                      <SwitchAprobacion
                        activo={requiereAprobacion}
                        onChange={(activo) => void cambiarRequiereAprobacion(archivo, activo)}
                        disabled={accion === `aprobacion-${archivo.id}`}
                      />
                    </div>
                    <textarea
                      key={`${archivo.id}-${archivo.nota}`}
                      defaultValue={archivo.nota ?? ""}
                      rows={2}
                      placeholder="Agrega una nota: qué es, versión, indicaciones…"
                      className={inputClass}
                      onBlur={(event) => {
                        if (event.target.value.trim() !== (archivo.nota ?? "")) void guardarNota(archivo, event.target.value);
                      }}
                    />
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">Mover a</span>
                      <select
                        value={archivo.carpeta_id ?? ""}
                        disabled={accion === archivo.id}
                        onChange={(event) => void moverArchivo(archivo, event.target.value || null)}
                        className={`${inputClass} cursor-pointer`}
                      >
                        <option value="">Raíz</option>
                        {carpetas.map((carpeta) => <option key={carpeta.id} value={carpeta.id}>{carpeta.nombre}</option>)}
                      </select>
                    </label>
                    <div className="flex items-center justify-between gap-2">
                      <button type="button" onClick={() => void cargarComentarios(archivo.id)} className="cursor-pointer text-xs font-bold text-[#1883FF] hover:underline">Vista previa y comentarios</button>
                      <button type="button" disabled={accion === archivo.id} onClick={() => void eliminar(archivo)} className="cursor-pointer text-xs font-bold text-red-600 disabled:opacity-50">Eliminar</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
      {archivoSeleccionado && (
        <div role="dialog" aria-modal="true" aria-label={`Vista previa de ${archivoSeleccionado.nombre}`} onMouseDown={() => setArchivoAbierto(null)} className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-3 sm:p-5">
          <div onMouseDown={(event) => event.stopPropagation()} className="max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#1883FF]">{espacio.nombre}</p>
                <h3 className="mt-1 break-words text-lg font-black text-[#042E7B]">{archivoSeleccionado.nombre}</h3>
              </div>
              <button type="button" onClick={() => setArchivoAbierto(null)} aria-label="Cerrar" className="cursor-pointer text-3xl leading-none text-slate-400 hover:text-slate-700">×</button>
            </header>
            <div className="space-y-5 p-4 sm:p-6">
              <div className="flex h-[60vh] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-900 sm:h-[72vh]">
                {archivoSeleccionado.tipo?.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={archivoSeleccionado.url} alt={archivoSeleccionado.nombre} className="h-full w-full object-contain" />
                ) : esPdfEspacio(archivoSeleccionado) ? (
                  <iframe src={archivoSeleccionado.url} title={archivoSeleccionado.nombre} className="h-full w-full border-0 bg-white" />
                ) : (
                  <div className="px-6 text-center text-white">
                    <IconoLinea nombre="documento" className="mx-auto h-14 w-14 text-slate-300" />
                    <p className="mt-4 text-sm font-bold">Este tipo de archivo no se puede previsualizar.</p>
                    <p className="mt-1 text-xs text-slate-300">{extensionEspacio(archivoSeleccionado.nombre)}</p>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <a href={archivoSeleccionado.url} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-[#FFCC00] px-4 py-2.5 text-center text-sm font-black text-[#042E7B]">Abrir en otra pestaña</a>
                <a href={archivoSeleccionado.url} download className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-black text-[#042E7B]">Descargar ↓</a>
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                <section className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {archivoSeleccionado.requiere_aprobacion !== false ? (
                      <span className="flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-extrabold" style={{ color: ESTADO_BLOQUE_UI[archivoSeleccionado.estado].color }}><PuntoEstado color={ESTADO_BLOQUE_UI[archivoSeleccionado.estado].color} />{ESTADO_BLOQUE_UI[archivoSeleccionado.estado].label}</span>
                    ) : (
                      <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold text-slate-500"><IconUI name="sparkle-off" size={12} />Sin aprobación</span>
                    )}
                    <span className="text-xs font-semibold text-slate-400">{pesoLegible(archivoSeleccionado.peso)}</span>
                  </div>
                  <div className="rounded-xl border border-[#E6EBF5] bg-[#F8FAFC] px-3 py-3">
                    <SwitchAprobacion
                      activo={archivoSeleccionado.requiere_aprobacion !== false}
                      onChange={(activo) => void cambiarRequiereAprobacion(archivoSeleccionado, activo)}
                      disabled={accion === `aprobacion-${archivoSeleccionado.id}`}
                    />
                  </div>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-black text-[#042E7B]">Nota del entregable</span>
                    <textarea key={`${archivoSeleccionado.id}-${archivoSeleccionado.nota}`} defaultValue={archivoSeleccionado.nota ?? ""} rows={4} placeholder="Agrega una nota: qué es, versión, indicaciones…" className={inputClass} onBlur={(event) => {
                      if (event.target.value.trim() !== (archivoSeleccionado.nota ?? "")) void guardarNota(archivoSeleccionado, event.target.value);
                    }} />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-black text-[#042E7B]">Mover a</span>
                    <select value={archivoSeleccionado.carpeta_id ?? ""} disabled={accion === archivoSeleccionado.id} onChange={(event) => void moverArchivo(archivoSeleccionado, event.target.value || null)} className={`${inputClass} cursor-pointer`}>
                      <option value="">Raíz</option>
                      {carpetas.map((carpeta) => <option key={carpeta.id} value={carpeta.id}>{carpeta.nombre}</option>)}
                    </select>
                  </label>
                  <button type="button" disabled={accion === archivoSeleccionado.id} onClick={() => void eliminar(archivoSeleccionado)} className="cursor-pointer rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 disabled:opacity-50">Eliminar archivo</button>
                </section>
                <section className="space-y-3 border-t border-slate-200 pt-5 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                  <h4 className="text-sm font-black text-[#042E7B]">Comentarios ({comentarios.length})</h4>
                  {comentarios.length === 0 ? <p className="text-xs text-slate-400">Aún no hay comentarios.</p> : comentarios.map((item) => (
                    <div key={item.id} className="rounded-xl bg-slate-50 p-3 text-xs">
                      <p className="font-black text-[#042E7B]">{item.autor_nombre || (item.autor_rol === "admin" ? "Kyoszen" : "Cliente")}</p>
                      <p className="mt-1 whitespace-pre-wrap text-slate-600">{item.contenido}</p>
                    </div>
                  ))}
                  <textarea value={comentario} onChange={(event) => setComentario(event.target.value)} rows={3} placeholder="Responder al cliente…" className={inputClass} />
                  <button type="button" onClick={() => void publicarComentario()} disabled={!comentario.trim() || accion === `comentario-${archivoSeleccionado.id}`} className="cursor-pointer rounded-lg bg-[#FFCC00] px-3 py-2 text-xs font-black text-[#042E7B] disabled:opacity-50">Publicar comentario</button>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModalBase>
  );
}

function TarjetaEspacioAdmin({ espacio, invitaciones, cargandoInvitaciones, onUpdated, onOpenArchivos, onOpenTablero }: {
  espacio: EspacioListado;
  invitaciones: InvitacionCuestionario[];
  cargandoInvitaciones: boolean;
  onUpdated: () => Promise<void>;
  onOpenArchivos: (espacio: EspacioListado) => void;
  onOpenTablero: (espacio: EspacioListado) => void;
}) {
  const [nombre, setNombre] = useState(espacio.nombre);
  const [descripcion, setDescripcion] = useState(espacio.descripcion ?? "");
  const [color, setColor] = useState(espacio.color ?? "#1883FF");
  const [orden, setOrden] = useState(espacio.orden);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const guardar = async (patch: Record<string, unknown>) => {
    setGuardando(true);
    setError("");
    try {
      const response = await fetchAdmin(`/api/admin/proyectos/espacios/${espacio.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!response.ok) throw new Error(await mensajeError(response, "No se pudo actualizar el espacio."));
      await onUpdated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo actualizar el espacio.");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    if (!confirm(`¿Eliminar el espacio “${espacio.nombre}”? Sus proyectos quedarán sin espacio.`)) return;
    setGuardando(true);
    setError("");
    try {
      const response = await fetchAdmin(`/api/admin/proyectos/espacios/${espacio.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await mensajeError(response, "No se pudo eliminar el espacio."));
      await onUpdated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo eliminar el espacio.");
      setGuardando(false);
    }
  };

  return (
    <article className="rounded-2xl border border-[#E6EBF5] bg-white p-[22px] shadow-[0_1px_2px_rgba(4,46,123,.05)] transition duration-150 hover:-translate-y-0.5 hover:border-[#BFD5FF] hover:shadow-[0_14px_30px_-16px_rgba(4,46,123,.22)]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <MosaicoEspacio tipo={espacio.tipo} />
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[.08em] text-[#6B7A99]">{espacio.tipo}</p>
            <h3 className="truncate text-[19px] font-extrabold tracking-[-.01em] text-[#042E7B]">{espacio.nombre}</h3>
            <p className="mt-0.5 text-[13px] text-[#64748B]">
              {espacio.proyectos_count} proyectos · {espacio.archivos_count} archivos · {espacio.tarjetas_count} tarjetas
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={guardando}
          onClick={() => void guardar({ publicado: !espacio.publicado })}
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold disabled:opacity-50 ${espacio.publicado ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
        >
          <PuntoEstado color={espacio.publicado ? "#16A34A" : "#94A3B8"} />
          {espacio.publicado ? "Publicado" : "Borrador"}
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2"><Etiqueta texto="Nombre" /><input value={nombre} onChange={(event) => setNombre(event.target.value)} className={inputClass} /></label>
        <label className="sm:col-span-2"><Etiqueta texto="Descripción" /><textarea rows={2} value={descripcion} onChange={(event) => setDescripcion(event.target.value)} className={inputClass} /></label>
        <label><Etiqueta texto="Color" /><input type="color" value={color} onChange={(event) => setColor(event.target.value)} className="h-[42px] w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-1" /></label>
        <label><Etiqueta texto="Orden" /><input type="number" value={orden} onChange={(event) => setOrden(Number(event.target.value) || 0)} className={inputClass} /></label>
        <label className="sm:col-span-2">
          <Etiqueta texto="Cuestionario de onboarding" />
          <select
            value={espacio.cuestionario_token ?? ""}
            disabled={guardando || cargandoInvitaciones}
            onChange={(event) => void guardar({ cuestionario_token: event.target.value || null })}
            className={inputClass}
          >
            <option value="">{cargandoInvitaciones ? "Cargando cuestionarios…" : "Ninguno"}</option>
            {invitaciones.map((invitacion) => (
              <option key={invitacion.token} value={invitacion.token}>
                {invitacion.invitado_nombre} · {invitacion.token}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p>}
      <div className="mt-4 flex justify-between gap-2 border-t border-slate-100 pt-4">
        <button type="button" disabled={guardando} onClick={() => void eliminar()} className="cursor-pointer rounded-xl px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">Eliminar</button>
        <div className="flex gap-2">
          {espacio.tipo === "archivos" && <button type="button" onClick={() => onOpenArchivos(espacio)} className="cursor-pointer rounded-xl border border-[#1883FF]/25 px-3 py-2 text-xs font-black text-[#1883FF]">Gestionar archivos</button>}
          {espacio.tipo === "tablero" && <button type="button" onClick={() => onOpenTablero(espacio)} className="cursor-pointer rounded-xl border border-[#1883FF]/25 px-3 py-2 text-xs font-black text-[#1883FF]">Abrir tablero</button>}
          <button
            type="button"
            disabled={guardando || !nombre.trim()}
            onClick={() => void guardar({ nombre: nombre.trim(), descripcion: descripcion.trim() || null, color, orden })}
            className="cursor-pointer rounded-xl bg-[#FFCC00] px-4 py-2 text-xs font-black text-[#042E7B] disabled:opacity-50"
          >
            {guardando ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </article>
  );
}

function GestionEspacios({ espacios, onUpdated, onOpenArchivos, onOpenTablero }: {
  espacios: EspacioListado[];
  onUpdated: () => Promise<void>;
  onOpenArchivos: (espacio: EspacioListado) => void;
  onOpenTablero: (espacio: EspacioListado) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoEspacio>("aprobacion");
  const [color, setColor] = useState("#1883FF");
  const [publicado, setPublicado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [invitaciones, setInvitaciones] = useState<InvitacionCuestionario[]>([]);
  const [cargandoInvitaciones, setCargandoInvitaciones] = useState(true);
  const [errorInvitaciones, setErrorInvitaciones] = useState("");

  useEffect(() => {
    let vigente = true;

    const cargarInvitaciones = async () => {
      setCargandoInvitaciones(true);
      setErrorInvitaciones("");
      try {
        const response = await fetchAdmin("/api/admin/cuestionario");
        if (!response.ok) {
          throw new Error(await mensajeError(response, "No se pudieron cargar los cuestionarios."));
        }
        const data = await response.json() as { invitaciones?: InvitacionCuestionario[] };
        if (vigente) {
          setInvitaciones(Array.isArray(data.invitaciones) ? data.invitaciones : []);
        }
      } catch (cause) {
        if (vigente) {
          setErrorInvitaciones(
            cause instanceof Error ? cause.message : "No se pudieron cargar los cuestionarios."
          );
        }
      } finally {
        if (vigente) setCargandoInvitaciones(false);
      }
    };

    void cargarInvitaciones();
    return () => {
      vigente = false;
    };
  }, []);

  const crear = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGuardando(true);
    setError("");
    try {
      const response = await fetchAdmin("/api/admin/proyectos/espacios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim(), tipo, color, publicado }),
      });
      if (!response.ok) throw new Error(await mensajeError(response, "No se pudo crear el espacio."));
      setNombre("");
      setPublicado(false);
      await onUpdated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo crear el espacio.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={crear} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-black text-[#042E7B]">Nuevo espacio</h2>
        <p className="mt-1 text-xs text-slate-500">Organiza los entregables según su forma de trabajo.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="lg:col-span-2"><Etiqueta texto="Nombre *" /><input required value={nombre} onChange={(event) => setNombre(event.target.value)} className={inputClass} placeholder="Videos de inducción" /></label>
          <label><Etiqueta texto="Tipo" /><select value={tipo} onChange={(event) => setTipo(event.target.value as TipoEspacio)} className={inputClass}><option value="aprobacion">Aprobación</option><option value="archivos">Archivos</option><option value="tablero">Tablero</option></select></label>
          <div><Etiqueta texto="Ícono según el tipo" /><div className="flex h-[42px] items-center gap-2 rounded-xl border border-[#E6EBF5] bg-[#F8FAFC] px-3 text-xs font-bold text-[#64748B]"><span className="text-[#042E7B]"><IconoEspacio tipo={tipo} className="h-5 w-5" /></span>{tipo === "aprobacion" ? "Aprobación" : tipo === "archivos" ? "Archivos" : "Tablero"}</div></div>
          <label><Etiqueta texto="Color" /><input type="color" value={color} onChange={(event) => setColor(event.target.value)} className="h-[42px] w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-1" /></label>
        </div>
        {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-[#042E7B]"><input type="checkbox" checked={publicado} onChange={(event) => setPublicado(event.target.checked)} className="h-4 w-4 accent-[#1883FF]" />Publicar al crear</label>
          <button type="submit" disabled={guardando || !nombre.trim()} className="cursor-pointer rounded-xl bg-[#FFCC00] px-5 py-2.5 text-sm font-black text-[#042E7B] disabled:opacity-50">{guardando ? "Creando…" : "+ Crear espacio"}</button>
        </div>
      </form>
      {errorInvitaciones && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Los espacios siguen disponibles, pero no se pudo cargar el selector de cuestionarios: {errorInvitaciones}
        </p>
      )}
      {espacios.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-sm text-slate-500">Aún no hay espacios.</div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {espacios.map((espacio) => (
            <TarjetaEspacioAdmin
              key={espacio.id}
              espacio={espacio}
              invitaciones={invitaciones}
              cargandoInvitaciones={cargandoInvitaciones}
              onUpdated={onUpdated}
              onOpenArchivos={onOpenArchivos}
              onOpenTablero={onOpenTablero}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProyectosPage() {
  const [proyectos, setProyectos] = useState<ProyectoListado[]>([]);
  const [espacios, setEspacios] = useState<EspacioListado[]>([]);
  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [seccion, setSeccion] = useState<"proyectos" | "espacios">("proyectos");
  const [bandejaAbierta, setBandejaAbierta] = useState(true);
  const [modal, setModal] = useState<"manual" | "importar" | null>(null);
  const [proyectoAbierto, setProyectoAbierto] = useState<string | null>(null);
  const [espacioArchivos, setEspacioArchivos] = useState<EspacioListado | null>(null);
  const [espacioTablero, setEspacioTablero] = useState<EspacioListado | null>(null);
  const [acceso, setAcceso] = useState<AccesoProyectos | null>(null);
  const [cargandoAcceso, setCargandoAcceso] = useState(true);
  const [errorAcceso, setErrorAcceso] = useState("");

  useEffect(() => {
    let vigente = true;

    const cargarAcceso = async () => {
      setCargandoAcceso(true);
      setErrorAcceso("");
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("No se pudo verificar la sesión actual.");

        const { data, error: perfilError } = await supabase
          .from("admin_perfiles")
          .select("rol, proyectos, nombre, usuario")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (perfilError) throw perfilError;
        if (!vigente) return;

        setAcceso(data
          ? {
              esAdmin: data.rol !== "colaborador",
              proyectos: Array.isArray(data.proyectos) ? data.proyectos : [],
              nombre: data.nombre || data.usuario || "Un colaborador",
            }
          : { esAdmin: true, proyectos: [], nombre: "Kyoszen" });
      } catch (cause) {
        if (vigente) {
          setErrorAcceso(
            cause instanceof Error
              ? cause.message
              : "No se pudo verificar el acceso a proyectos.",
          );
        }
      } finally {
        if (vigente) setCargandoAcceso(false);
      }
    };

    void cargarAcceso();
    return () => {
      vigente = false;
    };
  }, []);

  const esAdmin = acceso?.esAdmin === true;
  const proyectosPermitidos = useMemo(
    () => new Set(acceso?.proyectos ?? []),
    [acceso?.proyectos],
  );
  const proyectosVisibles = useMemo(
    () => esAdmin
      ? proyectos
      : proyectos.filter((proyecto) => proyectosPermitidos.has(proyecto.id)),
    [esAdmin, proyectos, proyectosPermitidos],
  );
  const pendientesVisibles = useMemo(
    () => esAdmin
      ? pendientes
      : pendientes.filter((pendiente) => proyectosPermitidos.has(pendiente.proyecto.id)),
    [esAdmin, pendientes, proyectosPermitidos],
  );

  const abrirProyecto = useCallback((proyectoId: string) => {
    if (!acceso || (!acceso.esAdmin && !proyectosPermitidos.has(proyectoId))) return;
    setProyectoAbierto(proyectoId);
  }, [acceso, proyectosPermitidos]);

  useEffect(() => {
    if (!acceso || acceso.esAdmin) return;
    setSeccion("proyectos");
    setModal(null);
    setEspacioArchivos(null);
    setEspacioTablero(null);
    if (proyectoAbierto && !proyectosPermitidos.has(proyectoAbierto)) {
      setProyectoAbierto(null);
    }
  }, [acceso, proyectoAbierto, proyectosPermitidos]);

  const cargar = useCallback(async () => {
    setCargando(true); setError("");
    try {
      const [proyectosResponse, pendientesResponse, espaciosResponse] = await Promise.all([
        fetchAdmin("/api/admin/proyectos"),
        fetchAdmin("/api/admin/proyectos/pendientes"),
        fetchAdmin("/api/admin/proyectos/espacios"),
      ]);
      if (!proyectosResponse.ok) throw new Error(await mensajeError(proyectosResponse, "No se pudieron cargar los proyectos."));
      if (!pendientesResponse.ok) throw new Error(await mensajeError(pendientesResponse, "No se pudo cargar la bandeja de pendientes."));
      if (!espaciosResponse.ok) throw new Error(await mensajeError(espaciosResponse, "No se pudieron cargar los espacios."));
      const [lista, bandeja, espaciosData] = await Promise.all([
        proyectosResponse.json() as Promise<ProyectoListado[]>,
        pendientesResponse.json() as Promise<Pendiente[]>,
        espaciosResponse.json() as Promise<{ espacios: EspacioListado[] }>,
      ]);
      setProyectos(lista);
      setPendientes(bandeja);
      setEspacios(espaciosData.espacios ?? []);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo cargar el Centro de Proyectos."); }
    finally { setCargando(false); }
  }, []);
  useEffect(() => { void cargar(); }, [cargar]);
  const creado = async (id: string) => { setModal(null); await cargar(); abrirProyecto(id); };
  const cerrarDetalle = () => { setProyectoAbierto(null); void cargar(); };
  const asignarEspacio = async (proyectoId: string, espacioId: string | null) => {
    setError("");
    try {
      const response = await fetchAdmin(`/api/admin/proyectos/${proyectoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ espacio_id: espacioId }),
      });
      if (!response.ok) throw new Error(await mensajeError(response, "No se pudo asignar el espacio."));
      await cargar();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo asignar el espacio.");
    }
  };

  return (
    <div className="min-h-full bg-[#F8FAFC] p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#042E7B] sm:text-3xl">Centro de Proyectos</h1>
            <p className="mt-1.5 text-sm text-slate-500">Gestiona espacios y la aprobación granular por escena.</p>
          </div>
          {esAdmin && seccion === "proyectos" && (
            <div className="flex flex-wrap gap-2">
              <a href="/revisor?tab=proyectos" target="_blank" rel="noopener" title="Ver el portal como lo ve el cliente" className="inline-flex items-center gap-2 rounded-xl border border-[#042E7B]/25 bg-white px-4 py-2.5 text-sm font-black text-[#042E7B] transition hover:border-[#1883FF]/40 hover:bg-blue-50 hover:text-[#1883FF]">
                <IconUI name="eye" size={16} />Vista cliente
              </a>
              <button type="button" onClick={() => setModal("importar")} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#1883FF]/25 bg-white px-4 py-2.5 text-sm font-black text-[#1883FF] hover:bg-blue-50">
                <IconoLinea nombre="subir" className="h-4 w-4" />Importar guion
              </button>
              <button type="button" onClick={() => setModal("manual")} className="cursor-pointer rounded-xl bg-[#FFCC00] px-4 py-2.5 text-sm font-black text-[#042E7B]">+ Nuevo proyecto</button>
            </div>
          )}
        </header>
        <nav className="mb-7 flex gap-1 border-b border-[#E6EBF5]" aria-label="Secciones del Centro de Proyectos">
          {(esAdmin ? ["proyectos", "espacios"] as const : ["proyectos"] as const).map((id) => (
            <button key={id} type="button" onClick={() => setSeccion(id)} className={`relative inline-flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-black transition after:absolute after:inset-x-3 after:bottom-[-1px] after:h-0.5 after:rounded-full ${seccion === id ? "text-[#042E7B] after:bg-[#1883FF]" : "text-slate-500 after:bg-transparent hover:text-[#1883FF]"}`}>
              {id === "proyectos" ? <IconoEspacio tipo="aprobacion" className="h-[18px] w-[18px]" /> : <IconoLinea nombre="carpeta" className="h-[18px] w-[18px]" />}
              {id === "proyectos" ? "Proyectos" : "Espacios"}
            </button>
          ))}
        </nav>
        {(error || errorAcceso) && <p className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{errorAcceso || error}</p>}
        {cargando || cargandoAcceso ? (
          <div className="flex min-h-64 items-center justify-center"><Spinner /></div>
        ) : errorAcceso || !acceso ? null : esAdmin && seccion === "espacios" ? (
          <GestionEspacios espacios={espacios} onUpdated={cargar} onOpenArchivos={setEspacioArchivos} onOpenTablero={setEspacioTablero} />
        ) : (
          <>
            <section className="mb-7 overflow-hidden rounded-2xl border border-red-100 bg-white shadow-[0_1px_2px_rgba(4,46,123,.05)]">
              <button type="button" onClick={() => setBandejaAbierta((abierta) => !abierta)} className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left">
                <span className="flex items-center gap-2 font-black text-[#042E7B]"><PuntoEstado color="#DC2626" />Por corregir <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">{pendientesVisibles.length}</span></span>
                <span className="text-sm text-slate-400">{bandejaAbierta ? "Ocultar" : "Mostrar"}</span>
              </button>
              {bandejaAbierta && (pendientesVisibles.length ? (
                <div className="divide-y divide-slate-100 border-t border-slate-100">
                  {pendientesVisibles.map((pendiente) => (
                    <button key={pendiente.id} type="button" onClick={() => abrirProyecto(pendiente.proyecto.id)} className="block w-full cursor-pointer px-5 py-4 text-left hover:bg-red-50/40">
                      <p className="text-sm font-black text-[#042E7B]">{pendiente.proyecto.titulo} <span className="font-semibold text-slate-400">· {pendiente.etapa.nombre} · {pendiente.escena ? `Escena ${pendiente.escena.numero}: ${pendiente.escena.titulo}` : "Entregable único"}</span></p>
                      {pendiente.ultimo_comentario ? <p className="mt-1 line-clamp-2 text-sm text-slate-600"><strong>{pendiente.ultimo_comentario.autor_nombre}:</strong> {pendiente.ultimo_comentario.contenido}</p> : <p className="mt-1 text-xs italic text-slate-400">Sin comentario asociado.</p>}
                    </button>
                  ))}
                </div>
              ) : <p className="flex items-center gap-2 border-t border-slate-100 px-5 py-4 text-sm font-semibold text-emerald-700"><PuntoEstado color="#16A34A" />Sin cambios pendientes</p>)}
            </section>
            {proyectosVisibles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF2FF] text-[#042E7B]"><IconoEspacio tipo="aprobacion" /></span>
                <h2 className="mt-3 font-black text-[#042E7B]">{esAdmin ? "Aún no hay proyectos" : "Aún no tienes videos asignados"}</h2>
                <p className="mt-1 text-sm text-slate-500">{esAdmin ? "Crea uno manualmente o importa un guion." : "Pídele acceso a un administrador."}</p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {proyectosVisibles.map((proyecto) => (
                  <article key={proyecto.id} className="overflow-hidden rounded-2xl border border-[#E6EBF5] bg-white shadow-[0_1px_2px_rgba(4,46,123,.05)] transition hover:-translate-y-0.5 hover:border-[#BFD5FF] hover:shadow-[0_14px_30px_-16px_rgba(4,46,123,.22)]">
                    <button type="button" onClick={() => abrirProyecto(proyecto.id)} className="group block w-full cursor-pointer p-5 text-left">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0"><h2 className="truncate font-black text-[#042E7B] group-hover:text-[#1883FF]">{proyecto.titulo}</h2>{proyecto.folio && <p className="mt-1 text-xs font-bold text-slate-400">{proyecto.folio}</p>}{proyecto.area && <p className="mt-1 truncate text-xs font-semibold text-slate-500">{proyecto.area}</p>}</div>
                        <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${proyecto.publicado ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}><PuntoEstado color={proyecto.publicado ? "#16A34A" : "#94A3B8"} />{proyecto.publicado ? "Publicado" : "Borrador"}</span>
                      </div>
                      <div className="my-5 flex flex-wrap gap-2">
                        {proyecto.proyecto_etapas.map((etapa) => { const ui = ESTADO_ETAPA_UI[etapa.estado]; return <span key={etapa.id} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-extrabold" style={{ color: ui.color }}><PuntoEstado color={ui.color} />{etapa.nombre}{etapa.progreso.total > 0 ? ` ${etapa.progreso.aprobado}/${etapa.progreso.total}` : ""}</span>; })}
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-xs text-slate-400">{proyecto.escenas_count} {proyecto.escenas_count === 1 ? "escena" : "escenas"}</span><span className="text-xs font-bold text-[#1883FF]">Ver detalle →</span></div>
                    </button>
                    {esAdmin && <label className="block border-t border-slate-100 bg-slate-50 px-5 py-3">
                      <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">Espacio</span>
                      <select value={proyecto.espacio_id ?? ""} onChange={(event) => void asignarEspacio(proyecto.id, event.target.value || null)} className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-[#042E7B] outline-none focus:border-[#1883FF]">
                        <option value="">Sin espacio</option>
                        {espacios.filter(({ tipo }) => tipo === "aprobacion").map((espacio) => <option key={espacio.id} value={espacio.id}>{espacio.nombre}</option>)}
                      </select>
                    </label>}
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      {esAdmin && modal === "manual" && <ModalManual onClose={() => setModal(null)} onCreated={creado} />}
      {esAdmin && modal === "importar" && <ModalImportador onClose={() => setModal(null)} onCreated={creado} />}
      {proyectoAbierto && (esAdmin || proyectosPermitidos.has(proyectoAbierto)) && <ModalDetalle proyectoId={proyectoAbierto} esAdmin={esAdmin} autorNombre={acceso?.nombre ?? "Kyoszen"} onClose={cerrarDetalle} />}
      {esAdmin && espacioArchivos && <GestorArchivos espacio={espacioArchivos} onClose={() => setEspacioArchivos(null)} onUpdated={cargar} />}
      {esAdmin && espacioTablero && <TableroAdmin espacio={espacioTablero} onClose={() => setEspacioTablero(null)} onUpdated={cargar} />}
    </div>
  );
}
