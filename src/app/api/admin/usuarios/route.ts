import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { ADMIN_SECCION_KEYS } from "@/lib/admin-secciones";
import { correoInterno, sanitizarUsuario } from "@/lib/admin-usuarios";

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
  if (valor === undefined) return [];
  if (!Array.isArray(valor) || !valor.every((item) => typeof item === "string")) {
    return null;
  }

  const unicas = [...new Set(valor)];
  return unicas.every((seccion) => ADMIN_SECCION_KEYS.has(seccion))
    ? unicas
    : null;
}

function generarPasswordTemporal(): string {
  const codigo = randomBytes(4).toString("hex");
  return `Kyoszen-${codigo}!`;
}

function esErrorDuplicado(message: string): boolean {
  const normalizado = message.toLowerCase();
  return (
    normalizado.includes("already") ||
    normalizado.includes("registered") ||
    normalizado.includes("exists") ||
    normalizado.includes("duplicate")
  );
}

export async function GET() {
  try {
    const { data, error } = await sb
      .from("admin_perfiles")
      .select("user_id, usuario, email, nombre, rol, secciones, activo, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ usuarios: data ?? [] });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudieron cargar los usuarios.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const emailSolicitado =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const usuarioSolicitado =
      typeof body.usuario === "string" ? body.usuario : "";
    const usuarioNormalizado = emailSolicitado
      ? null
      : sanitizarUsuario(usuarioSolicitado);
    const email =
      emailSolicitado ||
      (usuarioNormalizado ? correoInterno(usuarioNormalizado) : "");
    const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";

    if (!emailSolicitado && !usuarioNormalizado) {
      return NextResponse.json(
        {
          error:
            "Ingresa un usuario válido usando solo letras minúsculas, números, punto, guion o guion bajo.",
        },
        { status: 400 },
      );
    }
    if (emailSolicitado && !/^\S+@\S+\.\S+$/.test(emailSolicitado)) {
      return NextResponse.json(
        { error: "Ingresa un correo electrónico válido." },
        { status: 400 },
      );
    }
    if (!esRol(body.rol)) {
      return NextResponse.json(
        { error: "El rol debe ser admin o colaborador." },
        { status: 400 },
      );
    }

    const secciones = validarSecciones(body.secciones);
    if (secciones === null) {
      return NextResponse.json(
        { error: "La lista de secciones contiene valores no válidos." },
        { status: 400 },
      );
    }

    const passwordSolicitado =
      typeof body.password === "string" ? body.password.trim() : "";
    if (passwordSolicitado && passwordSolicitado.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres." },
        { status: 400 },
      );
    }
    const passwordTemporal = passwordSolicitado || generarPasswordTemporal();

    if (usuarioNormalizado) {
      const { data: existente, error: consultaError } = await sb
        .from("admin_perfiles")
        .select("user_id")
        .eq("usuario", usuarioNormalizado)
        .maybeSingle();

      if (consultaError) {
        return NextResponse.json({ error: consultaError.message }, { status: 500 });
      }
      if (existente) {
        return NextResponse.json(
          { error: "Ya existe una cuenta con ese usuario." },
          { status: 409 },
        );
      }
    }

    const { data: authData, error: authError } = await sb.auth.admin.createUser({
      email,
      password: passwordTemporal,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      const message = authError?.message ?? "No se pudo crear el usuario en Auth.";
      return NextResponse.json(
        {
          error: esErrorDuplicado(message)
            ? usuarioNormalizado
              ? "Ya existe una cuenta con ese usuario."
              : "Ya existe una cuenta con ese correo electrónico."
            : message,
        },
        { status: esErrorDuplicado(message) ? 409 : 500 },
      );
    }

    const perfil = {
      user_id: authData.user.id,
      usuario: usuarioNormalizado,
      email,
      nombre: nombre || null,
      rol: body.rol,
      secciones: body.rol === "admin" ? [] : secciones,
      activo: true,
    };
    const { data: usuario, error: perfilError } = await sb
      .from("admin_perfiles")
      .insert(perfil)
      .select("user_id, usuario, email, nombre, rol, secciones, activo, created_at, updated_at")
      .single();

    if (perfilError || !usuario) {
      await sb.auth.admin.deleteUser(authData.user.id);
      const message =
        perfilError?.message ?? "No se pudo crear el perfil del usuario.";
      return NextResponse.json(
        {
          error:
            usuarioNormalizado && esErrorDuplicado(message)
              ? "Ya existe una cuenta con ese usuario."
              : message,
        },
        {
          status:
            usuarioNormalizado && esErrorDuplicado(message) ? 409 : 500,
        },
      );
    }

    return NextResponse.json({ usuario, passwordTemporal }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo crear el usuario.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
