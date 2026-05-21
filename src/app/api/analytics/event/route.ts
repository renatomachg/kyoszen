import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { tipo, valor, session_id } = await req.json();
    if (!tipo) return NextResponse.json({ ok: false }, { status: 400 });

    await sb.from("site_eventos").insert({
      tipo,
      valor: valor ?? null,
      session_id: session_id ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
