/* Campañas pagadas — tipos y helpers compartidos (admin + revisor).
   Mismo patrón de estados/comentarios que el módulo de redes sociales. */

export type EstadoCampana = "pendiente" | "aprobado" | "cambios";

export const ESTADOS_CAMPANA: Record<EstadoCampana, { label: string; bg: string; color: string; dot: string }> = {
  pendiente: { label: "Pendiente revisión", bg: "#FEF9C3", color: "#854D0E", dot: "#EAB308" },
  aprobado:  { label: "Aprobado",            bg: "#DCFCE7", color: "#166534", dot: "#22C55E" },
  cambios:   { label: "Cambios solicitados", bg: "#FEE2E2", color: "#991B1B", dot: "#EF4444" },
};

/** Cómo se le presenta la campaña al cliente.
 *  - `revision`: la aprueba anuncio por anuncio antes de salir al aire.
 *  - `en_curso`: ya está corriendo en Meta. Solo la ve; si quiere, comenta. */
export type ModoCampana = "revision" | "en_curso";

export const MODOS_CAMPANA: Record<ModoCampana, { label: string; corto: string; descripcion: string }> = {
  revision: {
    label: "Revisión del cliente",
    corto: "En revisión",
    descripcion: "El cliente aprueba cada anuncio antes de que salga al aire.",
  },
  en_curso: {
    label: "Ya está corriendo",
    corto: "En curso",
    descripcion: "La campaña ya está publicada en Meta. El cliente solo la ve y puede dejar comentarios.",
  },
};

/** true cuando la campaña ya está al aire y no se le pide aprobación al cliente. */
export function esEnCurso(campana: Pick<Campana, "modo">): boolean {
  return campana.modo === "en_curso";
}

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
  modo: ModoCampana;
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

/** Un anuncio lleva formulario solo si tiene preguntas o pantalla de confirmación.
    Las campañas de alcance no llevan: el candidato solo ve el anuncio. */
export function tieneFormulario(anuncio: Pick<CampanaAnuncio, "formulario">): boolean {
  const f = anuncio.formulario;
  return (f?.preguntas?.length ?? 0) > 0 || !!f?.pantalla_confirmacion?.trim();
}

/** Pasos del recorrido del candidato. Si la campaña no trae un flujo propio,
    se arma uno con sus datos reales, distinto según lleve formulario o no. */
export function flujoDeCampana(campana: Campana): PasoFlujo[] {
  if (campana.flujo && campana.flujo.length > 0) return campana.flujo;

  const anuncios = campana.campana_anuncios ?? [];
  const conFormulario = anuncios.filter(tieneFormulario);
  const numPreguntas = conFormulario[0]?.formulario?.preguntas?.length ?? 0;
  const cta = anuncios[0]?.cta ?? "Registrarte";
  const red = campana.plataforma === "facebook" ? "Facebook" : campana.plataforma;

  const verAnuncio: PasoFlujo = {
    titulo: `Ve el anuncio en ${red}`,
    detalle: campana.segmentacion?.ubicaciones?.length
      ? `Le aparece a quien vive en ${campana.segmentacion.ubicaciones.join(", ")}.`
      : "Le aparece al público segmentado de la campaña.",
    icono: "users",
  };

  const llegaAlReclutamiento: PasoFlujo = {
    titulo: "Se presenta al reclutamiento",
    detalle: campana.sede_texto ?? "Llega a la sede con su documentación completa.",
    icono: "location",
  };

  // Campaña de alcance: no hay formulario, la información vive en el anuncio
  if (conFormulario.length === 0) {
    return [
      verAnuncio,
      {
        titulo: "Lee la vacante en la imagen",
        detalle: "El sueldo, el puesto y las fechas del reclutamiento van en el arte del anuncio.",
        icono: "clipboard",
      },
      {
        titulo: `Toca "${cta}"`,
        detalle: "Llega a la publicación completa, donde puede guardarla, compartirla o escribirnos.",
        icono: "mouse-pointer",
      },
      {
        ...llegaAlReclutamiento,
        detalle: campana.fechas_reclutamiento
          ? `${campana.fechas_reclutamiento}. ${campana.sede_texto ?? ""}`.trim()
          : llegaAlReclutamiento.detalle,
      },
    ];
  }

  return [
    verAnuncio,
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
    llegaAlReclutamiento,
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
