import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { ESTADOS, type EstadoPipeline } from "@/lib/crm";
import { SinPermiso, exigirSeccion } from "@/lib/admin-auth";

export const runtime = "nodejs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const ESTADOS_VALIDOS = new Set<EstadoPipeline>(
  ESTADOS.map((estado) => estado.value),
);
const CAMPOS_EDITABLES = [
  "nombre",
  "correo",
  "whatsapp",
  "ubicacion",
  "experiencia",
  "cv_url",
] as const;

function textoEditable(value: unknown): string | null | undefined {
  if (typeof value !== "string") return undefined;
  return value.trim() || null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await exigirSeccion(req, "crm");
    const { id } = await params;
    const { data: candidato, error } = await sb
      .from("crm_candidatos")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!candidato) {
      return NextResponse.json(
        { error: "Candidato no encontrado." },
        { status: 404 },
      );
    }

    const [
      { data: aplicaciones, error: aplicacionesError },
      { data: notas, error: notasError },
    ] = await Promise.all([
      sb
        .from("aplicaciones")
        .select("vacante, cv_url, experiencia, ubicacion, created_at")
        .eq("candidato_id", id)
        .order("created_at", { ascending: false }),
      sb
        .from("crm_notas")
        .select("*")
        .eq("candidato_id", id)
        .order("created_at", { ascending: false }),
    ]);

    if (aplicacionesError || notasError) {
      return NextResponse.json(
        { error: aplicacionesError?.message ?? notasError?.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      candidato,
      aplicaciones: aplicaciones ?? [],
      notas: notas ?? [],
    });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo cargar el candidato.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await exigirSeccion(req, "crm");
    const { id } = await params;
    const body = (await req.json()) as Record<string, unknown>;
    const cambios: Record<string, string | null> = {};

    if ("estado" in body) {
      if (
        typeof body.estado !== "string" ||
        !ESTADOS_VALIDOS.has(body.estado as EstadoPipeline)
      ) {
        return NextResponse.json(
          { error: "El estado del pipeline no es válido." },
          { status: 400 },
        );
      }
      cambios.estado = body.estado;
    }

    for (const campo of CAMPOS_EDITABLES) {
      if (!(campo in body)) continue;
      const value = textoEditable(body[campo]);
      if (value === undefined) {
        return NextResponse.json(
          { error: `El campo ${campo} debe ser texto.` },
          { status: 400 },
        );
      }
      if (campo === "nombre" && value === null) {
        return NextResponse.json(
          { error: "El nombre no puede quedar vacío." },
          { status: 400 },
        );
      }
      cambios[campo] = value;
    }

    if (Object.keys(cambios).length === 0) {
      return NextResponse.json(
        { error: "No se recibieron campos editables." },
        { status: 400 },
      );
    }

    cambios.updated_at = new Date().toISOString();
    const { data, error } = await sb
      .from("crm_candidatos")
      .update(cambios)
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json(
        { error: "Candidato no encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo actualizar el candidato.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await exigirSeccion(req, "crm");
    const { id } = await params;
    const { error: desvincularError } = await sb
      .from("aplicaciones")
      .update({ candidato_id: null })
      .eq("candidato_id", id);

    if (desvincularError) {
      return NextResponse.json(
        { error: desvincularError.message },
        { status: 500 },
      );
    }

    const { error } = await sb.from("crm_candidatos").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo borrar el candidato.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
