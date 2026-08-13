import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SinPermiso, exigirSeccion } from "@/lib/admin-auth";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    await exigirSeccion(req, "redes-sociales");
    const { data } = await sb.from("social_page_config").select("*").order("red_social");
    return NextResponse.json(data ?? []);
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await exigirSeccion(req, "redes-sociales");
    const { red_social, nombre_pagina, avatar_url } = await req.json();
    const { data, error } = await sb
      .from("social_page_config")
      .upsert({ red_social, nombre_pagina, avatar_url, updated_at: new Date().toISOString() }, { onConflict: "red_social" })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
