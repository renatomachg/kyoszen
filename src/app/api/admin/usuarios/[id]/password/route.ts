import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { PASSWORD_MINIMO, generarPasswordTemporal } from "@/lib/admin-usuarios";
import { SinPermiso, soloAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/** POST — le pone contraseña nueva a un usuario del panel.
 *  Sin `password` en el cuerpo, genera una temporal.
 *  La devuelve una sola vez para que el admin se la pase al colaborador. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await soloAdmin(req);
    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    // Solo cuentas del panel: nunca las de los revisores del cliente
    const { data: perfil, error: consultaError } = await sb
      .from("admin_perfiles")
      .select("user_id, usuario, email")
      .eq("user_id", id)
      .maybeSingle();

    if (consultaError) {
      return NextResponse.json({ error: consultaError.message }, { status: 500 });
    }
    if (!perfil) {
      return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
    }

    const solicitada = typeof body.password === "string" ? body.password.trim() : "";
    if (solicitada && solicitada.length < PASSWORD_MINIMO) {
      return NextResponse.json(
        { error: `La contraseña debe tener al menos ${PASSWORD_MINIMO} caracteres.` },
        { status: 400 },
      );
    }

    const password = solicitada || generarPasswordTemporal();

    const { error: authError } = await sb.auth.admin.updateUserById(id, { password });
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    return NextResponse.json({
      password,
      usuario: perfil.usuario,
      email: perfil.email,
    });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    const message =
      error instanceof Error ? error.message : "No se pudo cambiar la contraseña.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
