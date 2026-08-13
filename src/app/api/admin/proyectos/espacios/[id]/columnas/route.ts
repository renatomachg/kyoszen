import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SinPermiso, exigirSeccion } from "@/lib/admin-auth";

export const runtime = "nodejs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function validarTablero(id: string) {
  return sb
    .from("proyecto_espacios")
    .select("id")
    .eq("id", id)
    .eq("tipo", "tablero")
    .maybeSingle();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await exigirSeccion(req, "proyectos");
    const { id } = await params;
    const { data: columnas, error } = await sb
      .from("espacio_columnas")
      .select("*")
      .eq("espacio_id", id)
      .order("orden", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const columnaIds = (columnas ?? []).map(({ id: columnaId }) => columnaId);
    let tarjetas: Record<string, unknown>[] = [];
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
      tarjetas = resultado.data ?? [];
    }
    return NextResponse.json({
      columnas: (columnas ?? []).map((columna) => ({
        ...columna,
        tarjetas: tarjetas.filter(({ columna_id }) => columna_id === columna.id),
      })),
    });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await exigirSeccion(req, "proyectos");
    const { id } = await params;
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Body inválido" }, { status: 400 });
    }

    const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
    if (!nombre) {
      return NextResponse.json({ error: "nombre es requerido" }, { status: 400 });
    }

    const { data: espacio, error: espacioError } = await validarTablero(id);
    if (espacioError) {
      return NextResponse.json({ error: espacioError.message }, { status: 500 });
    }
    if (!espacio) {
      return NextResponse.json({ error: "Espacio de tablero no encontrado" }, { status: 404 });
    }

    let orden: number;
    if (typeof body.orden === "number" && Number.isInteger(body.orden)) {
      orden = body.orden;
    } else {
      const { data: ultima, error: ordenError } = await sb
        .from("espacio_columnas")
        .select("orden")
        .eq("espacio_id", id)
        .order("orden", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (ordenError) {
        return NextResponse.json({ error: ordenError.message }, { status: 500 });
      }
      orden = (ultima?.orden ?? -1) + 1;
    }

    const { data, error } = await sb
      .from("espacio_columnas")
      .insert({ espacio_id: id, nombre, orden })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
