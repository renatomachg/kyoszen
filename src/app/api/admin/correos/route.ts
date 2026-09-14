import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SinPermiso, exigirSeccion } from "@/lib/admin-auth";

export const runtime = "nodejs";

/* site_config también guarda la contraseña SMTP: solo el servidor la toca.
   Por eso los correos de destino se leen y guardan por aquí y no desde el
   navegador. */
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CLAVES = ["contact_email", "courses_email", "aplicaciones_email"] as const;
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** GET — a qué correo llega cada formulario del sitio. */
export async function GET(req: NextRequest) {
  try {
    await exigirSeccion(req, "correos");
    const { data, error } = await sb
      .from("site_config")
      .select("key, value")
      .in("key", [...CLAVES]);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const correos: Record<string, string> = {};
    for (const fila of data ?? []) correos[fila.key] = fila.value;
    return NextResponse.json({ correos });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

/** PUT — guarda los tres correos de destino. */
export async function PUT(req: NextRequest) {
  try {
    await exigirSeccion(req, "correos");
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Body inválido" }, { status: 400 });
    }

    const ahora = new Date().toISOString();
    const filas = [];
    for (const clave of CLAVES) {
      const valor = typeof body[clave] === "string" ? (body[clave] as string).trim() : "";
      if (!CORREO.test(valor)) {
        return NextResponse.json({ error: `El correo "${valor}" no es válido.` }, { status: 400 });
      }
      filas.push({ key: clave, value: valor, updated_at: ahora });
    }

    const { error } = await sb.from("site_config").upsert(filas, { onConflict: "key" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
