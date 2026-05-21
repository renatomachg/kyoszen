import { NextRequest, NextResponse } from "next/server";
import { logAdmin } from "@/lib/admin-log";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { accion, detalle } = await req.json();
  if (!accion) return NextResponse.json({ error: "accion requerida" }, { status: 400 });
  await logAdmin(accion, detalle);
  return NextResponse.json({ ok: true });
}
