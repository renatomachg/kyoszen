import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { SinPermiso, exigirSeccion } from "@/lib/admin-auth";

export const runtime = "nodejs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const CAMPOS_OPCIONALES = [
  "correo",
  "whatsapp",
  "ubicacion",
  "experiencia",
  "cv_url",
] as const;

function textoOpcional(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function GET(req: NextRequest) {
  try {
    await exigirSeccion(req, "crm");
    const { data: candidatos, error } = await sb
      .from("crm_candidatos")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: aplicaciones, error: aplicacionesError } = await sb
      .from("aplicaciones")
      .select("candidato_id")
      .not("candidato_id", "is", null);

    if (aplicacionesError) {
      return NextResponse.json(
        { error: aplicacionesError.message },
        { status: 500 },
      );
    }

    const conteos = new Map<string, number>();
    for (const aplicacion of aplicaciones ?? []) {
      if (typeof aplicacion.candidato_id === "string") {
        conteos.set(
          aplicacion.candidato_id,
          (conteos.get(aplicacion.candidato_id) ?? 0) + 1,
        );
      }
    }

    return NextResponse.json({
      candidatos: (candidatos ?? []).map((candidato) => ({
        ...candidato,
        aplicaciones_count: conteos.get(candidato.id) ?? 0,
      })),
    });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    const message =
      error instanceof Error
        ? error.message
        : "No se pudieron cargar los candidatos.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await exigirSeccion(req, "crm");
    const body = (await req.json()) as Record<string, unknown>;
    const nombre =
      typeof body.nombre === "string" ? body.nombre.trim() : "";

    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre es obligatorio." },
        { status: 400 },
      );
    }

    const nuevo: Record<string, string | null> = {
      nombre,
      origen: "manual",
      estado: "nuevo",
    };

    for (const campo of CAMPOS_OPCIONALES) {
      nuevo[campo] = textoOpcional(body[campo]);
    }

    const { data, error } = await sb
      .from("crm_candidatos")
      .insert(nuevo)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo crear el candidato.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
