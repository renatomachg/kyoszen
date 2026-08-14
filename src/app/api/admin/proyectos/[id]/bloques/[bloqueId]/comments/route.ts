import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SinPermiso, exigirProyecto } from "@/lib/admin-auth";

export const runtime = "nodejs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type EtapaRelacion = { proyecto_id: string } | { proyecto_id: string }[] | null;
type BloqueRelacion = { id: string; proyecto_etapas: EtapaRelacion };

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; bloqueId: string }> }
) {
  try {
    const { id, bloqueId } = await params;
    const identidad = await exigirProyecto(req, id);
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Body inválido" }, { status: 400 });
    }

    const contenido = typeof body.contenido === "string" ? body.contenido.trim() : "";
    if (!contenido) {
      return NextResponse.json({ error: "El comentario no puede estar vacío." }, { status: 400 });
    }

    const { data, error: bloqueError } = await sb
      .from("proyecto_bloques")
      .select("id, proyecto_etapas!inner(proyecto_id)")
      .eq("id", bloqueId)
      .eq("es_activa", true)
      .maybeSingle();
    if (bloqueError) {
      return NextResponse.json({ error: bloqueError.message }, { status: 500 });
    }

    const bloque = data as BloqueRelacion | null;
    const relacion = bloque?.proyecto_etapas;
    const etapa = Array.isArray(relacion) ? relacion[0] : relacion;
    if (!bloque || etapa?.proyecto_id !== id) {
      return NextResponse.json({ error: "Bloque no encontrado" }, { status: 404 });
    }

    const respaldoNombre = typeof body.autor_nombre === "string" ? body.autor_nombre.trim() : "";
    const autorRol = identidad.rol === "admin" ? "admin" : "colaborador";
    const autorNombre = identidad.rol === "admin"
      ? "Kyoszen"
      : identidad.nombre?.trim() || respaldoNombre || "Un colaborador";
    const { data: comentario, error } = await sb
      .from("proyecto_comentarios")
      .insert({
        bloque_id: bloqueId,
        autor_nombre: autorNombre,
        autor_rol: autorRol,
        contenido,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(comentario, { status: 201 });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
