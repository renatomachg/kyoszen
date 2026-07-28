import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { contarRespondidas } from "@/lib/cuestionario";
import type { Respuestas } from "@/lib/cuestionario/tipos";
import type { Espacio } from "@/lib/proyectos";

export const runtime = "nodejs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await sb
    .from("proyecto_espacios")
    .select(
      "id, nombre, tipo, descripcion, icono, color, cuestionario_token, orden, publicado, created_at, updated_at"
    )
    .eq("publicado", true)
    .order("orden", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    const espaciosBase = (data ?? []) as Espacio[];
    const tokens = Array.from(
      new Set(
        espaciosBase
          .map(({ cuestionario_token }) => cuestionario_token)
          .filter((token): token is string => Boolean(token))
      )
    );
    const cuestionariosPorToken = new Map<
      string,
      {
        token: string;
        invitado_nombre: string;
        respondidas: number;
        total: number;
        completado: boolean;
      }
    >();

    if (tokens.length > 0) {
      const { data: cuestionarios, error: cuestionariosError } = await sb
        .from("cuestionario_respuestas")
        .select("token, invitado_nombre, respuestas, completado")
        .in("token", tokens);

      if (cuestionariosError) throw cuestionariosError;

      for (const cuestionario of cuestionarios ?? []) {
        const respuestas =
          cuestionario.respuestas &&
          typeof cuestionario.respuestas === "object" &&
          !Array.isArray(cuestionario.respuestas)
            ? (cuestionario.respuestas as Respuestas)
            : {};
        const { respondidas, total } = contarRespondidas(respuestas);
        cuestionariosPorToken.set(cuestionario.token, {
          token: cuestionario.token,
          invitado_nombre: cuestionario.invitado_nombre,
          respondidas,
          total,
          completado: cuestionario.completado === true,
        });
      }
    }

    const espacios = await Promise.all(espaciosBase.map(async (espacio) => {
      const [proyectos, archivos, columnas] = await Promise.all([
        sb.from("proyectos").select("*", { count: "exact", head: true })
          .eq("espacio_id", espacio.id)
          .eq("publicado", true),
        sb.from("espacio_archivos").select("*", { count: "exact", head: true })
          .eq("espacio_id", espacio.id),
        sb.from("espacio_columnas").select("id").eq("espacio_id", espacio.id),
      ]);
      const countError = proyectos.error ?? archivos.error ?? columnas.error;
      if (countError) throw countError;

      const columnaIds = (columnas.data ?? []).map(({ id }) => id);
      let tarjetasCount = 0;
      if (columnaIds.length > 0) {
        const tarjetas = await sb
          .from("espacio_tarjetas")
          .select("*", { count: "exact", head: true })
          .in("columna_id", columnaIds);
        if (tarjetas.error) throw tarjetas.error;
        tarjetasCount = tarjetas.count ?? 0;
      }

      return {
        ...espacio,
        proyectos_count: proyectos.count ?? 0,
        archivos_count: archivos.count ?? 0,
        tarjetas_count: tarjetasCount,
        cuestionario: espacio.cuestionario_token
          ? cuestionariosPorToken.get(espacio.cuestionario_token) ?? null
          : null,
      };
    }));

    return NextResponse.json({ espacios });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "No se pudieron calcular los conteos";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
