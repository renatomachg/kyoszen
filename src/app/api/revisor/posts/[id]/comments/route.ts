import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getSmtp() {
  const { data } = await sb.from("site_config").select("key,value").in("key", ["smtp_host","smtp_port","smtp_user","smtp_pass","smtp_from"]);
  const m: Record<string, string> = {};
  for (const r of data ?? []) m[r.key] = r.value;
  return m;
}

async function notifyComment(postId: string, autorNombre: string, contenido: string) {
  try {
    const smtp = await getSmtp();
    if (!smtp.smtp_host) return;
    const t = nodemailer.createTransport({
      host: smtp.smtp_host,
      port: parseInt(smtp.smtp_port ?? "465"),
      secure: parseInt(smtp.smtp_port ?? "465") === 465,
      auth: { user: smtp.smtp_user, pass: smtp.smtp_pass },
    });
    await t.sendMail({
      from: `"Kyoszen Revisor" <${smtp.smtp_from ?? smtp.smtp_user}>`,
      to: "renatomachg@gmail.com",
      subject: `💬 Nuevo comentario en Post #${postId} — ${autorNombre}`,
      text: `${autorNombre} comentó en el post #${postId}:\n\n"${contenido}"\n\nRevisa en: https://kyoszen.com/admin/redes-sociales`,
    });
  } catch { /* noop */ }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data, error } = await sb
    .from("social_comments")
    .select("*")
    .eq("post_id", id)
    .order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { autor_nombre, autor_rol, contenido } = await req.json();

  if (!contenido?.trim()) return NextResponse.json({ error: "Comentario vacío" }, { status: 400 });

  const { data, error } = await sb
    .from("social_comments")
    .insert({ post_id: id, autor_nombre, autor_rol: autor_rol ?? "cliente", contenido })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (autor_rol === "cliente") {
    notifyComment(id, autor_nombre, contenido);
  }

  return NextResponse.json(data, { status: 201 });
}
