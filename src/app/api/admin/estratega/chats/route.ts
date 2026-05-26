import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/estratega/chats — lista todos los chats ordenados por fecha desc
export async function GET() {
  const { data, error } = await sb
    .from("estratega_chats")
    .select("id, title, messages, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/admin/estratega/chats — crea o actualiza un chat (upsert)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id, title, messages } = body;

  if (!id || !title) {
    return NextResponse.json({ error: "id y title son requeridos" }, { status: 400 });
  }

  const { data, error } = await sb
    .from("estratega_chats")
    .upsert({ id, title, messages: messages ?? [], updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
