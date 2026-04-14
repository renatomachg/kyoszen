export type Modality = "en-vivo" | "online" | "hibrido";

export interface CourseModule {
  titulo: string;
  descripcion: string;
  duracion: string;
}

export interface Course {
  slug: string;
  titulo: string;
  categoria: string;
  categoriaLabel: string;
  modalidad: Modality;
  horas: number;
  modulos: number;
  lecciones: number;
  nivel: "Iniciacion" | "Intermedio" | "Avanzado";
  idioma: string;
  badge: string | null;
  instructor: string;
  instructorBio: string;
  color: string;
  iconColor: string;
  initials: string;
  descripcionCorta: string;
  descripcionLarga: string[];
  aprenderas: string[];
  dirigido: string[];
  requisitos: string[];
  contenido: CourseModule[];
  incluye: string[];
  contactEmail: string;
}

export const COURSES: Course[] = [
  {
    slug: "reclutamiento-y-seleccion",
    titulo: "Reclutamiento y Seleccion",
    categoria: "rrhh",
    categoriaLabel: "RRHH",
    modalidad: "hibrido",
    horas: 18,
    modulos: 6,
    lecciones: 24,
    nivel: "Intermedio",
    idioma: "Español",
    badge: "Popular",
    instructor: "Equipo Kyoszen",
    instructorBio: "Mas de 10 años formando especialistas en capital humano para microempresas mexicanas.",
    color: "#EAE0FB",
    iconColor: "var(--color-blue)",
    initials: "RS",
    descripcionCorta: "Aprende a identificar, atraer y seleccionar al candidato ideal con metodologias probadas para microempresas mexicanas.",
    descripcionLarga: [
      "Este curso te dara las herramientas practicas para construir un proceso de reclutamiento solido, desde la definicion del perfil hasta la integracion del colaborador. Combinamos teoria actualizada con casos reales del mercado laboral mexicano.",
      "Al finalizar sabras disenar descripciones de puesto atractivas, aplicar pruebas psicometricas, conducir entrevistas por competencias y tomar decisiones de contratacion basadas en datos. Un programa 100% enfocado a la realidad de las microempresas en CDMX y Estado de Mexico.",
    ],
    aprenderas: [
      "Disenar perfiles de puesto alineados a la cultura organizacional",
      "Aplicar tecnicas modernas de sourcing y atraccion de talento",
      "Conducir entrevistas por competencias con criterios objetivos",
      "Interpretar pruebas psicometricas y referencias laborales",
      "Integrar al nuevo colaborador con un proceso de induccion efectivo",
    ],
    dirigido: [
      "Encargados de RRHH en microempresas",
      "Lideres que reclutan para sus propios equipos",
      "Consultores independientes de capital humano",
    ],
    requisitos: [
      "Conocimientos basicos de RRHH (deseable)",
      "Ganas de aprender y aplicar en casos reales",
    ],
    contenido: [
      { titulo: "Fundamentos del reclutamiento moderno", descripcion: "Marco conceptual y tendencias 2026.", duracion: "2.5 h" },
      { titulo: "Definicion de perfiles y descripciones de puesto", descripcion: "Metodologia para capturar requerimientos reales.", duracion: "3 h" },
      { titulo: "Sourcing y atraccion de talento", descripcion: "Canales efectivos para PYMEs mexicanas.", duracion: "3 h" },
      { titulo: "Entrevista por competencias", descripcion: "Tecnica STAR y evaluacion objetiva.", duracion: "3.5 h" },
      { titulo: "Pruebas psicometricas y verificaciones", descripcion: "Interpretacion practica.", duracion: "3 h" },
      { titulo: "Oferta, cierre e induccion", descripcion: "Del si al dia 30 del nuevo colaborador.", duracion: "3 h" },
    ],
    incluye: [
      "Constancia con validez oficial DC-3",
      "Material descargable y plantillas",
      "Acceso ilimitado a grabaciones",
      "Sesiones de dudas con el instructor",
    ],
    contactEmail: "cursos@kyoszen.com",
  },
  {
    slug: "liderazgo-y-gestion-de-equipos",
    titulo: "Liderazgo y Gestion de Equipos",
    categoria: "liderazgo",
    categoriaLabel: "Liderazgo",
    modalidad: "en-vivo",
    horas: 16,
    modulos: 5,
    lecciones: 20,
    nivel: "Intermedio",
    idioma: "Español",
    badge: "Popular",
    instructor: "Equipo Kyoszen",
    instructorBio: "Formadores con experiencia directiva en empresas mexicanas en crecimiento.",
    color: "#fff3b0",
    iconColor: "#b45309",
    initials: "LG",
    descripcionCorta: "Desarrolla habilidades para liderar, motivar y gestionar equipos de alto desempeño con resultados medibles.",
    descripcionLarga: [
      "Un curso intensivo 100% en vivo donde pondras en practica las herramientas de liderazgo que necesitan los mandos medios y gerenciales de microempresas mexicanas.",
      "Trabajarás tu estilo de liderazgo, comunicacion efectiva, delegacion, manejo de conflictos y construccion de cultura de alto desempeño. Con ejercicios, roleplays y casos reales.",
    ],
    aprenderas: [
      "Identificar tu estilo de liderazgo y adaptarlo al contexto",
      "Delegar con claridad y dar retroalimentacion efectiva",
      "Gestionar conflictos y conversaciones dificiles",
      "Motivar equipos con herramientas basadas en evidencia",
      "Construir indicadores de desempeño claros",
    ],
    dirigido: [
      "Jefes, coordinadores y gerentes de area",
      "Lideres nuevos o con experiencia que buscan profesionalizarse",
      "Duenos de micro y pequeñas empresas",
    ],
    requisitos: [
      "Tener o haber tenido un equipo a cargo (deseable)",
      "Disponibilidad para sesiones en vivo",
    ],
    contenido: [
      { titulo: "Liderazgo situacional", descripcion: "Modelo de Hersey-Blanchard aplicado.", duracion: "3 h" },
      { titulo: "Comunicacion efectiva con tu equipo", descripcion: "Escucha activa y feedback constructivo.", duracion: "3 h" },
      { titulo: "Delegacion y gestion del tiempo", descripcion: "Matriz de Eisenhower y delegacion por niveles.", duracion: "3 h" },
      { titulo: "Manejo de conflictos", descripcion: "Conversaciones dificiles y mediacion.", duracion: "3.5 h" },
      { titulo: "Cultura y alto desempeño", descripcion: "OKRs, KPIs y motivacion intrinseca.", duracion: "3.5 h" },
    ],
    incluye: [
      "Constancia con validez oficial DC-3",
      "Sesiones en vivo con instructor experto",
      "Ejercicios y roleplays practicos",
      "Grupo pequeño para maxima interaccion",
    ],
    contactEmail: "cursos@kyoszen.com",
  },
  {
    slug: "iso-9001-sistema-de-gestion-de-calidad",
    titulo: "ISO 9001 — Sistema de Gestion de Calidad",
    categoria: "calidad",
    categoriaLabel: "Calidad",
    modalidad: "hibrido",
    horas: 16,
    modulos: 6,
    lecciones: 22,
    nivel: "Intermedio",
    idioma: "Español",
    badge: "Popular",
    instructor: "Equipo Kyoszen",
    instructorBio: "Auditores certificados con experiencia en implementacion ISO.",
    color: "#EAE0FB",
    iconColor: "var(--color-blue)",
    initials: "IS",
    descripcionCorta: "Implementa los estandares internacionales de calidad en tu organizacion y eleva la competitividad de tu empresa.",
    descripcionLarga: [
      "Curso practico para implementar y certificar un Sistema de Gestion de Calidad bajo la norma ISO 9001:2015, diseñado para PYMEs mexicanas.",
      "Te llevamos de la teoria a la practica: entenderas cada clausula, construiras tu documentacion y prepararas a tu equipo para auditorias internas y externas.",
    ],
    aprenderas: [
      "Interpretar correctamente la norma ISO 9001:2015",
      "Diseñar el mapa de procesos de tu organizacion",
      "Construir la documentacion requerida (procedimientos, politicas)",
      "Preparar y pasar auditorias internas",
      "Identificar oportunidades de mejora continua",
    ],
    dirigido: [
      "Responsables de calidad y procesos",
      "Duenos de empresas que buscan certificarse",
      "Consultores que acompañan a PYMEs",
    ],
    requisitos: [
      "Conocimientos basicos de procesos empresariales",
      "Interes por la gestion de calidad",
    ],
    contenido: [
      { titulo: "Fundamentos ISO 9001:2015", descripcion: "Historia, principios y estructura.", duracion: "2.5 h" },
      { titulo: "Contexto organizacional y liderazgo", descripcion: "Clausulas 4 y 5.", duracion: "2.5 h" },
      { titulo: "Planificacion y apoyo", descripcion: "Clausulas 6 y 7.", duracion: "3 h" },
      { titulo: "Operacion del sistema", descripcion: "Clausula 8 y control de procesos.", duracion: "3 h" },
      { titulo: "Evaluacion del desempeño", descripcion: "Auditorias internas y KPIs.", duracion: "2.5 h" },
      { titulo: "Mejora continua y certificacion", descripcion: "Plan de mejora y ruta a certificacion.", duracion: "2.5 h" },
    ],
    incluye: [
      "Constancia con validez oficial DC-3",
      "Plantillas de documentacion",
      "Checklist de auditoria interna",
      "Sesiones de acompañamiento",
    ],
    contactEmail: "cursos@kyoszen.com",
  },
  {
    slug: "digitalizacion-de-rrhh",
    titulo: "Digitalizacion de RRHH",
    categoria: "digital",
    categoriaLabel: "Digital",
    modalidad: "online",
    horas: 12,
    modulos: 4,
    lecciones: 16,
    nivel: "Iniciacion",
    idioma: "Español",
    badge: "Nuevo",
    instructor: "Equipo Kyoszen",
    instructorBio: "Especialistas en transformacion digital de RRHH.",
    color: "#bbf7d0",
    iconColor: "#15803d",
    initials: "DR",
    descripcionCorta: "Herramientas y procesos digitales para modernizar tu area de capital humano y mejorar la eficiencia operativa.",
    descripcionLarga: [
      "Aprende a llevar tu area de RRHH al mundo digital sin inversiones complicadas. Herramientas accesibles para PYMEs mexicanas.",
      "Desde firma electronica hasta sistemas de nomina en la nube, verás como transformar procesos manuales en flujos digitales eficientes.",
    ],
    aprenderas: [
      "Seleccionar herramientas digitales para PYMEs",
      "Migrar expedientes fisicos a digitales",
      "Implementar firma electronica con validez legal",
      "Automatizar procesos de reclutamiento y nomina",
      "Medir el impacto de la digitalizacion",
    ],
    dirigido: [
      "Encargados de RRHH que quieren modernizar",
      "Duenos de empresas en crecimiento",
      "Emprendedores y consultores",
    ],
    requisitos: [
      "Manejo basico de computadora e internet",
      "Sin conocimientos tecnicos previos",
    ],
    contenido: [
      { titulo: "Diagnostico de madurez digital", descripcion: "Evalua el punto de partida.", duracion: "2.5 h" },
      { titulo: "Expediente digital y firma electronica", descripcion: "Marco legal en Mexico.", duracion: "3 h" },
      { titulo: "Sistemas de nomina y asistencia en la nube", descripcion: "Opciones para PYMEs.", duracion: "3 h" },
      { titulo: "Automatizacion con herramientas no-code", descripcion: "Zapier, Make, hojas de calculo.", duracion: "3.5 h" },
    ],
    incluye: [
      "Constancia con validez oficial DC-3",
      "Acceso 100% online autodirigido",
      "Plantillas y comparativos de herramientas",
      "Acceso ilimitado a grabaciones",
    ],
    contactEmail: "cursos@kyoszen.com",
  },
  {
    slug: "relaciones-laborales",
    titulo: "Relaciones Laborales",
    categoria: "rrhh",
    categoriaLabel: "RRHH",
    modalidad: "en-vivo",
    horas: 14,
    modulos: 5,
    lecciones: 18,
    nivel: "Intermedio",
    idioma: "Español",
    badge: "Popular",
    instructor: "Equipo Kyoszen",
    instructorBio: "Abogados laborales y especialistas en cumplimiento normativo.",
    color: "#EAE0FB",
    iconColor: "var(--color-blue)",
    initials: "RL",
    descripcionCorta: "Ley Federal del Trabajo, contratacion, IMSS, INFONAVIT y manejo de conflictos laborales. Actualizado 2026.",
    descripcionLarga: [
      "Curso practico sobre la normatividad laboral mexicana vigente, enfocado a resolver los casos reales del dia a dia en microempresas.",
      "Incluye actualizaciones 2026 de LFT, IMSS e INFONAVIT, asi como estrategias para prevenir conflictos y resolver los que surjan dentro del marco legal.",
    ],
    aprenderas: [
      "Aplicar correctamente la Ley Federal del Trabajo",
      "Contratar, sancionar y rescindir con seguridad juridica",
      "Cumplir obligaciones ante IMSS e INFONAVIT",
      "Manejar conflictos y conciliaciones",
      "Prevenir demandas laborales",
    ],
    dirigido: [
      "Encargados de RRHH y nomina",
      "Duenos de empresas",
      "Contadores que atienden PYMEs",
    ],
    requisitos: [
      "Conocimientos basicos laborales (deseable)",
    ],
    contenido: [
      { titulo: "Marco legal laboral en Mexico", descripcion: "LFT actualizada y jurisprudencia.", duracion: "3 h" },
      { titulo: "Contratacion y tipos de contrato", descripcion: "Eleccion correcta segun caso.", duracion: "2.5 h" },
      { titulo: "IMSS e INFONAVIT", descripcion: "Alta, modificaciones, obligaciones.", duracion: "3 h" },
      { titulo: "Sanciones y rescisiones", descripcion: "Procedimiento legal paso a paso.", duracion: "3 h" },
      { titulo: "Conciliacion y demandas", descripcion: "Centro Federal de Conciliacion.", duracion: "2.5 h" },
    ],
    incluye: [
      "Constancia con validez oficial DC-3",
      "Formatos legales actualizados",
      "Sesiones en vivo con expertos",
      "Casos practicos del mercado mexicano",
    ],
    contactEmail: "cursos@kyoszen.com",
  },
  {
    slug: "tecnicas-de-ventas-y-negociacion",
    titulo: "Tecnicas de Ventas y Negociacion",
    categoria: "ventas",
    categoriaLabel: "Ventas",
    modalidad: "hibrido",
    horas: 12,
    modulos: 5,
    lecciones: 18,
    nivel: "Iniciacion",
    idioma: "Español",
    badge: "Popular",
    instructor: "Equipo Kyoszen",
    instructorBio: "Vendedores y directores comerciales con trayectoria B2B y B2C.",
    color: "#ffedd5",
    iconColor: "var(--color-orange)",
    initials: "TV",
    descripcionCorta: "Estrategias de venta consultiva, prospeccion, cierre y negociacion. Para equipos comerciales B2B y B2C.",
    descripcionLarga: [
      "Curso practico donde aprenderas metodologias modernas de venta consultiva aplicadas al contexto mexicano.",
      "Trabajaras prospeccion inteligente, descubrimiento de necesidades, manejo de objeciones y cierres efectivos con roleplays y casos reales.",
    ],
    aprenderas: [
      "Prospectar de forma inteligente usando CRM",
      "Descubrir necesidades con preguntas poderosas",
      "Manejar objeciones sin discutir",
      "Negociar acuerdos ganar-ganar",
      "Cerrar ventas con tecnicas probadas",
    ],
    dirigido: [
      "Ejecutivos y gerentes de ventas",
      "Emprendedores que venden sus servicios",
      "Equipos comerciales B2B y B2C",
    ],
    requisitos: [
      "Sin requisitos previos",
    ],
    contenido: [
      { titulo: "Fundamentos de venta consultiva", descripcion: "Metodologia moderna de ventas.", duracion: "2 h" },
      { titulo: "Prospeccion e inteligencia comercial", descripcion: "Herramientas y CRM.", duracion: "2.5 h" },
      { titulo: "Descubrimiento y presentacion", descripcion: "Preguntas SPIN y propuesta de valor.", duracion: "2.5 h" },
      { titulo: "Manejo de objeciones", descripcion: "Tecnicas de aikido verbal.", duracion: "2.5 h" },
      { titulo: "Negociacion y cierre", descripcion: "Acuerdos y seguimiento posventa.", duracion: "2.5 h" },
    ],
    incluye: [
      "Constancia con validez oficial DC-3",
      "Plantillas de scripts y objeciones",
      "Roleplays practicos",
      "Sesiones mixtas presencial y online",
    ],
    contactEmail: "cursos@kyoszen.com",
  },
];

export function getCourseBySlug(slug: string): Course | undefined {
  return COURSES.find((c) => c.slug === slug);
}

export const MODALITY_LABELS: Record<Modality, string> = {
  "en-vivo": "En vivo",
  "online": "Online a tu ritmo",
  "hibrido": "Hibrido",
};

export const MODALITY_BADGE: Record<Modality, string> = {
  "en-vivo": "bg-red-100 text-red-700",
  "online": "bg-green-soft text-[#15803d]",
  "hibrido": "bg-purple-soft text-purple",
};
