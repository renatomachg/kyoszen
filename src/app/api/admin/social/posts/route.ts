import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET — listar posts con versión activa y conteo de comentarios
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");

  let query = sb
    .from("social_posts")
    .select(`
      id, red_social, fecha_programada, estado, titulo_interno, created_at, updated_at,
      social_post_versions!inner(id, version_num, caption, imagenes, es_activa, created_at),
      social_comments(id)
    `)
    .eq("social_post_versions.es_activa", true)
    .order("fecha_programada");

  if (desde) query = query.gte("fecha_programada", desde);
  if (hasta) query = query.lte("fecha_programada", hasta);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST — crear nuevo post con primera versión
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { red_social, fecha_programada, titulo_interno, caption, imagenes } = body;

  if (!fecha_programada || !caption) {
    return NextResponse.json({ error: "fecha_programada y caption son requeridos" }, { status: 400 });
  }

  const { data: post, error: postErr } = await sb
    .from("social_posts")
    .insert({ red_social: red_social ?? "facebook", fecha_programada, titulo_interno: titulo_interno ?? "" })
    .select()
    .single();

  if (postErr) return NextResponse.json({ error: postErr.message }, { status: 500 });

  const { error: vErr } = await sb.from("social_post_versions").insert({
    post_id: post.id,
    version_num: 1,
    caption,
    imagenes: imagenes ?? [],
    es_activa: true,
  });

  if (vErr) return NextResponse.json({ error: vErr.message }, { status: 500 });

  return NextResponse.json(post, { status: 201 });
}
