import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { EstadoBloque } from "@/lib/proyectos";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type EtapaListado = {
  orden: number;
  proyecto_bloques?: { estado: EstadoBloque }[] | null;
  [key: string]: unknown;
};

type ProyectoListado = {
  proyecto_etapas?: EtapaListado[] | null;
  proyecto_escenas?: { count: number }[] | null;
  [key: string]: unknown;
};

export async function GET() {
  const { data, error } = await sb
    .from("proyectos")
    .select(`
      *,
      proyecto_escenas(count),
      proyecto_etapas(
        *,
        proyecto_bloques(estado)
      )
    `)
    .eq("publicado", true)
    .eq("proyecto_etapas.proyecto_bloques.es_activa", true)
    // El progreso que ve el cliente no cuenta las entregas internas sin liberar
    .eq("proyecto_etapas.proyecto_bloques.visible_cliente", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const proyectos = ((data ?? []) as ProyectoListado[]).map((proyecto) => ({
    ...proyecto,
    proyecto_etapas: (proyecto.proyecto_etapas ?? [])
      .map(({ proyecto_bloques, ...etapa }) => {
        const bloques = proyecto_bloques ?? [];
        return {
          ...etapa,
          progreso: {
            total: bloques.length,
            aprobado: bloques.filter(({ estado }) => estado === "aprobado").length,
            cambios: bloques.filter(({ estado }) => estado === "cambios").length,
            pendiente: bloques.filter(({ estado }) => estado === "pendiente").length,
          },
        };
      })
      .sort((a, b) => a.orden - b.orden),
  }));

  return NextResponse.json(proyectos);
}
