import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { notificarAdminAnuncio } from "@/lib/campanas-notify";
import { faseDeCampana, rollupCampana, type Campana, type EstadoCampana } from "@/lib/campanas";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { estado, revisor_nombre, comentario } = await req.json();

  if (!["aprobado", "cambios", "pendiente"].includes(estado)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  // El anuncio tiene que existir y pertenecer a una campaña publicada
  const { data: anuncio, error: errAnuncio } = await sb
    .from("campana_anuncios")
    .select("id, puesto, campana_id, campanas(nombre, publicado, modo, fecha_fin)")
    .eq("id", id)
    .maybeSingle();

  if (errAnuncio) return NextResponse.json({ error: errAnuncio.message }, { status: 500 });
  if (!anuncio) return NextResponse.json({ error: "Anuncio no encontrado" }, { status: 404 });

  const campana = anuncio.campanas as unknown as Pick<Campana, "nombre" | "publicado" | "modo" | "fecha_fin"> | null;
  if (!campana?.publicado) {
    return NextResponse.json({ error: "Esta campaña aún no está disponible" }, { status: 403 });
  }
  // Campaña informativa: no se aprueba ni se piden cambios
  if (faseDeCampana(campana) !== "revision") {
    return NextResponse.json(
      { error: "Esta campaña no requiere aprobación" },
      { status: 409 }
    );
  }

  const { error } = await sb
    .from("campana_anuncios")
    .update({ estado, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Rollup: la campaña queda aprobada solo cuando TODOS sus anuncios lo están
  const { data: hermanos } = await sb
    .from("campana_anuncios")
    .select("estado")
    .eq("campana_id", anuncio.campana_id);

  const estadoCampana = rollupCampana((hermanos ?? []) as { estado: EstadoCampana }[]);
  await sb
    .from("campanas")
    .update({ estado: estadoCampana, updated_at: new Date().toISOString() })
    .eq("id", anuncio.campana_id);

  if (estado !== "pendiente") {
    await notificarAdminAnuncio(
      anuncio.puesto,
      campana.nombre,
      estado,
      revisor_nombre ?? "Cliente",
      comentario
    );
  }

  return NextResponse.json({ ok: true, estado_campana: estadoCampana });
}
