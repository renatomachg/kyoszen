import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET — detalle completo: todas las versiones + comentarios
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [{ data: post }, { data: versions }, { data: comments }] = await Promise.all([
    sb.from("social_posts").select("*").eq("id", id).single(),
    sb.from("social_post_versions").select("*").eq("post_id", id).order("version_num", { ascending: false }),
    sb.from("social_comments").select("*").eq("post_id", id).order("created_at"),
  ]);

  return NextResponse.json({ post, versions: versions ?? [], comments: comments ?? [] });
}

// PATCH — actualizar estado
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { estado } = await req.json();

  const { error } = await sb
    .from("social_posts")
    .update({ estado, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await sb.from("social_posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
