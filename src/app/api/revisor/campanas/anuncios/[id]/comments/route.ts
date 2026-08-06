import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { notificarAdminAnuncio } from "@/lib/campanas-notify";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { autor_nombre, autor_rol, contenido, notificar } = await req.json();

  if (!contenido?.trim()) {
    return NextResponse.json({ error: "Comentario vacío" }, { status: 400 });
  }

  const { data: anuncio } = await sb
    .from("campana_anuncios")
    .select("id, puesto, campanas(nombre, publicado)")
    .eq("id", id)
    .maybeSingle();

  if (!anuncio) return NextResponse.json({ error: "Anuncio no encontrado" }, { status: 404 });
  const campana = anuncio.campanas as unknown as { nombre: string; publicado: boolean } | null;
  if (!campana?.publicado) {
    return NextResponse.json({ error: "Esta campaña aún no está disponible" }, { status: 403 });
  }

  const { data, error } = await sb
    .from("campana_comentarios")
    .insert({
      anuncio_id: id,
      autor_nombre,
      autor_rol: autor_rol ?? "cliente",
      contenido: contenido.trim(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // `notificar: false` cuando el cambio de estado ya mandó el correo con este mismo texto
  if (autor_rol !== "admin" && notificar !== false) {
    await notificarAdminAnuncio(
      anuncio.puesto,
      campana.nombre,
      "comentario",
      autor_nombre ?? "Cliente",
      contenido.trim()
    );
  }

  return NextResponse.json(data, { status: 201 });
}
