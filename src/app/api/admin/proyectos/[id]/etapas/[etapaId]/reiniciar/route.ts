import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SinPermiso, soloAdmin } from "@/lib/admin-auth";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** POST — borra el historial completo de una etapa y la deja en blanco.
 *
 *  Se lleva todas las versiones, los comentarios, las entregas y los archivos
 *  que se hayan subido. Deja una versión 1 vacía por escena, oculta al cliente,
 *  y vuelve a bloquear las etapas que venían después. No manda ningún correo:
 *  esto es trabajo interno hasta que se use "Enviar al cliente".
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; etapaId: string }> }
) {
  try {
    // Es destructivo: solo el admin, nunca un colaborador
    await soloAdmin(req);
    const { id, etapaId } = await params;
    const body = await req.json().catch(() => ({}));
    // Por defecto se borra todo; `conservar_notas` deja el brief de cada escena
    const conservarNotas = body?.conservar_notas === true;

    const { data: etapa, error: etapaError } = await sb
      .from("proyecto_etapas")
      .select("id, proyecto_id, nombre, orden, modo")
      .eq("id", etapaId)
      .maybeSingle();

    if (etapaError) return NextResponse.json({ error: etapaError.message }, { status: 500 });
    if (!etapa || etapa.proyecto_id !== id) {
      return NextResponse.json({ error: "Etapa no encontrada" }, { status: 404 });
    }

    // Guardar las notas antes de borrar, si el admin las quiere conservar
    const { data: previos, error: previosError } = await sb
      .from("proyecto_bloques")
      .select("id, escena_id, nota, es_activa")
      .eq("etapa_id", etapaId);

    if (previosError) return NextResponse.json({ error: previosError.message }, { status: 500 });

    const notasPorEscena = new Map<string, string | null>();
    if (conservarNotas) {
      for (const bloque of previos ?? []) {
        if (!bloque.es_activa || !bloque.escena_id) continue;
        if (bloque.nota) notasPorEscena.set(bloque.escena_id, bloque.nota);
      }
    }

    const idsPrevios = (previos ?? []).map(b => b.id);

    // Los comentarios van primero: cuelgan de los bloques
    if (idsPrevios.length > 0) {
      const { error: comentariosError } = await sb
        .from("proyecto_comentarios")
        .delete()
        .in("bloque_id", idsPrevios);
      if (comentariosError) {
        return NextResponse.json({ error: comentariosError.message }, { status: 500 });
      }

      const { error: bloquesError } = await sb
        .from("proyecto_bloques")
        .delete()
        .in("id", idsPrevios);
      if (bloquesError) {
        return NextResponse.json({ error: bloquesError.message }, { status: 500 });
      }
    }

    // Volver a sembrar la etapa en blanco
    const ahora = new Date().toISOString();
    let escenasCreadas = 0;

    if (etapa.modo === "por_escena") {
      const { data: escenas, error: escenasError } = await sb
        .from("proyecto_escenas")
        .select("id")
        .eq("proyecto_id", id)
        .order("orden");
      if (escenasError) return NextResponse.json({ error: escenasError.message }, { status: 500 });

      const filas = (escenas ?? []).map(escena => ({
        etapa_id: etapaId,
        escena_id: escena.id,
        estado: "pendiente",
        contenido: {},
        archivos: [],
        nota: conservarNotas ? notasPorEscena.get(escena.id) ?? null : null,
        version_num: 1,
        es_activa: true,
        visible_cliente: false,
        entrega_estado: "ninguna",
        entrega_nombre: null,
        entrega_at: null,
      }));

      if (filas.length > 0) {
        const { error: insertarError } = await sb.from("proyecto_bloques").insert(filas);
        if (insertarError) return NextResponse.json({ error: insertarError.message }, { status: 500 });
      }
      escenasCreadas = filas.length;
    } else {
      const { error: insertarError } = await sb.from("proyecto_bloques").insert({
        etapa_id: etapaId,
        escena_id: null,
        estado: "pendiente",
        contenido: {},
        archivos: [],
        nota: null,
        version_num: 1,
        es_activa: true,
        visible_cliente: false,
        entrega_estado: "ninguna",
        entrega_nombre: null,
        entrega_at: null,
      });
      if (insertarError) return NextResponse.json({ error: insertarError.message }, { status: 500 });
      escenasCreadas = 1;
    }

    // La etapa vuelve a pendiente y las siguientes se re-bloquean:
    // ya no hay nada aprobado que las habilite.
    const [{ error: etapaUpdateError }, { error: bloqueoError }, { error: proyectoError }] = await Promise.all([
      sb.from("proyecto_etapas").update({ estado: "pendiente", updated_at: ahora }).eq("id", etapaId),
      sb
        .from("proyecto_etapas")
        .update({ estado: "bloqueada", updated_at: ahora })
        .eq("proyecto_id", id)
        .gt("orden", etapa.orden)
        .neq("estado", "bloqueada"),
      sb.from("proyectos").update({ etapa_actual: etapa.orden, updated_at: ahora }).eq("id", id),
    ]);

    if (etapaUpdateError || bloqueoError || proyectoError) {
      return NextResponse.json(
        {
          error:
            etapaUpdateError?.message ??
            bloqueoError?.message ??
            proyectoError?.message ??
            "No se pudo reiniciar la etapa",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      etapa: etapa.nombre,
      borrados: idsPrevios.length,
      creados: escenasCreadas,
    });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
