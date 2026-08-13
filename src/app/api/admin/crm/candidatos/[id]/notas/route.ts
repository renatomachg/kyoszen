import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { SinPermiso, exigirSeccion } from "@/lib/admin-auth";

export const runtime = "nodejs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await exigirSeccion(req, "crm");
    const { id } = await params;
    const body = (await req.json()) as {
      texto?: unknown;
      autor?: unknown;
    };
    const texto = typeof body.texto === "string" ? body.texto.trim() : "";
    const autor =
      typeof body.autor === "string" && body.autor.trim()
        ? body.autor.trim()
        : null;

    if (!texto) {
      return NextResponse.json(
        { error: "El texto de la nota es obligatorio." },
        { status: 400 },
      );
    }

    const { data, error } = await sb
      .from("crm_notas")
      .insert({ candidato_id: id, texto, autor })
      .select("*")
      .single();

    if (error) {
      const status = error.code === "23503" ? 404 : 500;
      const message =
        status === 404 ? "Candidato no encontrado." : error.message;
      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    const message =
      error instanceof Error ? error.message : "No se pudo agregar la nota.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
