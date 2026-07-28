import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data: espacio, error: espacioError } = await sb
    .from("proyecto_espacios")
    .select("*")
    .eq("id", id)
    .eq("tipo", "archivos")
    .eq("publicado", true)
    .maybeSingle();
  if (espacioError) {
    return NextResponse.json({ error: espacioError.message }, { status: 500 });
  }
  if (!espacio) {
    return NextResponse.json({ error: "Espacio no encontrado" }, { status: 404 });
  }

  // El revisor recibe el árbol completo y navega en memoria; el volumen por espacio es bajo.
  const [archivosResult, carpetasResult] = await Promise.all([
    sb
      .from("espacio_archivos")
      .select("*")
      .eq("espacio_id", id)
      .order("orden", { ascending: true })
      .order("created_at", { ascending: false }),
    sb
      .from("espacio_carpetas")
      .select("*")
      .eq("espacio_id", id)
      .order("orden", { ascending: true })
      .order("nombre", { ascending: true }),
  ]);
  if (archivosResult.error) {
    return NextResponse.json({ error: archivosResult.error.message }, { status: 500 });
  }
  if (carpetasResult.error) {
    return NextResponse.json({ error: carpetasResult.error.message }, { status: 500 });
  }
  return NextResponse.json({
    espacio,
    carpetas: carpetasResult.data ?? [],
    archivos: archivosResult.data ?? [],
  });
}
