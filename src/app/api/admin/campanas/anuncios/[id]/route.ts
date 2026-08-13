import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { notificarRevisoresAnuncio } from "@/lib/campanas-notify";
import { rollupCampana, type EstadoCampana } from "@/lib/campanas";
import { SinPermiso, exigirSeccion } from "@/lib/admin-auth";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CAMPOS_EDITABLES = [
  "puesto", "imagen_url", "texto_principal", "titulo", "descripcion",
  "cta", "formulario", "orden", "resultados", "meta_id",
] as const;

/** PATCH — editar el anuncio.
 *  `avisar: true` lo regresa a "pendiente" y notifica al cliente (ya lo corregimos). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await exigirSeccion(req, "campanas");
    const { id } = await params;
    const body = await req.json();

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const campo of CAMPOS_EDITABLES) {
      if (campo in body) update[campo] = body[campo];
    }
    if (body.avisar === true) update.estado = "pendiente";
    else if (typeof body.estado === "string" && ["pendiente", "aprobado", "cambios"].includes(body.estado)) {
      update.estado = body.estado;
    }

    const { data: anuncio } = await sb
      .from("campana_anuncios")
      .select("id, puesto, campana_id, campanas(nombre)")
      .eq("id", id)
      .maybeSingle();

    if (!anuncio) return NextResponse.json({ error: "Anuncio no encontrado" }, { status: 404 });

    const { error } = await sb.from("campana_anuncios").update(update).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Recalcular el estado de la campaña si cambió el del anuncio
    if (update.estado) {
      const { data: hermanos } = await sb
        .from("campana_anuncios")
        .select("estado")
        .eq("campana_id", anuncio.campana_id);
      await sb
        .from("campanas")
        .update({
          estado: rollupCampana((hermanos ?? []) as { estado: EstadoCampana }[]),
          updated_at: new Date().toISOString(),
        })
        .eq("id", anuncio.campana_id);
    }

    if (body.avisar === true) {
      const campana = anuncio.campanas as unknown as { nombre: string } | null;
      await notificarRevisoresAnuncio(
        (update.puesto as string) ?? anuncio.puesto,
        campana?.nombre ?? "Campaña"
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await exigirSeccion(req, "campanas");
    const { id } = await params;

    const { data: anuncio } = await sb
      .from("campana_anuncios")
      .select("campana_id")
      .eq("id", id)
      .maybeSingle();

    const { error } = await sb.from("campana_anuncios").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Al quitar un anuncio cambia el rollup de la campaña
    if (anuncio) {
      const { data: hermanos } = await sb
        .from("campana_anuncios")
        .select("estado")
        .eq("campana_id", anuncio.campana_id);
      await sb
        .from("campanas")
        .update({
          estado: rollupCampana((hermanos ?? []) as { estado: EstadoCampana }[]),
          updated_at: new Date().toISOString(),
        })
        .eq("id", anuncio.campana_id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
