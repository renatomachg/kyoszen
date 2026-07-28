import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import type { EstadoBloque } from "@/lib/proyectos";

export const runtime = "nodejs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function notificarAdmin(
  espacio: string,
  archivo: string,
  estado: EstadoBloque,
  revisor: string
) {
  try {
    const { data } = await sb
      .from("site_config")
      .select("key,value")
      .in("key", ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from"]);
    const smtp = Object.fromEntries((data ?? []).map(({ key, value }) => [key, value])) as Record<string, string>;
    if (!smtp.smtp_host) return;
    const port = Number.parseInt(smtp.smtp_port ?? "465", 10);
    const transport = nodemailer.createTransport({
      host: smtp.smtp_host,
      port,
      secure: port === 465,
      auth: { user: smtp.smtp_user, pass: smtp.smtp_pass },
    });
    const etiqueta = estado === "aprobado" ? "✅ Archivo aprobado" : "🔴 Cambios solicitados";
    await transport.sendMail({
      from: { name: "Kyoszen Revisor", address: smtp.smtp_from ?? smtp.smtp_user },
      to: "renatomachg@gmail.com",
      subject: `${etiqueta} · ${archivo}`,
      text: `${revisor} actualizó “${archivo}” en ${espacio}: ${etiqueta}.\n\nRevisa en: https://kyoszen.com/admin/proyectos`,
    });
  } catch {
    // La actualización de estado no depende del correo.
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; archivoId: string }> }
) {
  const { id, archivoId } = await params;
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
  const revisor = typeof body.autor_nombre === "string" && body.autor_nombre.trim()
    ? body.autor_nombre.trim()
    : "Cliente";

  const { data: archivo, error: lecturaError } = await sb
    .from("espacio_archivos")
    .select("id, nombre, proyecto_espacios!inner(id, nombre, publicado)")
    .eq("id", archivoId)
    .eq("espacio_id", id)
    .eq("proyecto_espacios.publicado", true)
    .maybeSingle();
  if (lecturaError) {
    return NextResponse.json({ error: lecturaError.message }, { status: 500 });
  }
  if (!archivo) return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });

  const { data: actualizado, error } = await sb
    .from("espacio_archivos")
    .update({ estado, updated_at: new Date().toISOString() })
    .eq("id", archivoId)
    .eq("espacio_id", id)
    .select("id")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!actualizado) return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });

  const relacion = Array.isArray(archivo.proyecto_espacios)
    ? archivo.proyecto_espacios[0]
    : archivo.proyecto_espacios;
  void notificarAdmin(relacion?.nombre ?? "Artes", archivo.nombre, estado, revisor);
  return NextResponse.json({ ok: true });
}
