import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import type { RolAutor } from "@/lib/proyectos";

export const runtime = "nodejs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function validarArchivo(espacioId: string, archivoId: string) {
  const { data, error } = await sb
    .from("espacio_archivos")
    .select("id, nombre")
    .eq("id", archivoId)
    .eq("espacio_id", espacioId)
    .maybeSingle();
  return { archivo: data, error };
}

async function notificarAdmin(nombre: string, autor: string, contenido: string) {
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
    await transport.sendMail({
      from: { name: "Kyoszen Revisor", address: smtp.smtp_from ?? smtp.smtp_user },
      to: "renatomachg@gmail.com",
      subject: `💬 Nuevo comentario en Artes · ${nombre}`,
      text: `${autor} comentó en “${nombre}”:\n\n${contenido}\n\nRevisa en: https://kyoszen.com/admin/proyectos`,
    });
  } catch {
    // El comentario se conserva aunque falle el correo.
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; archivoId: string }> }
) {
  const { id, archivoId } = await params;
  const { archivo, error: validacionError } = await validarArchivo(id, archivoId);
  if (validacionError) {
    return NextResponse.json({ error: validacionError.message }, { status: 500 });
  }
  if (!archivo) return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });

  const { data, error } = await sb
    .from("espacio_comentarios")
    .select("*")
    .eq("archivo_id", archivoId)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comentarios: data ?? [] });
}

export async function POST(
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

  const contenido = typeof body.contenido === "string" ? body.contenido.trim() : "";
  const autorNombre = typeof body.autor_nombre === "string" && body.autor_nombre.trim()
    ? body.autor_nombre.trim()
    : "Cliente";
  const autorRol: RolAutor = body.autor_rol === "admin" ? "admin" : "cliente";
  if (!contenido) {
    return NextResponse.json({ error: "El comentario no puede estar vacío" }, { status: 400 });
  }

  const { archivo, error: validacionError } = await validarArchivo(id, archivoId);
  if (validacionError) {
    return NextResponse.json({ error: validacionError.message }, { status: 500 });
  }
  if (!archivo) return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });

  const { data, error } = await sb
    .from("espacio_comentarios")
    .insert({
      archivo_id: archivoId,
      autor_nombre: autorNombre,
      autor_rol: autorRol,
      contenido,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (autorRol === "cliente") void notificarAdmin(archivo.nombre, autorNombre, contenido);
  return NextResponse.json(data, { status: 201 });
}
