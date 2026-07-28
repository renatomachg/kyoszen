import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { EspacioColumna, EspacioTarjeta } from "@/lib/proyectos";

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
    .eq("tipo", "tablero")
    .eq("publicado", true)
    .maybeSingle();
  if (espacioError) {
    return NextResponse.json({ error: espacioError.message }, { status: 500 });
  }
  if (!espacio) {
    return NextResponse.json({ error: "Espacio no encontrado" }, { status: 404 });
  }

  const { data: columnas, error: columnasError } = await sb
    .from("espacio_columnas")
    .select("*")
    .eq("espacio_id", id)
    .order("orden", { ascending: true })
    .order("created_at", { ascending: true });
  if (columnasError) {
    return NextResponse.json({ error: columnasError.message }, { status: 500 });
  }

  const columnaIds = (columnas ?? []).map(({ id }) => id);
  let tarjetas: EspacioTarjeta[] = [];
  if (columnaIds.length > 0) {
    const resultado = await sb
      .from("espacio_tarjetas")
      .select("*")
      .in("columna_id", columnaIds)
      .order("orden", { ascending: true })
      .order("created_at", { ascending: true });
    if (resultado.error) {
      return NextResponse.json({ error: resultado.error.message }, { status: 500 });
    }
    tarjetas = (resultado.data ?? []) as EspacioTarjeta[];
  }

  return NextResponse.json({
    espacio,
    columnas: ((columnas ?? []) as EspacioColumna[]).map((columna) => ({
      ...columna,
      tarjetas: tarjetas.filter(({ columna_id }) => columna_id === columna.id),
    })),
  });
}
