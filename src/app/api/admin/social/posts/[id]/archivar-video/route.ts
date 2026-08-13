import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { spawn } from "node:child_process";
import { writeFile, readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { subirADrive, driveConfigurado } from "@/lib/google-drive";
import { SinPermiso, exigirSeccion } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const maxDuration = 300;

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Genera una carátula JPG ligera (frame ~1s, ancho máx 360px) a partir del MP4.
// Devuelve null si ffmpeg no está disponible o falla.
async function generarCaratula(videoBuf: Buffer): Promise<Buffer | null> {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const input = join(tmpdir(), `kyo-poster-${stamp}-in.mp4`);
  const output = join(tmpdir(), `kyo-poster-${stamp}-out.jpg`);
  const run = (segundos: number) =>
    new Promise<void>((resolve, reject) => {
      const ff = spawn("ffmpeg", [
        "-ss", String(segundos),
        "-i", input,
        "-frames:v", "1",
        "-vf", "scale='min(360,iw)':-2",
        "-q:v", "4",
        "-y", output,
      ]);
      let err = "";
      ff.stderr.on("data", (d) => { err += d.toString(); });
      ff.on("error", reject);
      ff.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg ${code}: ${err.slice(-160)}`))));
    });
  try {
    await writeFile(input, videoBuf);
    try {
      await run(1);
    } catch {
      await run(0); // videos muy cortos: toma el primer frame
    }
    return await readFile(output);
  } catch (e) {
    console.error("generarCaratula:", e instanceof Error ? e.message : e);
    return null;
  } finally {
    unlink(input).catch(() => {});
    unlink(output).catch(() => {});
  }
}

// Extrae la ruta dentro del bucket 'media' de una URL pública de Supabase Storage.
function rutaDeStorage(url: string): string | null {
  const m = url.match(/\/storage\/v1\/object\/public\/media\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

// POST — archivar el video: respaldar a Drive + dejar carátula + liberar Storage
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await exigirSeccion(req, "redes-sociales");
    const { id } = await params;

    if (!driveConfigurado()) {
      return NextResponse.json(
        { error: "Google Drive no está configurado en este entorno (faltan credenciales)." },
        { status: 503 }
      );
    }

    // 1) versión activa con el video
    const { data: version, error: vErr } = await sb
      .from("social_post_versions")
      .select("id, video_url, storyboard")
      .eq("post_id", id)
      .eq("es_activa", true)
      .single();
    if (vErr || !version) {
      return NextResponse.json({ error: "No se encontró la versión activa." }, { status: 404 });
    }

    const storyboard = (version.storyboard ?? {}) as Record<string, unknown>;
    if (storyboard.archivado) {
      return NextResponse.json({ error: "Este video ya está archivado." }, { status: 400 });
    }
    if (!version.video_url) {
      return NextResponse.json({ error: "Esta publicación no tiene video que archivar." }, { status: 400 });
    }

    // 2) descargar el MP4 desde Storage
    let videoBuf: Buffer;
    try {
      const res = await fetch(version.video_url);
      if (!res.ok) throw new Error(`descarga ${res.status}`);
      videoBuf = Buffer.from(await res.arrayBuffer());
    } catch (e) {
      return NextResponse.json(
        { error: "No se pudo descargar el video original: " + (e instanceof Error ? e.message : e) },
        { status: 500 }
      );
    }
    const pesoMb = Math.round((videoBuf.length / 1024 / 1024) * 10) / 10;

    // 3) generar carátula y subirla a Storage (best-effort: si falla, igual archivamos)
    let posterUrl: string | null = null;
    const poster = await generarCaratula(videoBuf);
    if (poster) {
      const posterPath = `social/poster-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const { error: pErr } = await sb.storage
        .from("media")
        .upload(posterPath, poster, { contentType: "image/jpeg", upsert: true });
      if (!pErr) posterUrl = sb.storage.from("media").getPublicUrl(posterPath).data.publicUrl;
    }

    // 4) subir el MP4 a Google Drive — PASO CRÍTICO: si falla, abortamos sin borrar nada
    let drive;
    try {
      const nombre = `kyoszen-tiktok-${id}-${Date.now()}.mp4`;
      drive = await subirADrive(videoBuf, nombre, "video/mp4");
    } catch (e) {
      return NextResponse.json(
        { error: "Falló la subida a Google Drive (no se borró nada): " + (e instanceof Error ? e.message : e) },
        { status: 502 }
      );
    }

    // 5) guardar metadata del archivado + soltar video_url (el reproductor ya no lo carga)
    const nuevoStoryboard = {
      ...storyboard,
      archivado: {
        drive_url: drive.webViewLink,
        drive_file_id: drive.id,
        poster_url: posterUrl,
        archivado_en: new Date().toISOString(),
        peso_mb: pesoMb,
      },
    };
    const { error: upErr } = await sb
      .from("social_post_versions")
      .update({ storyboard: nuevoStoryboard, video_url: null })
      .eq("id", version.id);
    if (upErr) {
      return NextResponse.json(
        { error: "Se respaldó en Drive pero falló al guardar en la BD: " + upErr.message },
        { status: 500 }
      );
    }

    // 6) liberar el MP4 de Supabase Storage (best-effort — ya está respaldado en Drive)
    const ruta = rutaDeStorage(version.video_url);
    if (ruta) await sb.storage.from("media").remove([ruta]).catch(() => {});

    return NextResponse.json({
      ok: true,
      drive_url: drive.webViewLink,
      poster_url: posterUrl,
      peso_mb: pesoMb,
    });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
