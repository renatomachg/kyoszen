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
    slug: "desarrollo-habilidades-jefes-gerentes",
    titulo: "Desarrollo de Habilidades para Jefes y Gerentes",
    categoria: "liderazgo",
    categoriaLabel: "Liderazgo",
    modalidad: "hibrido",
    horas: 24,
    modulos: 6,
    lecciones: 32,
    nivel: "Intermedio",
    idioma: "Español",
    badge: "Popular",
    instructor: "Equipo Kyoszen",
    instructorBio: "Coaches ejecutivos y consultores con experiencia formando lideres y equipos directivos en empresas mexicanas.",
    color: "#fff3b0",
    iconColor: "#b45309",
    initials: "JG",
    descripcionCorta: "Aplica los principios y tecnicas de Administracion y Liderazgo, usando las practicas del Coaching, para mejorar la productividad y el desempeño de tus colaboradores y equipo.",
    descripcionLarga: [
      "Al termino del curso los participantes estaran en condiciones de aplicar los principios y las tecnicas de la Administracion y Liderazgo, usando las practicas del Coaching, con la finalidad de mejorar la productividad y el desempeño actual de los colaboradores y del equipo.",
      "El participante obtendra herramientas y tecnicas para identificar y mejorar su estilo de liderazgo y resolver situaciones de manejo de personal. Compartira experiencias y obtendra criterios para el manejo de situaciones de formacion, integracion y desarrollo de equipos de trabajo, mediante la delegacion y el liderazgo.",
      "Desarrollara estrategias para la mejor delimitacion y redaccion de sus objetivos.",
    ],
    aprenderas: [
      "Aplicar autoconocimiento, FODA y desarrollar tu lider interno",
      "Diferenciar lider vs jefe y aplicar liderazgo situacional y generacional",
      "Comunicarte de forma efectiva y asertiva",
      "Manejar conflictos con inteligencia emocional y negociar ganar-ganar",
      "Formar equipos de alto rendimiento con las 7'C del trabajo en equipo",
      "Planear estrategicamente y administrar tu tiempo",
    ],
    dirigido: [
      "Jefes y gerentes de area",
      "Lideres de proyecto y coordinadores",
      "Mandos medios que buscan desarrollar habilidades directivas",
      "Profesionistas proximos a posiciones de liderazgo",
    ],
    requisitos: [
      "Experiencia en coordinacion de personas o proyectos",
      "Disposicion para trabajo practico y auto-analisis",
    ],
    contenido: [
      {
        titulo: "Desarrollo Personal",
        descripcion: "Autoconocimiento y Autodiagnostico · Analisis FODA · Desarrollo del lider interno · Competencias: Conocimientos, Habilidades y Actitudes.",
        duracion: "3.5 h",
      },
      {
        titulo: "Liderazgo",
        descripcion: "Concepto de lider · Lider vs Jefe · Liderazgo Tradicional · Liderazgo Situacional de Hersey y Blanchard · Liderazgo generacional · Empowerment y Delegacion · Coaching.",
        duracion: "5 h",
      },
      {
        titulo: "Comunicacion",
        descripcion: "Comunicacion Efectiva · Comunicacion Asertiva.",
        duracion: "3 h",
      },
      {
        titulo: "Conflicto y Negociacion",
        descripcion: "Tipos de Conflicto · Resolucion de Conflictos · Ganar-Ganar · Inteligencia Emocional · Como negociar.",
        duracion: "4 h",
      },
      {
        titulo: "Equipos de Trabajo",
        descripcion: "Equipo vs Grupo · Las 7'C del trabajo en equipo · Los colaboradores del lider · Equipos de alto rendimiento · Analisis de competencias del equipo · Sinergia.",
        duracion: "4.5 h",
      },
      {
        titulo: "Estrategia y Objetivos",
        descripcion: "Planeacion Estrategica · Enfoque y Priorizacion · Administracion del Tiempo.",
        duracion: "4 h",
      },
    ],
    incluye: [
      "Constancia con validez oficial DC-3",
      "Sesiones practicas de coaching grupal",
      "Material descargable y plantillas de liderazgo",
      "Casos reales de empresas mexicanas",
    ],
    contactEmail: "cursos@kyoszen.com",
  },
  {
    slug: "tramites-aduanales",
    titulo: "Tramites Aduanales",
    categoria: "normatividad",
    categoriaLabel: "Normatividad",
    modalidad: "online",
    horas: 16,
    modulos: 3,
    lecciones: 18,
    nivel: "Iniciacion",
    idioma: "Español",
    badge: "Nuevo",
    instructor: "Equipo Kyoszen",
    instructorBio: "Agentes aduanales y consultores en comercio exterior con experiencia en importacion y exportacion desde Mexico.",
    color: "#EAE0FB",
    iconColor: "var(--color-blue)",
    initials: "TA",
    descripcionCorta: "Conoce los tramites, procedimientos y documentos necesarios para llevar a cabo una importacion y/o exportacion segun las necesidades de tu negocio.",
    descripcionLarga: [
      "Podras contar con conocimientos basicos referentes a los negocios internacionales y conoceras los tramites, procedimientos y documentos necesarios para llevar a cabo una importacion y/o exportacion segun sea necesario.",
      "El curso brinda una vision practica del marco legal mexicano, los INCOTERMS y la cadena logistica internacional para que puedas operar con seguridad en operaciones de comercio exterior.",
    ],
    aprenderas: [
      "Entender el contexto actual del comercio exterior en Mexico",
      "Identificar acuerdos, tratados y legislacion aplicable",
      "Tramitar importaciones siguiendo INCOTERMS y obligaciones fiscales",
      "Inscribirte al padron de importadores",
      "Preparar documentos y logistica para exportar desde Mexico",
      "Conocer la cadena de suministros de exportacion",
    ],
    dirigido: [
      "Encargados de comercio exterior en PYMEs",
      "Emprendedores que inician operaciones de import/export",
      "Profesionistas de logistica y compras",
      "Estudiantes de negocios internacionales",
    ],
    requisitos: [
      "Sin requisitos previos",
      "Interes por comercio exterior y logistica",
    ],
    contenido: [
      {
        titulo: "Tramites aduaneros en Mexico",
        descripcion: "Contexto actual · Conceptos generales · Acuerdos y tratados · Tramitacion de importaciones y exportaciones · Personas autorizadas para promover el despacho aduanero · Distribucion de aduanas · Legislacion del comercio exterior.",
        duracion: "5.5 h",
      },
      {
        titulo: "Importaciones",
        descripcion: "Que es importar · Beneficios · Previo a la importacion · INCOTERMS · Procedimiento y obligaciones · Documentos · Inscripcion al padron de importadores · Principales impuestos.",
        duracion: "6 h",
      },
      {
        titulo: "Exportar desde Mexico",
        descripcion: "Que es exportar · Consideraciones generales · Preparacion · Documentos y requisitos · Cadena de suministros y logistica de exportacion.",
        duracion: "4.5 h",
      },
    ],
    incluye: [
      "Constancia con validez oficial DC-3",
      "Plantillas de documentacion aduanera",
      "Acceso a biblioteca de INCOTERMS actualizados",
      "Sesiones de dudas con el instructor",
    ],
    contactEmail: "cursos@kyoszen.com",
  },
  {
    slug: "proteccion-civil",
    titulo: "Proteccion Civil",
    categoria: "normatividad",
    categoriaLabel: "Normatividad",
    modalidad: "en-vivo",
    horas: 20,
    modulos: 5,
    lecciones: 22,
    nivel: "Iniciacion",
    idioma: "Español",
    badge: null,
    instructor: "Equipo Kyoszen",
    instructorBio: "Especialistas en gestion de riesgos y proteccion civil con experiencia asesorando programas internos en empresas y oficinas en Ciudad de Mexico.",
    color: "#bbf7d0",
    iconColor: "#15803d",
    initials: "PC",
    descripcionCorta: "Elabora e instrumenta un Programa Interno de Proteccion Civil para mitigar riesgos, organizar brigadas y saber que hacer antes, durante y despues de una emergencia.",
    descripcionLarga: [
      "En la actualidad llevar a cabo un Programa Interno de Proteccion Civil es primordial. Con el aumento de las catastrofes naturales, el incremento de las amenazas a la seguridad y la pandemia mundial que sigue causando trastornos, el PIPC proporciona a las personas y las empresas los conocimientos, recursos y herramientas fundamentales para ayudar a mitigar los riesgos de este tipo de sucesos.",
      "Este curso te ayudara a la elaboracion y asesoria en la instrumentacion del Programa Interno de Proteccion Civil, a la determinacion de los procedimientos necesarios para saber que hacer antes, durante y despues de una emergencia, al auxilio en la organizacion de la unidad interna de proteccion civil y las brigadas de emergencia para la instrumentacion del PIPC, y al analisis de riesgos internos y externos, croquis de señalizacion, equipo contra incendio, etc.",
    ],
    aprenderas: [
      "Comprender la importancia de la Proteccion Civil y clasificar emergencias",
      "Conformar brigadas de proteccion con marco legal y responsabilidades claras",
      "Operar brigadas de primeros auxilios, rescate, comunicacion, evacuacion e incendios",
      "Aplicar la Ley General de Proteccion Civil y la ley de CDMX",
      "Actuar correctamente ante sismos, incendios y otras emergencias",
      "Considerar prevencion de riesgos para personas con discapacidad",
    ],
    dirigido: [
      "Responsables de seguridad y proteccion civil en empresas",
      "Brigadistas internos y coordinadores de emergencia",
      "Encargados de recursos humanos y administracion",
      "Equipos que requieren certificar su PIPC",
    ],
    requisitos: [
      "Sin requisitos previos",
      "Disposicion para practicas de simulacro",
    ],
    contenido: [
      {
        titulo: "Introduccion e Importancia de la Proteccion Civil",
        descripcion: "Introduccion y objetivo · Emergencias: clasificacion · Posibles eventos en nuestras instalaciones · Etapas de la emergencia.",
        duracion: "3 h",
      },
      {
        titulo: "Brigadas de Proteccion",
        descripcion: "Marco legal · Caracteristicas y responsabilidades · Organigrama y ciclo de emergencia · Plan de reduccion de riesgo · Capacitacion · Brigadas: primeros auxilios, busqueda y rescate, comunicacion, evacuacion, combate de incendios.",
        duracion: "6 h",
      },
      {
        titulo: "Ley General de Proteccion Civil",
        descripcion: "Marco federal · Obligaciones y facultades · Aplicacion en el entorno empresarial.",
        duracion: "3 h",
      },
      {
        titulo: "Ley de Gestion Integral de Riesgos y Proteccion Civil de la CDMX",
        descripcion: "Legislacion local · Obligaciones empresariales · Vinculacion con el PIPC.",
        duracion: "3 h",
      },
      {
        titulo: "Guias practicas para saber que hacer",
        descripcion: "Guia ante sismo · Guia ante incendios y prevencion · Guia de prevencion de riesgos para personas con discapacidad.",
        duracion: "5 h",
      },
    ],
    incluye: [
      "Constancia con validez oficial DC-3",
      "Formatos y plantillas del PIPC",
      "Practicas de simulacro guiadas",
      "Material de señalizacion descargable",
    ],
    contactEmail: "cursos@kyoszen.com",
  },
  {
    slug: "taller-procesos-produccion",
    titulo: "Taller de Procesos de Produccion",
    categoria: "calidad",
    categoriaLabel: "Calidad",
    modalidad: "hibrido",
    horas: 20,
    modulos: 5,
    lecciones: 28,
    nivel: "Intermedio",
    idioma: "Español",
    badge: "Nuevo",
    instructor: "Equipo Kyoszen",
    instructorBio: "Ingenieros industriales y consultores con experiencia en gestion de operaciones, lean manufacturing y sistemas de produccion en empresas mexicanas.",
    color: "#bbf7d0",
    iconColor: "#15803d",
    initials: "PP",
    descripcionCorta: "Analiza, define y desarrolla los factores mas relevantes de los procesos operacionales y de produccion, aplicando decisiones operativas, tacticas y estrategicas.",
    descripcionLarga: [
      "Conoceras la metodologia necesaria para realizar el analisis, definicion y desarrollo de los factores mas relevantes asociados a los procesos operacionales y de produccion.",
      "Al finalizar el curso comprenderas que son los procesos de produccion y como se llevan a cabo; conoceras las cadenas productivas y aprenderas a definir los mecanismos que inciden en la toma de decisiones operativas, tacticas y estrategicas asociadas a los procesos de produccion y la gestion de operaciones.",
    ],
    aprenderas: [
      "Diferenciar procesos, productos y factores de produccion",
      "Conocer la evolucion historica: del artesanal a Toyota Production System",
      "Planificar la capacidad de produccion y diseñar sistemas productivos",
      "Aplicar innovacion de producto y de proceso",
      "Implementar control de calidad y sistema Just in Time (JIT)",
      "Tomar decisiones operativas, tacticas y estrategicas en produccion",
    ],
    dirigido: [
      "Responsables de produccion y operaciones",
      "Supervisores de planta y mandos medios industriales",
      "Emprendedores con negocios manufactureros",
      "Consultores de mejora de procesos",
    ],
    requisitos: [
      "Experiencia en entornos operativos o de produccion",
      "Conocimientos basicos de gestion de procesos",
    ],
    contenido: [
      {
        titulo: "Conceptos basicos",
        descripcion: "Procesos: que son, caracteristicas, clasificacion, elementos y representacion grafica · Productos: tipos · Produccion y factores de produccion.",
        duracion: "3 h",
      },
      {
        titulo: "Historia, conceptos y objetivos de los procesos de produccion",
        descripcion: "Evolucion historica: artesanal, serie, flexible, Toyota · Procesos productivos: tipos, tendencias · Objetivos y clases de decisiones en produccion.",
        duracion: "4 h",
      },
      {
        titulo: "Planificacion y Sistemas de Produccion",
        descripcion: "Planificacion y capacidad · Sistemas de produccion: objetivos, modelos, elementos, tipos · Diseño del sistema · Modelos y tecnicas de planificacion · Flexibilidad y calidad total.",
        duracion: "5 h",
      },
      {
        titulo: "Innovacion de Producto y Proceso",
        descripcion: "Tecnologia e innovacion · Innovacion de producto/servicio vs de proceso · Gestion de la innovacion · Ciclo de vida del producto.",
        duracion: "4 h",
      },
      {
        titulo: "Calidad en la produccion",
        descripcion: "Calidad a lo largo del proceso · Fases de implementacion SGC · Control de calidad · Sistema Just in Time: historia, metodologia, objetivos, ventajas, implementacion.",
        duracion: "4 h",
      },
    ],
    incluye: [
      "Constancia con validez oficial DC-3",
      "Plantillas de mapeo de procesos productivos",
      "Casos practicos de manufactura mexicana",
      "Ejercicios de calculo de capacidad y JIT",
    ],
    contactEmail: "cursos@kyoszen.com",
  },
  {
    slug: "nom-035",
    titulo: "NOM-035",
    categoria: "normatividad",
    categoriaLabel: "Normatividad",
    modalidad: "en-vivo",
    horas: 16,
    modulos: 7,
    lecciones: 24,
    nivel: "Intermedio",
    idioma: "Español",
    badge: "Popular",
    instructor: "Equipo Kyoszen",
    instructorBio: "Especialistas en seguridad y salud en el trabajo con experiencia implementando la NOM-035-STPS-2018 en empresas de distintos sectores.",
    color: "#EAE0FB",
    iconColor: "var(--color-blue)",
    initials: "N3",
    descripcionCorta: "Analiza el plan de trabajo, metodos, herramientas y acciones para el cumplimiento de la NOM-035 y la identificacion de factores de riesgo psicosocial.",
    descripcionLarga: [
      "El objetivo de este curso es analizar un enfoque de plan de trabajo, metodos, herramientas, tipos de accion y elementos para el cumplimiento de la NOM-035-STPS-2018.",
      "Aprenderas a identificar factores de riesgo psicosocial (FRPS), promover un entorno organizacional favorable (EOF) y atender acontecimientos traumaticos severos conforme a la norma oficial.",
    ],
    aprenderas: [
      "Conocer los objetivos y campos de aplicacion de la NOM-035",
      "Aplicar acciones de prevencion de FRPS basadas en evidencia (OIT SOLVE)",
      "Promover un entorno organizacional favorable (EOF)",
      "Identificar trabajadores expuestos a acontecimientos traumaticos severos",
      "Elaborar informes de identificacion de FRPS y EOF",
      "Diseñar planes de accion de control y atencion con evaluacion de efectividad",
    ],
    dirigido: [
      "Responsables de RRHH y SST en empresas",
      "Comites de seguridad e higiene",
      "Mandos medios y supervisores",
      "Consultores en clima organizacional",
    ],
    requisitos: [
      "Sin requisitos previos",
      "Interes por salud mental laboral y normatividad",
    ],
    contenido: [
      {
        titulo: "Introduccion a la NOM-035",
        descripcion: "Objetivos principales · Campos de aplicacion · Enfoque del proyecto de implementacion.",
        duracion: "2 h",
      },
      {
        titulo: "Medidas y acciones de prevencion de FRPS",
        descripcion: "Politica de prevencion · Metodologia SOLVE (OIT) · Modelos de Demandas y Recursos Laborales · Condiciones en el ambiente de trabajo como FRPS · Prevencion.",
        duracion: "3 h",
      },
      {
        titulo: "Promocion de un entorno organizacional favorable",
        descripcion: "Factores protectores del EOF · Modelo OMS de entorno de trabajo saludable.",
        duracion: "2 h",
      },
      {
        titulo: "Acontecimientos traumaticos severos",
        descripcion: "Definicion · Elementos obligatorios señalados en la norma · Protocolo de identificacion.",
        duracion: "2 h",
      },
      {
        titulo: "Identificacion de FRPS y EOF",
        descripcion: "Informe de especificacion · Metodo para identificacion.",
        duracion: "2.5 h",
      },
      {
        titulo: "Plan de acciones de control y atencion",
        descripcion: "Evaluacion especifica · Enfoque metodologico · Programa de atencion · Seguimiento y evaluacion de efectividad.",
        duracion: "2.5 h",
      },
      {
        titulo: "Norma Oficial NOM-035-STPS-2018",
        descripcion: "Estructura y contenido oficial de la norma.",
        duracion: "2 h",
      },
    ],
    incluye: [
      "Constancia con validez oficial DC-3",
      "Cuestionarios oficiales NOM-035 listos para aplicar",
      "Plantillas de politicas y programas de atencion",
      "Acompañamiento del instructor",
    ],
    contactEmail: "cursos@kyoszen.com",
  },
  {
    slug: "control-interno",
    titulo: "Control Interno",
    categoria: "calidad",
    categoriaLabel: "Calidad",
    modalidad: "hibrido",
    horas: 20,
    modulos: 4,
    lecciones: 26,
    nivel: "Intermedio",
    idioma: "Español",
    badge: null,
    instructor: "Equipo Kyoszen",
    instructorBio: "Auditores internos y consultores en sistemas de control con experiencia en modelos COSO, CoCo y CobiT aplicados a empresas medianas.",
    color: "#bbf7d0",
    iconColor: "#15803d",
    initials: "CI",
    descripcionCorta: "Adquiere los principios fundamentales del control interno y desarrolla habilidades para evaluarlo, diseñarlo y documentarlo en la organizacion.",
    descripcionLarga: [
      "Podras adquirir conocimientos de los principios fundamentales del control interno y desarrollar habilidades para evaluarlo, diseñarlo y documentarlo.",
      "Al finalizar el curso contaras con los conocimientos para identificar los propositos, objetivos, componentes, principios, herramientas y tecnicas de evaluacion del modelo de Control Interno.",
    ],
    aprenderas: [
      "Definir y comprender los componentes del control interno (COSO)",
      "Evaluar riesgos, tolerancia, impacto y aplicar costo-beneficio",
      "Diseñar controles formales, manuales y automatizados",
      "Aplicar modelos de control: COSO, CoCo, Cadbury, CobiT",
      "Documentar con diagramas de flujo, mapeo de procesos y cuestionarios",
      "Diseñar e implementar un Sistema de Control Interno (SCI)",
    ],
    dirigido: [
      "Responsables de control interno y auditoria",
      "Directores financieros y administrativos",
      "Consultores y contadores publicos",
      "Mandos medios a cargo de procesos criticos",
    ],
    requisitos: [
      "Conocimientos basicos de procesos administrativos y contables",
      "Deseable experiencia en auditoria o gestion de riesgos",
    ],
    contenido: [
      {
        titulo: "Aspectos Generales del Control Interno",
        descripcion: "Definicion, importancia y objetivos · Componentes del SCI · Control interno en el marco de la empresa · Tipos de riesgos · Tecnicas de evaluacion · Responsabilidad del auditor interno/externo.",
        duracion: "6 h",
      },
      {
        titulo: "Teoria del riesgo y del control",
        descripcion: "Relacion riesgo-objetivos · Tolerancia, riesgo residual, exposicion · Tecnicas de administracion: transferir, administrar, aceptar · Tipos de controles · Tecnicas de documentacion: flujogramas, mapeo, cuestionarios.",
        duracion: "5 h",
      },
      {
        titulo: "Modelos de Control Interno",
        descripcion: "Modelos de negocios: COSO, CoCo, ERM, Cadbury · Modelos de TI: CobiT, Information Technology Control Guidelines.",
        duracion: "4 h",
      },
      {
        titulo: "Diseño e implementacion del SCI",
        descripcion: "Diseño del SCI · Control y proceso administrativo · Manuales, tipos de control, indicadores · Evaluacion del SCI: objetivos, diagnostico, fuentes.",
        duracion: "5 h",
      },
    ],
    incluye: [
      "Constancia con validez oficial DC-3",
      "Plantillas de mapeo de procesos y cuestionarios de control",
      "Casos practicos con modelos COSO y CobiT",
      "Sesiones de dudas con el instructor",
    ],
    contactEmail: "cursos@kyoszen.com",
  },
  {
    slug: "relaciones-laborales",
    titulo: "Relaciones Laborales",
    categoria: "rrhh",
    categoriaLabel: "RRHH",
    modalidad: "online",
    horas: 14,
    modulos: 6,
    lecciones: 18,
    nivel: "Iniciacion",
    idioma: "Español",
    badge: null,
    instructor: "Equipo Kyoszen",
    instructorBio: "Abogados laborales y consultores de RRHH con experiencia en contratacion, relaciones colectivas y cumplimiento de la Ley Federal del Trabajo.",
    color: "#EAE0FB",
    iconColor: "var(--color-blue)",
    initials: "RL",
    descripcionCorta: "Define los conceptos de empresa, patron, trabajador y relacion laboral, identificando tipos de contratos, duracion y manera de demostrar la relacion laboral.",
    descripcionLarga: [
      "Al finalizar el curso definiras de manera clara los conceptos de empresa, establecimiento, patron, trabajador, relacion laboral, clases de contratos laborales y clases de trabajadores.",
      "Identificaras los tipos de relaciones de trabajo, su duracion, estructura, elementos y la manera de demostrar la relacion laboral cuando no hay contrato de trabajo formal.",
    ],
    aprenderas: [
      "Definir relacion de trabajo y sus elementos fundamentales",
      "Estructurar contratos individuales de trabajo",
      "Diferenciar contratos por tiempo determinado, indeterminado y por obra",
      "Identificar sujetos: trabajador, patron, patron sustituto, intermediario",
      "Distinguir conceptos legales de empresa y establecimiento",
      "Aplicar relaciones laborales estrategicas en la organizacion",
    ],
    dirigido: [
      "Encargados de RRHH y nominas",
      "Emprendedores y dueños de negocio",
      "Jefes que contratan personal",
      "Estudiantes de derecho y administracion",
    ],
    requisitos: [
      "Sin requisitos previos",
    ],
    contenido: [
      {
        titulo: "Relacion de trabajo",
        descripcion: "Concepto y fundamento legal · Elementos de la relacion de trabajo.",
        duracion: "2 h",
      },
      {
        titulo: "Contrato individual de trabajo",
        descripcion: "Concepto y fundamento legal · Elementos · Presuncion de la existencia del contrato.",
        duracion: "2.5 h",
      },
      {
        titulo: "Duracion de la relacion laboral",
        descripcion: "Tiempo determinado · Tiempo indeterminado · Por obra · Prorroga del contrato.",
        duracion: "2.5 h",
      },
      {
        titulo: "Sujetos que intervienen",
        descripcion: "Trabajador · Patron · Patron sustituto · Intermediario.",
        duracion: "2 h",
      },
      {
        titulo: "Empresa y establecimiento",
        descripcion: "Concepto y fundamento legal de la empresa · Concepto y fundamento legal del establecimiento.",
        duracion: "2.5 h",
      },
      {
        titulo: "Relaciones laborales estrategicas",
        descripcion: "Funcion y objetivo principal · Reformulacion de las relaciones laborales.",
        duracion: "2.5 h",
      },
    ],
    incluye: [
      "Constancia con validez oficial DC-3",
      "Plantillas de contratos individuales",
      "Guia rapida de LFT aplicada a PYMEs",
      "Sesiones de dudas legales",
    ],
    contactEmail: "cursos@kyoszen.com",
  },
  {
    slug: "asesoria-riesgo-trabajo",
    titulo: "Asesoria en Riesgo de Trabajo",
    categoria: "rrhh",
    categoriaLabel: "RRHH",
    modalidad: "hibrido",
    horas: 18,
    modulos: 5,
    lecciones: 22,
    nivel: "Intermedio",
    idioma: "Español",
    badge: "Nuevo",
    instructor: "Equipo Kyoszen",
    instructorBio: "Especialistas en seguridad social y salud ocupacional con experiencia tramitando incapacidades IMSS y cumplimiento de la Ley Federal del Trabajo.",
    color: "#fff3b0",
    iconColor: "#b45309",
    initials: "RT",
    descripcionCorta: "Comprende los riesgos profesionales, su clasificacion, evaluacion y mejora de condiciones de trabajo, con enfoque en la Ley del IMSS, LFT y NOM-035.",
    descripcionLarga: [
      "Comprenderas la relacion entre trabajo y salud, el conocimiento de los riesgos profesionales, la clasificacion, evaluacion y mejora de las condiciones de trabajo, detectar el peligro y actuar cuando se produce un riesgo grave e inminente.",
      "Tendras los conocimientos para saber cuales son las consecuencias para el trabajador y para la empresa, incluyendo el marco legal del IMSS, LFT y la NOM-035-STPS-2018.",
    ],
    aprenderas: [
      "Identificar que es y que no es un riesgo de trabajo",
      "Conocer obligaciones patronales ante el IMSS",
      "Calcular y presentar la prima de riesgo",
      "Gestionar incapacidades, formatos y pagos",
      "Aplicar obligaciones y excepciones de la LFT",
      "Vincular la NOM-035 con la prevencion de riesgos",
    ],
    dirigido: [
      "Encargados de nominas, SST y RRHH",
      "Contadores y administradores en PYMEs",
      "Responsables de Seguridad e Higiene",
      "Empleadores que desean cumplir normativa",
    ],
    requisitos: [
      "Conocimientos basicos de RRHH o nominas",
    ],
    contenido: [
      {
        titulo: "Los riesgos de trabajo",
        descripcion: "Que es un riesgo de trabajo · Que hacer ante un riesgo · Que no es un riesgo · Accidentes en trayecto · Consecuencias.",
        duracion: "3 h",
      },
      {
        titulo: "Ley del IMSS",
        descripcion: "Obligaciones de los patrones · Seguro de riesgos de trabajo · Prima de riesgo: determinacion, variacion y declaracion.",
        duracion: "4 h",
      },
      {
        titulo: "Incapacidades por riesgo de trabajo",
        descripcion: "Tramite · Formatos · Pago de incapacidades · Tipos de pensiones derivadas.",
        duracion: "4 h",
      },
      {
        titulo: "Ley Federal del Trabajo",
        descripcion: "Consideraciones generales · Obligaciones y excepciones · Indemnizaciones · Prevencion de riesgos.",
        duracion: "4 h",
      },
      {
        titulo: "La NOM-035-STPS-2018",
        descripcion: "Que es · Campo de aplicacion · Vinculacion con la prevencion de riesgos.",
        duracion: "3 h",
      },
    ],
    incluye: [
      "Constancia con validez oficial DC-3",
      "Formatos oficiales IMSS para incapacidades",
      "Plantilla de calculo de prima de riesgo",
      "Casos reales de tramites de riesgos de trabajo",
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
