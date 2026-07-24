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

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { token } = await params;
    const { data, error } = await sb
      .from("cuestionario_respuestas")
      .select("invitado_nombre, respuestas, paso_actual, completado")
      .eq("token", token)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "no encontrado" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "No fue posible consultar el cuestionario" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { token } = await params;
    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
    }

    const input = body as {
      respuestas?: unknown;
      paso_actual?: unknown;
    };
    const cambios: {
      respuestas?: Record<string, unknown>;
      paso_actual?: number;
      updated_at: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if ("respuestas" in input) {
      if (
        !input.respuestas ||
        typeof input.respuestas !== "object" ||
        Array.isArray(input.respuestas)
      ) {
        return NextResponse.json(
          { error: "Las respuestas no son válidas" },
          { status: 400 },
        );
      }
      cambios.respuestas = input.respuestas as Record<string, unknown>;
    }

    if ("paso_actual" in input) {
      if (
        typeof input.paso_actual !== "number" ||
        !Number.isInteger(input.paso_actual) ||
        input.paso_actual < 0
      ) {
        return NextResponse.json(
          { error: "El paso actual no es válido" },
          { status: 400 },
        );
      }
      cambios.paso_actual = input.paso_actual;
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
      { error: "No fue posible guardar el avance" },
      { status: 500 },
    );
  }
}
