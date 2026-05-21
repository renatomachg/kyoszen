// Client-side only — llama al endpoint /api/admin/log via fetch
// No importa Supabase directamente (evita exponer SERVICE_ROLE_KEY al browser)

export function logAdminClient(accion: string, detalle?: string) {
  fetch("/api/admin/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accion, detalle }),
  }).catch(() => {});
}
