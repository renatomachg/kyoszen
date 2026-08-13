import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SinPermiso, exigirSeccion } from "@/lib/admin-auth";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Respuesta del equipo Kyoszen en el hilo del anuncio
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await exigirSeccion(req, "campanas");
    const { id } = await params;
    const { autor_nombre, contenido } = await req.json();

    if (!contenido?.trim()) {
      return NextResponse.json({ error: "Comentario vacío" }, { status: 400 });
    }

    const { data, error } = await sb
      .from("campana_comentarios")
      .insert({
        anuncio_id: id,
        autor_nombre: autor_nombre || "Kyoszen",
        autor_rol: "admin",
        contenido: contenido.trim(),
      })
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
