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
    await transport.sendMail({
      from: `"Kyoszen Revisor" <${smtp.smtp_from ?? smtp.smtp_user}>`,
      to: "renatomachg@gmail.com",
      subject: `💬 Nuevo comentario en un proyecto · ${autorNombre}`,
      text: `${autorNombre} comentó en el bloque ${bloqueId}:\n\n"${contenido}"\n\nRevisa en: https://kyoszen.com/admin/proyectos`,
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
