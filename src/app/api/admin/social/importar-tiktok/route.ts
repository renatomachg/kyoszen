import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const runtime = "nodejs";
export const maxDuration = 60;

interface Frame {
  tc: string;        // "0-3 s · HOOK"
  tipo: string;      // hook | normal | cta
  overlay: string;   // texto en pantalla
  escena: string;    // que se ve
  dice: string;      // que dice
}
interface Storyboard {
  audiencia: string;
  duracion: string;
  frames: Frame[];
  cta: string;
  hashtags: string;
  nota_produccion: string;
}
interface PiezaTT {
  titulo: string;
  caption: string;
  storyboard: Storyboard;
}
interface PropuestaTT {
  titulo?: string;
  subtitulo?: string;
  por_que?: string;
  linea_diseno?: string[];
  copy?: string[];
  caption?: string;
}
interface MontajeTT { beat?: string; texto?: string; color?: string; nota?: string }
interface GuiaTecnicaTT {
  titulo?: string;
  prompt?: string;
  linea_hablada?: string;
  montaje?: MontajeTT[];
  caption?: string;
  hashtags?: string;
  cta_tecnica?: string;
}

const SYSTEM = `Eres un extractor de datos. Recibiras el HTML (o texto) de un storyboard de videos de TikTok y debes extraer CADA video.

Para cada video, devuelve un objeto con:
- "titulo": el titulo del video (el h3, sin comillas raras).
- "caption": el texto del bloque "Caption TikTok".
- "storyboard": objeto con:
  - "audiencia": valor de "Audiencia" en la meta del video.
  - "duracion": valor de "Duracion" (ej "15 s").
  - "cta": el texto del bloque "CTA".
  - "hashtags": el texto del bloque "Hashtags".
  - "nota_produccion": el texto del bloque "Nota de produccion".
  - "frames": array, un objeto por cada cuadro (.frame) del storyboard, en orden:
    - "tc": el timecode/etiqueta del cuadro (ej "0-3 s · HOOK", "3-6 s", "12-15 s · CTA").
    - "tipo": "hook" si el cuadro es el gancho (tiene HOOK), "cta" si es el de cierre (tiene CTA), si no "normal".
    - "overlay": el texto que aparece en pantalla (overlay-text).
    - "escena": la descripcion de lo que se ve (scene-tag).
    - "dice": lo que dice la persona (el texto despues de "Dice").

Reglas:
- Devuelve SOLO un array JSON valido, sin markdown ni explicaciones.
- Respeta el orden de los videos y de los frames.
- Si un campo no existe, usa string vacio "".
- No inventes videos ni frames que no esten.`;

function extraerJSON(texto: string): PiezaTT[] {
  let limpio = texto.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = limpio.indexOf("[");
  const end = limpio.lastIndexOf("]");
  if (start !== -1 && end !== -1) limpio = limpio.slice(start, end + 1);
  return JSON.parse(limpio);
}

// Parsea un documento con Claude y devuelve el array tipado (o [] si falla).
async function parseDoc<T>(system: string, texto: string): Promise<T[]> {
  try {
    const resp = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 8000,
      system,
      messages: [{ role: "user", content: texto.slice(0, 80000) }],
    });
    const block = resp.content.find((b) => b.type === "text");
    let raw = block && block.type === "text" ? block.text : "[]";
    raw = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const start = raw.indexOf("[");
    const end = raw.lastIndexOf("]");
    if (start !== -1 && end !== -1) raw = raw.slice(start, end + 1);
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

const SYSTEM_PROP = `Eres un extractor de datos. Recibiras el HTML (o texto) de una PROPUESTA de videos de TikTok dirigida al cliente. Extrae CADA video en orden.
Para cada video devuelve un objeto con:
- "titulo": el titulo del video (el h3 principal del video, sin la etiqueta "Video N").
- "subtitulo": la descripcion corta debajo del titulo (.sub) si existe.
- "por_que": el texto del bloque "Por que este tema" / "Por que este video".
- "linea_diseno": array de strings, un item por cada punto de la lista "Linea de diseno".
- "copy": array de strings, una por cada linea del bloque "Mensaje / copy".
- "caption": el texto de "Texto de la publicacion".
Reglas: devuelve SOLO un array JSON valido, sin markdown. Respeta el orden de los videos. Campo inexistente = "" o []. No inventes videos ni datos.`;

const SYSTEM_TEC = `Eres un extractor de datos. Recibiras el HTML (o texto) de una GUIA TECNICA interna de produccion de videos TikTok. Extrae CADA video en orden (la seccion "Produccion por video", encabezados numerados).
Para cada video devuelve un objeto con:
- "titulo": el titulo del video.
- "prompt": el contenido completo del bloque "Prompt Higgsfield / clip principal" (conserva saltos de linea; incluye los comentarios que empiezan con #).
- "linea_hablada": si dentro del prompt hay una linea hablada entre comillas, ponla aqui; si no, "".
- "montaje": array, un objeto por cada fila de la tabla de montaje (texto por beat):
  - "beat": columna Beat (ej "0-3s").
  - "texto": columna "Texto en pantalla".
  - "color": el valor hex de "Color clave" (ej "#F59E0B"); si no hay, "".
  - "nota": columna "Nota".
- "caption": el valor de "Caption" en la seccion Publicacion.
- "hashtags": el valor de "Hashtags".
- "cta_tecnica": el texto de "CTA tecnica" si existe; si no, "".
Reglas: devuelve SOLO un array JSON valido, sin markdown. Respeta el orden de los videos. Campo inexistente = "" o []. No inventes.`;

// Proximos N martes a partir de hoy (incluye hoy si es martes)
function proximosMartes(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  // avanzar hasta el proximo martes (getDay 2 = martes)
  while (d.getDay() !== 2) d.setDate(d.getDate() + 1);
  for (let i = 0; i < n; i++) {
    out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 7);
  }
  return out;
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY no configurada" }, { status: 503 });
  }

  let body: { action?: string; texto?: string; propuesta?: string; storyboard?: string; tecnica?: string; piezas?: (PiezaTT & { fecha?: string })[] };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Body invalido" }, { status: 400 }); }

  // ── ANALIZAR SET (3 documentos: propuesta cliente + storyboard + guia tecnica) ──
  if (body.action === "analizar-set") {
    const tStory = (body.storyboard ?? "").trim();
    const tProp = (body.propuesta ?? "").trim();
    const tTec = (body.tecnica ?? "").trim();
    if (tStory.length < 40 && tProp.length < 40) {
      return NextResponse.json({ error: "Sube al menos el Storyboard o la Propuesta del cliente." }, { status: 400 });
    }
    try {
      const [story, prop, tec] = await Promise.all([
        tStory.length >= 40 ? parseDoc<PiezaTT>(SYSTEM, tStory) : Promise.resolve([] as PiezaTT[]),
        tProp.length >= 40 ? parseDoc<PropuestaTT>(SYSTEM_PROP, tProp) : Promise.resolve([] as PropuestaTT[]),
        tTec.length >= 40 ? parseDoc<GuiaTecnicaTT>(SYSTEM_TEC, tTec) : Promise.resolve([] as GuiaTecnicaTT[]),
      ]);

      const n = Math.max(story.length, prop.length, tec.length);
      if (n === 0) return NextResponse.json({ error: "No se detectaron videos en los documentos." }, { status: 422 });

      const fechas = proximosMartes(n);
      const piezas = [];
      for (let i = 0; i < n; i++) {
        const s = story[i];
        const p = prop[i] ?? null;
        const t = tec[i] ?? null;
        const sbBase: Storyboard = s?.storyboard ?? { frames: [] };
        const titulo = p?.titulo || s?.titulo || t?.titulo || `Video ${i + 1}`;
        const caption = s?.caption || p?.caption || "";
        piezas.push({
          titulo,
          caption,
          storyboard: { ...sbBase, propuesta: p, guia_tecnica: t },
          fecha: fechas[i],
          seleccionada: true,
        });
      }
      return NextResponse.json({ piezas, fuentes: { storyboard: story.length, propuesta: prop.length, tecnica: tec.length } });
    } catch (err) {
      console.error("importar-tiktok analizar-set:", err);
      return NextResponse.json({ error: "Error al analizar los documentos." }, { status: 500 });
    }
  }

  // ── ANALIZAR ──
  if (body.action === "analizar") {
    const texto = (body.texto ?? "").trim();
    if (texto.length < 40) return NextResponse.json({ error: "Pega el storyboard completo (HTML o texto)." }, { status: 400 });
    try {
      const resp = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 8000,
        system: SYSTEM,
        messages: [{ role: "user", content: texto.slice(0, 80000) }],
      });
      const block = resp.content.find((b) => b.type === "text");
      const raw = block && block.type === "text" ? block.text : "[]";
      let piezas: PiezaTT[] = [];
      try { piezas = extraerJSON(raw); } catch { return NextResponse.json({ error: "No se pudo interpretar el storyboard." }, { status: 422 }); }
      piezas = piezas.filter((p) => p && (p.titulo?.trim() || (p.storyboard?.frames?.length ?? 0) > 0));
      if (piezas.length === 0) return NextResponse.json({ error: "No se detectaron videos en el storyboard." }, { status: 422 });

      // fechas sugeridas: martes consecutivos
      const fechas = proximosMartes(piezas.length);
      const conFecha = piezas.map((p, i) => ({ ...p, fecha: fechas[i], seleccionada: true }));
      return NextResponse.json({ piezas: conFecha });
    } catch (err) {
      console.error("importar-tiktok analizar:", err);
      return NextResponse.json({ error: "Error al analizar el storyboard." }, { status: 500 });
    }
  }

  // ── CREAR ──
  if (body.action === "crear") {
    const piezas = body.piezas ?? [];
    if (!Array.isArray(piezas) || piezas.length === 0) return NextResponse.json({ error: "No hay videos para crear." }, { status: 400 });

    const hoy = new Date().toISOString().slice(0, 10);
    let creadas = 0, omitidas = 0;
    const errores: string[] = [];

    for (const p of piezas) {
      const fecha = p.fecha ?? "";
      if (!fecha || fecha < hoy) { omitidas++; continue; } // no fechas pasadas
      try {
        const { data: post, error: postErr } = await sb
          .from("social_posts")
          .insert({
            red_social: "tiktok",
            fecha_programada: fecha,
            titulo_interno: p.titulo || "",
            fase: "guion",        // nace para revisar el guion
            publicado: false,     // borrador hasta publicar al cliente
          })
          .select()
          .single();
        if (postErr || !post) { errores.push(p.titulo || fecha); continue; }

        const { error: vErr } = await sb.from("social_post_versions").insert({
          post_id: post.id,
          version_num: 1,
          caption: p.caption || "",
          imagenes: [],
          storyboard: p.storyboard ?? null,
          es_activa: true,
        });
        if (vErr) { errores.push(p.titulo || fecha); continue; }
        creadas++;
      } catch {
        errores.push(p.titulo || fecha);
      }
    }
    return NextResponse.json({ creadas, omitidas, total: piezas.length, errores });
  }

  return NextResponse.json({ error: "Accion no reconocida" }, { status: 400 });
}
