import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { token } = await params;
    const rawBody = await request.text();
    const body: unknown = rawBody ? JSON.parse(rawBody) : {};

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
    }

    const respuestas = (body as { respuestas?: unknown }).respuestas;
    if (
      respuestas !== undefined &&
      (!respuestas || typeof respuestas !== "object" || Array.isArray(respuestas))
    ) {
      return NextResponse.json(
        { error: "Las respuestas no son válidas" },
        { status: 400 },
      );
    }

    const ahora = new Date().toISOString();
    const cambios: {
      completado: boolean;
      enviado_en: string;
      updated_at: string;
      respuestas?: Record<string, unknown>;
    } = {
      completado: true,
      enviado_en: ahora,
      updated_at: ahora,
    };

    if (respuestas !== undefined) {
      cambios.respuestas = respuestas as Record<string, unknown>;
    }

    const { data, error } = await sb
      .from("cuestionario_respuestas")
      .update(cambios)
      .eq("token", token)
      .select("token")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "No fue posible enviar las respuestas" },
      { status: 500 },
    );
  }
}
