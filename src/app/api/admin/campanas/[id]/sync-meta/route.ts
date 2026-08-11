import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { MetaSinConfigurar, revisarToken, traerResultados } from "@/lib/meta-insights";

export const runtime = "nodejs";
export const maxDuration = 60;

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** GET — si el botón puede funcionar, y qué tan cerca está de vencer el token. */
export async function GET() {
  return NextResponse.json(await revisarToken());
}

/** POST — trae de Meta los resultados de la campaña y de cada anuncio.
 *  Solo lectura del lado de Meta: no toca la cuenta de anuncios. */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: campana, error } = await sb
    .from("campanas")
    .select("id, nombre, meta_id, campana_anuncios(id, puesto, meta_id)")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!campana) return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });

  if (!campana.meta_id) {
    return NextResponse.json(
      {
        error:
          "Esta campaña no tiene su ID de Meta. Cópialo del administrador de anuncios y pégalo en el campo “ID en Meta”.",
      },
      { status: 400 }
    );
  }

  try {
    const corte = await traerResultados(campana.meta_id, process.env.META_AD_ACCOUNT_ID);
    const ahora = new Date().toISOString();

    await sb
      .from("campanas")
      .update({ resultados: corte.campana, updated_at: ahora })
      .eq("id", campana.id);

    // Cada anuncio se casa por su id de Meta
    const anuncios = campana.campana_anuncios ?? [];
    let actualizados = 0;
    const sinCasar: string[] = [];

    await Promise.all(
      anuncios.map(async anuncio => {
        const resultados = anuncio.meta_id ? corte.anuncios.get(anuncio.meta_id) : undefined;
        if (!resultados) {
          sinCasar.push(anuncio.puesto);
          return;
        }
        await sb
          .from("campana_anuncios")
          .update({ resultados, updated_at: ahora })
          .eq("id", anuncio.id);
        actualizados += 1;
      })
    );

    return NextResponse.json({
      ok: true,
      campana: corte.campana,
      anuncios_actualizados: actualizados,
      anuncios_sin_casar: sinCasar,
    });
  } catch (e) {
    const sinConfigurar = e instanceof MetaSinConfigurar;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo traer de Meta", sinConfigurar },
      { status: sinConfigurar ? 503 : 502 }
    );
  }
}
