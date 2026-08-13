import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SinPermiso, exigirSeccion } from "@/lib/admin-auth";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET — detalle completo: todas las versiones + comentarios
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await exigirSeccion(req, "redes-sociales");
    const { id } = await params;

    const [{ data: post }, { data: versions }, { data: comments }] = await Promise.all([
      sb.from("social_posts").select("*").eq("id", id).single(),
      sb.from("social_post_versions").select("*").eq("post_id", id).order("version_num", { ascending: false }),
      sb.from("social_comments").select("*").eq("post_id", id).order("created_at"),
    ]);

    return NextResponse.json({ post, versions: versions ?? [], comments: comments ?? [] });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// PATCH — actualizar estado y/o visibilidad (publicado)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await exigirSeccion(req, "redes-sociales");
    const { id } = await params;
    const body = await req.json();

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.estado === "string") patch.estado = body.estado;
    if (typeof body.publicado === "boolean") patch.publicado = body.publicado;
    if (typeof body.fase === "string") patch.fase = body.fase; // 'guion' | 'video'

    // video_url va en la version activa (subir video del TikTok)
    if (typeof body.video_url === "string") {
      const { error: vErr } = await sb
        .from("social_post_versions")
        .update({ video_url: body.video_url })
        .eq("post_id", id)
        .eq("es_activa", true);
      if (vErr) return NextResponse.json({ error: vErr.message }, { status: 500 });
    }

    const { error } = await sb.from("social_posts").update(patch).eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await exigirSeccion(req, "redes-sociales");
    const { id } = await params;
    const { error } = await sb.from("social_posts").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
