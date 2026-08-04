import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { sanitizarUsuario } from "@/lib/admin-usuarios";

export const runtime = "nodejs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const usuario =
      typeof body.usuario === "string" ? sanitizarUsuario(body.usuario) : null;

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    const { data, error } = await sb
      .from("admin_perfiles")
      .select("email")
      .eq("usuario", usuario)
      .eq("activo", true)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data?.email) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ email: data.email });
  } catch {
    return NextResponse.json(
      { error: "No se pudo resolver el usuario." },
      { status: 500 },
    );
  }
}
