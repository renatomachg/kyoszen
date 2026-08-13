import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { rollupEtapa, type EstadoBloque } from "@/lib/proyectos";
import { SinPermiso, exigirProyecto } from "@/lib/admin-auth";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getSmtp() {
  const { data } = await sb
    .from("site_config")
    .select("key,value")
    .in("key", ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from"]);
  const config: Record<string, string> = {};
  for (const row of data ?? []) config[row.key] = row.value;
  return config;
}

/** Un solo correo al cliente con todas las escenas que se le liberan. */
async function notificarRevisores(titulo: string, etapa: string, escenas: string[]) {
  try {
    const { data: revisores } = await sb
      .from("social_reviewers")
      .select("email, nombre")
      .eq("activo", true);
    if (!revisores?.length) return;

    const smtp = await getSmtp();
    if (!smtp.smtp_host || !smtp.smtp_user || !smtp.smtp_pass) return;
    const puerto = Number.parseInt(smtp.smtp_port ?? "465", 10);
    const transport = nodemailer.createTransport({
      host: smtp.smtp_host,
      port: puerto,
      secure: puerto === 465,
      auth: { user: smtp.smtp_user, pass: smtp.smtp_pass },
    });

    const lista = escenas.length
      ? `<ul>${escenas.map(e => `<li>${e}</li>`).join("")}</ul>`
      : "";

    await Promise.all(
      revisores.map(revisor => transport.sendMail({
        from: { name: "Kyoszen", address: smtp.smtp_from || smtp.smtp_user },
        to: revisor.email,
        subject: `${etapa} listo para revisión · ${titulo || "Proyecto"}`,
        html:
          `<p>Hola ${revisor.nombre || ""},</p>` +
          `<p>Ya está listo para que lo revises: <strong>${etapa}</strong> de <strong>${titulo || "un proyecto"}</strong>.</p>` +
          (escenas.length === 1
            ? `<p>Es 1 escena:</p>${lista}`
            : `<p>Son ${escenas.length} escenas:</p>${lista}`) +
          `<p>Puedes aprobarlas una por una o pedir cambios en la que quieras.</p>` +
          `<p><a href="https://kyoszen.com/revisor">Revisar ahora</a></p>`,
      }))
    );
  } catch (error) {
    console.error("[notif etapa al cliente] error al enviar:", error);
  }
}

/** POST — libera al cliente todas las entregas internas ya revisadas de una etapa. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; etapaId: string }> }
) {
  try {
    const { id, etapaId } = await params;
    await exigirProyecto(req, id);

    const { data: etapa, error: etapaError } = await sb
      .from("proyecto_etapas")
      .select("id, nombre, proyecto_id, estado, proyectos!inner(titulo, publicado)")
      .eq("id", etapaId)
      .maybeSingle();

    if (etapaError) return NextResponse.json({ error: etapaError.message }, { status: 500 });
    if (!etapa || etapa.proyecto_id !== id) {
      return NextResponse.json({ error: "Etapa no encontrada" }, { status: 404 });
    }

    const proyecto = (Array.isArray(etapa.proyectos) ? etapa.proyectos[0] : etapa.proyectos) as
      | { titulo: string; publicado: boolean }
      | undefined;

    // Los bloques entregados por un colaborador y todavía ocultos al cliente
    const { data: entregados, error: entregadosError } = await sb
      .from("proyecto_bloques")
      .select("id, escena_id")
      .eq("etapa_id", etapaId)
      .eq("es_activa", true)
      .eq("entrega_estado", "entregado");

    if (entregadosError) {
      return NextResponse.json({ error: entregadosError.message }, { status: 500 });
    }
    if (!entregados?.length) {
      return NextResponse.json(
        { error: "No hay entregas pendientes de mandar en esta etapa." },
        { status: 400 }
      );
    }

    const ahora = new Date().toISOString();
    const { error: liberarError } = await sb
      .from("proyecto_bloques")
      .update({ visible_cliente: true, entrega_estado: "enviado", updated_at: ahora })
      .in("id", entregados.map(b => b.id));

    if (liberarError) return NextResponse.json({ error: liberarError.message }, { status: 500 });

    // El estado de la etapa se recalcula con lo que el cliente ya puede ver
    const { data: bloquesEtapa } = await sb
      .from("proyecto_bloques")
      .select("estado")
      .eq("etapa_id", etapaId)
      .eq("es_activa", true)
      .eq("visible_cliente", true);

    if (etapa.estado !== "bloqueada") {
      await sb
        .from("proyecto_etapas")
        .update({
          estado: rollupEtapa((bloquesEtapa ?? []) as { estado: EstadoBloque }[]),
          updated_at: ahora,
        })
        .eq("id", etapaId);
    }

    // Nombres de las escenas para el correo
    const escenaIds = entregados.map(b => b.escena_id).filter((v): v is string => !!v);
    let nombres: string[] = [];
    if (escenaIds.length) {
      const { data: escenas } = await sb
        .from("proyecto_escenas")
        .select("numero, titulo")
        .in("id", escenaIds)
        .order("orden");
      nombres = (escenas ?? []).map(e => `Escena ${e.numero} · ${e.titulo}`);
    }

    if (proyecto?.publicado) {
      await notificarRevisores(proyecto.titulo ?? "", etapa.nombre ?? "", nombres);
    }

    return NextResponse.json({
      ok: true,
      enviados: entregados.length,
      notificado: Boolean(proyecto?.publicado),
    });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
