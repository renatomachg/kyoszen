import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { extractText, getDocumentProxy } from "unpdf";
import { getPlantilla, type ModoEtapa, type TipoEtapa } from "@/lib/proyectos";
import { SinPermiso, exigirSeccion } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type EscenaGuion = {
  numero: number;
  titulo: string;
  locucion: string;
  en_pantalla: string;
};

type GuionAnalizado = {
  titulo: string;
  folio: string;
  formato: string;
  duracion: string;
  escenas: EscenaGuion[];
};

type ImportarBody = {
  accion?: unknown;
  texto?: unknown;
  pdfBase64?: unknown;
  titulo?: unknown;
  folio?: unknown;
  area?: unknown;
  descripcion?: unknown;
  escenas?: unknown;
  modos?: { arte?: unknown; video?: unknown };
  datosParsed?: unknown;
};

const SYSTEM_PARSE = `Eres un extractor de guiones audiovisuales en español. Recibirás un guion con escenas numeradas. Cada escena contiene LOCUCIÓN (voz en off) y EN PANTALLA (idea o indicación visual).

Devuelve SOLAMENTE un objeto JSON válido, sin markdown ni explicaciones, con esta forma exacta:
{"titulo":"","folio":"","formato":"","duracion":"","escenas":[{"numero":1,"titulo":"","locucion":"","en_pantalla":""}]}

Reglas:
- Conserva el español y todos sus acentos.
- Extrae todas las escenas en el orden del documento.
- "numero" debe ser numérico.
- No combines escenas distintas.
- Si falta un dato de nivel superior, usa string vacío.
- Si una escena no tiene título explícito, crea un título breve basado únicamente en su contenido.
- No inventes locución ni indicaciones visuales.`;

function esModoEtapa(valor: unknown): valor is ModoEtapa {
  return valor === "por_escena" || valor === "entregable_unico";
}

function esEscenaGuion(valor: unknown): valor is EscenaGuion {
  if (!valor || typeof valor !== "object") return false;
  const escena = valor as Record<string, unknown>;
  return (
    typeof escena.numero === "number" &&
    Number.isFinite(escena.numero) &&
    typeof escena.titulo === "string" &&
    typeof escena.locucion === "string" &&
    typeof escena.en_pantalla === "string"
  );
}

function validarGuion(valor: unknown): GuionAnalizado {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    throw new Error("La IA no devolvió un objeto JSON válido");
  }
  const guion = valor as Record<string, unknown>;
  if (!Array.isArray(guion.escenas) || guion.escenas.length === 0 || !guion.escenas.every(esEscenaGuion)) {
    throw new Error("La IA no detectó escenas válidas");
  }
  return {
    titulo: typeof guion.titulo === "string" ? guion.titulo : "",
    folio: typeof guion.folio === "string" ? guion.folio : "",
    formato: typeof guion.formato === "string" ? guion.formato : "",
    duracion: typeof guion.duracion === "string" ? guion.duracion : "",
    escenas: guion.escenas,
  };
}

function extraerObjetoJSON(texto: string): unknown {
  const limpio = texto
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const inicio = limpio.indexOf("{");
  if (inicio === -1) throw new Error("La respuesta no contiene JSON");

  let profundidad = 0;
  let enCadena = false;
  let escapado = false;
  for (let index = inicio; index < limpio.length; index += 1) {
    const caracter = limpio[index];
    if (enCadena) {
      if (escapado) escapado = false;
      else if (caracter === "\\") escapado = true;
      else if (caracter === '"') enCadena = false;
      continue;
    }
    if (caracter === '"') enCadena = true;
    else if (caracter === "{") profundidad += 1;
    else if (caracter === "}") {
      profundidad -= 1;
      if (profundidad === 0) return JSON.parse(limpio.slice(inicio, index + 1));
    }
  }
  throw new Error("El objeto JSON está incompleto");
}

async function textoDesdePdfBase64(pdfBase64: string): Promise<string> {
  const base64 = pdfBase64.includes(",") ? pdfBase64.slice(pdfBase64.indexOf(",") + 1) : pdfBase64;
  const bytes = new Uint8Array(Buffer.from(base64, "base64"));
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return (text ?? "").trim();
}

async function eliminarProyecto(id: string) {
  await sb.from("proyectos").delete().eq("id", id);
}

async function crearProyecto(body: ImportarBody, datos: Record<string, unknown>) {
  const tituloValor = body.titulo ?? datos.titulo;
  const folioValor = body.folio ?? datos.folio;
  const escenasValor = body.escenas ?? datos.escenas;
  const titulo = typeof tituloValor === "string" ? tituloValor.trim() : "";

  if (!titulo) throw new Error("titulo es requerido");
  if (!Array.isArray(escenasValor) || escenasValor.length === 0 || !escenasValor.every(esEscenaGuion)) {
    throw new Error("Se requiere al menos una escena válida");
  }
  if (
    (body.modos?.arte !== undefined && !esModoEtapa(body.modos.arte)) ||
    (body.modos?.video !== undefined && !esModoEtapa(body.modos.video))
  ) {
    throw new Error("Modo de etapa inválido");
  }

  const escenasEntrada = escenasValor;
  const { data: proyecto, error: proyectoError } = await sb
    .from("proyectos")
    .insert({
      tipo: "video_induccion",
      titulo,
      folio: typeof folioValor === "string" ? folioValor : null,
      area: typeof body.area === "string" ? body.area : null,
      descripcion: typeof body.descripcion === "string" ? body.descripcion : null,
      publicado: false,
      estado: "activo",
      etapa_actual: 1,
    })
    .select()
    .single();
  if (proyectoError || !proyecto) {
    throw new Error(proyectoError?.message ?? "No se pudo crear el proyecto");
  }

  const modos: Record<TipoEtapa, ModoEtapa> = {
    guion: "por_escena",
    arte: esModoEtapa(body.modos?.arte) ? body.modos.arte : "por_escena",
    video: esModoEtapa(body.modos?.video) ? body.modos.video : "por_escena",
  };
  const { data: etapas, error: etapasError } = await sb
    .from("proyecto_etapas")
    .insert(getPlantilla("video_induccion").map((etapa) => ({
      proyecto_id: proyecto.id,
      tipo: etapa.tipo,
      nombre: etapa.nombre,
      orden: etapa.orden,
      modo: modos[etapa.tipo],
      estado: etapa.tipo === "guion" ? "pendiente" : "bloqueada",
    })))
    .select("id, tipo, modo");
  if (etapasError || !etapas) {
    await eliminarProyecto(proyecto.id);
    throw new Error(etapasError?.message ?? "No se pudieron crear las etapas");
  }

  const { data: escenas, error: escenasError } = await sb
    .from("proyecto_escenas")
    .insert(escenasEntrada.map((escena, index) => ({
      proyecto_id: proyecto.id,
      numero: escena.numero,
      titulo: escena.titulo,
      orden: index + 1,
    })))
    .select("id, orden");
  if (escenasError || !escenas) {
    await eliminarProyecto(proyecto.id);
    throw new Error(escenasError?.message ?? "No se pudieron crear las escenas");
  }

  const bloques = etapas.flatMap((etapa) => {
    if (etapa.modo === "entregable_unico") {
      return [{
        etapa_id: etapa.id,
        escena_id: null,
        estado: "pendiente",
        contenido: {},
        archivos: [],
        nota: null,
        version_num: 1,
        es_activa: true,
      }];
    }
    return escenas.map((escena) => {
      const entrada = escenasEntrada[escena.orden - 1];
      return {
        etapa_id: etapa.id,
        escena_id: escena.id,
        estado: "pendiente",
        contenido: etapa.tipo === "guion"
          ? { locucion: entrada.locucion, en_pantalla: entrada.en_pantalla }
          : {},
        archivos: [],
        nota: etapa.tipo === "arte" ? entrada.en_pantalla : null,
        version_num: 1,
        es_activa: true,
      };
    });
  });
  const { error: bloquesError } = await sb.from("proyecto_bloques").insert(bloques);
  if (bloquesError) {
    await eliminarProyecto(proyecto.id);
    throw new Error(bloquesError.message);
  }
  return proyecto;
}

export async function POST(req: NextRequest) {
  try {
    await exigirSeccion(req, "proyectos");
    let body: ImportarBody;
    try {
      body = (await req.json()) as ImportarBody;
    } catch {
      return NextResponse.json({ error: "Body inválido" }, { status: 400 });
    }

    if (body.accion === "analizar") {
      if (!process.env.ANTHROPIC_API_KEY) {
        return NextResponse.json({ error: "ANTHROPIC_API_KEY no configurada" }, { status: 503 });
      }
      try {
        let texto = typeof body.texto === "string" ? body.texto.trim() : "";
        if (!texto && typeof body.pdfBase64 === "string" && body.pdfBase64.trim()) {
          texto = await textoDesdePdfBase64(body.pdfBase64);
        }
        if (texto.length < 20) {
          return NextResponse.json(
            { error: "Proporciona el texto del guion o un PDF con texto seleccionable" },
            { status: 400 }
          );
        }
        if (texto.length > 100000) {
          return NextResponse.json(
            { error: "El guion es demasiado largo para procesarse de una vez (más de 100k caracteres). Divídelo en partes." },
            { status: 400 }
          );
        }

        const respuesta = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 8192,
          system: SYSTEM_PARSE,
          messages: [{ role: "user", content: texto }],
        });
        const bloqueTexto = respuesta.content.find((bloque) => bloque.type === "text");
        if (!bloqueTexto || bloqueTexto.type !== "text") {
          throw new Error("Claude no devolvió texto");
        }
        return NextResponse.json(validarGuion(extraerObjetoJSON(bloqueTexto.text)));
      } catch (error) {
        console.error("importar-guion/analizar:", error);
        const mensaje = error instanceof Error ? error.message : "No se pudo analizar el guion";
        return NextResponse.json({ error: mensaje }, { status: 422 });
      }
    }

    if (body.accion === "crear") {
      const datos = body.datosParsed && typeof body.datosParsed === "object" && !Array.isArray(body.datosParsed)
        ? body.datosParsed as Record<string, unknown>
        : {};
      try {
        const proyecto = await crearProyecto(body, datos);
        return NextResponse.json(proyecto, { status: 201 });
      } catch (error) {
        const mensaje = error instanceof Error ? error.message : "No se pudo crear el proyecto";
        const status = mensaje.includes("requer") || mensaje.includes("válid") || mensaje.includes("inválido") ? 400 : 500;
        return NextResponse.json({ error: mensaje }, { status });
      }
    }

    return NextResponse.json({ error: "accion debe ser 'analizar' o 'crear'" }, { status: 400 });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
