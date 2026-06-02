import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// El cliente solo ve informes PUBLICADOS, el más reciente primero
export async function GET() {
  const { data, error } = await sb
    .from("social_informes")
    .select("periodo, periodo_label, desde, hasta, metricas, resumen, decisiones, propuestas, updated_at")
    .eq("estado", "publicado")
    .order("periodo", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
