import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; archivoId: string }> }
) {
  const { id, archivoId } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.nota === "string" || body.nota === null) {
    patch.nota = typeof body.nota === "string" ? body.nota.trim() || null : null;
  }
  if (typeof body.orden === "number" && Number.isInteger(body.orden)) {
    patch.orden = body.orden;
  }
  if (body.carpeta_id !== undefined) {
    if (body.carpeta_id === null || body.carpeta_id === "root") {
      patch.carpeta_id = null;
    } else {
      const carpetaId = typeof body.carpeta_id === "string" ? body.carpeta_id.trim() : "";
      if (!carpetaId) {
        return NextResponse.json({ error: "Carpeta de destino inválida" }, { status: 400 });
      }
      const { data: carpeta, error: carpetaError } = await sb
        .from("espacio_carpetas")
        .select("id")
        .eq("id", carpetaId)
        .eq("espacio_id", id)
        .maybeSingle();
      if (carpetaError) {
        return NextResponse.json({ error: carpetaError.message }, { status: 500 });
      }
      if (!carpeta) {
        return NextResponse.json(
          { error: "La carpeta de destino no pertenece a este espacio" },
          { status: 400 }
        );
      }
      patch.carpeta_id = carpetaId;
    }
  }
  if (Object.keys(patch).length === 1) {
    return NextResponse.json({ error: "No hay cambios válidos" }, { status: 400 });
  }

  const { data, error } = await sb
    .from("espacio_archivos")
    .update(patch)
    .eq("id", archivoId)
    .eq("espacio_id", id)
    .select()
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  return NextResponse.json(data);
}

function storagePath(url: string) {
  const marker = "/storage/v1/object/public/media/";
  const index = url.indexOf(marker);
  if (index < 0) return null;
  try {
    return decodeURIComponent(url.slice(index + marker.length));
  } catch {
    return url.slice(index + marker.length);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; archivoId: string }> }
) {
  const { id, archivoId } = await params;
  const { data: archivo, error: lecturaError } = await sb
    .from("espacio_archivos")
    .select("id, url")
    .eq("id", archivoId)
    .eq("espacio_id", id)
    .maybeSingle();
  if (lecturaError) {
    return NextResponse.json({ error: lecturaError.message }, { status: 500 });
  }
  if (!archivo) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  const path = storagePath(archivo.url);
  if (path) {
    const { error } = await sb.storage.from("media").remove([path]);
    if (error) console.error("No se pudo borrar el archivo de Storage:", error.message);
  }

  const { error } = await sb
    .from("espacio_archivos")
    .delete()
    .eq("id", archivoId)
    .eq("espacio_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
