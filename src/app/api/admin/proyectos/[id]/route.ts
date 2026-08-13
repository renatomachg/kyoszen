import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type {
  ProyectoBloque,
  ProyectoComentario,
  ProyectoEscena,
  ProyectoEtapa,
} from "@/lib/proyectos";
import { SinPermiso, exigirProyecto } from "@/lib/admin-auth";

export const runtime = "nodejs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type BloqueDetalle = ProyectoBloque & {
  proyecto_comentarios: ProyectoComentario[];
};

// GET — detalle anidado: proyecto > etapas > bloques activos > comentarios.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await exigirProyecto(req, id);
    const [proyectoResult, escenasResult, etapasResult] = await Promise.all([
      sb.from("proyectos").select("*").eq("id", id).maybeSingle(),
      sb.from("proyecto_escenas").select("*").eq("proyecto_id", id).order("orden"),
      sb.from("proyecto_etapas").select("*").eq("proyecto_id", id).order("orden"),
    ]);

    if (proyectoResult.error) {
      return NextResponse.json({ error: proyectoResult.error.message }, { status: 500 });
    }
    if (!proyectoResult.data) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }
    if (escenasResult.error || etapasResult.error) {
      return NextResponse.json(
        { error: escenasResult.error?.message ?? etapasResult.error?.message ?? "Error al cargar el proyecto" },
        { status: 500 }
      );
    }

    const escenas = (escenasResult.data ?? []) as ProyectoEscena[];
    const etapas = (etapasResult.data ?? []) as ProyectoEtapa[];
    const etapaIds = etapas.map(({ id: etapaId }) => etapaId);
    let bloques: ProyectoBloque[] = [];
    if (etapaIds.length > 0) {
      const { data, error } = await sb
        .from("proyecto_bloques")
        .select("*")
        .in("etapa_id", etapaIds)
        .eq("es_activa", true)
        .order("created_at");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      bloques = (data ?? []) as ProyectoBloque[];
    }

    const bloqueIds = bloques.map(({ id: bloqueId }) => bloqueId);
    let comentarios: ProyectoComentario[] = [];
    if (bloqueIds.length > 0) {
      const { data, error } = await sb
        .from("proyecto_comentarios")
        .select("*")
        .in("bloque_id", bloqueIds)
        .order("created_at");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      comentarios = (data ?? []) as ProyectoComentario[];
    }

    const bloquesConComentarios: BloqueDetalle[] = bloques.map((bloque) => ({
      ...bloque,
      proyecto_comentarios: comentarios.filter(({ bloque_id }) => bloque_id === bloque.id),
    }));
    const etapasAnidadas = etapas.map((etapa) => ({
      ...etapa,
      proyecto_bloques: bloquesConComentarios.filter(({ etapa_id }) => etapa_id === etapa.id),
    }));

    return NextResponse.json({
      ...proyectoResult.data,
      proyecto_escenas: escenas,
      proyecto_etapas: etapasAnidadas,
    });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// PUT/PATCH — edición parcial de metadatos del proyecto.
async function actualizarProyecto(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await exigirProyecto(req, id);
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Body inválido" }, { status: 400 });
    }

    if (
      body.estado !== undefined &&
      (typeof body.estado !== "string" || !["activo", "pausado", "completado", "archivado"].includes(body.estado))
    ) {
      return NextResponse.json({ error: "Estado de proyecto inválido" }, { status: 400 });
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.titulo === "string") patch.titulo = body.titulo;
    if (typeof body.area === "string" || body.area === null) patch.area = body.area;
    if (typeof body.descripcion === "string" || body.descripcion === null) patch.descripcion = body.descripcion;
    if (typeof body.folio === "string" || body.folio === null) patch.folio = body.folio;
    if (typeof body.estado === "string") patch.estado = body.estado;
    if (typeof body.publicado === "boolean") patch.publicado = body.publicado;
    if (typeof body.espacio_id === "string" || body.espacio_id === null) {
      patch.espacio_id = body.espacio_id;
    }

    const { data, error } = await sb
      .from("proyectos")
      .update(patch)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export const PUT = actualizarProyecto;
export const PATCH = actualizarProyecto;

// DELETE — el cascade de la base elimina etapas, escenas, bloques y comentarios.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await exigirProyecto(req, id);
    const { data, error } = await sb
      .from("proyectos")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
