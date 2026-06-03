import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");

  let query = sb
    .from("social_posts")
    .select(`
      id, red_social, fecha_programada, estado, created_at,
      social_post_versions(id, version_num, caption, imagenes, es_activa, created_at),
      social_comments(id, autor_nombre, autor_rol, contenido, created_at)
    `)
    .eq("publicado", true) // el cliente SOLO ve las publicaciones que el admin ya publicó
    .order("fecha_programada");

  if (desde) query = query.gte("fecha_programada", desde);
  if (hasta) query = query.lte("fecha_programada", hasta);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
