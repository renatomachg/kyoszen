import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { SinPermiso, exigirSeccion } from "@/lib/admin-auth";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const runtime = "nodejs";
export const maxDuration = 60;

interface Pieza {
  fecha: string;          // YYYY-MM-DD
  red_social: string;     // facebook | tiktok
  formato: string;        // 1 slide | carrusel | video | historia
  titulo_interno: string;
  caption: string;
  nota_visual: string;
}

const SYSTEM_PARSE = `Eres un extractor de datos. Recibirás un calendario de contenido de redes sociales (en HTML o texto) y debes extraer CADA publicación individual.

Para cada publicación, extrae exactamente estos campos:
- "fecha": la fecha de publicación en formato YYYY-MM-DD. Infiere el año y mes del título o contexto del documento. Si dice "LUN 1 JUN" y el documento es de junio 2026, la fecha es "2026-06-01".
- "red_social": "facebook" o "tiktok" (en minúsculas). REGLA CLAVE para clasificar:
  · Si menciona "TikTok", o el formato es un VIDEO (9:16, vertical, UGC, talking head, reel) → "tiktok".
  · Si menciona "Facebook", "FB", "feed", "carrusel", "1 slide", "historia" → "facebook".
  · Ante la duda, mira el formato: video = tiktok, imagen/slide/carrusel = facebook.
- "formato": describe el formato corto, ej: "1 slide", "carrusel 3 slides", "video 9:16", "historia".
- "titulo_interno": el título o tema de la pieza (el encabezado h4, sin emojis al inicio).
- "caption": el copy/texto listo para publicar, INCLUYENDO los hashtags al final. Une el copy con sus hashtags en un solo texto. Respeta los saltos de línea con \\n.
- "nota_visual": la dirección visual / descripción de qué diseñar. Si es un video, incluye el guión resumido.

Reglas:
- Devuelve SOLO un array JSON válido, sin markdown, sin explicaciones, sin bloques de código.
- Ordena las piezas por fecha ascendente.
- Si una pieza no tiene algún campo, usa string vacío "".
- No inventes piezas que no estén en el documento.
- Extrae SOLO publicaciones reales (las que tienen fecha, copy y formato propio). NO extraigas filas de tablas de resumen, ritmo semanal, métricas, checklists de producción ni políticas — esas no son publicaciones.`;

function limpiarHtml(input: string): string {
  // Si no parece HTML, devolver tal cual
  if (!/<[a-z][\s\S]*>/i.test(input)) return input;
  return input
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<head[\s\S]*?<\/head>/gi, " ")
    .replace(/<\/(div|p|section|tr|h[1-6]|li)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&aacute;/gi, "á").replace(/&eacute;/gi, "é").replace(/&iacute;/gi, "í")
    .replace(/&oacute;/gi, "ó").replace(/&uacute;/gi, "ú").replace(/&ntilde;/gi, "ñ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extraerJSON(texto: string): Pieza[] {
  let limpio = texto.trim();
  // Quitar fences de markdown si los hubiera
  limpio = limpio.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  // Buscar el primer [ y el último ]
  const start = limpio.indexOf("[");
  const end = limpio.lastIndexOf("]");
  if (start !== -1 && end !== -1) limpio = limpio.slice(start, end + 1);
  return JSON.parse(limpio);
}

// Divide el plan por semanas para procesar en paralelo (más rápido)
function dividirEnLotes(texto: string): string[] {
  const matches = [...texto.matchAll(/SEMANA\s*\d+/gi)];
  if (matches.length < 2) return [texto];
  const head = texto.split("\n").slice(0, 8).join("\n"); // contexto de mes/año
  const lotes: string[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index ?? 0;
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? texto.length) : texto.length;
    lotes.push(`${head}\n\n=== FRAGMENTO A EXTRAER ===\n${texto.slice(start, end)}`);
  }
  return lotes;
}

async function parsearLote(lote: string): Promise<Pieza[]> {
  const resp = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    system: SYSTEM_PARSE,
    messages: [{ role: "user", content: lote }],
  });
  const textBlock = resp.content.find((b) => b.type === "text");
  const raw = textBlock && textBlock.type === "text" ? textBlock.text : "[]";
  try { return extraerJSON(raw); } catch { return []; }
}

export async function POST(req: NextRequest) {
  try {
    await exigirSeccion(req, "redes-sociales");
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY no configurada" }, { status: 503 });
    }

    let body: { action?: string; texto?: string; piezas?: Pieza[] };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Body inválido" }, { status: 400 });
    }

    // ── ANALIZAR: parsear el plan con Claude ──
    if (body.action === "analizar") {
      const texto = (body.texto ?? "").trim();
      if (texto.length < 30) {
        return NextResponse.json({ error: "Pega el plan de contenido completo." }, { status: 400 });
      }

      try {
        const textoLimpio = limpiarHtml(texto).slice(0, 60000);
        const lotes = dividirEnLotes(textoLimpio);

        // Procesar todos los lotes (semanas) en paralelo
        const resultados = await Promise.all(lotes.map((l) => parsearLote(l)));
        let piezas = resultados.flat();

        // Quitar fantasmas (sin título o caption) y duplicados, luego ordenar
        const vistos = new Set<string>();
        piezas = piezas
          .filter((p) => p && p.fecha && (p.titulo_interno?.trim() || p.caption?.trim()))
          .filter((p) => {
            // dedup por día + red (una publicación por día/red en este flujo)
            const k = `${p.fecha}|${p.red_social}`;
            if (vistos.has(k)) return false;
            vistos.add(k);
            return true;
          })
          .sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""));

        if (piezas.length === 0) {
          return NextResponse.json({ error: "No se detectaron publicaciones en el plan." }, { status: 422 });
        }

        // Marcar las que ya existen en el calendario (mismo día + misma red)
        const fechas = [...new Set(piezas.map((p) => p.fecha).filter(Boolean))];
        const { data: existentes } = await sb
          .from("social_posts")
          .select("fecha_programada, red_social")
          .in("fecha_programada", fechas);
        const setExist = new Set((existentes ?? []).map((e) => `${e.fecha_programada}|${e.red_social}`));

        const piezasMarcadas = piezas.map((p) => ({
          ...p,
          ya_existe: setExist.has(`${p.fecha}|${p.red_social || "facebook"}`),
        }));

        return NextResponse.json({ piezas: piezasMarcadas });
      } catch (err) {
        console.error("Importar/analizar error:", err);
        return NextResponse.json({ error: "Error al analizar el plan. Intenta de nuevo." }, { status: 500 });
      }
    }

    // ── CREAR: insertar las publicaciones confirmadas ──
    if (body.action === "crear") {
      const piezas = body.piezas ?? [];
      if (!Array.isArray(piezas) || piezas.length === 0) {
        return NextResponse.json({ error: "No hay publicaciones para crear." }, { status: 400 });
      }

      let creadas = 0;
      let omitidas = 0;
      const errores: string[] = [];
      const hoy = new Date().toISOString().slice(0, 10);

      // Doble seguridad: re-verificar contra lo que ya existe en el calendario
      const fechas = [...new Set(piezas.map((p) => p.fecha).filter(Boolean))];
      const { data: existentes } = await sb
        .from("social_posts")
        .select("fecha_programada, red_social")
        .in("fecha_programada", fechas.length ? fechas : ["0000-00-00"]);
      const setExist = new Set((existentes ?? []).map((e) => `${e.fecha_programada}|${e.red_social}`));

      for (const p of piezas) {
        const clave = `${p.fecha}|${p.red_social || "facebook"}`;
        // Bloqueo de fechas pasadas: no se crean publicaciones con fecha anterior a hoy
        if (p.fecha && p.fecha < hoy) { omitidas++; continue; }
        // Si ya hay una publicación ese día en esa red, se respeta lo existente
        if (setExist.has(clave)) { omitidas++; continue; }

        try {
          const { data: post, error: postErr } = await sb
            .from("social_posts")
            .insert({
              red_social: p.red_social || "facebook",
              fecha_programada: p.fecha,
              titulo_interno: p.titulo_interno || "",
              publicado: false, // nace como borrador, solo el admin lo ve hasta publicar
            })
            .select()
            .single();

          if (postErr || !post) { errores.push(p.titulo_interno || p.fecha); continue; }

          const { error: vErr } = await sb.from("social_post_versions").insert({
            post_id: post.id,
            version_num: 1,
            caption: p.caption || "",
            imagenes: [],
            nota_visual: p.nota_visual || "",
            es_activa: true,
          });

          if (vErr) { errores.push(p.titulo_interno || p.fecha); continue; }
          setExist.add(clave); // evita duplicar dentro del mismo lote
          creadas++;
        } catch {
          errores.push(p.titulo_interno || p.fecha);
        }
      }

      return NextResponse.json({ creadas, omitidas, total: piezas.length, errores });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
