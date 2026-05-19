import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { clearSmtpCache } from "@/lib/smtp-config";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/* ── GET: leer config SMTP actual (pass enmascarado) ── */
export async function GET() {
  const { data } = await supabaseAdmin
    .from("site_config")
    .select("key, value")
    .in("key", ["smtp_host", "smtp_port", "smtp_user", "smtp_pass"]);

  const map: Record<string, string> = {};
  (data ?? []).forEach((r) => { map[r.key] = r.value; });

  return NextResponse.json({
    host: map.smtp_host ?? process.env.SMTP_HOST ?? "",
    port: map.smtp_port ?? process.env.SMTP_PORT ?? "587",
    user: map.smtp_user ?? process.env.SMTP_USER ?? "",
    // Nunca devolver la contraseña real — solo indicar si existe
    passSet: !!(map.smtp_pass ?? process.env.SMTP_PASS),
  });
}

/* ── POST: guardar o probar SMTP ── */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, host, port, user, pass } = body;

  if (!host || !user) {
    return NextResponse.json({ error: "Host y usuario son requeridos" }, { status: 400 });
  }

  const portNum = Number(port) || 587;

  /* ── PROBAR conexion ── */
  if (action === "test") {
    if (!pass && !(await hasStoredPass())) {
      return NextResponse.json({ error: "Ingresa la contrasena para probar" }, { status: 400 });
    }

    const password = pass || await getStoredPass();
    const transporter = nodemailer.createTransport({
      host,
      port: portNum,
      secure: portNum === 465,
      requireTLS: portNum === 587,
      auth: { user, pass: password },
      tls: { rejectUnauthorized: false },
    });

    try {
      await transporter.verify();
      // Enviar correo de prueba
      await transporter.sendMail({
        from: `"Kyoszen Panel" <${user}>`,
        to: user,
        subject: "Prueba de conexion SMTP — Kyoszen",
        html: `<p>La configuracion SMTP esta funcionando correctamente.</p><p>Servidor: <strong>${host}:${portNum}</strong><br>Usuario: <strong>${user}</strong></p>`,
      });
      return NextResponse.json({ ok: true, message: "Conexion exitosa. Se envio un correo de prueba a " + user });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      return NextResponse.json({ error: "Error de conexion: " + message }, { status: 400 });
    }
  }

  /* ── GUARDAR config ── */
  const rows: { key: string; value: string; updated_at: string }[] = [
    { key: "smtp_host", value: host, updated_at: new Date().toISOString() },
    { key: "smtp_port", value: String(portNum), updated_at: new Date().toISOString() },
    { key: "smtp_user", value: user, updated_at: new Date().toISOString() },
  ];

  // Solo actualizar la contraseña si se proporcionó una nueva
  if (pass) {
    rows.push({ key: "smtp_pass", value: pass, updated_at: new Date().toISOString() });
  }

  const { error } = await supabaseAdmin
    .from("site_config")
    .upsert(rows, { onConflict: "key" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Limpiar cache para que los siguientes correos usen la nueva config
  clearSmtpCache();

  return NextResponse.json({ ok: true });
}

async function hasStoredPass(): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("site_config").select("value").eq("key", "smtp_pass").single();
  return !!(data?.value);
}

async function getStoredPass(): Promise<string> {
  const { data } = await supabaseAdmin
    .from("site_config").select("value").eq("key", "smtp_pass").single();
  return data?.value ?? process.env.SMTP_PASS ?? "";
}
