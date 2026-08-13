import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SinPermiso, exigirSeccion } from "@/lib/admin-auth";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SELECT = `
  id, nombre, cliente_final, plataforma, tipo, objetivo, publica_desde,
  segmentacion, presupuesto_texto, fecha_difusion, fechas_reclutamiento,
  meta_texto, sede_texto, flujo, nota_interna, estado, modo, fecha_inicio, fecha_fin,
  resultados, meta_id, publicado, orden, created_at,
  campana_anuncios(
    id, campana_id, puesto, imagen_url, texto_principal, titulo, descripcion,
    cta, formulario, estado, orden, resultados, meta_id,
    campana_comentarios(id, autor_nombre, autor_rol, contenido, created_at)
  )
`;

export async function GET(req: NextRequest) {
  try {
    await exigirSeccion(req, "campanas");
    const { data, error } = await sb
      .from("campanas")
      .select(SELECT)
      .order("orden")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// Alta de campaña (con sus anuncios opcionales)
export async function POST(req: NextRequest) {
  try {
    await exigirSeccion(req, "campanas");
    const body = await req.json();
    const { anuncios, ...campana } = body;

    if (!campana.nombre?.trim()) {
      return NextResponse.json({ error: "Falta el nombre de la campaña" }, { status: 400 });
    }

    const { data: nueva, error } = await sb
      .from("campanas")
      .insert({ ...campana, publicado: false })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (Array.isArray(anuncios) && anuncios.length > 0) {
      const filas = anuncios.map((a: Record<string, unknown>, i: number) => ({
        ...a,
        campana_id: nueva.id,
        orden: typeof a.orden === "number" ? a.orden : i,
      }));
      const { error: errAnuncios } = await sb.from("campana_anuncios").insert(filas);
      if (errAnuncios) return NextResponse.json({ error: errAnuncios.message }, { status: 500 });
    }

    return NextResponse.json({ id: nueva.id }, { status: 201 });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
