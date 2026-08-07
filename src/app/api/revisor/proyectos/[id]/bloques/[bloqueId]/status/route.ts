import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { rollupEtapa, type EstadoBloque, type EstadoEtapa } from "@/lib/proyectos";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type EtapaRelacion = {
  id: string;
  proyecto_id: string;
  orden: number;
  estado: EstadoEtapa;
  nombre: string;
  proyectos: { titulo: string; publicado: boolean } | { titulo: string; publicado: boolean }[] | null;
} | {
  id: string;
  proyecto_id: string;
  orden: number;
  estado: EstadoEtapa;
  nombre: string;
  proyectos: { titulo: string; publicado: boolean } | { titulo: string; publicado: boolean }[] | null;
}[] | null;

type BloqueConEtapa = {
  id: string;
  etapa_id: string;
  estado: EstadoBloque;
  proyecto_etapas: EtapaRelacion;
};

function tomarUno<T>(relacion: T | T[] | null) {
  return Array.isArray(relacion) ? relacion[0] : relacion;
}

async function getSmtp() {
  const { data } = await sb
    .from("site_config")
    .select("key,value")
    .in("key", ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from"]);
  const config: Record<string, string> = {};
  for (const row of data ?? []) config[row.key] = row.value;
  return config;
}

async function notifyAdmin(
  titulo: string,
  etapa: string,
  estado: EstadoBloque,
  revisorNombre: string
) {
  try {
    const smtp = await getSmtp();
    if (!smtp.smtp_host) return;
    const puerto = Number.parseInt(smtp.smtp_port ?? "465", 10);
    const transport = nodemailer.createTransport({
      host: smtp.smtp_host,
      port: puerto,
      secure: puerto === 465,
      auth: { user: smtp.smtp_user, pass: smtp.smtp_pass },
    });
    const estadoLabel = estado === "aprobado" ? "✅ Escena aprobada" : "🔴 Cambios solicitados";
    await transport.sendMail({
      from: `"Kyoszen Revisor" <${smtp.smtp_from ?? smtp.smtp_user}>`,
      to: "renatomachg@gmail.com",
      subject: `${estadoLabel} · ${titulo || "Proyecto"} · ${etapa}`,
      text: `${revisorNombre} actualizó una escena de ${etapa} a: ${estadoLabel}.\n\nRevisa en: https://kyoszen.com/admin/proyectos`,
    });
  } catch (error) {
    console.error("[notif proyecto bloque status] error al enviar:", error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; bloqueId: string }> }
) {
  const { id, bloqueId } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const estado = body.estado;
  if (estado !== "aprobado" && estado !== "cambios") {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }
  const revisorNombre = typeof body.revisor_nombre === "string" && body.revisor_nombre.trim()
    ? body.revisor_nombre.trim()
    : "Cliente";

  const { data, error: bloqueError } = await sb
    .from("proyecto_bloques")
    .select("id, etapa_id, estado, proyecto_etapas!inner(id, proyecto_id, orden, estado, nombre, proyectos!inner(titulo, publicado))")
    .eq("id", bloqueId)
    .eq("es_activa", true)
    // Una entrega interna que el admin no ha liberado no se puede aprobar
    .eq("visible_cliente", true)
    .eq("proyecto_etapas.proyecto_id", id)
    .eq("proyecto_etapas.proyectos.publicado", true)
    .maybeSingle();
  if (bloqueError) return NextResponse.json({ error: bloqueError.message }, { status: 500 });

  const bloque = data as BloqueConEtapa | null;
  const etapa = bloque ? tomarUno(bloque.proyecto_etapas) : null;
  const proyecto = etapa ? tomarUno(etapa.proyectos) : null;
  if (!bloque || !etapa || etapa.proyecto_id !== id || proyecto?.publicado !== true) {
    return NextResponse.json({ error: "Etapa/bloque no encontrado" }, { status: 404 });
  }
  if (
    etapa.estado === "bloqueada" ||
    (bloque.estado !== "pendiente" && bloque.estado !== "cambios")
  ) {
    return NextResponse.json(
      { error: "Esta escena no está disponible para revisión." },
      { status: 409 }
    );
  }

  const ahora = new Date().toISOString();
  const { data: actualizado, error: actualizarError } = await sb
    .from("proyecto_bloques")
    .update({ estado, updated_at: ahora })
    .eq("id", bloque.id)
    .eq("es_activa", true)
    .in("estado", ["pendiente", "cambios"])
    .select("id")
    .maybeSingle();
  if (actualizarError) {
    return NextResponse.json({ error: actualizarError.message }, { status: 500 });
  }
  if (!actualizado) {
    return NextResponse.json(
      { error: "Esta escena no está disponible para revisión." },
      { status: 409 }
    );
  }

  const { data: bloquesEtapa, error: bloquesError } = await sb
    .from("proyecto_bloques")
    .select("estado")
    .eq("etapa_id", etapa.id)
    .eq("es_activa", true);
  if (bloquesError) return NextResponse.json({ error: bloquesError.message }, { status: 500 });

  const estadoEtapa = rollupEtapa((bloquesEtapa ?? []) as { estado: EstadoBloque }[]);
  const { error: etapaError } = await sb
    .from("proyecto_etapas")
    .update({ estado: estadoEtapa, updated_at: ahora })
    .eq("id", etapa.id);
  if (etapaError) return NextResponse.json({ error: etapaError.message }, { status: 500 });

  if (estadoEtapa === "aprobado") {
    const siguienteOrden = etapa.orden + 1;
    const { data: siguiente, error: siguienteError } = await sb
      .from("proyecto_etapas")
      .select("id, estado")
      .eq("proyecto_id", id)
      .eq("orden", siguienteOrden)
      .maybeSingle();
    if (siguienteError) return NextResponse.json({ error: siguienteError.message }, { status: 500 });

    if (!siguiente) {
      const { error: proyectoError } = await sb
        .from("proyectos")
        .update({ estado: "completado", updated_at: ahora })
        .eq("id", id);
      if (proyectoError) return NextResponse.json({ error: proyectoError.message }, { status: 500 });
    } else if (siguiente.estado === "bloqueada") {
      const [{ error: desbloqueoError }, { error: proyectoError }] = await Promise.all([
        sb.from("proyecto_etapas").update({ estado: "pendiente", updated_at: ahora }).eq("id", siguiente.id),
        sb.from("proyectos").update({ etapa_actual: siguienteOrden, updated_at: ahora }).eq("id", id),
      ]);
      if (desbloqueoError || proyectoError) {
        return NextResponse.json(
          { error: desbloqueoError?.message ?? proyectoError?.message ?? "No se pudo desbloquear la etapa" },
          { status: 500 }
        );
      }
    }
  }

  try {
    await notifyAdmin(proyecto?.titulo ?? "", etapa.nombre, estado, revisorNombre);
  } catch (error) {
    console.error("[notif proyecto bloque status] fallo:", error);
  }
  return NextResponse.json({ ok: true, estado_etapa: estadoEtapa });
}
