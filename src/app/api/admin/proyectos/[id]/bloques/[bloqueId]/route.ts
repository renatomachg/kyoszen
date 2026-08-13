import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SinPermiso, exigirProyecto } from "@/lib/admin-auth";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type EtapaRelacion = { proyecto_id: string } | { proyecto_id: string }[] | null;

type BloqueConEtapa = {
  id: string;
  estado: string;
  proyecto_etapas: EtapaRelacion;
};

function proyectoDeRelacion(relacion: EtapaRelacion): string | undefined {
  return Array.isArray(relacion) ? relacion[0]?.proyecto_id : relacion?.proyecto_id;
}

// PUT — modifica el bloque activo en su lugar, sin versionar ni notificar.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; bloqueId: string }> }
) {
  try {
    const { id, bloqueId } = await params;
    await exigirProyecto(req, id);
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Body inválido" }, { status: 400 });
    }

    const { data: bloque, error: bloqueError } = await sb
      .from("proyecto_bloques")
      .select("id, estado, proyecto_etapas!inner(proyecto_id)")
      .eq("id", bloqueId)
      .eq("es_activa", true)
      .maybeSingle();

    if (bloqueError) {
      return NextResponse.json({ error: bloqueError.message }, { status: 500 });
    }
    const bloqueTipado = bloque as BloqueConEtapa | null;
    if (!bloqueTipado || proyectoDeRelacion(bloqueTipado.proyecto_etapas) !== id) {
      return NextResponse.json({ error: "Bloque no encontrado" }, { status: 404 });
    }
    if (bloqueTipado.estado === "aprobado") {
      return NextResponse.json(
        { error: "Este bloque ya está aprobado. Usa 'Guardar y avisar' para enviar una nueva versión." },
        { status: 409 }
      );
    }

    const patch: Record<string, unknown> = {};
    if (body.contenido !== undefined) {
      if (!body.contenido || typeof body.contenido !== "object" || Array.isArray(body.contenido)) {
        return NextResponse.json({ error: "contenido debe ser un objeto" }, { status: 400 });
      }
      patch.contenido = body.contenido;
    }
    if (body.archivos !== undefined) {
      if (!Array.isArray(body.archivos)) {
        return NextResponse.json({ error: "archivos debe ser un arreglo" }, { status: 400 });
      }
      patch.archivos = body.archivos;
    }
    if (body.nota !== undefined) {
      if (typeof body.nota !== "string" && body.nota !== null) {
        return NextResponse.json({ error: "nota debe ser texto o null" }, { status: 400 });
      }
      patch.nota = body.nota;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "No hay campos válidos para actualizar" }, { status: 400 });
    }
    // Borrador de un colaborador: se guarda pero el cliente no lo ve. Sigue sin
    // entrar a la bandeja del admin hasta que ella apriete "Enviar a revisión".
    if (body.destino === "interno") patch.visible_cliente = false;
    patch.updated_at = new Date().toISOString();

    const { data, error } = await sb
      .from("proyecto_bloques")
      .update(patch)
      .eq("id", bloqueId)
      .eq("es_activa", true)
      .select()
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Bloque no encontrado" }, { status: 404 });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
