import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

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

    await transporter.sendMail({
      from: `"Kyoszen Web" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_EMAIL ?? "renatomachg@gmail.com",
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

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error enviando contacto:", err);
    return NextResponse.json({ error: "Error al enviar el mensaje" }, { status: 500 });
  }
}
