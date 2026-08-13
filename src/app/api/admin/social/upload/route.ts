import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { spawn } from "node:child_process";
import { writeFile, readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SinPermiso, identificar } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const maxDuration = 300; // la compresión de video puede tardar

// Usa service role para saltarse RLS en Storage
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Comprime un video a MP4 web-optimizado (H.264, máx 1080px de ancho, faststart).
// Devuelve null si ffmpeg no está disponible o falla → el caller sube el original.
async function comprimirVideo(buffer: Buffer): Promise<Buffer | null> {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const input = join(tmpdir(), `kyo-${stamp}-in`);
  const output = join(tmpdir(), `kyo-${stamp}-out.mp4`);
  try {
    await writeFile(input, buffer);
    await new Promise<void>((resolve, reject) => {
      const ff = spawn("ffmpeg", [
        "-i", input,
        "-vf", "scale='min(1080,iw)':-2", // limita el ancho a 1080 sin agrandar; alto par
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "28",
        "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart",
        "-y", output,
      ]);
      let err = "";
      ff.stderr.on("data", (d) => { err += d.toString(); });
      ff.on("error", reject); // ffmpeg no instalado (p.ej. en local)
      ff.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg ${code}: ${err.slice(-200)}`))));
    });
    return await readFile(output);
  } catch (e) {
    console.error("comprimirVideo:", e instanceof Error ? e.message : e);
    return null;
  } finally {
    unlink(input).catch(() => {});
    unlink(output).catch(() => {});
  }
}

export async function POST(req: NextRequest) {
  try {
  // Subidor compartido: lo usan Proyectos (arte de escena), Campañas (arte del
  // anuncio) y Redes. No es de una sección; basta con ser del panel.
    await identificar(req);
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    let buffer: Buffer = Buffer.from(await file.arrayBuffer());
    let ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
    let contentType = file.type || "application/octet-stream";

    // Si es video, comprimir antes de subir (mantiene los archivos chicos en Storage).
    const esVideo = (file.type?.startsWith("video/")) || /\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(file.name);
    if (esVideo) {
      const comprimido = await comprimirVideo(buffer);
      if (comprimido) {
        buffer = comprimido;
        ext = "mp4";
        contentType = "video/mp4";
      }
      // si comprimir falla (ffmpeg ausente en local), se sube el original tal cual
    }

    const path = `social/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await sb.storage
      .from("media")
      .upload(path, buffer, { contentType, upsert: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data } = sb.storage.from("media").getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
