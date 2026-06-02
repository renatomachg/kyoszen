import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Métricas de un período. Fuente intercambiable:
 * Fase 1 → datos del sitio (site_eventos, social_posts, contactos, aplicaciones)
 * Fase 2 → se añade Meta (alcance, seguidores, engagement orgánico)
 */
export interface MetricasInforme {
  fuente: "sitio" | "meta";
  // Actividad de contenido
  publicaciones_total: number;
  publicaciones_aprobadas: number;
  publicaciones_por_red: Record<string, number>;
  // Conversión / negocio (lo que más le vende al cliente)
  whatsapp_clicks: number;
  vacante_vistas: number;
  vacante_aplicaciones: number;
  curso_informes: number;
  kyo_mensajes: number;
  contactos: number;
  aplicaciones: number;
  // Comparativa con el mes anterior (% de cambio)
  vs_anterior: {
    whatsapp_clicks: number | null;
    vacante_vistas: number | null;
    contactos: number | null;
  };
  // Mejor contenido del período (proxy de engagement en fase 1: comentarios + aprobación)
  top_contenido: { titulo: string; red: string; comentarios: number; estado: string }[];
  // Señales para propuestas
  interes_cursos: number;     // curso_informes_click + enviada
  interes_vacantes: number;   // vacante_vista + aplicar
}

const conteo = (eventos: { tipo: string }[], tipo: string) =>
  eventos.filter((e) => e.tipo === tipo).length;

function pctCambio(actual: number, anterior: number): number | null {
  if (anterior === 0) return actual > 0 ? 100 : null;
  return Math.round(((actual - anterior) / anterior) * 100);
}

export async function calcularMetricasSitio(
  sb: SupabaseClient,
  desde: string,
  hasta: string,
  desdeAnt: string,
  hastaAnt: string
): Promise<MetricasInforme> {
  const [
    { data: eventos },
    { data: eventosAnt },
    { data: posts },
    { data: contactosRows },
    { data: aplicacionesRows },
    { data: contactosAnt },
  ] = await Promise.all([
    sb.from("site_eventos").select("tipo, valor").gte("created_at", desde).lte("created_at", hasta + "T23:59:59"),
    sb.from("site_eventos").select("tipo").gte("created_at", desdeAnt).lte("created_at", hastaAnt + "T23:59:59"),
    sb.from("social_posts").select("id, red_social, estado, titulo_interno, fecha_programada, social_comments(id)").gte("fecha_programada", desde).lte("fecha_programada", hasta),
    sb.from("contactos").select("id").gte("created_at", desde).lte("created_at", hasta + "T23:59:59"),
    sb.from("aplicaciones").select("id").gte("created_at", desde).lte("created_at", hasta + "T23:59:59"),
    sb.from("contactos").select("id").gte("created_at", desdeAnt).lte("created_at", hastaAnt + "T23:59:59"),
  ]);

  const ev = eventos ?? [];
  const evAnt = eventosAnt ?? [];
  const ps = posts ?? [];

  const porRed: Record<string, number> = {};
  for (const p of ps) porRed[p.red_social] = (porRed[p.red_social] ?? 0) + 1;

  const whatsapp = conteo(ev, "whatsapp_click");
  const vacanteVistas = conteo(ev, "vacante_vista");
  const contactosN = (contactosRows ?? []).length;

  const topContenido = ps
    .map((p) => ({
      titulo: p.titulo_interno || "Publicación",
      red: p.red_social,
      comentarios: (p.social_comments?.length ?? 0),
      estado: p.estado,
    }))
    .sort((a, b) => b.comentarios - a.comentarios)
    .slice(0, 5);

  return {
    fuente: "sitio",
    publicaciones_total: ps.length,
    publicaciones_aprobadas: ps.filter((p) => p.estado === "aprobado").length,
    publicaciones_por_red: porRed,
    whatsapp_clicks: whatsapp,
    vacante_vistas: vacanteVistas,
    vacante_aplicaciones: conteo(ev, "vacante_aplicacion_enviada"),
    curso_informes: conteo(ev, "curso_informes_click") + conteo(ev, "curso_informes_enviada"),
    kyo_mensajes: conteo(ev, "kyo_mensaje"),
    contactos: contactosN,
    aplicaciones: (aplicacionesRows ?? []).length,
    vs_anterior: {
      whatsapp_clicks: pctCambio(whatsapp, conteo(evAnt, "whatsapp_click")),
      vacante_vistas: pctCambio(vacanteVistas, conteo(evAnt, "vacante_vista")),
      contactos: pctCambio(contactosN, (contactosAnt ?? []).length),
    },
    top_contenido: topContenido,
    interes_cursos: conteo(ev, "curso_informes_click") + conteo(ev, "curso_informes_enviada"),
    interes_vacantes: conteo(ev, "vacante_vista") + conteo(ev, "vacante_aplicar_click"),
  };
}

/** Reglas que detectan patrones reales (nada inventado) para fundamentar las decisiones. */
export function detectarPatrones(m: MetricasInforme): string[] {
  const p: string[] = [];

  // Red con más actividad
  const redes = Object.entries(m.publicaciones_por_red).sort((a, b) => b[1] - a[1]);
  if (redes.length > 0) p.push(`Red con más publicaciones: ${redes[0][0]} (${redes[0][1]} piezas).`);

  // Conversión a WhatsApp con tendencia
  if (m.whatsapp_clicks > 0) {
    const t = m.vs_anterior.whatsapp_clicks;
    p.push(`Clics a WhatsApp: ${m.whatsapp_clicks}${t !== null ? ` (${t >= 0 ? "+" : ""}${t}% vs mes anterior)` : ""}.`);
  }

  // Interés por línea de servicio
  if (m.interes_cursos > m.interes_vacantes && m.interes_cursos > 0)
    p.push(`Mayor interés en CURSOS/capacitación (${m.interes_cursos} interacciones) que en vacantes.`);
  else if (m.interes_vacantes > 0)
    p.push(`Mayor interés en VACANTES (${m.interes_vacantes} interacciones).`);

  // Contenido top
  if (m.top_contenido[0] && m.top_contenido[0].comentarios > 0)
    p.push(`Publicación con más interacción: "${m.top_contenido[0].titulo}" (${m.top_contenido[0].comentarios} comentarios).`);

  // Leads
  if (m.contactos > 0 || m.aplicaciones > 0)
    p.push(`Leads recibidos: ${m.contactos} contactos por formulario, ${m.aplicaciones} aplicaciones a vacantes.`);

  return p;
}

export function periodoLabel(year: number, month0: number): string {
  const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  return `${meses[month0]} ${year}`;
}
