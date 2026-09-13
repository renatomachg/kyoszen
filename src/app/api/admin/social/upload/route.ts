import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { readFile, stat, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import { SinPermiso, identificar } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const maxDuration = 300; // la compresión de video puede tardar

// Usa service role para saltarse RLS en Storage
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** Tope por archivo del bucket `media` (es el máximo del plan de Supabase). */
const LIMITE_STORAGE = 50 * 1024 * 1024;
/** A lo que se apunta al comprimir: deja margen para no rozar el tope. */
const OBJETIVO = 45 * 1024 * 1024;
const AUDIO_KBPS = 96;

function mb(bytes: number) {
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

/** Corre un programa y devuelve su salida estándar. Sin stdin: ffmpeg lo lee si puede. */
function correr(programa: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proceso = spawn(programa, args, { stdio: ["ignore", "pipe", "pipe"] });
    let salida = "";
    let errores = "";
    proceso.stdout.on("data", (d) => { salida += d.toString(); });
    proceso.stderr.on("data", (d) => { errores += d.toString(); });
    proceso.on("error", reject); // el programa no está instalado
    proceso.on("close", (code) =>
      code === 0 ? resolve(salida) : reject(new Error(`${programa} ${code}: ${errores.slice(-300)}`))
    );
  });
}

/** Duración y tamaño del video, para decidir cuánto comprimir. */
async function sondear(ruta: string): Promise<{ duracion: number; ancho: number; alto: number } | null> {
  try {
    const json = await correr("ffprobe", [
      "-v", "error", "-select_streams", "v:0",
      "-show_entries", "stream=width,height:format=duration",
      "-of", "json", ruta,
    ]);
    const datos = JSON.parse(json) as {
      streams?: { width?: number; height?: number }[];
      format?: { duration?: string };
    };
    const duracion = Number(datos.format?.duration);
    const ancho = datos.streams?.[0]?.width ?? 0;
    const alto = datos.streams?.[0]?.height ?? 0;
    if (!Number.isFinite(duracion) || duracion <= 0 || !ancho || !alto) return null;
    return { duracion, ancho, alto };
  } catch {
    return null;
  }
}

/** Calidad a la medida: los kbps que caben en el objetivo según lo que dura, y
 *  la resolución que esos kbps aguantan. Nunca agranda; limita el lado corto,
 *  así sirve igual para videos horizontales y verticales. */
function planDeCompresion(info: { duracion: number; ancho: number; alto: number }, apretar: number) {
  const totalKbps = (OBJETIVO * 8) / 1000 / info.duracion * apretar;
  const videoKbps = Math.round(Math.max(250, Math.min(3000, totalKbps - AUDIO_KBPS)));
  const lado = videoKbps >= 1800 ? 1080 : videoKbps >= 900 ? 720 : 540;
  const escala = info.ancho >= info.alto
    ? `scale=-2:'min(${lado},ih)'`
    : `scale='min(${lado},iw)':-2`;
  // En 1 CPU, un video largo tiene que comprimir más rápido para no pasar el tiempo de espera
  const preset = info.duracion > 240 ? "superfast" : "veryfast";
  return { videoKbps, escala, preset };
}

/** Comprime a MP4 web (H.264 + AAC, faststart) apuntando a que quepa en Storage.
 *  Devuelve la ruta del resultado, o null si ffmpeg no está o falla. */
async function comprimirVideo(entrada: string): Promise<string | null> {
  const salida = `${entrada}-out.mp4`;
  const info = await sondear(entrada);
  try {
    // Una segunda vuelta más apretada por si la primera se pasa del tope
    for (const apretar of info ? [1, 0.75] : [1]) {
      const args = ["-nostdin", "-i", entrada];
      if (info) {
        const plan = planDeCompresion(info, apretar);
        args.push(
          "-vf", plan.escala,
          "-c:v", "libx264", "-preset", plan.preset, "-crf", "26",
          "-maxrate", `${plan.videoKbps}k`, "-bufsize", `${plan.videoKbps * 2}k`,
        );
      } else {
        // Sin duración conocida: el ajuste de siempre
        args.push("-vf", "scale='min(1080,iw)':-2", "-c:v", "libx264", "-preset", "veryfast", "-crf", "28");
      }
      args.push("-c:a", "aac", "-b:a", `${AUDIO_KBPS}k`, "-movflags", "+faststart", "-y", salida);
      await correr("ffmpeg", args);
      const { size } = await stat(salida);
      if (size <= LIMITE_STORAGE || !info) return salida;
    }
    return salida; // sigue pasándose; el que llama lo reporta con su peso
  } catch (e) {
    console.error("comprimirVideo:", e instanceof Error ? e.message : e);
    unlink(salida).catch(() => {});
    return null;
  }
}

export async function POST(req: NextRequest) {
  const temporales: string[] = [];
  try {
    // Subidor compartido: lo usan Proyectos (arte y video), Campañas (arte del
    // anuncio) y Redes. No es de una sección; basta con ser del panel.
    await identificar(req);
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No llegó ningún archivo." }, { status: 400 });

    let buffer: Buffer;
    let ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
    let contentType = file.type || "application/octet-stream";

    const esVideo = (file.type?.startsWith("video/")) || /\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(file.name);
    if (esVideo) {
      // El video va directo a disco: tenerlo dos veces en memoria no hace falta
      const entrada = join(tmpdir(), `kyo-${Date.now()}-${Math.random().toString(36).slice(2)}-in`);
      temporales.push(entrada);
      await pipeline(
        Readable.fromWeb(file.stream() as unknown as WebReadableStream),
        createWriteStream(entrada)
      );

      const comprimido = await comprimirVideo(entrada);
      if (comprimido) {
        temporales.push(comprimido);
        buffer = await readFile(comprimido);
        ext = "mp4";
        contentType = "video/mp4";
      } else {
        // Sin ffmpeg (p. ej. una Mac sin instalarlo) se sube el original tal cual
        buffer = await readFile(entrada);
      }
    } else {
      buffer = Buffer.from(await file.arrayBuffer());
    }

    if (buffer.length > LIMITE_STORAGE) {
      return NextResponse.json(
        {
          error: esVideo
            ? `Aun comprimido, el video pesa ${mb(buffer.length)} y el máximo es 50 MB. Expórtalo a 720p o recórtalo y vuelve a subirlo.`
            : `${file.name} pesa ${mb(buffer.length)} y el máximo es 50 MB.`,
        },
        { status: 413 }
      );
    }

    const path = `social/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await sb.storage
      .from("media")
      .upload(path, buffer, { contentType, upsert: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data } = sb.storage.from("media").getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl, peso: buffer.length });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  } finally {
    for (const ruta of temporales) unlink(ruta).catch(() => {});
  }
}
