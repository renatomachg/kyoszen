import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { calcularMetricasSitio, detectarPatrones, periodoLabel, type MetricasInforme } from "@/lib/social-informe";
import { SinPermiso, exigirSeccion } from "@/lib/admin-auth";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export const runtime = "nodejs";
export const maxDuration = 60;

function rangosMes(periodo: string) {
  // periodo "2026-06"
  const [y, mRaw] = periodo.split("-").map(Number);
  const m0 = mRaw - 1;
  const first = new Date(y, m0, 1);
  const last = new Date(y, m0 + 1, 0);
  const firstAnt = new Date(y, m0 - 1, 1);
  const lastAnt = new Date(y, m0, 0);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return {
    desde: iso(first), hasta: iso(last),
    desdeAnt: iso(firstAnt), hastaAnt: iso(lastAnt),
    label: periodoLabel(y, m0),
  };
}

async function redactarConIA(m: MetricasInforme, patrones: string[], label: string) {
  const contexto = `
DATOS REALES DE ${label.toUpperCase()} (redes sociales de Kyoszen — consultora de capital humano en CDMX):

Actividad de contenido:
- Publicaciones del mes: ${m.publicaciones_total} (${m.publicaciones_aprobadas} aprobadas)
- Por red: ${Object.entries(m.publicaciones_por_red).map(([r, n]) => `${r}: ${n}`).join(", ") || "sin datos"}

Resultados de negocio (medidos en el sitio kyoszen.com):
- Clics a WhatsApp: ${m.whatsapp_clicks}${m.vs_anterior.whatsapp_clicks !== null ? ` (${m.vs_anterior.whatsapp_clicks >= 0 ? "+" : ""}${m.vs_anterior.whatsapp_clicks}% vs mes pasado)` : ""}
- Vistas de vacantes: ${m.vacante_vistas}
- Aplicaciones a vacantes: ${m.aplicaciones}
- Solicitudes de informes de cursos: ${m.curso_informes}
- Contactos por formulario: ${m.contactos}
- Mensajes al asistente Kyo: ${m.kyo_mensajes}

Patrones detectados (datos duros, NO inventes nada fuera de esto):
${patrones.map((p) => `- ${p}`).join("\n")}

Mejor contenido del mes:
${m.top_contenido.map((c) => `- "${c.titulo}" (${c.red}, ${c.comentarios} comentarios)`).join("\n") || "Sin datos suficientes"}
`.trim();

  const system = `Eres el estratega de redes sociales de Kyoszen. Escribes el informe MENSUAL que se le presenta al cliente (Rosy y Monse, dueñas no técnicas de una consultora de RRHH).

Tu trabajo: a partir de los datos reales que te doy, redactar 3 bloques en español de México, claros, cálidos y orientados a negocio. NO inventes cifras ni inventes métricas que no estén en los datos. Si un dato es bajo (cuenta nueva), enmárcalo como punto de partida y oportunidad, con honestidad.

Responde SOLO con un JSON válido (sin markdown, sin bloques de código) con esta forma exacta:
{
  "resumen": "2-3 frases que resumen el mes en tono positivo y honesto",
  "decisiones": "3-4 decisiones concretas de qué hacer el próximo mes, cada una empezando con un verbo, fundamentadas en los datos. Usa saltos de línea \\n entre cada una con un guion al inicio.",
  "propuestas": "1-2 oportunidades para que KYOSZEN gane en SU negocio según las señales (ej: si hay interés en cursos, proponer capitalizarlo). Cada una con guion y salto de línea \\n."
}`;

  const resp = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    system,
    messages: [{ role: "user", content: contexto }],
  });
  const block = resp.content.find((b) => b.type === "text");
  let raw = block && block.type === "text" ? block.text : "{}";
  raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const s = raw.indexOf("{"); const e = raw.lastIndexOf("}");
  if (s !== -1 && e !== -1) raw = raw.slice(s, e + 1);
  try { return JSON.parse(raw); } catch { return { resumen: "", decisiones: "", propuestas: "" }; }
}

export async function GET(req: NextRequest) {
  try {
    await exigirSeccion(req, "redes-sociales");
    const { data } = await sb.from("social_informes").select("*").order("periodo", { ascending: false });
    return NextResponse.json(data ?? []);
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await exigirSeccion(req, "redes-sociales");
    const body = await req.json();
    const { action } = body;

    // ── Generar borrador (calcula métricas + IA) ──
    if (action === "generar") {
      const periodo: string = body.periodo; // "2026-06"
      if (!periodo) return NextResponse.json({ error: "Falta el período" }, { status: 400 });
      const r = rangosMes(periodo);

      const metricas = await calcularMetricasSitio(sb, r.desde, r.hasta, r.desdeAnt, r.hastaAnt);
      const patrones = detectarPatrones(metricas);

      let ia = { resumen: "", decisiones: "", propuestas: "" };
      try { ia = await redactarConIA(metricas, patrones, r.label); }
      catch (e) { console.error("IA informe error:", e); }

      // Guardar/actualizar como borrador
      const { data, error } = await sb.from("social_informes").upsert({
        periodo, periodo_label: r.label, desde: r.desde, hasta: r.hasta,
        metricas, resumen: ia.resumen, decisiones: ia.decisiones, propuestas: ia.propuestas,
        estado: "borrador", fuente: "sitio", updated_at: new Date().toISOString(),
      }, { onConflict: "periodo" }).select().single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    }

    // ── Guardar edición del admin ──
    if (action === "guardar") {
      const { id, resumen, decisiones, propuestas } = body;
      const { error } = await sb.from("social_informes")
        .update({ resumen, decisiones, propuestas, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    // ── Publicar / despublicar ──
    if (action === "publicar" || action === "despublicar") {
      const { id } = body;
      const { error } = await sb.from("social_informes")
        .update({ estado: action === "publicar" ? "publicado" : "borrador", updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
