import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import type { RolAutor } from "@/lib/proyectos";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type EtapaRelacion = {
  proyecto_id: string;
  proyectos: { publicado: boolean } | { publicado: boolean }[] | null;
} | {
  proyecto_id: string;
  proyectos: { publicado: boolean } | { publicado: boolean }[] | null;
}[] | null;
type BloqueRelacion = { id: string; proyecto_etapas: EtapaRelacion };

function tomarUno<T>(relacion: T | T[] | null) {
  return Array.isArray(relacion) ? relacion[0] : relacion;
}

async function validarBloque(proyectoId: string, bloqueId: string) {
  const { data, error } = await sb
    .from("proyecto_bloques")
    .select("id, proyecto_etapas!inner(proyecto_id, proyectos!inner(publicado))")
    .eq("id", bloqueId)
    .eq("es_activa", true)
    .eq("visible_cliente", true)
    .eq("proyecto_etapas.proyecto_id", proyectoId)
    .eq("proyecto_etapas.proyectos.publicado", true)
    .maybeSingle();
  if (error) return { error };
  const bloque = data as BloqueRelacion | null;
  const etapa = bloque ? tomarUno(bloque.proyecto_etapas) : null;
  const proyecto = etapa ? tomarUno(etapa.proyectos) : null;
  return {
    pertenece: Boolean(
      bloque && etapa?.proyecto_id === proyectoId && proyecto?.publicado === true
    ),
  };
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

/** De qué escena habla el comentario, en palabras y no en identificadores. */
async function ubicarBloque(bloqueId: string) {
  const { data } = await sb
    .from("proyecto_bloques")
    .select("escena_id, proyecto_etapas!inner(nombre, tipo, proyectos!inner(titulo))")
    .eq("id", bloqueId)
    .maybeSingle();

  const etapa = data
    ? tomarUno(data.proyecto_etapas as unknown as { nombre: string; tipo: string; proyectos: unknown })
    : null;
  const proyecto = etapa ? tomarUno(etapa.proyectos as { titulo: string } | { titulo: string }[] | null) : null;

  let escena: string | null = null;
  if (data?.escena_id) {
    const { data: fila } = await sb
      .from("proyecto_escenas")
      .select("numero, titulo")
      .eq("id", data.escena_id)
      .maybeSingle();
    if (fila) escena = `Escena ${fila.numero} · ${fila.titulo}`;
  }

  return {
    proyecto: proyecto?.titulo ?? "un proyecto",
    etapa: etapa?.nombre ?? "una etapa",
    escena: escena ?? (etapa?.tipo === "video" ? "el video completo" : "el entregable de la etapa"),
  };
}

async function notifyAdmin(bloqueId: string, autorNombre: string, contenido: string) {
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

    const donde = await ubicarBloque(bloqueId);
    await transport.sendMail({
      from: `"Kyoszen Revisor" <${smtp.smtp_from ?? smtp.smtp_user}>`,
      to: "renatomachg@gmail.com",
      subject: `💬 ${autorNombre} comentó en ${donde.escena} · ${donde.etapa} · ${donde.proyecto}`,
      html:
        `<p><strong>${autorNombre}</strong> dejó un comentario:</p>` +
        `<blockquote style="margin:0 0 16px;padding:10px 14px;border-left:3px solid #1883FF;background:#F0F4FF">${contenido}</blockquote>` +
        `<p style="margin:0 0 4px"><strong>Proyecto:</strong> ${donde.proyecto}</p>` +
        `<p style="margin:0 0 4px"><strong>Etapa:</strong> ${donde.etapa}</p>` +
        `<p style="margin:0 0 16px"><strong>${donde.escena}</strong></p>` +
        `<p>Ábrela en el panel, en esa etapa, y contéstale ahí mismo para que quede el hilo completo.</p>` +
        `<p><a href="https://kyoszen.com/admin/proyectos">Ir al proyecto</a></p>`,
    });
  } catch (error) {
    console.error("[notif proyecto bloque comments] error al enviar:", error);
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; bloqueId: string }> }
) {
  const { id, bloqueId } = await params;
  const validacion = await validarBloque(id, bloqueId);
  if (validacion.error) {
    return NextResponse.json({ error: validacion.error.message }, { status: 500 });
  }
  if (!validacion.pertenece) {
    return NextResponse.json({ error: "Etapa/bloque no encontrado" }, { status: 404 });
  }

  const { data, error } = await sb
    .from("proyecto_comentarios")
    .select("*")
    .eq("bloque_id", bloqueId)
    .order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(
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

  const autorNombre = typeof body.autor_nombre === "string" ? body.autor_nombre.trim() : "";
  const autorRol = body.autor_rol;
  const contenido = typeof body.contenido === "string" ? body.contenido.trim() : "";
  if (!autorNombre || (autorRol !== "admin" && autorRol !== "cliente") || !contenido) {
    return NextResponse.json({ error: "Comentario inválido" }, { status: 400 });
  }

  const validacion = await validarBloque(id, bloqueId);
  if (validacion.error) {
    return NextResponse.json({ error: validacion.error.message }, { status: 500 });
  }
  if (!validacion.pertenece) {
    return NextResponse.json({ error: "Etapa/bloque no encontrado" }, { status: 404 });
  }

  const { data, error } = await sb
    .from("proyecto_comentarios")
    .insert({
      bloque_id: bloqueId,
      autor_nombre: autorNombre,
      autor_rol: autorRol as RolAutor,
      contenido,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (autorRol === "cliente") {
    try {
      await notifyAdmin(bloqueId, autorNombre, contenido);
    } catch (error) {
      console.error("[notif proyecto bloque comments] fallo:", error);
    }
  }
  return NextResponse.json(data, { status: 201 });
}
