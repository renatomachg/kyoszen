/**
 * Migración: corrige acentos en tablas `cursos` y `vacantes` de Supabase.
 * Uso: node scripts/migrate-acentos.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xwzggymwdrvxpwvuefqf.supabase.co";
const SERVICE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3emdneW13ZHJ2eHB3dnVlZnFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU1MjA5OSwiZXhwIjoyMDk0MTI4MDk5fQ.939HnmBZLrXVDpx7w5ClXKAbuUaw_tD6-tZdO2u0L3o";

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

// ── Helpers ───────────────────────────────────────────────────────────────────
function ok(label, res) {
  if (res.error) { console.error(`  ❌ ${label}:`, res.error.message); return false; }
  const n = res.count ?? (Array.isArray(res.data) ? res.data.length : "?");
  console.log(`  ✅ ${label} (${n} filas)`);
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CURSOS — campos globales (nivel, categoria_label)
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n📚  Migrando tabla: cursos\n");

await ok("nivel Iniciación",
  await sb.from("cursos").update({ nivel: "Iniciación" }, { count: "exact" }).eq("nivel", "Iniciacion"));

await ok("categoriaLabel Capacitación",
  await sb.from("cursos").update({ categoria_label: "Capacitación" }, { count: "exact" }).eq("categoria_label", "Capacitacion"));

await ok("categoriaLabel Gestión de Calidad",
  await sb.from("cursos").update({ categoria_label: "Gestión de Calidad" }, { count: "exact" }).eq("categoria_label", "Gestion de Calidad"));

await ok("categoriaLabel Administración y Finanzas",
  await sb.from("cursos").update({ categoria_label: "Administración y Finanzas" }, { count: "exact" }).eq("categoria_label", "Administracion y Finanzas"));

await ok("categoriaLabel Ventas y Atención al Cliente",
  await sb.from("cursos").update({ categoria_label: "Ventas y Atención al Cliente" }, { count: "exact" }).eq("categoria_label", "Ventas y Atencion al Cliente"));

await ok("categoriaLabel Tecnología Digital",
  await sb.from("cursos").update({ categoria_label: "Tecnología Digital" }, { count: "exact" }).eq("categoria_label", "Tecnologia Digital"));

// ─────────────────────────────────────────────────────────────────────────────
// 2. CURSOS — títulos individuales (por slug)
// ─────────────────────────────────────────────────────────────────────────────
const COURSE_TITLES = [
  // Recursos Humanos
  ["asesoria-capacitacion-rrhh",       "Asesoría y Capacitación en Recursos Humanos"],
  ["descripcion-puesto",               "Descripción de Puesto"],
  ["diseno-perfil-puestos",            "Diseño de Perfil y Descripción de Puestos"],
  ["planes-carrera-competencia",        "Diseño y Desarrollo de Planes de Carrera por Sucesión por Competencia"],
  ["evaluacion-desempeno-360",          "Evaluación de Desempeño 360 Grados"],
  ["tabuladores-sueldos",              "Generación de Tabuladores de Sueldos"],
  ["manual-seleccion-entrevista",      "Manual para la Selección de Personal Mediante Entrevista Profunda"],
  ["medicion-clima-laboral",           "Medición de Clima Laboral"],
  ["programa-evaluacion-desempeno",    "Programa de Evaluación de Desempeño"],
  ["psicometria-laboral",              "Psicometría Laboral"],
  // Capacitación
  ["adiestramiento-prestacion-servicios", "Adiestramiento de la Prestación de Servicios"],
  ["formacion-instructores-capacitacion", "Formación de Instructores de Capacitación"],
  ["fundamentos-capacitacion-linea",   "Fundamentos Legales Pedagógicos e Instrumentación de Capacitación en Línea"],
  ["cursos-materiales-motivacion",     "Cursos y Materiales de Motivación"],
  // Liderazgo
  ["comunicacion-asertiva",            "Líneas de Comunicación Asertiva"],
  ["motivacion",                       "Motivación"],
  // Desarrollo Organizacional
  ["asesoria-organizacion-estructura-negocios", "Asesoría en Organización y Estructura de Negocios"],
  ["coaching-liderazgo",               "Coaching para el Liderazgo Empresarial"],
  ["planeacion-estrategica",           "Planeación Estratégica"],
  ["emprendimiento-innovacion",        "Emprendimiento e Innovación"],
  ["gestion-negocios",                 "Gestión de Negocios"],
  // Gestión de Calidad
  ["auditoria-interna",                "Auditoría Interna"],
  ["normatividad-iso",                 "Normatividad ISO"],
  ["taller-procesos-produccion",       "Taller de Procesos de Producción"],
  ["elaboracion-manuales",             "Elaboración de Manuales de Organización y Procedimientos"],
  ["medicion-resultados-indicadores",  "Medición de Resultados e Indicadores de Desempeño del Sistema de Gestión de Calidad"],
  ["sistema-gestion-calidad",          "Sistema de Gestión de Calidad"],
  ["control-estadistico-proceso",      "Control Estadístico del Proceso"],
  ["prevencion-acciones-correctivas",  "Prevención y Acciones Correctivas"],
  // Administración y Finanzas
  ["control-interno-herramienta-gestion", "Control Interno como Herramienta de Gestión de Proyectos"],
  ["administracion-compras",           "Administración de Compras"],
  ["estructuracion-sistema-control-interno", "Taller de Estructuración de Sistema de Control Interno"],
  ["gestion-financiera-proyectos",     "Gestión Financiera de Proyectos"],
  ["ejecucion-inventarios",            "Guía para la Correcta Ejecución de Inventarios"],
  // Proyectos y Licitaciones
  ["garantia-contratacion-proyectos",  "Garantía en los Procedimientos de Contratación y Adjudicación de Proyectos"],
  ["gestion-licitaciones",             "Gestión de Licitaciones"],
  ["documentacion-propuestas",         "Integración de Documentación para Presentación de Propuestas"],
  ["supervision-proyectos",            "Supervisión de Proyectos"],
  ["taller-gestion-administracion-proyectos", "Taller de Gestión y Administración de Proyectos"],
  // Ventas y Atención al Cliente
  ["poder-servir-cliente",             "El Poder de Saber Servir al Cliente"],
  ["sistema-venta-efectiva",           "Sistema de Venta Efectiva"],
  ["promocion",                        "Promoción"],
  // Normatividad
  ["asesoria-riesgo-trabajo",          "Asesoría en Riesgo de Trabajo"],
  ["proteccion-civil",                 "Protección Civil"],
  ["nom-035",                          "NOM-035"],
  // Comercio Internacional
  ["legislacion-importaciones",        "Legislación de Importaciones"],
  ["tramites-aduanales",               "Trámites Aduanales"],
  ["normatividad-adquisicion-publica", "La Normatividad de las Adquisiciones en la Adquisición Pública"],
  // Tecnología Digital
  ["sitio-web-sin-programacion",       "Diseño y Construcción de un Sitio Web sin Programación"],
  ["transformacion-digital-pyme",      "Qué es la Transformación Digital y Cómo Aplicarla a una PYME"],
  ["estrategia-gestion-digital",       "Estrategia y Gestión Digital"],
  ["analitica-datos-ia",               "Curso de Analítica, Datos e Inteligencia Artificial"],
  ["ciberseguridad-pymes",             "Ciberseguridad para PYMEs"],
];

console.log("\n  Actualizando títulos individuales...");
let updated = 0; let skipped = 0;
for (const [slug, titulo] of COURSE_TITLES) {
  const res = await sb.from("cursos").update({ titulo }, { count: "exact" }).eq("slug", slug);
  if (res.error) { console.error(`  ❌ ${slug}:`, res.error.message); }
  else if ((res.count ?? 0) > 0) { updated++; }
  else { skipped++; }
}
console.log(`  ✅ Títulos: ${updated} actualizados, ${skipped} no encontrados en Supabase`);

// ─────────────────────────────────────────────────────────────────────────────
// 3. VACANTES — corregir empresa, ubicacion, titulo, categoria, descripcion
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n💼  Migrando tabla: vacantes\n");

// Empresas
await ok("empresa Logística Norte",
  await sb.from("vacantes").update({ empresa: "Logística Norte" }, { count: "exact" }).eq("empresa", "Logistica Norte"));

await ok("empresa Clínica Vitalis",
  await sb.from("vacantes").update({ empresa: "Clínica Vitalis" }, { count: "exact" }).eq("empresa", "Clinica Vitalis"));

// Ubicaciones
await ok("ubicacion Estado de México",
  await sb.from("vacantes").update({ ubicacion: "Estado de México" }, { count: "exact" }).eq("ubicacion", "Estado de Mexico"));

await ok("ubicacion Híbrido",
  await sb.from("vacantes").update({ ubicacion: "Híbrido" }, { count: "exact" }).eq("ubicacion", "Hibrido"));

// Categoría atención al cliente
await ok("categoria Atención al cliente",
  await sb.from("vacantes").update({ categoria: "Atención al cliente" }, { count: "exact" }).eq("categoria", "Atencion al cliente"));

// Títulos individuales por ID
const VAC_UPDATES = [
  { id: 2,  titulo: "Operador de Almacén",
    descripcion: "Control de inventarios, recepción y despacho de mercancía, manejo de montacargas." },
  { id: 5,  descripcion: "Gestión de nómina, reclutamiento, capacitación y relaciones laborales en empresa en crecimiento." },
  { id: 7,  descripcion: "Registro de operaciones contables, conciliaciones bancarias y elaboración de reportes financieros." },
  { id: 8,  descripcion: "Atención a clientes vía chat, correo y teléfono. Resolución de incidencias y seguimiento de casos." },
];

for (const { id, titulo, descripcion } of VAC_UPDATES) {
  const patch = {};
  if (titulo)      patch.titulo      = titulo;
  if (descripcion) patch.descripcion = descripcion;
  const res = await sb.from("vacantes").update(patch, { count: "exact" }).eq("id", id);
  if (res.error) { console.error(`  ❌ vacante id=${id}:`, res.error.message); }
  else { console.log(`  ✅ vacante id=${id} (${res.count ?? "?"} filas)`); }
}

// Tags
await ok("tags id=1 (Auxiliar Administrativo)",
  await sb.from("vacantes").update({ tags: ["Office 365", "Atención al cliente", "Organización"] }, { count: "exact" }).eq("id", 1));
await ok("tags id=2 (Operador de Almacén)",
  await sb.from("vacantes").update({ tags: ["Inventarios", "Montacargas", "Logística"] }, { count: "exact" }).eq("id", 2));
await ok("tags id=3 (Ejecutivo de Ventas)",
  await sb.from("vacantes").update({ tags: ["Ventas B2B", "CRM", "Negociación"] }, { count: "exact" }).eq("id", 3));
await ok("tags id=4 (Recepcionista)",
  await sb.from("vacantes").update({ tags: ["Atención al cliente", "Multitareas", "Comunicación"] }, { count: "exact" }).eq("id", 4));
await ok("tags id=5 (Coordinador RRHH)",
  await sb.from("vacantes").update({ tags: ["Nómina", "Reclutamiento", "Relaciones laborales"] }, { count: "exact" }).eq("id", 5));
await ok("tags id=8 (Agente Servicio al Cliente)",
  await sb.from("vacantes").update({ tags: ["Zendesk", "Servicio al cliente", "Remoto"] }, { count: "exact" }).eq("id", 8));

// ─────────────────────────────────────────────────────────────────────────────
console.log("\n✨  Migración completa.\n");
