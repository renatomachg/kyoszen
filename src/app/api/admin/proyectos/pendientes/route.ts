import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type {
  ProyectoBloque,
  ProyectoComentario,
  ProyectoEscena,
  ProyectoEtapa,
} from "@/lib/proyectos";
import { SinPermiso, exigirSeccion } from "@/lib/admin-auth";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ProyectoResumen = { id: string; titulo: string };

export async function GET(req: NextRequest) {
  try {
    await exigirSeccion(req, "proyectos");
    const { data: bloquesData, error: bloquesError } = await sb
      .from("proyecto_bloques")
      .select("*")
      .eq("estado", "cambios")
      .eq("es_activa", true)
      .order("updated_at", { ascending: false });

    if (bloquesError) {
      return NextResponse.json({ error: bloquesError.message }, { status: 500 });
    }

    const bloques = (bloquesData ?? []) as ProyectoBloque[];
    if (bloques.length === 0) return NextResponse.json([]);

    const etapaIds = [...new Set(bloques.map(({ etapa_id }) => etapa_id))];
    const bloqueIds = bloques.map(({ id }) => id);
    const escenaIds = [...new Set(
      bloques.flatMap(({ escena_id }) => escena_id === null ? [] : [escena_id])
    )];

    const [etapasResult, comentariosResult, escenasResult] = await Promise.all([
      sb.from("proyecto_etapas").select("*").in("id", etapaIds),
      sb
        .from("proyecto_comentarios")
        .select("*")
        .in("bloque_id", bloqueIds)
        .order("created_at", { ascending: false }),
      escenaIds.length > 0
        ? sb.from("proyecto_escenas").select("*").in("id", escenaIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const primerError = etapasResult.error ?? comentariosResult.error ?? escenasResult.error;
    if (primerError) {
      return NextResponse.json({ error: primerError.message }, { status: 500 });
    }

    const etapas = (etapasResult.data ?? []) as ProyectoEtapa[];
    const comentarios = (comentariosResult.data ?? []) as ProyectoComentario[];
    const escenas = (escenasResult.data ?? []) as ProyectoEscena[];
    const proyectoIds = [...new Set(etapas.map(({ proyecto_id }) => proyecto_id))];
    const { data: proyectosData, error: proyectosError } = await sb
      .from("proyectos")
      .select("id, titulo")
      .in("id", proyectoIds);

    if (proyectosError) {
      return NextResponse.json({ error: proyectosError.message }, { status: 500 });
    }

    const proyectos = (proyectosData ?? []) as ProyectoResumen[];
    const etapaPorId = new Map(etapas.map((etapa) => [etapa.id, etapa]));
    const escenaPorId = new Map(escenas.map((escena) => [escena.id, escena]));
    const proyectoPorId = new Map(proyectos.map((proyecto) => [proyecto.id, proyecto]));
    const ultimoComentarioPorBloque = new Map<string, ProyectoComentario>();
    for (const comentario of comentarios) {
      if (!ultimoComentarioPorBloque.has(comentario.bloque_id)) {
        ultimoComentarioPorBloque.set(comentario.bloque_id, comentario);
      }
    }

    const pendientes = bloques.flatMap((bloque) => {
      const etapa = etapaPorId.get(bloque.etapa_id);
      const proyecto = etapa ? proyectoPorId.get(etapa.proyecto_id) : undefined;
      if (!etapa || !proyecto) return [];
      const escena = bloque.escena_id ? escenaPorId.get(bloque.escena_id) ?? null : null;
      const comentario = ultimoComentarioPorBloque.get(bloque.id);
      return [{
        id: bloque.id,
        updated_at: bloque.updated_at,
        proyecto,
        etapa: { tipo: etapa.tipo, nombre: etapa.nombre },
        escena: escena ? { numero: escena.numero, titulo: escena.titulo } : null,
        ultimo_comentario: comentario
          ? {
              autor_nombre: comentario.autor_nombre,
              contenido: comentario.contenido,
              created_at: comentario.created_at,
            }
          : null,
      }];
    });

    return NextResponse.json(pendientes);
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
