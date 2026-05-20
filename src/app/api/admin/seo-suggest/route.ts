import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const KYOSZEN_CONTEXT = `
Empresa: Kyoszen
Rubro: Consultoria de Capital Humano en Mexico (CDMX y Area Metropolitana)
Mas de 10 años de experiencia.

Servicios:
- Reclutamiento y seleccion de personal (busqueda selectiva y masiva, puestos temporales y permanentes)
- Capacitacion de personal (cursos para empresas: liderazgo, ventas, RRHH, seguridad, tecnologia, finanzas, operaciones)
- Digitalizacion de documentos
- Induccion de personal (videos de induccion por puesto)

Diferenciadores:
- Acompañamiento personalizado
- Mas de 10 años en el mercado mexicano
- Cobertura de vacantes en tiempo y forma
- Contacto en menos de 24 horas habiles
- Reduccion de rotacion de personal

Audiencia doble:
1. Empresas (clientes): buscan cubrir vacantes rapidamente, reducir rotacion, capacitar a su equipo
2. Candidatos (trabajadores): buscan empleo activamente en CDMX y zona metropolitana

Propuesta de valor: "Kyoszen te permite enfocarte en tu negocio mientras nosotros gestionamos tu capital humano"
`.trim();

const PAGE_CONTEXT: Record<string, string> = {
  home: `Pagina de inicio. Presenta la empresa, sus servicios principales (reclutamiento, capacitacion, induccion, digitalizacion), diferenciadores, testimonios y llamadas a la accion. Audiencia: tanto empresas como candidatos en Mexico.`,
  vacantes: `Pagina de vacantes activas. Muestra empleos disponibles para candidatos que buscan trabajo en CDMX y zona metropolitana. Incluye buscador por puesto, filtros y formulario de aplicacion.`,
  cursos: `Catalogo de cursos de capacitacion para empresas. Incluye cursos de liderazgo, ventas, recursos humanos, seguridad e higiene, tecnologia, finanzas, operaciones y desarrollo personal. Dirigido a empresas que quieren capacitar a su equipo.`,
  nosotros: `Pagina institucional. Presenta la historia, mision, vision, valores y equipo de Kyoszen. Mas de 10 años de experiencia en capital humano en Mexico.`,
  servicios: `Detalle de los servicios de consultoria de capital humano: reclutamiento y seleccion, capacitacion, induccion de personal y digitalizacion de documentos. Dirigido a empresas mexicanas.`,
  contacto: `Formulario de contacto para empresas que quieren solicitar informacion sobre servicios o candidatos que quieren comunicarse. Incluye formulario y datos de contacto directo.`,
  blog: `Blog con articulos sobre recursos humanos, reclutamiento, capacitacion, tendencias laborales y consejos para empresas y candidatos en Mexico.`,
};

export async function POST(req: NextRequest) {
  const { pagina } = await req.json();

  if (!pagina || !PAGE_CONTEXT[pagina]) {
    return NextResponse.json({ error: "Pagina no valida" }, { status: 400 });
  }

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{
      role: "user",
      content: `Eres un experto en SEO para sitios web de empresas mexicanas de servicios B2B y B2C.

Contexto de la empresa:
${KYOSZEN_CONTEXT}

Pagina a optimizar: ${pagina.toUpperCase()}
Descripcion de la pagina: ${PAGE_CONTEXT[pagina]}

Genera un titulo SEO y una meta description OPTIMIZADOS para esta pagina. Devuelve SOLO un JSON valido sin markdown:

{
  "titulo": "string (maximo 60 caracteres, incluye keyword principal + nombre de marca al final)",
  "descripcion": "string (entre 140-160 caracteres, incluye keyword, beneficio claro y CTA natural, sin puntos suspensivos al final)"
}

Reglas:
- Sin acentos en el texto (convencion del cliente)
- Lenguaje directo y profesional, espanol de Mexico
- El titulo debe incluir la keyword principal primero, luego " | Kyoszen" o " — Kyoszen"
- La descripcion debe responder: que es, para quien es, y por que contactar
- No uses frases genericas como "bienvenido a" o "somos una empresa"
- Enfocate en beneficios concretos y palabras que la gente realmente busca en Google`,
    }],
  });

  const raw = (response.content[0] as Anthropic.TextBlock).text.trim();
  const clean = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "");

  try {
    const data = JSON.parse(clean);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "No se pudo generar la sugerencia", raw }, { status: 500 });
  }
}
