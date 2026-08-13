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
export const maxDuration = 300;

const SYSTEM = `Eres un extractor de datos de campañas publicitarias de Facebook para una consultoría de reclutamiento en México (Kyoszen).

Recibirás el brief de una campaña — puede venir como texto pegado, como documento, o como capturas de pantalla del administrador de anuncios de Meta. Extrae la campaña y sus anuncios.

Devuelve SOLO un objeto JSON válido, sin markdown, sin bloques de código, sin explicaciones, con esta forma exacta:

{
  "campana": {
    "nombre": "nombre corto de la campaña",
    "cliente_final": "empresa para la que se recluta, si la hay",
    "plataforma": "facebook",
    "tipo": "vacantes",
    "objetivo": "qué busca la campaña, en una línea y en lenguaje simple",
    "publica_desde": "desde qué página se publica",
    "segmentacion": {
      "ubicaciones": ["alcaldía o ciudad", "..."],
      "edad": "ej: 18 a 65 años",
      "ancla": "si el público está anclado a un domicilio o radio, descríbelo",
      "publico_estimado": "ej: 6.5 a 7.6 millones de personas"
    },
    "presupuesto_texto": "la inversión en lenguaje simple, ej: $400 MXN al día en total",
    "fecha_difusion": "cuándo sale al aire, en lenguaje simple",
    "fechas_reclutamiento": "fechas y horario del reclutamiento presencial, si aplica",
    "meta_texto": "la meta del cliente",
    "sede_texto": "dirección de la sede y referencia de cómo llegar",
    "nota_interna": "cualquier cosa marcada como interna o 'no mostrar al cliente'"
  },
  "anuncios": [
    {
      "puesto": "el puesto que anuncia, ej: Cajero/a",
      "texto_principal": "el texto principal del anuncio, con sus saltos de línea y emojis tal cual",
      "titulo": "el título del anuncio",
      "descripcion": "la descripción del anuncio",
      "cta": "el texto del botón, ej: Registrarte",
      "formulario": {
        "preguntas": [
          { "pregunta": "texto de la pregunta", "tipo": "opcion", "opciones": ["Sí", "No"], "nota": "aclaración entre paréntesis, si la hay" }
        ],
        "pantalla_confirmacion": "el mensaje que ve el candidato al terminar su registro"
      }
    }
  ]
}

Si lo que recibes NO es una campaña publicitaria (por ejemplo: un contrato, un instructivo, una propuesta de diseño, un calendario de contenido orgánico, una factura, notas sueltas), NO inventes nada. Devuelve exactamente:

{ "campana": null, "anuncios": [], "motivo": "una sola línea diciendo qué es el documento en realidad" }

Reglas:
- "tipo" de cada pregunta: "opcion" si tiene opciones para elegir; "telefono" si pide teléfono o celular; "numero" si pide edad o una cantidad; "texto" para lo demás (nombre completo, respuesta abierta).
- Si una pregunta trae una aclaración entre paréntesis del estilo "(No es obligatoria para este puesto)", ponla en "nota" y déjala fuera del texto de "pregunta".
- Las preguntas de nombre y teléfono suelen ir al final. Respeta el orden en que aparecen.
- Cada puesto es un anuncio distinto. Si el documento describe un formulario "igual al anterior pero cambiando la pregunta X", reconstruye el formulario COMPLETO para ese anuncio con el cambio aplicado.
- NO inventes datos. Si un campo no está en el documento, usa "" (o [] para listas).
- NO metas al brief identificadores de Meta (IDs de campaña, conjunto o formulario), claves geográficas, radios ni configuración de categoría especial. Eso es plomería interna y no va en ningún campo.
- Respeta la ortografía del español de México: acentos y signos de apertura (¿ ¡).
- Los montos y sueldos van tal cual aparecen. No los redondees ni los conviertas.`;

interface ImagenEntrada {
  media_type: string;
  data: string;
}

/** Devuelve null si la respuesta no trae JSON (p.ej. el modelo contestó en prosa). */
function extraerJSON(texto: string): Record<string, unknown> | null {
  let limpio = texto.trim();
  limpio = limpio.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = limpio.indexOf("{");
  const end = limpio.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(limpio.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

const SIN_CAMPANA =
  "No encontré una campaña en lo que subiste. El importador espera el brief de una campaña: los anuncios con su texto, título, botón y las preguntas del formulario.";

export async function POST(req: NextRequest) {
  try {
    await exigirSeccion(req, "campanas");
    const body = await req.json();
    const accion = body.accion;

    /* ── Analizar: solo lee y propone, NO crea nada ─────── */
    if (accion === "analizar") {
      const texto: string = (body.texto ?? "").trim();
      const imagenes: ImagenEntrada[] = Array.isArray(body.imagenes) ? body.imagenes : [];

      if (!texto && imagenes.length === 0) {
        return NextResponse.json({ error: "Pega el brief o sube al menos una captura." }, { status: 400 });
      }
      if (!process.env.ANTHROPIC_API_KEY) {
        return NextResponse.json({ error: "Falta ANTHROPIC_API_KEY en el servidor." }, { status: 500 });
      }

      const contenido: Anthropic.ContentBlockParam[] = [];
      for (const img of imagenes.slice(0, 12)) {
        contenido.push({
          type: "image",
          source: { type: "base64", media_type: img.media_type as "image/png", data: img.data },
        });
      }
      contenido.push({
        type: "text",
        text: texto
          ? `Extrae la campaña y sus anuncios de este brief:\n\n${texto}`
          : "Extrae la campaña y sus anuncios de estas capturas de pantalla.",
      });

      try {
        const res = await anthropic.messages.create({
          // Con capturas conviene el modelo más fuerte; con texto, el rápido.
          model: imagenes.length > 0 ? "claude-opus-4-5" : "claude-haiku-4-5-20251001",
          max_tokens: 8000,
          system: SYSTEM,
          messages: [{ role: "user", content: contenido }],
        });

        const salida = res.content.find(b => b.type === "text");
        if (!salida || salida.type !== "text") {
          return NextResponse.json({ error: SIN_CAMPANA }, { status: 422 });
        }

        const parsed = extraerJSON(salida.text);
        const anuncios = parsed && Array.isArray(parsed.anuncios) ? parsed.anuncios : [];

        // El documento no es una campaña: decirlo en claro, con lo que sí parece ser
        if (!parsed || anuncios.length === 0) {
          const motivo = typeof parsed?.motivo === "string" ? parsed.motivo.trim() : "";
          return NextResponse.json(
            {
              error: SIN_CAMPANA,
              detalle: motivo || undefined,
              sin_campana: true,
            },
            { status: 422 }
          );
        }

        return NextResponse.json({ campana: parsed.campana ?? {}, anuncios });
      } catch (e) {
        console.error("importar campañas:", e);
        return NextResponse.json(
          { error: "Se cayó el análisis. Vuelve a intentarlo; si sigue fallando, pega el brief como texto." },
          { status: 500 }
        );
      }
    }

    /* ── Crear: inserta en la BD lo que el admin aprobó ─── */
    if (accion === "crear") {
      const anuncios = Array.isArray(body.anuncios) ? body.anuncios : [];
      if (anuncios.length === 0) {
        return NextResponse.json({ error: "No hay anuncios seleccionados." }, { status: 400 });
      }

      let campanaId: number | null = body.campana_id ?? null;

      // Sumar anuncios a una campaña existente, o crear una nueva (siempre en borrador)
      if (campanaId) {
        const { data: existe } = await sb.from("campanas").select("id").eq("id", campanaId).maybeSingle();
        if (!existe) return NextResponse.json({ error: "La campaña destino no existe." }, { status: 404 });
      } else {
        const c = body.campana ?? {};
        if (!c.nombre?.trim()) {
          return NextResponse.json({ error: "La campaña necesita un nombre." }, { status: 400 });
        }
        const { data: nueva, error } = await sb
          .from("campanas")
          .insert({
            nombre: c.nombre,
            cliente_final: c.cliente_final || null,
            plataforma: c.plataforma || "facebook",
            tipo: c.tipo || "vacantes",
            objetivo: c.objetivo || null,
            publica_desde: c.publica_desde || null,
            segmentacion: c.segmentacion ?? {},
            presupuesto_texto: c.presupuesto_texto || null,
            fecha_difusion: c.fecha_difusion || null,
            fechas_reclutamiento: c.fechas_reclutamiento || null,
            meta_texto: c.meta_texto || null,
            sede_texto: c.sede_texto || null,
            nota_interna: c.nota_interna || null,
            modo: c.modo === "en_curso" ? "en_curso" : "revision",
            publicado: false,
          })
          .select("id")
          .single();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        campanaId = nueva.id;
      }

      // El orden continúa después de los anuncios que ya tiene la campaña
      const { data: previos } = await sb
        .from("campana_anuncios")
        .select("orden")
        .eq("campana_id", campanaId)
        .order("orden", { ascending: false })
        .limit(1);
      const base = (previos?.[0]?.orden ?? -1) + 1;

      const filas = anuncios.map((a: Record<string, unknown>, i: number) => ({
        campana_id: campanaId,
        puesto: (a.puesto as string) || `Anuncio ${base + i + 1}`,
        imagen_url: (a.imagen_url as string) || null,
        texto_principal: (a.texto_principal as string) || null,
        titulo: (a.titulo as string) || null,
        descripcion: (a.descripcion as string) || null,
        cta: (a.cta as string) || "Registrarte",
        formulario: a.formulario ?? { preguntas: [] },
        orden: base + i,
      }));

      const { error: errAnuncios } = await sb.from("campana_anuncios").insert(filas);
      if (errAnuncios) return NextResponse.json({ error: errAnuncios.message }, { status: 500 });

      return NextResponse.json({ ok: true, campana_id: campanaId, creados: filas.length }, { status: 201 });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
