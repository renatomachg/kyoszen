import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type {
  ProyectoBloque,
  ProyectoComentario,
  ProyectoEscena,
  ProyectoEtapa,
} from "@/lib/proyectos";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type BloqueDetalle = ProyectoBloque & {
  proyecto_comentarios: ProyectoComentario[];
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [proyectoResult, escenasResult, etapasResult] = await Promise.all([
    sb.from("proyectos").select("*").eq("id", id).eq("publicado", true).maybeSingle(),
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
      { error: escenasResult.error?.message ?? etapasResult.error?.message ?? "No se pudo cargar el proyecto" },
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

  return NextResponse.json({
    ...proyectoResult.data,
    proyecto_escenas: escenas,
    proyecto_etapas: etapas.map((etapa) => ({
      ...etapa,
      proyecto_bloques: bloquesConComentarios.filter(({ etapa_id }) => etapa_id === etapa.id),
    })),
  });
}
