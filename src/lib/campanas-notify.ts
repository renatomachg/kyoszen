/* Notificaciones por correo del módulo de campañas (solo servidor).
   Mismo transporte SMTP (IONOS) y mismo tono que el revisor de redes. */

import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import type { ModoCampana } from "@/lib/campanas";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_EMAIL = "renatomachg@gmail.com";

async function getTransport() {
  const { data } = await sb
    .from("site_config")
    .select("key,value")
    .in("key", ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from"]);
  const m: Record<string, string> = {};
  for (const r of data ?? []) m[r.key] = r.value;
  if (!m.smtp_host || !m.smtp_user || !m.smtp_pass) return null;
  const port = parseInt(m.smtp_port ?? "465");
  return {
    transport: nodemailer.createTransport({
      host: m.smtp_host,
      port,
      secure: port === 465,
      auth: { user: m.smtp_user, pass: m.smtp_pass },
    }),
    from: { name: "Kyoszen", address: m.smtp_from || m.smtp_user },
  };
}

/** El cliente aprobó, pidió cambios o comentó un anuncio → avisar al admin. */
export async function notificarAdminAnuncio(
  puesto: string,
  campana: string,
  estado: string,
  revisor: string,
  comentario?: string
) {
  try {
    const t = await getTransport();
    if (!t) return;
    const label =
      estado === "aprobado" ? "✅ Aprobado"
      : estado === "comentario" ? "💬 Nuevo comentario"
      : "🔴 Cambios solicitados";
    const cuerpo =
      estado === "comentario"
        ? `${revisor} dejó un comentario en el anuncio "${puesto}" de la campaña "${campana}".`
        : `${revisor} marcó el anuncio "${puesto}" de la campaña "${campana}" como: ${label}.`;
    await t.transport.sendMail({
      from: t.from,
      to: ADMIN_EMAIL,
      subject: `${label} — Anuncio "${puesto}" · ${campana}`,
      text:
        cuerpo +
        (comentario ? `\n\nComentario:\n"${comentario}"` : "") +
        `\n\nRevisa en: https://kyoszen.com/admin/campanas`,
    });
  } catch {
    /* noop — el correo nunca rompe el flujo */
  }
}

/** El admin corrigió un anuncio → avisar a los revisores activos. */
export async function notificarRevisoresAnuncio(puesto: string, campana: string) {
  try {
    const { data: revisores } = await sb
      .from("social_reviewers")
      .select("email, nombre")
      .eq("activo", true);
    if (!revisores || revisores.length === 0) return;

    const t = await getTransport();
    if (!t) return;

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head><body style="margin:0;padding:0;background:#ffffff;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:32px 16px"><tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;border:1.5px solid #E2E8F0;border-radius:18px;overflow:hidden">
  <tr><td style="background:#0D55BE;padding:22px 28px;text-align:center">
    <p style="margin:0;font-size:30px">✅</p>
    <h1 style="margin:8px 0 0;color:#fff;font-size:18px;font-weight:900">¡Ya hicimos los cambios!</h1>
  </td></tr>
  <tr><td style="padding:26px 30px;background:#fff">
    <p style="margin:0 0 14px;font-size:14px;color:#1E293B;line-height:1.6">Hola, aplicamos los cambios que pediste en el anuncio:</p>
    <p style="margin:0 0 6px;font-size:15px;font-weight:800;color:#0D55BE;background:#F0F4FF;border-radius:10px;padding:12px 16px">${puesto}</p>
    <p style="margin:0 0 18px;font-size:12.5px;color:#94A3B8">Campaña: ${campana}</p>
    <p style="margin:0 0 22px;font-size:13.5px;color:#475569;line-height:1.6">Ya está listo para que lo revises de nuevo. Entra y dinos si lo apruebas o si necesitas otro ajuste.</p>
    <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
      <a href="https://kyoszen.com/revisor?tab=campanas" style="display:inline-block;background:#0D55BE;color:#fff;text-decoration:none;padding:14px 38px;border-radius:50px;font-weight:900;font-size:14px">Revisar ahora →</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background:#0D1B4B;padding:14px 28px;text-align:center">
    <p style="margin:0;font-size:11px;color:rgba(255,255,255,.4)">Kyoszen · Revisor de Contenido</p>
  </td></tr>
</table></td></tr></table></body></html>`;

    await Promise.all(
      revisores.map(r =>
        t.transport.sendMail({
          from: t.from,
          to: r.email,
          subject: "✅ Ya corregimos tu anuncio · Kyoszen",
          html,
        })
      )
    );
  } catch {
    /* noop */
  }
}

/** El admin publicó una campaña nueva → avisar a los revisores activos.
 *  Si la campaña ya está corriendo (`en_curso`) el correo informa, no pide aprobación. */
export async function notificarRevisoresCampanaPublicada(
  campana: string,
  numAnuncios: number,
  modo: ModoCampana = "revision"
) {
  try {
    const { data: revisores } = await sb
      .from("social_reviewers")
      .select("email, nombre")
      .eq("activo", true);
    if (!revisores || revisores.length === 0) return;

    const t = await getTransport();
    if (!t) return;

    const enCurso = modo === "en_curso";
    const titulo = enCurso ? "Tu campaña ya está al aire" : "Tienes una campaña por revisar";
    const entrada = enCurso
      ? "Ya está corriendo en Facebook la campaña:"
      : "Ya está lista para tu revisión la campaña:";
    const detalle = enCurso
      ? `Entra a ver a quién le está llegando, cuánto se invierte, el recorrido del candidato y los ${numAnuncios} anuncio${numAnuncios === 1 ? "" : "s"} tal como se ven publicados. No tienes que aprobar nada: si algo te salta, déjanos un comentario.`
      : `Vas a ver a quién le llega, cuánto se invierte, el recorrido completo del candidato y ${numAnuncios} anuncio${numAnuncios === 1 ? "" : "s"} para aprobar uno por uno.`;

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head><body style="margin:0;padding:0;background:#ffffff;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:32px 16px"><tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;border:1.5px solid #E2E8F0;border-radius:18px;overflow:hidden">
  <tr><td style="background:#042E7B;padding:22px 28px;text-align:center">
    <h1 style="margin:0;color:#fff;font-size:18px;font-weight:900">${titulo}</h1>
  </td></tr>
  <tr><td style="padding:26px 30px;background:#fff">
    <p style="margin:0 0 14px;font-size:14px;color:#1E293B;line-height:1.6">${entrada}</p>
    <p style="margin:0 0 18px;font-size:15px;font-weight:800;color:#0D55BE;background:#F0F4FF;border-radius:10px;padding:12px 16px">${campana}</p>
    <p style="margin:0 0 22px;font-size:13.5px;color:#475569;line-height:1.6">${detalle}</p>
    <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
      <a href="https://kyoszen.com/revisor?tab=campanas" style="display:inline-block;background:#0D55BE;color:#fff;text-decoration:none;padding:14px 38px;border-radius:50px;font-weight:900;font-size:14px">Ver la campaña →</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background:#0D1B4B;padding:14px 28px;text-align:center">
    <p style="margin:0;font-size:11px;color:rgba(255,255,255,.4)">Kyoszen · Revisor de Contenido</p>
  </td></tr>
</table></td></tr></table></body></html>`;

    await Promise.all(
      revisores.map(r =>
        t.transport.sendMail({
          from: t.from,
          to: r.email,
          subject: enCurso
            ? `Campaña al aire · ${campana}`
            : `Campaña lista para revisión · ${campana}`,
          html,
        })
      )
    );
  } catch {
    /* noop */
  }
}
