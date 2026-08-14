import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  rollupEtapa,
  tieneEntregable,
  type Aprobador,
  type Archivo,
  type EstadoBloque,
  type TipoEtapa,
} from "@/lib/proyectos";
import { SinPermiso, exigirProyecto, soloAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type EtapaRel = {
  id: string;
  proyecto_id: string;
  orden: number;
  tipo: TipoEtapa;
  estado: string;
  aprobador: Aprobador;
};

/** PATCH — el admin aprueba o pide cambios en un bloque de una etapa suya (arte). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; bloqueId: string }> }
) {
  try {
    const { id, bloqueId } = await params;
    await exigirProyecto(req, id);
    const identidad = await soloAdmin(req);
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Body inválido" }, { status: 400 });
    }

    const estado = body.estado;
    if (estado !== "aprobado" && estado !== "cambios" && estado !== "pendiente") {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }
    const comentario = typeof body.comentario === "string" ? body.comentario.trim() : "";

    const { data, error } = await sb
      .from("proyecto_bloques")
      .select("id, etapa_id, contenido, archivos, proyecto_etapas!inner(id, proyecto_id, orden, tipo, estado, aprobador)")
      .eq("id", bloqueId)
      .eq("es_activa", true)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Bloque no encontrado" }, { status: 404 });

    const rel = data.proyecto_etapas as unknown as EtapaRel | EtapaRel[] | null;
    const etapa = Array.isArray(rel) ? rel[0] : rel;
    if (!etapa || etapa.proyecto_id !== id) {
      return NextResponse.json({ error: "Bloque no encontrado" }, { status: 404 });
    }
    if (etapa.aprobador !== "admin") {
      return NextResponse.json(
        { error: "Esta etapa la aprueba el cliente desde su portal." },
        { status: 409 }
      );
    }
    if (etapa.estado === "bloqueada") {
      return NextResponse.json(
        { error: "Esta etapa todavía está bloqueada." },
        { status: 409 }
      );
    }

    // No se aprueba una escena vacía: es justo lo que dejaba el 9/9 en verde sin nada
    if (
      estado === "aprobado" &&
      !tieneEntregable(
        {
          contenido: (data.contenido ?? {}) as Record<string, unknown>,
          archivos: (data.archivos ?? []) as Archivo[],
        },
        etapa.tipo
      )
    ) {
      return NextResponse.json(
        { error: "Esta escena no tiene nada entregado todavía. Sube el archivo antes de aprobarla." },
        { status: 409 }
      );
    }

    const ahora = new Date().toISOString();
    const { error: errorEstado } = await sb
      .from("proyecto_bloques")
      .update({
        estado,
        updated_at: ahora,
        ...(estado === "cambios" ? { entrega_estado: "ninguna" } : {}),
      })
      .eq("id", bloqueId)
      .eq("es_activa", true);
    if (errorEstado) return NextResponse.json({ error: errorEstado.message }, { status: 500 });

    if (comentario) {
      const respaldoNombre = typeof body.autor_nombre === "string" ? body.autor_nombre.trim() : "";
      const autorRol = identidad.rol === "admin" ? "admin" : "colaborador";
      const autorNombre = identidad.rol === "admin"
        ? "Kyoszen"
        : identidad.nombre?.trim() || respaldoNombre || "Un colaborador";
      const { error: comentarioError } = await sb
        .from("proyecto_comentarios")
        .insert({
          bloque_id: bloqueId,
          autor_nombre: autorNombre,
          autor_rol: autorRol,
          contenido: comentario,
        });
      if (comentarioError) {
        return NextResponse.json({ error: comentarioError.message }, { status: 500 });
      }
    }

    // Rollup de la etapa con lo que ya está liberado
    const { data: hermanos } = await sb
      .from("proyecto_bloques")
      .select("estado")
      .eq("etapa_id", etapa.id)
      .eq("es_activa", true);

    const estadoEtapa = rollupEtapa((hermanos ?? []) as { estado: EstadoBloque }[]);
    await sb
      .from("proyecto_etapas")
      .update({ estado: estadoEtapa, updated_at: ahora })
      .eq("id", etapa.id);

    // Aprobar la etapa completa desbloquea la siguiente; reabrirla la vuelve a bloquear
    if (estadoEtapa === "aprobado") {
      await sb
        .from("proyecto_etapas")
        .update({ estado: "pendiente", updated_at: ahora })
        .eq("proyecto_id", etapa.proyecto_id)
        .eq("orden", etapa.orden + 1)
        .eq("estado", "bloqueada");
      await sb
        .from("proyectos")
        .update({ etapa_actual: etapa.orden + 1, updated_at: ahora })
        .eq("id", etapa.proyecto_id);
    } else {
      await sb
        .from("proyecto_etapas")
        .update({ estado: "bloqueada", updated_at: ahora })
        .eq("proyecto_id", etapa.proyecto_id)
        .gt("orden", etapa.orden)
        .neq("estado", "bloqueada");
      await sb
        .from("proyectos")
        .update({ etapa_actual: etapa.orden, updated_at: ahora })
        .eq("id", etapa.proyecto_id);
    }

    return NextResponse.json({ ok: true, estado, estado_etapa: estadoEtapa });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
