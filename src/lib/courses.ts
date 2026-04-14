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
    slug: "auditoria-interna",
    titulo: "Auditoria Interna",
    categoria: "calidad",
    categoriaLabel: "Calidad",
    modalidad: "hibrido",
    horas: 16,
    modulos: 4,
    lecciones: 12,
    nivel: "Intermedio",
    idioma: "Español",
    badge: "Popular",
    instructor: "Equipo Kyoszen",
    instructorBio: "Auditores certificados con experiencia en implementacion de sistemas de control interno y normatividad ISO en empresas mexicanas.",
    color: "#bbf7d0",
    iconColor: "#15803d",
    initials: "AI",
    descripcionCorta: "Conoce la metodologia necesaria para la realizacion de auditorias internas basadas en la normatividad actual mediante un entrenamiento teorico-practico.",
    descripcionLarga: [
      "Podras conocer la metodologia necesaria para la realizacion de auditorias internas de una organizacion, basadas en la normatividad actual y a traves de un entrenamiento teorico-practico.",
      "Al finalizar el desarrollo del curso, los participantes obtendran los conocimientos y las herramientas actualizadas para desempeñar la funcion de auditoria interna, de manera eficiente y alineada a los objetivos de negocio. De igual forma, el participante conocera la forma de aplicar las distintas herramientas utilizadas en las auditorias internas, analizar y evaluar los sistemas de control interno, aplicar las tecnicas de auditoria interna y elaborar los informes finales, resultado de una auditoria interna.",
    ],
    aprenderas: [
      "Aplicar las distintas herramientas utilizadas en las auditorias internas",
      "Analizar y evaluar los sistemas de control interno",
      "Aplicar las tecnicas de auditoria interna basada en riesgos",
      "Elaborar informes finales como resultado de una auditoria interna",
      "Diferenciar la responsabilidad de auditores internos y externos",
    ],
    dirigido: [
      "Encargados de calidad y control interno",
      "Auditores en formacion",
      "Responsables de procesos en PYMEs",
      "Consultores que acompañan a empresas en certificaciones",
    ],
    requisitos: [
      "Conocimientos basicos de procesos empresariales",
      "Interes por sistemas de gestion y normatividad",
    ],
    contenido: [
      {
        titulo: "Generalidades de la Auditoria",
        descripcion: "Conceptos · Objetivo y beneficios de la auditoria · El Control interno en el Marco de la Empresa.",
        duracion: "3.5 h",
      },
      {
        titulo: "Introduccion a la Auditoria interna",
        descripcion: "Tipos de auditoria · Auditoria interna o auditoria de primera parte · Principios de la Auditoria interna · Responsabilidad de los auditores (internos / externos).",
        duracion: "4 h",
      },
      {
        titulo: "Plan y programa de auditoria",
        descripcion: "Plan de auditoria · Programa de auditoria.",
        duracion: "4 h",
      },
      {
        titulo: "Desarrollo de Auditoria interna",
        descripcion: "Auditoria interna basada en riesgos · ¿Como llevar una auditoria interna? · Recomendaciones para llevar a cabo la auditoria.",
        duracion: "4.5 h",
      },
    ],
    incluye: [
      "Constancia con validez oficial DC-3",
      "Material descargable y plantillas de auditoria",
      "Sesiones de dudas con el instructor",
      "Acceso ilimitado a grabaciones",
    ],
    contactEmail: "cursos@kyoszen.com",
  },
  {
    slug: "asesoria-organizacion-estructura-negocios",
    titulo: "Asesoria para la Organizacion y Estructura de Negocios",
    categoria: "liderazgo",
    categoriaLabel: "Liderazgo",
    modalidad: "hibrido",
    horas: 22,
    modulos: 6,
    lecciones: 28,
    nivel: "Intermedio",
    idioma: "Español",
    badge: "Nuevo",
    instructor: "Equipo Kyoszen",
    instructorBio: "Directores y consultores con trayectoria en alta direccion y planeacion estrategica de negocios mexicanos.",
    color: "#fff3b0",
    iconColor: "#b45309",
    initials: "AO",
    descripcionCorta: "Identifica la relacion e influencia de la Alta Direccion en el optimo desarrollo de un Plan de Negocio y desarrolla competencias para dirigir negocios con valor financiero, comercial y humano.",
    descripcionLarga: [
      "Al finalizar el curso, podras identificar la relacion e influencia de la Alta Direccion en el optimo desarrollo de un Plan de Negocio.",
      "Podras desarrollar competencias para dirigir negocios que generen valor financiero, comercial, humano (talento) y una entidad socialmente responsable.",
    ],
    aprenderas: [
      "Identificar el rol e influencia de la Alta Direccion en el plan de negocio",
      "Aplicar habilidades directivas fundamentales en la gestion actual",
      "Desarrollar tu liderazgo personal, empresarial, situacional y transformacional",
      "Interpretar estados financieros y elaborar planeacion financiera",
      "Diseñar un plan de marketing estrategico y operativo",
      "Implementar gestion estrategica del talento humano por competencias",
    ],
    dirigido: [
      "Duenos y directores generales de PYMEs",
      "CEOs y mandos altos",
      "Emprendedores en etapa de crecimiento",
      "Consultores de negocio",
    ],
    requisitos: [
      "Experiencia previa en posiciones directivas o de liderazgo",
      "Interes por la planeacion estrategica integral",
    ],
    contenido: [
      {
        titulo: "Alta Direccion",
        descripcion: "Definicion · CEO's y Directores · Funciones.",
        duracion: "3 h",
      },
      {
        titulo: "Habilidades Directivas",
        descripcion: "Concepto y naturaleza · Tipos de Habilidades directivas · Habilidades directivas fundamentales y sus competencias conductuales claves · Habilidades directivas en la gestion actual.",
        duracion: "4 h",
      },
      {
        titulo: "El Lider",
        descripcion: "Aspectos generales y definicion · Estilos de liderazgo: personal, empresarial, situacional y transformacional · El lider como coach.",
        duracion: "4 h",
      },
      {
        titulo: "Direccion Financiera",
        descripcion: "Introduccion y conceptos financieros y contables · Estados Financieros · Analisis financiero · Planeacion financiera, objetivos y tipos.",
        duracion: "4 h",
      },
      {
        titulo: "Direccion de Mercadotecnia",
        descripcion: "Concepto y Naturaleza · Principios y fundamentos del marketing · Marketing estrategico y operativo · Plan de marketing · Marketing digital.",
        duracion: "3.5 h",
      },
      {
        titulo: "Direccion Estrategica del Talento Humano",
        descripcion: "Concepto y naturaleza · Metodos del Talento Humano · Gestion Estrategica de T. H. · Gestion por Competencias · Desarrollo Organizacional · Reclutamiento y Seleccion · Clima Laboral.",
        duracion: "3.5 h",
      },
    ],
    incluye: [
      "Constancia con validez oficial DC-3",
      "Casos practicos de empresas mexicanas",
      "Sesiones en vivo con expertos directivos",
      "Plantillas de planeacion estrategica",
    ],
    contactEmail: "cursos@kyoszen.com",
  },
  {
    slug: "asesoria-capacitacion-rrhh",
    titulo: "Asesoria y Capacitacion en Recursos Humanos",
    categoria: "rrhh",
    categoriaLabel: "RRHH",
    modalidad: "hibrido",
    horas: 18,
    modulos: 5,
    lecciones: 24,
    nivel: "Iniciacion",
    idioma: "Español",
    badge: "Popular",
    instructor: "Equipo Kyoszen",
    instructorBio: "Especialistas en gestion del capital humano con experiencia formando equipos de RRHH en microempresas mexicanas.",
    color: "#EAE0FB",
    iconColor: "var(--color-blue)",
    initials: "RH",
    descripcionCorta: "Conocimientos generales del area de Recursos Humanos: reclutamiento, seleccion, psicometria, evaluacion, capacitacion y desarrollo aplicados al contexto mexicano.",
    descripcionLarga: [
      "Al finalizar el curso deberas contar con conocimientos generales en temas relacionados al area de Recursos Humanos, tales como reclutamiento, seleccion, psicometria, evaluacion, capacitacion y desarrollo.",
      "Entenderas la importancia de cada area, asi como los beneficios personales y de negocio que conlleva el dominio de dichos conceptos y procesos. Y sobre todo podras poner en practica las habilidades adquiridas.",
    ],
    aprenderas: [
      "Disenar procesos de atraccion y reclutamiento de talento",
      "Aplicar tecnicas modernas de seleccion de personal",
      "Llevar procesos de contratacion bajo politicas claras y salario adecuado",
      "Implementar evaluaciones de desempeño efectivas",
      "Diseñar y operar ciclos completos de capacitacion",
    ],
    dirigido: [
      "Encargados de RRHH en PYMEs",
      "Lideres que gestionan personas",
      "Consultores y emprendedores",
      "Estudiantes y profesionistas que se inician en RRHH",
    ],
    requisitos: [
      "Sin requisitos previos",
    ],
    contenido: [
      {
        titulo: "Atraccion de Talento",
        descripcion: "Aspectos generales · ¿Que es Atraccion de Talento? · Principales elementos · Reclutamiento de talentos.",
        duracion: "3.5 h",
      },
      {
        titulo: "Seleccion",
        descripcion: "Concepto · Diferencias entre reclutamiento y seleccion de personal · Bases para la seleccion de personal · Tecnicas de seleccion.",
        duracion: "3.5 h",
      },
      {
        titulo: "Contratacion",
        descripcion: "Concepto · Politicas en los procesos de contratacion de personal y salario · Proceso de contratacion de personal.",
        duracion: "3 h",
      },
      {
        titulo: "Evaluacion del desempeño",
        descripcion: "Administracion de desempeño · Concepto y usos de la ED · Factores ambientales · Proceso · Establecimiento de criterios · Responsabilidades · Tecnicas · Problemas frecuentes · Entrevistas de evaluacion.",
        duracion: "4.5 h",
      },
      {
        titulo: "Capacitacion",
        descripcion: "Concepto · Contenido · Objetivos de la capacitacion · Ciclos de la capacitacion · Etapas de la capacitacion.",
        duracion: "3.5 h",
      },
    ],
    incluye: [
      "Constancia con validez oficial DC-3",
      "Plantillas de procesos de RRHH",
      "Casos practicos del mercado mexicano",
      "Acompañamiento del instructor",
    ],
    contactEmail: "cursos@kyoszen.com",
  },
  {
    slug: "atencion-no-conformidades-sgc",
    titulo: "Acciones para la Atencion de No Conformidades y Solventacion de Auditorias del SGC",
    categoria: "calidad",
    categoriaLabel: "Calidad",
    modalidad: "en-vivo",
    horas: 12,
    modulos: 2,
    lecciones: 10,
    nivel: "Intermedio",
    idioma: "Español",
    badge: null,
    instructor: "Equipo Kyoszen",
    instructorBio: "Especialistas en sistemas de gestion de calidad y auditorias bajo normas ISO con experiencia en certificacion de PYMEs.",
    color: "#bbf7d0",
    iconColor: "#15803d",
    initials: "NC",
    descripcionCorta: "Fundamentos, metodos y tecnicas para eliminar de forma permanente las no conformidades, cumplir auditorias, certificaciones y validaciones en la cadena de valor.",
    descripcionLarga: [
      "Nuestro objetivo es proporcionar al participante el conocimiento sobre los fundamentos, metodos y tecnicas que permitan eliminar de manera permanente las 'no conformidades' derivadas del incumplimiento del Deber Ser. Asimismo, contar con una metodologia para enfrentar y solucionar problemas de calidad, cumplir auditorias, certificaciones y validaciones en la cadena de valor.",
      "Al finalizar el desarrollo del curso, los participantes contaran con los conocimientos para identificar y solucionar problemas derivados de las 'no conformidades' con mayor efectividad; tomar acciones correctivas y preventivas para eliminar de manera permanente su recurrencia; reunir, organizar y analizar informacion relevante; apoyar las iniciativas para mejorar la calidad, la productividad y los resultados; asi como desarrollar un lenguaje comun para analizar, solucionar y documentar problemas dentro de la organizacion.",
    ],
    aprenderas: [
      "Diferenciar evidencias, hallazgos, conformidades y no conformidades",
      "Identificar tipos y fuentes de no conformidades",
      "Atender no conformidades frecuentes en auditorias ISO 9001",
      "Diseñar acciones correctivas y preventivas eficaces",
      "Documentar problemas con un lenguaje comun en la organizacion",
    ],
    dirigido: [
      "Responsables de calidad y procesos",
      "Auditores internos y miembros del equipo SGC",
      "Lideres operativos en empresas certificadas o en proceso de certificacion",
    ],
    requisitos: [
      "Conocimientos basicos de sistemas de gestion de calidad o ISO 9001",
    ],
    contenido: [
      {
        titulo: "Auditorias, evidencias y hallazgos",
        descripcion: "Auditoria · Evidencias, hallazgos, conformidades y no conformidades · Auditoria de calidad.",
        duracion: "5 h",
      },
      {
        titulo: "Identificacion y Atencion de las No Conformidades (NC) basadas en normas ISO",
        descripcion: "Tipos de no conformidades · Fuentes de identificacion · No conformidades frecuentes en Auditoria ISO 9001 · Acciones correctivas y preventivas.",
        duracion: "7 h",
      },
    ],
    incluye: [
      "Constancia con validez oficial DC-3",
      "Plantillas de acciones correctivas y preventivas",
      "Sesiones en vivo con auditores expertos",
      "Casos reales de auditorias ISO 9001",
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
