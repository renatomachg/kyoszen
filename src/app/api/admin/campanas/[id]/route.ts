import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { notificarRevisoresCampanaPublicada } from "@/lib/campanas-notify";
import type { ModoCampana } from "@/lib/campanas";
import { SinPermiso, exigirSeccion } from "@/lib/admin-auth";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CAMPOS_EDITABLES = [
  "nombre", "cliente_final", "plataforma", "tipo", "objetivo", "publica_desde",
  "segmentacion", "presupuesto_texto", "fecha_difusion", "fechas_reclutamiento",
  "meta_texto", "sede_texto", "flujo", "nota_interna", "modo", "resultados", "meta_id",
  "publicado", "orden",
] as const;

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

    const { data: antes } = await sb
      .from("campanas")
      .select("publicado, nombre, modo")
      .eq("id", id)
      .maybeSingle();

    const { error } = await sb.from("campanas").update(update).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Avisar a los revisores solo en la transición borrador → publicada
    if (body.publicado === true && antes && antes.publicado === false) {
      const { count } = await sb
        .from("campana_anuncios")
        .select("id", { count: "exact", head: true })
        .eq("campana_id", id);
      await notificarRevisoresCampanaPublicada(
        (update.nombre as string) ?? antes.nombre,
        count ?? 0,
        ((update.modo as ModoCampana) ?? antes.modo ?? "revision")
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
    const { error } = await sb.from("campanas").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
