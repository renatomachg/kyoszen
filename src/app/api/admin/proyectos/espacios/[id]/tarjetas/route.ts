import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SinPermiso, exigirSeccion } from "@/lib/admin-auth";

export const runtime = "nodejs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    const columnaId = typeof body.columna_id === "string" ? body.columna_id : "";
    const titulo = typeof body.titulo === "string" ? body.titulo.trim() : "";
    if (!columnaId || !titulo) {
      return NextResponse.json(
        { error: "columna_id y titulo son requeridos" },
        { status: 400 }
      );
    }

    const { data: columna, error: columnaError } = await sb
      .from("espacio_columnas")
      .select("id")
      .eq("id", columnaId)
      .eq("espacio_id", id)
      .maybeSingle();
    if (columnaError) {
      return NextResponse.json({ error: columnaError.message }, { status: 500 });
    }
    if (!columna) {
      return NextResponse.json({ error: "La columna no pertenece al espacio" }, { status: 400 });
    }

    let orden: number;
    if (typeof body.orden === "number" && Number.isInteger(body.orden)) {
      orden = body.orden;
    } else {
      const { data: ultima, error: ordenError } = await sb
        .from("espacio_tarjetas")
        .select("orden")
        .eq("columna_id", columnaId)
        .order("orden", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (ordenError) {
        return NextResponse.json({ error: ordenError.message }, { status: 500 });
      }
      orden = (ultima?.orden ?? -1) + 1;
    }

    const descripcion = typeof body.descripcion === "string"
      ? body.descripcion.trim() || null
      : null;
    const { data, error } = await sb
      .from("espacio_tarjetas")
      .insert({ columna_id: columnaId, titulo, descripcion, orden })
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
