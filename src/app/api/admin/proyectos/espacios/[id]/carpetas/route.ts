import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function validarEspacio(id: string) {
  return sb
    .from("proyecto_espacios")
    .select("id")
    .eq("id", id)
    .eq("tipo", "archivos")
    .maybeSingle();
}

async function validarParent(espacioId: string, parentId: string) {
  return sb
    .from("espacio_carpetas")
    .select("id")
    .eq("id", parentId)
    .eq("espacio_id", espacioId)
    .maybeSingle();
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data: espacio, error: espacioError } = await validarEspacio(id);
  if (espacioError) {
    return NextResponse.json({ error: espacioError.message }, { status: 500 });
  }
  if (!espacio) {
    return NextResponse.json({ error: "Espacio de archivos no encontrado" }, { status: 404 });
  }

  const { data, error } = await sb
    .from("espacio_carpetas")
    .select("*")
    .eq("espacio_id", id)
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ carpetas: data ?? [] });
}

export async function POST(
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

  const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
  if (!nombre) {
    return NextResponse.json({ error: "El nombre de la carpeta es obligatorio" }, { status: 400 });
  }

  const { data: espacio, error: espacioError } = await validarEspacio(id);
  if (espacioError) {
    return NextResponse.json({ error: espacioError.message }, { status: 500 });
  }
  if (!espacio) {
    return NextResponse.json({ error: "Espacio de archivos no encontrado" }, { status: 404 });
  }

  let parentId: string | null = null;
  if (body.parent_id !== undefined && body.parent_id !== null) {
    if (typeof body.parent_id !== "string" || !body.parent_id.trim()) {
      return NextResponse.json({ error: "Carpeta padre inválida" }, { status: 400 });
    }
    parentId = body.parent_id.trim();
    const { data: parent, error: parentError } = await validarParent(id, parentId);
    if (parentError) {
      return NextResponse.json({ error: parentError.message }, { status: 500 });
    }
    if (!parent) {
      return NextResponse.json({ error: "La carpeta padre no pertenece a este espacio" }, { status: 400 });
    }
  }

  const { data, error } = await sb
    .from("espacio_carpetas")
    .insert({ espacio_id: id, parent_id: parentId, nombre })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
