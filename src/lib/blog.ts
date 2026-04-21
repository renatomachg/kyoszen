export type BlogPost = {
  slug: string;
  titulo: string;
  categoria: string;
  fecha: string;
  lectura: string;
  imagen: string;
  intro: string;
  secciones: { titulo: string; contenido: string }[];
  cta: { texto: string; boton: string; href: string };
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "rotacion-de-personal-costo-oculto",
    titulo: "Rotacion de Personal: El Costo Oculto que Frena a Tu Empresa",
    categoria: "RETENCION",
    fecha: "28 Mar 2026",
    lectura: "5 min",
    imagen: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1200&auto=format&fit=crop&q=80",
    intro: "Cada empleado que se va puede costarte hasta $200,000 pesos. No es exageracion — es el promedio documentado por AMEDIRH para rotacion temprana en Mexico.",
    secciones: [
      {
        titulo: "¿Cuanto cuesta realmente perder un empleado?",
        contenido: "Mexico tiene la tasa de rotacion mas alta de Latinoamerica: 17% segun AMEDIRH. Reemplazar a un colaborador puede costar entre 1.5 y 2 veces su salario anual, considerando reclutamiento, capacitacion, curva de aprendizaje y perdida de productividad.\n\nPara una empresa con 50 empleados operativos y un salario promedio de $12,000 mensuales, eso puede significar mas de $2 millones de pesos al año en costos de rotacion.",
      },
      {
        titulo: "Los costos que nadie contabiliza",
        contenido: "Mas alla de lo obvio (publicar vacantes, entrevistar, contratar), hay costos invisibles que impactan directamente:\n\n• Uniformes y equipo desperdiciado\n• Desmotivacion del equipo que se queda\n• Perdida de conocimiento operativo\n• Impacto en la imagen de la empresa como empleador\n\nCuando la rotacion es alta, el equipo actual empieza a cuestionar si deberia buscar algo mejor. Es un efecto domino.",
      },
      {
        titulo: "¿Por que rota el personal operativo en Mexico?",
        contenido: "Las 3 causas principales son claras:\n\n1. Salario insuficiente — cuando la oferta no es competitiva, el colaborador acepta la primera opcion mejor que encuentre.\n\n2. Mal proceso de seleccion — se contrato al perfil equivocado. Sin evaluacion real de habilidades, actitud y compatibilidad cultural.\n\n3. Choque entre lo prometido y la realidad — lo que se dijo en la entrevista no coincide con lo que el colaborador encontro al entrar. Horarios, funciones o ambiente distintos a lo esperado.",
      },
      {
        titulo: "Como un buen proceso de seleccion reduce la rotacion",
        contenido: "Un reclutamiento bien hecho no solo llena vacantes — filtra candidatos alineados al perfil, la cultura y los objetivos de la empresa.\n\nEmpresas que trabajan con consultoras especializadas como Kyoszen reducen su rotacion hasta en un 40%. ¿Como? Con procesos que incluyen:\n\n• Entrevistas estructuradas por competencias\n• Verificacion de documentos y referencias\n• Evaluacion de compatibilidad cultural\n• Seguimiento post-contratacion durante los primeros 90 dias",
      },
    ],
    cta: {
      texto: "¿Tu empresa tiene alta rotacion? Hablemos.",
      boton: "Contactar a Kyoszen",
      href: "/contacto",
    },
  },
  {
    slug: "tendencias-reclutamiento-2026",
    titulo: "5 Tendencias de Reclutamiento que No Puedes Ignorar en 2026",
    categoria: "TENDENCIAS RH",
    fecha: "5 Abr 2026",
    lectura: "4 min",
    imagen: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&auto=format&fit=crop&q=80",
    intro: "El mercado laboral mexicano esta en transformacion. En 2026, reclutar mal ya no es una opcion — la competencia por talento operativo nunca habia sido tan intensa.",
    secciones: [
      {
        titulo: "1. Contratacion basada en habilidades, no solo en CV",
        contenido: "El enfoque \"Beyond the CV\" gana terreno en Mexico y el mundo. Cada vez mas empresas implementan pruebas practicas, entrevistas estructuradas y evaluacion de potencial real sobre titulos y experiencia escrita.\n\nUn candidato sin titulo universitario pero con habilidades comprobadas puede superar a uno con maestria pero sin experiencia practica. Las empresas que entienden esto contratan mejor.",
      },
      {
        titulo: "2. IA en el proceso de seleccion",
        contenido: "El 1.3% de todas las vacantes en Mexico ya menciona habilidades de IA (el doble que el año anterior). Las herramientas de inteligencia artificial agilizan el filtrado inicial, identifican patrones en perfiles exitosos y reducen el tiempo de contratacion.\n\nPero la decision final sigue siendo humana. La IA es una herramienta, no un reemplazo del juicio profesional de un reclutador experimentado.",
      },
      {
        titulo: "3. Experiencia del candidato como factor decisivo",
        contenido: "El 63% de los candidatos acepta primero la oferta de la empresa que les dio mejor experiencia en el proceso, aunque no sea la mejor oferta economica.\n\n¿Que significa \"buena experiencia\"? Comunicacion clara, tiempos de respuesta rapidos, retroalimentacion honesta y un proceso que respete el tiempo del candidato.",
      },
      {
        titulo: "4. Gen Z representa mas del 30% de la fuerza laboral",
        contenido: "Sus prioridades son distintas a generaciones anteriores: proposito, balance vida-trabajo y crecimiento profesional. El 77% valora mas la cultura organizacional que el salario inicial.\n\nLas empresas que no adapten su propuesta de valor al talento joven van a perder frente a las que si lo hagan. No es cuestion de gustos — es matematica demografica.",
      },
      {
        titulo: "5. \"Great Stay\": menos rotacion por incertidumbre economica",
        contenido: "En 2026 se proyecta menor rotacion — no por fidelidad, sino porque los trabajadores prefieren no arriesgar un cambio en un entorno economico incierto.\n\nLas empresas que sepan aprovechar este momento para invertir en cultura, capacitacion y desarrollo construiran equipos mas estables a largo plazo. Es una ventana de oportunidad que no durara para siempre.",
      },
    ],
    cta: {
      texto: "¿Listo para reclutar mejor en 2026? Kyoszen te acompaña.",
      boton: "Contactar a Kyoszen",
      href: "/contacto",
    },
  },
  {
    slug: "por-que-invertir-en-capacitacion",
    titulo: "Por Que Invertir en Capacitacion es la Mejor Decision que Puedes Tomar",
    categoria: "CAPACITACION",
    fecha: "1 Abr 2026",
    lectura: "4 min",
    imagen: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&auto=format&fit=crop&q=80",
    intro: "Empresas que capacitan crecen 3 veces mas rapido. Pero en Mexico, la mayoria de las pymes todavia ven la capacitacion como un gasto — no como una inversion.",
    secciones: [
      {
        titulo: "El mito del \"si los capacito se van a ir\"",
        contenido: "La realidad es al contrario: los colaboradores que reciben capacitacion tienen mayor sentido de pertenencia y permanecen mas tiempo. El 87% de los empleados es leal a empresas que invierten en su bienestar y desarrollo.\n\nLa pregunta correcta no es \"¿que pasa si los capacito y se van?\" sino \"¿que pasa si NO los capacito y se quedan?\"",
      },
      {
        titulo: "Que pasa cuando no capacitas",
        contenido: "Las consecuencias son visibles en el dia a dia:\n\n• Errores operativos frecuentes que cuestan dinero y tiempo\n• Mandos medios sin herramientas para liderar equipos\n• Equipos que no saben como resolver conflictos internos\n• Incumplimiento de normas como NOM-035 (riesgo psicosocial)\n\nCada uno de estos problemas tiene un costo directo en productividad, clima laboral y resultados del negocio.",
      },
      {
        titulo: "ROI real de la capacitacion",
        contenido: "Los numeros hablan por si solos:\n\n• Por cada peso invertido en bienestar y formacion, las empresas obtienen hasta 4 pesos en productividad (OMS)\n• Los sectores operativos que capacitan reducen errores hasta en un 35%\n• La capacitacion en liderazgo reduce la rotacion de equipos en un 25%\n\nNo es un gasto — es la inversion con mejor retorno que puede hacer una pyme en crecimiento.",
      },
      {
        titulo: "Que tipo de capacitacion necesita tu empresa",
        contenido: "No toda capacitacion es igual. La clave es alinear el contenido con las necesidades reales de tu operacion:\n\nPara mandos medios: liderazgo, manejo de equipos, comunicacion efectiva, NOM-035.\n\nPara personal operativo: induccion bien estructurada, procesos claros, habilidades blandas basicas, seguridad industrial.\n\nKyoszen ofrece mas de 25 cursos diseñados especificamente para microempresas y pymes en crecimiento. Desde sesiones de 4 horas hasta programas completos de desarrollo organizacional.",
      },
    ],
    cta: {
      texto: "Conoce nuestro catalogo de cursos y empieza hoy.",
      boton: "Ver cursos",
      href: "/cursos",
    },
  },
];

export function getBlogBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
