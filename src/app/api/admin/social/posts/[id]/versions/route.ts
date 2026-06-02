import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getSmtp() {
  const { data } = await sb.from("site_config").select("key,value").in("key", ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from"]);
  const m: Record<string, string> = {};
  for (const r of data ?? []) m[r.key] = r.value;
  return m;
}

// Notifica a los revisores activos que la publicación fue corregida
async function notificarRevisores(titulo: string) {
  try {
    const { data: revisores } = await sb
      .from("social_reviewers")
      .select("email, nombre")
      .eq("activo", true);
    if (!revisores || revisores.length === 0) return;

    const smtp = await getSmtp();
    if (!smtp.smtp_host || !smtp.smtp_user || !smtp.smtp_pass) return;

    const t = nodemailer.createTransport({
      host: smtp.smtp_host,
      port: parseInt(smtp.smtp_port ?? "465"),
      secure: parseInt(smtp.smtp_port ?? "465") === 465,
      auth: { user: smtp.smtp_user, pass: smtp.smtp_pass },
    });

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head><body style="margin:0;padding:0;background:#ffffff;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:32px 16px"><tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;border:1.5px solid #E2E8F0;border-radius:18px;overflow:hidden">
  <tr><td style="background:#0D55BE;padding:22px 28px;text-align:center">
    <p style="margin:0;font-size:30px">✅</p>
    <h1 style="margin:8px 0 0;color:#fff;font-size:18px;font-weight:900">¡Ya hicimos los cambios!</h1>
  </td></tr>
  <tr><td style="padding:26px 30px;background:#fff">
    <p style="margin:0 0 14px;font-size:14px;color:#1E293B;line-height:1.6">Hola, aplicamos los cambios que pediste en la publicación:</p>
    <p style="margin:0 0 18px;font-size:15px;font-weight:800;color:#0D55BE;background:#F0F4FF;border-radius:10px;padding:12px 16px">${titulo || "Publicación"}</p>
    <p style="margin:0 0 22px;font-size:13.5px;color:#475569;line-height:1.6">Ya está lista para que la revises de nuevo. Entra y dinos si la apruebas o si necesitas otro ajuste.</p>
    <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
      <a href="https://kyoszen.com/revisor" style="display:inline-block;background:#0D55BE;color:#fff;text-decoration:none;padding:14px 38px;border-radius:50px;font-weight:900;font-size:14px">Revisar ahora →</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background:#0D1B4B;padding:14px 28px;text-align:center">
    <p style="margin:0;font-size:11px;color:rgba(255,255,255,.4)">Kyoszen · Revisor de Contenido</p>
  </td></tr>
</table></td></tr></table></body></html>`;

    await Promise.all(
      revisores.map((r) =>
        t.sendMail({
          from: { name: "Kyoszen", address: smtp.smtp_from || smtp.smtp_user },
          to: r.email,
          subject: "✅ Ya corregimos tu publicación · Kyoszen",
          html,
        })
      )
    );
  } catch {
    /* noop — no romper el flujo si falla el correo */
  }
}

// POST — subir nueva versión corregida
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { caption, imagenes } = await req.json();

  // Desactivar versión actual
  await sb.from("social_post_versions").update({ es_activa: false }).eq("post_id", id).eq("es_activa", true);

  // Obtener número de última versión
  const { data: last } = await sb
    .from("social_post_versions")
    .select("version_num")
    .eq("post_id", id)
    .order("version_num", { ascending: false })
    .limit(1)
    .single();

  const nextNum = (last?.version_num ?? 0) + 1;

  // Insertar nueva versión activa
  const { data: newVersion, error } = await sb
    .from("social_post_versions")
    .insert({ post_id: id, version_num: nextNum, caption, imagenes: imagenes ?? [], es_activa: true })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Volver estado a pendiente
  await sb.from("social_posts").update({ estado: "pendiente", updated_at: new Date().toISOString() }).eq("id", id);

  // Avisar a los revisores que ya está corregida (fire-and-forget)
  const { data: post } = await sb.from("social_posts").select("titulo_interno").eq("id", id).single();
  notificarRevisores(post?.titulo_interno ?? "");

  return NextResponse.json(newVersion, { status: 201 });
}
