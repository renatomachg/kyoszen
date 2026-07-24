import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function slugDeNombre(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function tokenDisponible(base: string): Promise<string> {
  let token = base;
  let sufijo = 2;

  while (true) {
    const { data, error } = await sb
      .from("cuestionario_respuestas")
      .select("token")
      .eq("token", token)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return token;
    }

    token = `${base}-${sufijo}`;
    sufijo += 1;
  }
}

export async function GET() {
  try {
    const { data, error } = await sb
      .from("cuestionario_respuestas")
      .select(
        "token, invitado_nombre, respuestas, paso_actual, completado, enviado_en, created_at, updated_at",
      )
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invitaciones: data ?? [] });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudieron cargar las invitaciones.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      invitado_nombre?: unknown;
      token?: unknown;
    };
    const invitadoNombre =
      typeof body.invitado_nombre === "string"
        ? body.invitado_nombre.trim()
        : "";

    if (!invitadoNombre) {
      return NextResponse.json(
        { error: "El nombre del invitado es obligatorio." },
        { status: 400 },
      );
    }

    const tokenSolicitado =
      typeof body.token === "string" ? body.token.trim() : "";
    let token: string;

    if (tokenSolicitado) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tokenSolicitado)) {
        return NextResponse.json(
          {
            error:
              "El token solo puede contener minúsculas, números y guiones.",
          },
          { status: 400 },
        );
      }
      token = tokenSolicitado;
    } else {
      const base = slugDeNombre(invitadoNombre);
      if (!base) {
        return NextResponse.json(
          { error: "No se pudo generar un token válido con ese nombre." },
          { status: 400 },
        );
      }
      token = await tokenDisponible(base);
    }

    const { data, error } = await sb
      .from("cuestionario_respuestas")
      .insert({ token, invitado_nombre: invitadoNombre })
      .select("token, invitado_nombre")
      .single();

    if (error) {
      const status = error.code === "23505" ? 409 : 500;
      const message =
        status === 409
          ? "Ese token ya está en uso."
          : error.message;
      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo crear la invitación.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = (await req.json()) as { token?: unknown };
    const token = typeof body.token === "string" ? body.token.trim() : "";

    if (!token) {
      return NextResponse.json(
        { error: "El token es obligatorio." },
        { status: 400 },
      );
    }

    const { error } = await sb
      .from("cuestionario_respuestas")
      .delete()
      .eq("token", token);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo borrar la invitación.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
