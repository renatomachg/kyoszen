import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { texto } = await req.json();
  if (!texto?.trim()) return NextResponse.json({ error: "Texto vacio" }, { status: 400 });

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `Extrae la informacion de esta vacante de trabajo y devuelve SOLO un JSON valido sin explicaciones ni markdown.

Texto:
${texto}

Devuelve este JSON con los campos que puedas inferir. Para campos no mencionados usa los defaults indicados:

{
  "titulo": "string (requerido)",
  "empresa": "string (default: Kyoszen)",
  "ubicacion": "Presencial | Remoto | Hibrido (inferir del texto, default: Presencial)",
  "jornada": "Tiempo completo | Medio tiempo | Por proyecto (default: Tiempo completo)",
  "contrato": "Indefinido | Temporal | Por honorarios (default: Indefinido)",
  "salario": number (solo numero en MXN, sin signos, default: 0),
  "categoria": "Operativo | Administrativo | Ventas | Recursos Humanos | Contabilidad | Tecnologia | Logistica (inferir del puesto)",
  "badge": "Urgente | Nuevo | Destacado | (vacio si no aplica)",
  "badge_class": "bg-red-100 text-red-700 si Urgente | bg-green-100 text-green-700 si Nuevo | bg-yellow text-black si Destacado | vacio si no aplica",
  "descripcion": "string (resumen del puesto en 1-2 oraciones)",
  "responsabilidades": ["array", "de", "strings"],
  "requisitos": ["array", "de", "strings"],
  "tags": ["array", "de", "habilidades", "o", "palabras", "clave"]
}`,
    }],
  });

  const raw = (response.content[0] as Anthropic.TextBlock).text.trim();

  // Limpiar markdown si viene con backticks
  const clean = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "");

  try {
    const data = JSON.parse(clean);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "No se pudo parsear la respuesta de IA", raw }, { status: 500 });
  }
}
