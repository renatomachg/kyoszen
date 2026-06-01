import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

  return NextResponse.json(newVersion, { status: 201 });
}
