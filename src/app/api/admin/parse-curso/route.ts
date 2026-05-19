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
      content: `Extrae la informacion de este curso de capacitacion y devuelve SOLO un JSON valido sin explicaciones ni markdown.

Texto:
${texto}

Devuelve este JSON con los campos que puedas inferir:

{
  "titulo": "string (requerido, nombre del curso)",
  "categoria": "liderazgo | ventas | rh | seguridad | tecnologia | finanzas | operaciones | desarrollo-personal (elige la que mejor aplique)",
  "categoria_label": "Liderazgo y Gestion | Ventas y Atencion al Cliente | Recursos Humanos | Seguridad e Higiene | Tecnologia e Innovacion | Finanzas y Contabilidad | Operaciones y Logistica | Desarrollo Personal (corresponde a la categoria)",
  "modalidad": "En vivo | Online | Hibrido (default: En vivo)",
  "nivel": "Basico | Intermedio | Avanzado (inferir del contenido, default: Basico)",
  "horas": number (duracion en horas, default: 8),
  "descripcion_corta": "string (1-2 oraciones sobre el curso)",
  "badge": "Nuevo | Popular | DC-3 | (vacio si no aplica)"
}`,
    }],
  });

  const raw = (response.content[0] as Anthropic.TextBlock).text.trim();
  const clean = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "");

  try {
    const data = JSON.parse(clean);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "No se pudo parsear la respuesta de IA", raw }, { status: 500 });
  }
}
