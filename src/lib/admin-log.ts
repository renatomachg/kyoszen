import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Server-side: usar directamente desde API routes
export async function logAdmin(accion: string, detalle?: string) {
  try {
    await supabaseAdmin.from("admin_log").insert({ accion, detalle: detalle ?? null });
  } catch {
    // No bloquear el flujo principal si el log falla
  }
}

