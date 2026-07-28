import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type CarpetaMinima = {
  id: string;
  parent_id: string | null;
};

async function leerCarpetas(espacioId: string) {
  return sb
    .from("espacio_carpetas")
    .select("id, parent_id")
    .eq("espacio_id", espacioId);
}

function creariaCiclo(
  carpetaId: string,
  parentId: string,
  carpetas: CarpetaMinima[]
) {
  const porId = new Map(carpetas.map((carpeta) => [carpeta.id, carpeta]));
  const visitadas = new Set<string>();
  let actual: string | null = parentId;

  while (actual) {
    if (actual === carpetaId) return true;
    if (visitadas.has(actual)) return true;
    visitadas.add(actual);
    actual = porId.get(actual)?.parent_id ?? null;
  }
  return false;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; carpetaId: string }> }
) {
  const { id, carpetaId } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { data: carpetas, error: carpetasError } = await leerCarpetas(id);
  if (carpetasError) {
    return NextResponse.json({ error: carpetasError.message }, { status: 500 });
  }
  const lista = (carpetas ?? []) as CarpetaMinima[];
  if (!lista.some((carpeta) => carpeta.id === carpetaId)) {
    return NextResponse.json({ error: "Carpeta no encontrada" }, { status: 404 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.nombre !== undefined) {
    const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
    if (!nombre) {
      return NextResponse.json({ error: "El nombre de la carpeta es obligatorio" }, { status: 400 });
    }
    patch.nombre = nombre;
  }
  if (body.orden !== undefined) {
    if (typeof body.orden !== "number" || !Number.isInteger(body.orden)) {
      return NextResponse.json({ error: "Orden inválido" }, { status: 400 });
    }
    patch.orden = body.orden;
  }
  if (body.parent_id !== undefined) {
    if (body.parent_id === null) {
      patch.parent_id = null;
    } else {
      const parentId = typeof body.parent_id === "string" ? body.parent_id.trim() : "";
      if (!parentId || !lista.some((carpeta) => carpeta.id === parentId)) {
        return NextResponse.json({ error: "La carpeta padre no pertenece a este espacio" }, { status: 400 });
      }
      if (creariaCiclo(carpetaId, parentId, lista)) {
        return NextResponse.json(
          { error: "No puedes mover una carpeta dentro de sí misma o de una subcarpeta" },
          { status: 400 }
        );
      }
      patch.parent_id = parentId;
    }
  }

  if (Object.keys(patch).length === 1) {
    return NextResponse.json({ error: "No hay cambios válidos" }, { status: 400 });
  }

  const { data, error } = await sb
    .from("espacio_carpetas")
    .update(patch)
    .eq("id", carpetaId)
    .eq("espacio_id", id)
    .select()
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Carpeta no encontrada" }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; carpetaId: string }> }
) {
  const { id, carpetaId } = await params;
  const { data, error } = await sb
    .from("espacio_carpetas")
    .delete()
    .eq("id", carpetaId)
    .eq("espacio_id", id)
    .select("id")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Carpeta no encontrada" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
