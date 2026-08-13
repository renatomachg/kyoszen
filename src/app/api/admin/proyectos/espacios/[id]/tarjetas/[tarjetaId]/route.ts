import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SinPermiso, exigirSeccion } from "@/lib/admin-auth";

export const runtime = "nodejs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function validarTarjeta(espacioId: string, tarjetaId: string) {
  const { data, error } = await sb
    .from("espacio_tarjetas")
    .select("id, columna_id, espacio_columnas!inner(espacio_id)")
    .eq("id", tarjetaId)
    .eq("espacio_columnas.espacio_id", espacioId)
    .maybeSingle();
  return { tarjeta: data, error };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; tarjetaId: string }> }
) {
  try {
    await exigirSeccion(req, "proyectos");
    const { id, tarjetaId } = await params;
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Body inválido" }, { status: 400 });
    }

    const { tarjeta, error: tarjetaError } = await validarTarjeta(id, tarjetaId);
    if (tarjetaError) {
      return NextResponse.json({ error: tarjetaError.message }, { status: 500 });
    }
    if (!tarjeta) {
      return NextResponse.json({ error: "Tarjeta no encontrada" }, { status: 404 });
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.titulo === "string") {
      const titulo = body.titulo.trim();
      if (!titulo) {
        return NextResponse.json({ error: "titulo no puede estar vacío" }, { status: 400 });
      }
      patch.titulo = titulo;
    }
    if (typeof body.descripcion === "string" || body.descripcion === null) {
      patch.descripcion = typeof body.descripcion === "string"
        ? body.descripcion.trim() || null
        : null;
    }
    if (typeof body.orden === "number" && Number.isInteger(body.orden)) {
      patch.orden = body.orden;
    }
    if (typeof body.columna_id === "string" && body.columna_id !== tarjeta.columna_id) {
      const { data: columna, error: columnaError } = await sb
        .from("espacio_columnas")
        .select("id")
        .eq("id", body.columna_id)
        .eq("espacio_id", id)
        .maybeSingle();
      if (columnaError) {
        return NextResponse.json({ error: columnaError.message }, { status: 500 });
      }
      if (!columna) {
        return NextResponse.json({ error: "La columna destino no pertenece al espacio" }, { status: 400 });
      }
      patch.columna_id = body.columna_id;
    }
    if (Object.keys(patch).length === 1) {
      return NextResponse.json({ error: "No hay cambios válidos" }, { status: 400 });
    }

    const { data, error } = await sb
      .from("espacio_tarjetas")
      .update(patch)
      .eq("id", tarjetaId)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; tarjetaId: string }> }
) {
  try {
    await exigirSeccion(req, "proyectos");
    const { id, tarjetaId } = await params;
    const { tarjeta, error: tarjetaError } = await validarTarjeta(id, tarjetaId);
    if (tarjetaError) {
      return NextResponse.json({ error: tarjetaError.message }, { status: 500 });
    }
    if (!tarjeta) {
      return NextResponse.json({ error: "Tarjeta no encontrada" }, { status: 404 });
    }

    const { error } = await sb.from("espacio_tarjetas").delete().eq("id", tarjetaId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
