import { createClient } from "@supabase/supabase-js";

import type { Respuestas } from "@/lib/cuestionario/tipos";
import CuestionarioCliente from "./CuestionarioCliente";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function CuestionarioPage({ params }: PageProps) {
  const { token } = await params;
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { data, error } = await sb
    .from("cuestionario_respuestas")
    .select("invitado_nombre, respuestas, paso_actual, completado")
    .eq("token", token)
    .maybeSingle();

  if (error || !data) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          background:
            "radial-gradient(circle at 15% 15%, rgba(24,131,255,.12), transparent 34%), #F8FAFC",
          color: "#042E7B",
        }}
      >
        <section
          style={{
            width: "100%",
            maxWidth: 520,
            padding: "48px 32px",
            textAlign: "center",
            border: "1px solid #E2E8F0",
            borderRadius: 24,
            background: "#FFFFFF",
            boxShadow: "0 22px 60px rgba(4,46,123,.10)",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: 52,
              height: 52,
              display: "grid",
              placeItems: "center",
              margin: "0 auto 20px",
              borderRadius: 16,
              background: "linear-gradient(135deg, #1883FF, #042E7B)",
              color: "#FFFFFF",
              fontSize: 24,
              fontWeight: 900,
            }}
          >
            K
          </div>
          <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.2 }}>
            Este enlace no es válido
          </h1>
          <p style={{ margin: "12px 0 0", color: "#64748B", lineHeight: 1.65 }}>
            Revisa que el enlace esté completo o solicita uno nuevo a Kyoszen.
          </p>
        </section>
      </main>
    );
  }

  return (
    <CuestionarioCliente
      token={token}
      invitadoNombre={data.invitado_nombre}
      respuestasIniciales={(data.respuestas ?? {}) as Respuestas}
      pasoInicial={data.paso_actual ?? 0}
      completadoInicial={data.completado ?? false}
    />
  );
}
