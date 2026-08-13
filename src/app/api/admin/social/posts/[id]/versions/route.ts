import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { SinPermiso, exigirSeccion } from "@/lib/admin-auth";

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

// PUT — editar la version activa EN SU LUGAR (texto/imagenes/metadatos)
// No crea version nueva, no cambia el estado y NO notifica al cliente.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await exigirSeccion(req, "redes-sociales");
    const { id } = await params;
    const body = await req.json();

    // 1) actualizar la version activa (texto + imagenes + storyboard/propuesta)
    const vPatch: Record<string, unknown> = {};
    if (typeof body.caption === "string") vPatch.caption = body.caption;
    if (Array.isArray(body.imagenes)) vPatch.imagenes = body.imagenes;
    if (body.storyboard !== undefined) vPatch.storyboard = body.storyboard;
    if (Object.keys(vPatch).length > 0) {
      const { error: vErr } = await sb
        .from("social_post_versions")
        .update(vPatch)
        .eq("post_id", id)
        .eq("es_activa", true);
      if (vErr) return NextResponse.json({ error: vErr.message }, { status: 500 });
    }

    // 2) actualizar metadatos del post (titulo, red, fecha)
    const pPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.titulo_interno === "string") pPatch.titulo_interno = body.titulo_interno;
    if (typeof body.red_social === "string") pPatch.red_social = body.red_social;
    if (typeof body.fecha_programada === "string" && body.fecha_programada) {
      const hoy = new Date().toISOString().slice(0, 10);
      // permite conservar una fecha ya pasada, pero no MOVER a una fecha pasada
      const { data: actual } = await sb.from("social_posts").select("fecha_programada").eq("id", id).single();
      if (body.fecha_programada < hoy && body.fecha_programada !== actual?.fecha_programada) {
        return NextResponse.json({ error: "No se puede mover la publicacion a una fecha pasada." }, { status: 400 });
      }
      pPatch.fecha_programada = body.fecha_programada;
    }
    const { error: pErr } = await sb.from("social_posts").update(pPatch).eq("id", id);
    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST — subir nueva versión corregida
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await exigirSeccion(req, "redes-sociales");
    const { id } = await params;
    const { caption, imagenes, storyboard, titulo_interno } = await req.json();

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

    // Insertar nueva versión activa (incluye storyboard/propuesta si viene)
    const { data: newVersion, error } = await sb
      .from("social_post_versions")
      .insert({ post_id: id, version_num: nextNum, caption, imagenes: imagenes ?? [], storyboard: storyboard ?? null, es_activa: true })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Volver estado a pendiente (y actualizar titulo si viene)
    await sb.from("social_posts")
      .update({ estado: "pendiente", updated_at: new Date().toISOString(), ...(typeof titulo_interno === "string" && titulo_interno ? { titulo_interno } : {}) })
      .eq("id", id);

    // Avisar a los revisores que ya está corregida (fire-and-forget)
    const { data: post } = await sb.from("social_posts").select("titulo_interno").eq("id", id).single();
    notificarRevisores(post?.titulo_interno ?? "");

    return NextResponse.json(newVersion, { status: 201 });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
