/* Campañas pagadas — tipos y helpers compartidos (admin + revisor).
   Mismo patrón de estados/comentarios que el módulo de redes sociales. */

export type EstadoCampana = "pendiente" | "aprobado" | "cambios";

export const ESTADOS_CAMPANA: Record<EstadoCampana, { label: string; bg: string; color: string; dot: string }> = {
  pendiente: { label: "Pendiente revisión", bg: "#FEF9C3", color: "#854D0E", dot: "#EAB308" },
  aprobado:  { label: "Aprobado",            bg: "#DCFCE7", color: "#166534", dot: "#22C55E" },
  cambios:   { label: "Cambios solicitados", bg: "#FEE2E2", color: "#991B1B", dot: "#EF4444" },
};

export type TipoPregunta = "opcion" | "texto" | "telefono" | "numero";

export interface PreguntaFormulario {
  pregunta: string;
  tipo: TipoPregunta;
  opciones?: string[];
  nota?: string;
}

export interface FormularioAnuncio {
  intro?: string;
  preguntas: PreguntaFormulario[];
  pantalla_confirmacion?: string;
}

export interface Segmentacion {
  ubicaciones?: string[];
  edad?: string;
  ancla?: string;
  publico_estimado?: string;
  nota?: string;
}

export interface PasoFlujo {
  titulo: string;
  detalle: string;
  icono: "mouse-pointer" | "clipboard" | "check" | "location" | "send" | "users";
}

export interface CampanaComentario {
  id: number;
  autor_nombre: string;
  autor_rol: string;
  contenido: string;
  created_at: string;
}

export interface CampanaAnuncio {
  id: number;
  campana_id: number;
  puesto: string;
  imagen_url: string | null;
  texto_principal: string | null;
  titulo: string | null;
  descripcion: string | null;
  cta: string;
  formulario: FormularioAnuncio;
  estado: EstadoCampana;
  orden: number;
  campana_comentarios?: CampanaComentario[];
}

export interface Campana {
  id: number;
  nombre: string;
  cliente_final: string | null;
  plataforma: string;
  tipo: string;
  objetivo: string | null;
  publica_desde: string | null;
  segmentacion: Segmentacion;
  presupuesto_texto: string | null;
  fecha_difusion: string | null;
  fechas_reclutamiento: string | null;
  meta_texto: string | null;
  sede_texto: string | null;
  flujo: PasoFlujo[] | null;
  /** Solo admin — nunca se envía al revisor. */
  nota_interna?: string | null;
  estado: EstadoCampana;
  publicado: boolean;
  orden: number;
  created_at: string;
  campana_anuncios?: CampanaAnuncio[];
}

/** Estado de la campaña a partir de sus anuncios: rojo si alguno pide cambios,
    verde solo si todos están aprobados, amarillo mientras falte alguno. */
export function rollupCampana(anuncios: { estado: EstadoCampana }[]): EstadoCampana {
  if (anuncios.length === 0) return "pendiente";
  if (anuncios.some(a => a.estado === "cambios")) return "cambios";
  if (anuncios.every(a => a.estado === "aprobado")) return "aprobado";
  return "pendiente";
}

/** Pasos del recorrido del candidato. Si la campaña no trae un flujo propio,
    se arma uno estándar con sus datos reales (preguntas, fechas, sede). */
export function flujoDeCampana(campana: Campana): PasoFlujo[] {
  if (campana.flujo && campana.flujo.length > 0) return campana.flujo;

  const anuncios = campana.campana_anuncios ?? [];
  const numPreguntas = anuncios[0]?.formulario?.preguntas?.length ?? 0;
  const cta = anuncios[0]?.cta ?? "Registrarte";
  const red = campana.plataforma === "facebook" ? "Facebook" : campana.plataforma;

  return [
    {
      titulo: `Ve el anuncio en ${red}`,
      detalle: campana.segmentacion?.ubicaciones?.length
        ? `Le aparece a quien vive en ${campana.segmentacion.ubicaciones.join(", ")}.`
        : "Le aparece al público segmentado de la campaña.",
      icono: "users",
    },
    {
      titulo: `Toca "${cta}"`,
      detalle: "El formulario se abre dentro de Facebook. No sale de la app ni tiene que descargar nada.",
      icono: "mouse-pointer",
    },
    {
      titulo: numPreguntas ? `Contesta ${numPreguntas} preguntas` : "Contesta el formulario",
      detalle: "Filtramos desde aquí: zona, experiencia, disponibilidad y documentación.",
      icono: "clipboard",
    },
    {
      titulo: "Recibe la confirmación",
      detalle: campana.fechas_reclutamiento
        ? `Al terminar ve la cita: ${campana.fechas_reclutamiento}, con la dirección y los documentos que debe llevar.`
        : "Al terminar ve la cita, la dirección y los documentos que debe llevar.",
      icono: "check",
    },
    {
      titulo: "Se presenta al reclutamiento",
      detalle: campana.sede_texto ?? "Llega a la sede con su documentación completa.",
      icono: "location",
    },
  ];
}

/** Resumen de estados para las píldoras de la parte superior. */
export function statsAnuncios(anuncios: { estado: EstadoCampana }[]) {
  return {
    total: anuncios.length,
    aprobados: anuncios.filter(a => a.estado === "aprobado").length,
    pendientes: anuncios.filter(a => a.estado === "pendiente").length,
    cambios: anuncios.filter(a => a.estado === "cambios").length,
  };
}
