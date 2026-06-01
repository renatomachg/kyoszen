import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data } = await sb.from("social_page_config").select("*").order("red_social");
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { red_social, nombre_pagina, avatar_url } = await req.json();
  const { data, error } = await sb
    .from("social_page_config")
    .upsert({ red_social, nombre_pagina, avatar_url, updated_at: new Date().toISOString() }, { onConflict: "red_social" })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
