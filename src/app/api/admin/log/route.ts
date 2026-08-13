import { NextRequest, NextResponse } from "next/server";
import { logAdmin } from "@/lib/admin-log";
import { identificar, SinPermiso } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await identificar(req);
    const { accion, detalle } = await req.json();
    if (!accion) return NextResponse.json({ error: "accion requerida" }, { status: 400 });
    await logAdmin(accion, detalle);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
