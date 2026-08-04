import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { ADMIN_SECCION_KEYS } from "@/lib/admin-secciones";

export const runtime = "nodejs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type Rol = "admin" | "colaborador";

function esRol(valor: unknown): valor is Rol {
  return valor === "admin" || valor === "colaborador";
}

function validarSecciones(valor: unknown): string[] | null {
  if (!Array.isArray(valor) || !valor.every((item) => typeof item === "string")) {
    return null;
  }
  const unicas = [...new Set(valor)];
  return unicas.every((seccion) => ADMIN_SECCION_KEYS.has(seccion))
    ? unicas
    : null;
}

function validarProyectos(valor: unknown): string[] | null {
  if (!Array.isArray(valor) || !valor.every((item) =>
    typeof item === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item)
  )) {
    return null;
  }

  return [...new Set(valor)];
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as Record<string, unknown>;
    const { data: actual, error: consultaError } = await sb
      .from("admin_perfiles")
      .select("rol, secciones")
      .eq("user_id", id)
      .maybeSingle();

    if (consultaError) {
      return NextResponse.json({ error: consultaError.message }, { status: 500 });
    }
    if (!actual) {
      return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
    }

    const cambios: Record<string, string | string[] | boolean | null> = {};
    let rolFinal = actual.rol as Rol;

    if ("rol" in body) {
      if (!esRol(body.rol)) {
        return NextResponse.json(
          { error: "El rol debe ser admin o colaborador." },
          { status: 400 },
        );
      }
      rolFinal = body.rol;
      cambios.rol = body.rol;
    }

    if ("nombre" in body) {
      if (typeof body.nombre !== "string") {
        return NextResponse.json(
          { error: "El nombre debe ser texto." },
          { status: 400 },
        );
      }
      cambios.nombre = body.nombre.trim() || null;
    }

    if ("activo" in body) {
      if (typeof body.activo !== "boolean") {
        return NextResponse.json(
          { error: "El estado activo debe ser verdadero o falso." },
          { status: 400 },
        );
      }
      cambios.activo = body.activo;
    }

    if ("secciones" in body) {
      const secciones = validarSecciones(body.secciones);
      if (secciones === null) {
        return NextResponse.json(
          { error: "La lista de secciones contiene valores no válidos." },
          { status: 400 },
        );
      }
      cambios.secciones = rolFinal === "admin" ? [] : secciones;
    } else if (rolFinal === "admin") {
      cambios.secciones = [];
    }

    if ("proyectos" in body) {
      const proyectos = validarProyectos(body.proyectos);
      if (proyectos === null) {
        return NextResponse.json(
          { error: "La lista de proyectos contiene identificadores no válidos." },
          { status: 400 },
        );
      }
      cambios.proyectos = rolFinal === "admin" ? [] : proyectos;
    } else if (rolFinal === "admin") {
      cambios.proyectos = [];
    }

    if (Object.keys(cambios).length === 0) {
      return NextResponse.json(
        { error: "No se recibieron campos editables." },
        { status: 400 },
      );
    }

    cambios.updated_at = new Date().toISOString();
    const { data: usuario, error } = await sb
      .from("admin_perfiles")
      .update(cambios)
      .eq("user_id", id)
      .select("user_id, usuario, email, nombre, rol, secciones, proyectos, activo, created_at, updated_at")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ usuario });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo actualizar el usuario.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { error: authError } = await sb.auth.admin.deleteUser(id);

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    const { error: perfilError } = await sb
      .from("admin_perfiles")
      .delete()
      .eq("user_id", id);

    if (perfilError) {
      return NextResponse.json({ error: perfilError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo borrar el usuario.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
