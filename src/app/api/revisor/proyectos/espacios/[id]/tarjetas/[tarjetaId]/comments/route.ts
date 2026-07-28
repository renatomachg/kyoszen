import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { RolAutor } from "@/lib/proyectos";

export const runtime = "nodejs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function validarTarjeta(espacioId: string, tarjetaId: string) {
  const { data, error } = await sb
    .from("espacio_tarjetas")
    .select("id, titulo, espacio_columnas!inner(espacio_id)")
    .eq("id", tarjetaId)
    .eq("espacio_columnas.espacio_id", espacioId)
    .maybeSingle();
  return { tarjeta: data, error };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; tarjetaId: string }> }
) {
  const { id, tarjetaId } = await params;
  const { tarjeta, error: validacionError } = await validarTarjeta(id, tarjetaId);
  if (validacionError) {
    return NextResponse.json({ error: validacionError.message }, { status: 500 });
  }
  if (!tarjeta) {
    return NextResponse.json({ error: "Tarjeta no encontrada" }, { status: 404 });
  }

  const { data, error } = await sb
    .from("espacio_comentarios")
    .select("*")
    .eq("tarjeta_id", tarjetaId)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comentarios: data ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; tarjetaId: string }> }
) {
  const { id, tarjetaId } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const contenido = typeof body.contenido === "string" ? body.contenido.trim() : "";
  const autorNombre = typeof body.autor_nombre === "string" && body.autor_nombre.trim()
    ? body.autor_nombre.trim()
    : "Cliente";
  const autorRol: RolAutor = body.autor_rol === "admin" ? "admin" : "cliente";
  if (!contenido) {
    return NextResponse.json({ error: "El comentario no puede estar vacío" }, { status: 400 });
  }

  const { tarjeta, error: validacionError } = await validarTarjeta(id, tarjetaId);
  if (validacionError) {
    return NextResponse.json({ error: validacionError.message }, { status: 500 });
  }
  if (!tarjeta) {
    return NextResponse.json({ error: "Tarjeta no encontrada" }, { status: 404 });
  }

  const { data, error } = await sb
    .from("espacio_comentarios")
    .insert({
      tarjeta_id: tarjetaId,
      autor_nombre: autorNombre,
      autor_rol: autorRol,
      contenido,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
