import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// El cliente SOLO ve campañas publicadas, y nunca la nota interna.
export async function GET() {
  const { data, error } = await sb
    .from("campanas")
    .select(`
      id, nombre, cliente_final, plataforma, tipo, objetivo, publica_desde,
      segmentacion, presupuesto_texto, fecha_difusion, fechas_reclutamiento,
      meta_texto, sede_texto, flujo, estado, modo, fecha_inicio, fecha_fin,
      resultados, publicado, orden, created_at,
      campana_anuncios(
        id, campana_id, puesto, imagen_url, texto_principal, titulo, descripcion,
        cta, formulario, estado, orden, resultados,
        campana_comentarios(id, autor_nombre, autor_rol, contenido, created_at)
      )
    `)
    .eq("publicado", true)
    .order("orden")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Orden estable de los anuncios y de sus comentarios
  const campanas = (data ?? []).map(c => ({
    ...c,
    campana_anuncios: [...(c.campana_anuncios ?? [])]
      .sort((a, b) => a.orden - b.orden)
      .map(a => ({
        ...a,
        campana_comentarios: [...(a.campana_comentarios ?? [])].sort(
          (x, y) => new Date(x.created_at).getTime() - new Date(y.created_at).getTime()
        ),
      })),
  }));

  return NextResponse.json(campanas);
}
