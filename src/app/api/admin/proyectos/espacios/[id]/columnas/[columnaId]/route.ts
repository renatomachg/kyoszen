import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SinPermiso, exigirSeccion } from "@/lib/admin-auth";

export const runtime = "nodejs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; columnaId: string }> }
) {
  try {
    await exigirSeccion(req, "proyectos");
    const { id, columnaId } = await params;
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Body inválido" }, { status: 400 });
    }

    const patch: Record<string, unknown> = {};
    if (typeof body.nombre === "string") {
      const nombre = body.nombre.trim();
      if (!nombre) {
        return NextResponse.json({ error: "nombre no puede estar vacío" }, { status: 400 });
      }
      patch.nombre = nombre;
    }
    if (typeof body.orden === "number" && Number.isInteger(body.orden)) {
      patch.orden = body.orden;
    }
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "No hay cambios válidos" }, { status: 400 });
    }

    const { data, error } = await sb
      .from("espacio_columnas")
      .update(patch)
      .eq("id", columnaId)
      .eq("espacio_id", id)
      .select()
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Columna no encontrada" }, { status: 404 });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; columnaId: string }> }
) {
  try {
    await exigirSeccion(req, "proyectos");
    const { id, columnaId } = await params;
    const { data, error } = await sb
      .from("espacio_columnas")
      .delete()
      .eq("id", columnaId)
      .eq("espacio_id", id)
      .select("id")
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Columna no encontrada" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
