import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Cache email destinations from Supabase (60s TTL)
let _contactEmail: string | null = null;
let _coursesEmail: string | null = null;
let _emailCacheExpiry = 0;

async function getDestinationEmails() {
  if (Date.now() < _emailCacheExpiry) {
    return { contactEmail: _contactEmail, coursesEmail: _coursesEmail };
  }
  try {
    const { data } = await supabaseAdmin
      .from("site_config")
      .select("key, value")
      .in("key", ["contact_email", "courses_email"]);
    if (data?.length) {
      const map = Object.fromEntries(data.map((r) => [r.key, r.value]));
      _contactEmail = map.contact_email ?? null;
      _coursesEmail = map.courses_email ?? null;
      _emailCacheExpiry = Date.now() + 60_000;
    }
  } catch { /* fallback to env vars */ }
  return { contactEmail: _contactEmail, coursesEmail: _coursesEmail };
}

export async function POST(req: NextRequest) {
  try {
    const { nombre, correo, asunto, mensaje } = await req.json();

    if (!nombre || !correo || !asunto || !mensaje) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const port = Number(process.env.SMTP_PORT) || 587;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      requireTLS: port === 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: { rejectUnauthorized: false },
    });

    const { contactEmail, coursesEmail } = await getDestinationEmails();

    await transporter.sendMail({
      from: `"Kyoszen Web" <${process.env.SMTP_USER}>`,
      to: asunto.startsWith("Informes:")
        ? (coursesEmail ?? process.env.COURSES_EMAIL ?? "info@kyoszen.com")
        : (contactEmail ?? process.env.CONTACT_EMAIL ?? "rsalazar@kyoszen.com.mx"),
      replyTo: correo,
      subject: `Contacto web: ${asunto} — ${nombre}`,
      html: `
        <h2>Nuevo mensaje de contacto — Kyoszen</h2>
        <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
          <tr><td style="padding:6px 12px;font-weight:bold;">Nombre:</td><td style="padding:6px 12px;">${nombre}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;">Correo:</td><td style="padding:6px 12px;">${correo}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;">Asunto:</td><td style="padding:6px 12px;">${asunto}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;vertical-align:top;">Mensaje:</td><td style="padding:6px 12px;white-space:pre-line;">${mensaje}</td></tr>
        </table>
      `,
    });

    await supabaseAdmin.from("contactos").insert({ nombre, correo, asunto, mensaje });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error enviando contacto:", err);
    return NextResponse.json({ error: "Error al enviar el mensaje" }, { status: 500 });
  }
}
