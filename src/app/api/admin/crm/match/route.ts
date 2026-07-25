import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import {
  normalizarTexto,
  rankear,
  type Candidato,
  type CandidatoMatch,
  type VacanteMatch,
} from "@/lib/crm";

export const runtime = "nodejs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function listaDeTextos(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export async function GET(req: NextRequest) {
  try {
    const vacanteParam = req.nextUrl.searchParams.get("vacante")?.trim();
    const vacanteId = Number(vacanteParam);

    if (!vacanteParam || !Number.isInteger(vacanteId) || vacanteId <= 0) {
      return NextResponse.json(
        { error: "El id de la vacante es obligatorio y debe ser válido." },
        { status: 400 },
      );
    }

    const { data: vacanteData, error: vacanteError } = await sb
      .from("vacantes")
      .select("id, titulo, categoria, ubicacion, requisitos, tags")
      .eq("id", vacanteId)
      .maybeSingle();

    if (vacanteError) {
      return NextResponse.json(
        { error: vacanteError.message },
        { status: 500 },
      );
    }

    if (!vacanteData) {
      return NextResponse.json(
        { error: "La vacante no existe." },
        { status: 404 },
      );
    }

    const [candidatosResponse, aplicacionesResponse, vacantesResponse] =
      await Promise.all([
        sb.from("crm_candidatos").select(
          "id, nombre, experiencia, ubicacion, estado",
        ),
        sb
          .from("aplicaciones")
          .select("candidato_id, vacante")
          .not("candidato_id", "is", null),
        sb.from("vacantes").select("titulo, categoria"),
      ]);

    const errorCarga =
      candidatosResponse.error ??
      aplicacionesResponse.error ??
      vacantesResponse.error;

    if (errorCarga) {
      return NextResponse.json(
        { error: errorCarga.message },
        { status: 500 },
      );
    }

    const categoriaPorTitulo = new Map<string, string>();
    for (const vacante of vacantesResponse.data ?? []) {
      if (
        typeof vacante.titulo === "string" &&
        typeof vacante.categoria === "string" &&
        vacante.categoria.trim()
      ) {
        categoriaPorTitulo.set(
          normalizarTexto(vacante.titulo),
          vacante.categoria.trim(),
        );
      }
    }

    const categoriasPorCandidato = new Map<string, Map<string, string>>();
    const aplicacionesCount = new Map<string, number>();

    for (const aplicacion of aplicacionesResponse.data ?? []) {
      if (typeof aplicacion.candidato_id !== "string") continue;

      aplicacionesCount.set(
        aplicacion.candidato_id,
        (aplicacionesCount.get(aplicacion.candidato_id) ?? 0) + 1,
      );

      if (typeof aplicacion.vacante !== "string") continue;

      const categoria = categoriaPorTitulo.get(
        normalizarTexto(aplicacion.vacante),
      );
      if (!categoria) continue;

      const categorias =
        categoriasPorCandidato.get(aplicacion.candidato_id) ??
        new Map<string, string>();
      categorias.set(normalizarTexto(categoria), categoria);
      categoriasPorCandidato.set(aplicacion.candidato_id, categorias);
    }

    const vacante: VacanteMatch = {
      id: Number(vacanteData.id),
      titulo: vacanteData.titulo,
      categoria: vacanteData.categoria,
      ubicacion: vacanteData.ubicacion,
      requisitos: listaDeTextos(vacanteData.requisitos),
      tags: listaDeTextos(vacanteData.tags),
    };

    const candidatos = (candidatosResponse.data ?? []) as Pick<
      Candidato,
      "id" | "nombre" | "experiencia" | "ubicacion" | "estado"
    >[];
    const candidatosMatch: CandidatoMatch[] = candidatos.map((candidato) => ({
      id: candidato.id,
      nombre: candidato.nombre,
      experiencia: candidato.experiencia,
      ubicacion: candidato.ubicacion,
      categoriasAplicadas: [
        ...(categoriasPorCandidato.get(candidato.id)?.values() ?? []),
      ],
    }));
    const candidatoPorId = new Map(
      candidatos.map((candidato) => [candidato.id, candidato]),
    );

    const resultados = rankear(vacante, candidatosMatch).flatMap(
      (resultado) => {
        const candidato = candidatoPorId.get(resultado.candidatoId);
        if (!candidato) return [];

        return [
          {
            ...resultado,
            nombre: candidato.nombre,
            ubicacion: candidato.ubicacion,
            estado: candidato.estado,
            aplicaciones_count:
              aplicacionesCount.get(candidato.id) ?? 0,
          },
        ];
      },
    );

    return NextResponse.json({
      vacante: {
        id: vacante.id,
        titulo: vacante.titulo,
        categoria: vacante.categoria,
        ubicacion: vacante.ubicacion,
      },
      resultados,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo generar el ranking de candidatos.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
