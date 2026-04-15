import type Anthropic from "@anthropic-ai/sdk";
import { knowledge } from "./knowledge";

/**
 * Tool definitions given to Claude.
 * Each tool is a function the assistant can call to query the knowledge layer
 * or trigger a client-side action (e.g., navigation).
 */

export const TOOLS: Anthropic.Tool[] = [
  {
    name: "search_courses",
    description:
      "Busca cursos en el catalogo de Kyoszen. Usa esto cuando el usuario pregunte por cursos, capacitaciones o formacion. Siempre usa esta herramienta antes de responder sobre cursos especificos.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Texto libre para buscar en titulo, descripcion o lo que se aprende" },
        category: { type: "string", description: "Filtra por categoria: RRHH, Liderazgo, Calidad, Digital, Ventas, Normatividad" },
        modality: { type: "string", description: "Filtra por modalidad: en-vivo, online, hibrido" },
      },
    },
  },
  {
    name: "get_course_details",
    description: "Obtiene toda la informacion de un curso por su slug (incluye contenido, que aprenderas, modulos, dirigido a, etc).",
    input_schema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "El slug del curso, ej: 'auditoria-interna' o 'nom-035'" },
      },
      required: ["slug"],
    },
  },
  {
    name: "search_jobs",
    description:
      "Busca vacantes disponibles en el sitio. Usa esto cuando el usuario pregunte por empleos, vacantes, puestos o oportunidades laborales.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Texto libre para buscar en titulo, descripcion, empresa o skills" },
        category: { type: "string", description: "Filtra por categoria: Administrativo, Ventas, Operaciones, Atencion al cliente, RRHH" },
        location: { type: "string", description: "Filtra por ubicacion: CDMX, Estado de Mexico, Hibrido, Remoto" },
      },
    },
  },
  {
    name: "get_job_details",
    description: "Obtiene toda la informacion de una vacante especifica por su id.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "number", description: "El id de la vacante" },
      },
      required: ["id"],
    },
  },
  {
    name: "navigate_to",
    description:
      "Lleva al usuario a una pagina del sitio. Usa esta herramienta cuando el usuario quiera ir a una seccion especifica, ver detalles de un curso o vacante, o cuando la informacion solicitada esta mejor presentada visualmente en una pagina.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Ruta a navegar, ej: '/cursos', '/cursos/auditoria-interna', '/vacantes', '/contacto'" },
        reason: { type: "string", description: "Breve explicacion de por que se lleva al usuario a esa pagina (se muestra en la conversacion)" },
      },
      required: ["path"],
    },
  },
  {
    name: "get_company_info",
    description:
      "Obtiene informacion general de Kyoszen: descripcion, estadisticas, contacto, servicios, proceso de trabajo y FAQs. Usa esto para preguntas sobre la empresa, horarios, telefono, o preguntas frecuentes.",
    input_schema: { type: "object", properties: {} },
  },
];

/**
 * Handles tool calls from Claude. Returns the tool result as a string.
 * Navigation tools are special - they return a signal that the frontend
 * will interpret to trigger router.push().
 */
export async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  switch (name) {
    case "search_courses": {
      const results = knowledge.listCourses(input as { query?: string; category?: string; modality?: string });
      return JSON.stringify({ count: results.length, courses: results });
    }
    case "get_course_details": {
      const course = knowledge.getCourse(input.slug as string);
      if (!course) return JSON.stringify({ error: "Curso no encontrado" });
      return JSON.stringify(course);
    }
    case "search_jobs": {
      const results = knowledge.listJobs(input as { query?: string; category?: string; location?: string });
      return JSON.stringify({ count: results.length, jobs: results });
    }
    case "get_job_details": {
      const job = knowledge.getJob(input.id as number);
      if (!job) return JSON.stringify({ error: "Vacante no encontrada" });
      return JSON.stringify(job);
    }
    case "navigate_to": {
      // The frontend will detect this tool call and trigger navigation.
      // We return a confirmation here.
      return JSON.stringify({
        navigated: true,
        path: input.path as string,
        reason: (input.reason as string) ?? "",
      });
    }
    case "get_company_info": {
      return JSON.stringify(knowledge.getCompanyInfo());
    }
    default:
      return JSON.stringify({ error: `Tool ${name} no implementada` });
  }
}
