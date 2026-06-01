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

async function notifyAdmin(postId: string, estado: string, revisorNombre: string) {
  try {
    const smtp = await getSmtp();
    if (!smtp.smtp_host) return;
    const t = nodemailer.createTransport({
      host: smtp.smtp_host,
      port: parseInt(smtp.smtp_port ?? "465"),
      secure: parseInt(smtp.smtp_port ?? "465") === 465,
      auth: { user: smtp.smtp_user, pass: smtp.smtp_pass },
    });
    const estadoLabel = estado === "aprobado" ? "✅ Aprobado" : "🔴 Cambios solicitados";
    await t.sendMail({
      from: `"Kyoszen Revisor" <${smtp.smtp_from ?? smtp.smtp_user}>`,
      to: "renatomachg@gmail.com",
      subject: `${estadoLabel} — Post #${postId} por ${revisorNombre}`,
      text: `${revisorNombre} marcó el post #${postId} como: ${estadoLabel}.\n\nRevisa en: https://kyoszen.com/admin/redes-sociales`,
    });
  } catch { /* noop */ }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { estado, revisor_nombre } = await req.json();

  if (!["aprobado", "cambios", "pendiente"].includes(estado)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const { error } = await sb
    .from("social_posts")
    .update({ estado, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (estado !== "pendiente") {
    notifyAdmin(id, estado, revisor_nombre ?? "Cliente");
  }

  return NextResponse.json({ ok: true });
}
