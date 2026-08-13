import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Espacio, TipoEspacio } from "@/lib/proyectos";
import { SinPermiso, exigirSeccion } from "@/lib/admin-auth";

export const runtime = "nodejs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type EspacioConConteos = Espacio & {
  proyectos_count: number;
  archivos_count: number;
  tarjetas_count: number;
};

function esTipoEspacio(value: unknown): value is TipoEspacio {
  return value === "aprobacion" || value === "archivos" || value === "tablero";
}

async function agregarConteos(espacios: Espacio[]): Promise<EspacioConConteos[]> {
  return Promise.all(espacios.map(async (espacio) => {
    const [proyectos, archivos, columnas] = await Promise.all([
      sb.from("proyectos").select("*", { count: "exact", head: true }).eq("espacio_id", espacio.id),
      sb.from("espacio_archivos").select("*", { count: "exact", head: true }).eq("espacio_id", espacio.id),
      sb.from("espacio_columnas").select("id").eq("espacio_id", espacio.id),
    ]);

    const error = proyectos.error ?? archivos.error ?? columnas.error;
    if (error) throw error;

    const columnaIds = (columnas.data ?? []).map(({ id }) => id);
    let tarjetasCount = 0;
    if (columnaIds.length > 0) {
      const tarjetas = await sb
        .from("espacio_tarjetas")
        .select("*", { count: "exact", head: true })
        .in("columna_id", columnaIds);
      if (tarjetas.error) throw tarjetas.error;
      tarjetasCount = tarjetas.count ?? 0;
    }

    return {
      ...espacio,
      proyectos_count: proyectos.count ?? 0,
      archivos_count: archivos.count ?? 0,
      tarjetas_count: tarjetasCount,
    };
  }));
}

export async function GET(req: NextRequest) {
  try {
    await exigirSeccion(req, "proyectos");
    const { data, error } = await sb
      .from("proyecto_espacios")
      .select(
        "id, nombre, tipo, descripcion, icono, color, cuestionario_token, orden, publicado, created_at, updated_at"
      )
      .order("orden", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    try {
      return NextResponse.json({ espacios: await agregarConteos((data ?? []) as Espacio[]) });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "No se pudieron calcular los conteos";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await exigirSeccion(req, "proyectos");
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Body inválido" }, { status: 400 });
    }

    const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
    if (!nombre) return NextResponse.json({ error: "nombre es requerido" }, { status: 400 });
    if (!esTipoEspacio(body.tipo)) {
      return NextResponse.json({ error: "tipo de espacio inválido" }, { status: 400 });
    }

    const insert: Record<string, unknown> = { nombre, tipo: body.tipo };
    if (typeof body.descripcion === "string") insert.descripcion = body.descripcion.trim() || null;
    if (typeof body.icono === "string") insert.icono = body.icono.trim() || null;
    if (typeof body.color === "string") insert.color = body.color.trim() || null;
    if (typeof body.orden === "number" && Number.isInteger(body.orden)) insert.orden = body.orden;
    if (typeof body.publicado === "boolean") insert.publicado = body.publicado;

    const { data, error } = await sb
      .from("proyecto_espacios")
      .insert(insert)
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
