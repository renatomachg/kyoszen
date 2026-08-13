import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { MetaSinConfigurar, revisarToken, traerResultados, traerVentana } from "@/lib/meta-insights";
import { SinPermiso, exigirSeccion } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** GET — si el botón puede funcionar, y qué tan cerca está de vencer el token. */
export async function GET(req: NextRequest) {
  try {
    await exigirSeccion(req, "campanas");
    return NextResponse.json(await revisarToken());
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

/** POST — trae de Meta los resultados de la campaña y de cada anuncio.
 *  Solo lectura del lado de Meta: no toca la cuenta de anuncios. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await exigirSeccion(req, "campanas");
    const { id } = await params;

    const { data: campana, error } = await sb
      .from("campanas")
      .select("id, nombre, meta_id, modo, campana_anuncios(id, puesto, meta_id)")
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
      const [corte, ventana] = await Promise.all([
        traerResultados(campana.meta_id, process.env.META_AD_ACCOUNT_ID),
        traerVentana(campana.meta_id),
      ]);
      const ahora = new Date().toISOString();
      // Solo se apaga sola una campaña que estaba corriendo. Una que sigue en
      // revisión del cliente conserva su modo, aunque en Meta ya haya cerrado.
      const yaCerro = Boolean(ventana.fin && new Date(ventana.fin) <= new Date());
      const finalizada = yaCerro && campana.modo === "en_curso";

      await sb
        .from("campanas")
        .update({
          resultados: corte.campana,
          fecha_inicio: ventana.inicio,
          fecha_fin: ventana.fin,
          ...(finalizada ? { modo: "finalizada" } : {}),
          updated_at: ahora,
        })
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
        finalizada,
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
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
