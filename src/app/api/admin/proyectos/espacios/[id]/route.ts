import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.nombre === "string") {
    const nombre = body.nombre.trim();
    if (!nombre) return NextResponse.json({ error: "nombre no puede estar vacío" }, { status: 400 });
    patch.nombre = nombre;
  }
  if (typeof body.descripcion === "string" || body.descripcion === null) {
    patch.descripcion = typeof body.descripcion === "string" ? body.descripcion.trim() || null : null;
  }
  if (typeof body.icono === "string" || body.icono === null) {
    patch.icono = typeof body.icono === "string" ? body.icono.trim() || null : null;
  }
  if (typeof body.color === "string" || body.color === null) {
    patch.color = typeof body.color === "string" ? body.color.trim() || null : null;
  }
  if (typeof body.cuestionario_token === "string" || body.cuestionario_token === null) {
    patch.cuestionario_token =
      typeof body.cuestionario_token === "string"
        ? body.cuestionario_token.trim() || null
        : null;
  }
  if (typeof body.orden === "number" && Number.isInteger(body.orden)) patch.orden = body.orden;
  if (typeof body.publicado === "boolean") patch.publicado = body.publicado;

  const { data, error } = await sb
    .from("proyecto_espacios")
    .update(patch)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Espacio no encontrado" }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const desvincular = await sb
    .from("proyectos")
    .update({ espacio_id: null, updated_at: new Date().toISOString() })
    .eq("espacio_id", id);
  if (desvincular.error) {
    return NextResponse.json({ error: desvincular.error.message }, { status: 500 });
  }

  const { data, error } = await sb
    .from("proyecto_espacios")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Espacio no encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
