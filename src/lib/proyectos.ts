export type TipoProyecto = "video_induccion";
export type EstadoProyecto = "activo" | "pausado" | "completado" | "archivado";
export type TipoEtapa = "guion" | "arte" | "video";
export type ModoEtapa = "por_escena" | "entregable_unico";
export type EstadoEtapa = "bloqueada" | "pendiente" | "aprobado" | "cambios";
export type EstadoBloque = "pendiente" | "aprobado" | "cambios";
export type RolAutor = "admin" | "cliente";
export type TipoEspacio = "aprobacion" | "archivos" | "tablero";

export interface Archivo {
  url: string;
  nombre: string;
  tipo: string;
  peso?: number;
}

export interface Proyecto {
  id: string;
  espacio_id: string | null;
  tipo: TipoProyecto;
  folio: string | null;
  titulo: string;
  area: string | null;
  descripcion: string | null;
  estado: EstadoProyecto;
  etapa_actual: number;
  publicado: boolean;
  created_at: string;
  updated_at: string;
}

export interface Espacio {
  id: string;
  nombre: string;
  tipo: TipoEspacio;
  descripcion: string | null;
  icono: string | null;
  color: string | null;
  cuestionario_token: string | null;
  orden: number;
  publicado: boolean;
  created_at: string;
  updated_at: string;
}

export interface EspacioArchivo {
  id: string;
  espacio_id: string;
  carpeta_id: string | null;
  requiere_aprobacion: boolean;
  nombre: string;
  url: string;
  tipo: string | null;
  peso: number | null;
  nota: string | null;
  estado: EstadoBloque;
  orden: number;
  created_at: string;
  updated_at: string;
}

export interface EspacioCarpeta {
  id: string;
  espacio_id: string;
  parent_id: string | null;
  nombre: string;
  orden: number;
  created_at: string;
  updated_at: string;
}

export interface EspacioColumna {
  id: string;
  espacio_id: string;
  nombre: string;
  orden: number;
  created_at: string;
}

export interface EspacioTarjeta {
  id: string;
  columna_id: string;
  titulo: string;
  descripcion: string | null;
  orden: number;
  created_at: string;
  updated_at: string;
}

export interface EspacioComentario {
  id: string;
  archivo_id: string | null;
  tarjeta_id: string | null;
  autor_nombre: string | null;
  autor_rol: RolAutor | null;
  contenido: string;
  created_at: string;
}

/** Quién da el visto bueno de una etapa.
 *  - `cliente`: la aprueba desde /revisor (guion, video).
 *  - `admin`: la aprueba Kyoszen desde el panel (arte). El cliente la ve, no la aprueba. */
export type Aprobador = "cliente" | "admin";

export interface ProyectoEtapa {
  id: string;
  proyecto_id: string;
  tipo: TipoEtapa;
  nombre: string;
  orden: number;
  modo: ModoEtapa;
  estado: EstadoEtapa;
  aprobador: Aprobador;
  created_at: string;
  updated_at: string;
}

/** El arte es producción interna; lo demás lo aprueba el cliente. */
export function apruebaElAdmin(etapa: Pick<ProyectoEtapa, "aprobador">): boolean {
  return etapa.aprobador === "admin";
}

/** Un bloque solo se puede aprobar si de verdad hay algo entregado.
 *  Evita el 9/9 en verde con las escenas vacías. */
export function tieneEntregable(
  bloque: Pick<ProyectoBloque, "contenido" | "archivos">,
  tipo: TipoEtapa
): boolean {
  if (tipo === "guion") {
    const c = bloque.contenido ?? {};
    return Boolean(
      (typeof c.locucion === "string" && c.locucion.trim()) ||
      (typeof c.en_pantalla === "string" && c.en_pantalla.trim())
    );
  }
  return (bloque.archivos?.length ?? 0) > 0;
}

export interface ProyectoEscena {
  id: string;
  proyecto_id: string;
  numero: number;
  titulo: string;
  orden: number;
  created_at: string;
}

export interface ProyectoBloque {
  id: string;
  etapa_id: string;
  escena_id: string | null;
  estado: EstadoBloque;
  contenido: Record<string, unknown>;
  archivos: Archivo[];
  nota: string | null;
  version_num: number;
  es_activa: boolean;
  /** false mientras una entrega interna espera el visto bueno del admin. */
  visible_cliente: boolean;
  entrega_estado: EntregaEstado;
  /** Quién hizo la entrega interna (el colaborador). */
  entrega_nombre: string | null;
  entrega_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Handoff interno colaborador → admin → cliente.
 *  - `ninguna`: flujo normal del admin, sin entrega pendiente.
 *  - `entregado`: un colaborador lo subió y espera revisión interna (el cliente NO lo ve).
 *  - `enviado`: el admin ya lo mandó al cliente. */
export type EntregaEstado = "ninguna" | "entregado" | "enviado";

/** Cuántos bloques de la etapa esperan revisión interna. */
export function entregasPendientes(bloques: Pick<ProyectoBloque, "entrega_estado">[]): number {
  return bloques.filter(b => b.entrega_estado === "entregado").length;
}

export interface ProyectoComentario {
  id: string;
  bloque_id: string;
  autor_nombre: string;
  autor_rol: RolAutor;
  contenido: string;
  created_at: string;
}

type PlantillaEtapa = {
  tipo: TipoEtapa;
  nombre: string;
  orden: number;
  modo: ModoEtapa;
};

// Etapas predeterminadas para cada tipo de proyecto.
export const PLANTILLAS: Record<TipoProyecto, PlantillaEtapa[]> = {
  video_induccion: [
    { tipo: "guion", nombre: "Guion", orden: 1, modo: "por_escena" },
    { tipo: "arte", nombre: "Arte", orden: 2, modo: "por_escena" },
    { tipo: "video", nombre: "Video", orden: 3, modo: "por_escena" },
  ],
};

// Devuelve la plantilla solicitada o la de video de inducción como respaldo.
export function getPlantilla(tipo: TipoProyecto): PlantillaEtapa[] {
  return PLANTILLAS[tipo] ?? PLANTILLAS.video_induccion;
}

type EstadoUI = { label: string; color: string; colorSuave: string };

// Etiquetas y colores para representar el estado de cada etapa en la interfaz.
export const ESTADO_ETAPA_UI: Record<EstadoEtapa, EstadoUI> = {
  bloqueada: { label: "Bloqueada", color: "#6B7280", colorSuave: "#F3F4F6" },
  pendiente: { label: "Pendiente", color: "#F59E0B", colorSuave: "#FEF3C7" },
  aprobado: { label: "Aprobado", color: "#16A34A", colorSuave: "#DCFCE7" },
  cambios: { label: "Cambios", color: "#DC2626", colorSuave: "#FEE2E2" },
};

// Etiquetas y colores para representar el estado de cada bloque en la interfaz.
export const ESTADO_BLOQUE_UI: Record<EstadoBloque, EstadoUI> = {
  pendiente: { label: "Pendiente", color: "#F59E0B", colorSuave: "#FEF3C7" },
  aprobado: { label: "Aprobado", color: "#16A34A", colorSuave: "#DCFCE7" },
  cambios: { label: "Cambios", color: "#DC2626", colorSuave: "#FEE2E2" },
};

// Calcula el estado agregado de una etapa a partir de sus bloques.
export function rollupEtapa(
  bloques: { estado: EstadoBloque }[],
): EstadoBloque | "pendiente" {
  if (bloques.some(({ estado }) => estado === "cambios")) return "cambios";
  if (
    bloques.length > 0 &&
    bloques.every(({ estado }) => estado === "aprobado")
  ) {
    return "aprobado";
  }
  return "pendiente";
}
