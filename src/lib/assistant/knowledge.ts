import { COURSES, type Course } from "@/lib/courses";
import { JOBS, type Job } from "@/lib/jobs";

/**
 * KnowledgeProvider is the abstraction that the AI assistant uses to query
 * business data (courses, jobs, site pages, future docs).
 *
 * The current implementation reads from in-repo static data.
 * In phase 2, a SupabaseKnowledgeProvider will replace this without any change
 * to the assistant, tools, or chat logic.
 */

export interface SitePage {
  path: string;
  title: string;
  purpose: string;
  summary: string;
}

export interface CourseSummary {
  slug: string;
  titulo: string;
  categoriaLabel: string;
  modalidad: string;
  horas: number;
  nivel: string;
  descripcionCorta?: string;
}

export interface JobSummary {
  id: number;
  titulo: string;
  empresa: string;
  categoria: string;
  ubicacion: string;
  contrato: string;
  jornada: string;
  salario: number;
  desc: string;
}

export interface KnowledgeProvider {
  listPages(): SitePage[];
  listCourses(filters?: { category?: string; modality?: string; query?: string }): CourseSummary[];
  getCourse(slug: string): Course | null;
  listJobs(filters?: { category?: string; location?: string; query?: string }): JobSummary[];
  getJob(id: number): Job | null;
  getCompanyInfo(): {
    name: string;
    tagline: string;
    description: string;
    stats: Record<string, string>;
    contact: Record<string, string>;
    services: { name: string; description: string }[];
    process: { step: string; title: string; description: string }[];
    faqs: { q: string; a: string }[];
  };
}

const SITE_PAGES: SitePage[] = [
  { path: "/", title: "Inicio", purpose: "Landing principal del sitio", summary: "Hero, servicios, proceso, testimonios, cursos y blog de Kyoszen." },
  { path: "/servicios", title: "Servicios", purpose: "Muestra los servicios de la consultora", summary: "Reclutamiento, capacitacion, onboarding, digitalizacion de RRHH, con detalle de cada uno." },
  { path: "/cursos", title: "Cursos", purpose: "Catalogo de cursos profesionales", summary: "15 cursos con filtros por categoria (RRHH, Liderazgo, Calidad, Digital, Ventas, Normatividad) y modalidad (En vivo, Online, Hibrido)." },
  { path: "/vacantes", title: "Vacantes", purpose: "Bolsa de trabajo", summary: "Vacantes activas con filtros de ubicacion, empresa, contrato, jornada y salario." },
  { path: "/nosotros", title: "Nosotros", purpose: "Informacion sobre la empresa", summary: "Historia, mision, valores, equipo y proceso de trabajo de Kyoszen." },
  { path: "/contacto", title: "Contacto", purpose: "Formulario de contacto y datos de oficina", summary: "Formulario directo, telefono (56 4004 5414), horario Lun-Vie 9am-6pm, WhatsApp." },
];

const COMPANY = {
  name: "Kyoszen",
  tagline: "Estrategia en Capital Humano",
  description:
    "Consultora mexicana especializada en capital humano para microempresas. Conectamos talento verificado con empresas en crecimiento mediante procesos agiles, tecnologia y trato genuinamente humano.",
  stats: {
    "Candidatos colocados": "687+",
    "Empresas atendidas": "672+",
    "Tasa de satisfaccion": "99%",
    "Tiempo de respuesta": "24 horas",
    "Años en el mercado": "3+",
  },
  contact: {
    telefono: "56 4004 5414",
    whatsapp: "https://wa.link/5zv0ba",
    horario: "Lunes a Viernes 9am-6pm",
    ubicacion: "CDMX, Mexico",
  },
  services: [
    { name: "Reclutamiento y Seleccion", description: "Identificacion, evaluacion y presentacion de candidatos verificados en menos de 72 horas." },
    { name: "Capacitacion y Cursos", description: "Programas de formacion en RRHH, liderazgo, calidad, normatividad y ventas con constancia DC-3." },
    { name: "Induccion y Onboarding", description: "Diseño de procesos de integracion efectivos para nuevos colaboradores." },
    { name: "Digitalizacion de RRHH", description: "Implementacion de herramientas digitales para modernizar el area de capital humano." },
  ],
  process: [
    { step: "01", title: "Identificamos el perfil", description: "Analizamos requerimientos, cultura y expectativas." },
    { step: "02", title: "Busqueda dirigida", description: "Reclutamos en multiples canales y evaluamos con criterio claro." },
    { step: "03", title: "Evaluacion profunda", description: "Verificamos habilidades, actitud, compatibilidad y documentacion." },
    { step: "04", title: "Cierre y seguimiento", description: "Presentamos candidatos y acompañamos hasta la contratacion exitosa." },
  ],
  faqs: [
    { q: "¿En cuanto tiempo presentan candidatos?", a: "En menos de 72 horas habiles presentamos la primera terna de candidatos verificados." },
    { q: "¿Que garantia dan?", a: "Si el candidato no funciona en los primeros 30 dias, hacemos reposicion sin costo adicional." },
    { q: "¿Donde operan?", a: "CDMX y Estado de Mexico principalmente, tambien perfiles remotos e hibridos." },
    { q: "¿Las constancias de cursos tienen validez oficial?", a: "Si, todas nuestras constancias son DC-3 con validez oficial STPS." },
    { q: "¿Tienen costos ocultos?", a: "No, somos 100% transparentes con nuestras tarifas desde el primer contacto." },
  ],
};

function matchesQuery(text: string, query: string | undefined): boolean {
  if (!query) return true;
  return text.toLowerCase().includes(query.toLowerCase());
}

export class StaticKnowledgeProvider implements KnowledgeProvider {
  listPages(): SitePage[] {
    return SITE_PAGES;
  }

  listCourses(filters?: { category?: string; modality?: string; query?: string }): CourseSummary[] {
    return COURSES
      .filter((c) => !filters?.category || c.categoria === filters.category || c.categoriaLabel.toLowerCase() === filters.category.toLowerCase())
      .filter((c) => !filters?.modality || c.modalidad === filters.modality)
      .filter((c) => !filters?.query || matchesQuery(c.titulo + " " + (c.descripcionCorta ?? "") + " " + (c.aprenderas ?? []).join(" "), filters.query))
      .map((c) => ({
        slug: c.slug,
        titulo: c.titulo,
        categoriaLabel: c.categoriaLabel,
        modalidad: c.modalidad,
        horas: c.horas,
        nivel: c.nivel,
        descripcionCorta: c.descripcionCorta,
      }));
  }

  getCourse(slug: string): Course | null {
    return COURSES.find((c) => c.slug === slug) ?? null;
  }

  listJobs(filters?: { category?: string; location?: string; query?: string }): JobSummary[] {
    return JOBS
      .filter((j) => !filters?.category || j.categoria.toLowerCase() === filters.category.toLowerCase())
      .filter((j) => !filters?.location || j.ubicacion.toLowerCase() === filters.location.toLowerCase())
      .filter((j) => !filters?.query || matchesQuery(j.titulo + " " + j.desc + " " + j.empresa + " " + j.tags.join(" "), filters.query))
      .map((j) => ({
        id: j.id,
        titulo: j.titulo,
        empresa: j.empresa,
        categoria: j.categoria,
        ubicacion: j.ubicacion,
        contrato: j.contrato,
        jornada: j.jornada,
        salario: j.salario,
        desc: j.desc,
      }));
  }

  getJob(id: number): Job | null {
    return JOBS.find((j) => j.id === id) ?? null;
  }

  getCompanyInfo() {
    return COMPANY;
  }
}

// Singleton instance used by the assistant.
// In phase 2 this will become: new SupabaseKnowledgeProvider(supabaseClient)
export const knowledge: KnowledgeProvider = new StaticKnowledgeProvider();
