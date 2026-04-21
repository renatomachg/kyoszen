import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const nombre = formData.get("nombre") as string;
    const whatsapp = formData.get("whatsapp") as string;
    const correo = formData.get("correo") as string;
    const experiencia = formData.get("experiencia") as string;
    const ubicacion = formData.get("ubicacion") as string;
    const documentacion = formData.get("documentacion") as string;
    const vacante = formData.get("vacante") as string;
    const cv = formData.get("cv") as File | null;

    if (!nombre || !whatsapp || !correo || !experiencia || !ubicacion || !documentacion) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: (Number(process.env.SMTP_PORT) || 465) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const attachments: { filename: string; content: Buffer }[] = [];
    if (cv && cv.size > 0) {
      const buffer = Buffer.from(await cv.arrayBuffer());
      attachments.push({ filename: cv.name, content: buffer });
    }

    await transporter.sendMail({
      from: `"Kyoszen Web" <${process.env.SMTP_USER}>`,
      to: "rsalazar@kyoszen.com",
      subject: `Nueva aplicacion: ${vacante} — ${nombre}`,
      html: `
        <h2>Nueva aplicacion de empleo</h2>
        <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
          <tr><td style="padding:6px 12px;font-weight:bold;">Vacante:</td><td style="padding:6px 12px;">${vacante}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;">Nombre:</td><td style="padding:6px 12px;">${nombre}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;">WhatsApp:</td><td style="padding:6px 12px;">${whatsapp}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;">Correo:</td><td style="padding:6px 12px;">${correo}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;">Experiencia:</td><td style="padding:6px 12px;">${experiencia}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;">Ubicacion/traslado:</td><td style="padding:6px 12px;">${ubicacion}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;">Documentacion:</td><td style="padding:6px 12px;">${documentacion}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;">CV adjunto:</td><td style="padding:6px 12px;">${cv && cv.size > 0 ? "Si" : "No"}</td></tr>
        </table>
      `,
      attachments,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error enviando aplicacion:", err);
    return NextResponse.json({ error: "Error al enviar la solicitud" }, { status: 500 });
  }
}
