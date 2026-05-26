import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fetchContexto() {
  const since30 = new Date(Date.now() - 30 * 86400_000).toISOString();
  const since7  = new Date(Date.now() - 7  * 86400_000).toISOString();

  const [
    { data: eventos30 },
    { data: eventos7 },
    { data: contactos },
    { data: aplicaciones },
    { data: vacantes },
    { data: cursos },
  ] = await Promise.all([
    sb.from("site_eventos").select("tipo, valor, session_id, created_at").gte("created_at", since30),
    sb.from("site_eventos").select("tipo, valor, session_id").gte("created_at", since7),
    sb.from("contactos").select("asunto, created_at").gte("created_at", since30).order("created_at", { ascending: false }),
    sb.from("aplicaciones").select("vacante, created_at").gte("created_at", since30).order("created_at", { ascending: false }),
    sb.from("vacantes").select("titulo, categoria, ubicacion, activa"),
    sb.from("cursos").select("titulo, categoria_label, nivel, activo"),
  ]);

  // Agregaciones de eventos 30 días
  const conteo = (tipo: string, data: typeof eventos30) =>
    (data ?? []).filter((e) => e.tipo === tipo).length;

  const topValor = (tipo: string, data: typeof eventos30, n = 5) => {
    const map: Record<string, number> = {};
    for (const e of data ?? []) {
      if (e.tipo !== tipo || !e.valor) continue;
      let key = e.valor;
      try { const p = JSON.parse(e.valor); key = p.titulo ?? e.valor; } catch { /* noop */ }
      map[key] = (map[key] ?? 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k} (${v})`);
  };

  const sesiones30 = new Set((eventos30 ?? []).map((e) => e.session_id).filter(Boolean)).size;
  const sesiones7  = new Set((eventos7  ?? []).map((e) => e.session_id).filter(Boolean)).size;

  // Funnel vacantes
  const vistas   = conteo("vacante_vista", eventos30);
  const clicks   = conteo("vacante_aplicar_click", eventos30);
  const enviadas = conteo("vacante_aplicacion_enviada", eventos30);

  return `
## DATOS DEL SITIO KYOSZEN.COM — últimos 30 días

### Tráfico
- Sesiones únicas (30d): ${sesiones30}
- Sesiones únicas (7d): ${sesiones7}
- Total eventos registrados: ${(eventos30 ?? []).length}

### Funnel de vacantes
- Vistas de páginas de vacante: ${vistas}
- Clics en "Aplicar ahora": ${clicks} (${vistas > 0 ? Math.round((clicks/vistas)*100) : 0}% de los que ven)
- Solicitudes enviadas: ${enviadas} (${clicks > 0 ? Math.round((enviadas/clicks)*100) : 0}% de los que hacen clic)

### Vacantes más vistas
${topValor("vacante_vista", eventos30).join("\n") || "Sin datos"}

### Cursos con más solicitudes de informes
${topValor("curso_informes_click", eventos30).join("\n") || "Sin datos"}

### Motivos de contacto (formulario)
${topValor("contacto_enviado", eventos30).join("\n") || "Sin datos"}

### WhatsApp
- Clics totales en WhatsApp: ${conteo("whatsapp_click", eventos30)}

### Asistente Kyo
- Mensajes recibidos: ${conteo("kyo_mensaje", eventos30)}
- Navegaciones activadas: ${conteo("kyo_navegacion", eventos30)}
- Búsquedas en vacantes: ${conteo("busqueda_vacantes", eventos30)}

### Leads recibidos (últimos 30d)
- Contactos por formulario: ${(contactos ?? []).length}
- Asuntos: ${[...new Set((contactos ?? []).map((c: { asunto: string }) => c.asunto))].filter(Boolean).join(", ") || "Sin datos"}
- Aplicaciones a vacantes: ${(aplicaciones ?? []).length}

### Catálogo actual
- Vacantes activas: ${(vacantes ?? []).filter((v: { activa: boolean }) => v.activa).length} de ${(vacantes ?? []).length} totales
- Cursos activos: ${(cursos ?? []).filter((c: { activo: boolean }) => c.activo).length} de ${(cursos ?? []).length} totales
- Categorías de cursos: ${[...new Set((cursos ?? []).map((c: { categoria_label: string }) => c.categoria_label))].filter(Boolean).join(", ")}
`.trim();
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const contexto = await fetchContexto();

    const systemPrompt = `Eres un consultor experto en estrategia digital y marketing para empresas de capital humano en México. Tu nombre es **Estratega**.

Tu misión: analizar los datos reales del sitio kyoszen.com y proponer servicios o mejoras concretas que se le puedan vender a Kyoszen como servicios adicionales al sitio web.

Kyoszen es una consultora de capital humano (reclutamiento, capacitación, inducción, digitalización de RRHH) que atiende microempresas y pymes en CDMX y Área Metropolitana.

${contexto}

## Tu forma de trabajar:
1. Usa siempre los datos reales que tienes arriba para fundamentar tus ideas
2. Conecta los datos con tendencias del mercado laboral y digital mexicano
3. Propone servicios concretos, con nombre, descripción corta y argumento de venta
4. Prioriza por impacto potencial y facilidad de implementación
5. Sé directo, práctico y orientado a negocio
6. Responde siempre en español, sin lenguaje técnico innecesario

Cuando detectes algo en los datos (ej. alta tasa de abandono, mucho interés en cierto curso), explícalo primero y luego propón qué servicio se puede ofrecer basándose en eso.`;

    const stream = await anthropic.messages.stream({
      model: "claude-opus-4-5",
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      },
    });

    return new NextResponse(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    console.error("Estratega error:", err);
    return NextResponse.json({ error: "Error al generar análisis" }, { status: 500 });
  }
}
