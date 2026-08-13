"use client";

import { useEffect, useState } from "react";
import { ESTADOS, type EstadoPipeline } from "@/lib/crm";
import { supabase } from "@/lib/supabase";
import { Dot, IconUI } from "@/components/ui/IconUI";
import { fetchAdmin } from "@/lib/admin-fetch";


interface VacanteOpcion {
  id: number;
  titulo: string;
  categoria: string | null;
  ubicacion: string | null;
}

interface ResultadoEnriquecido {
  candidatoId: string;
  score: number;
  razones: string[];
  nombre: string | null;
  ubicacion: string | null;
  estado: EstadoPipeline;
  aplicaciones_count: number;
}

interface RespuestaMatch {
  vacante: VacanteOpcion;
  resultados: ResultadoEnriquecido[];
}

function colorScore(score: number): string {
  if (score >= 66) return "bg-green-100 text-green-700";
  if (score >= 33) return "bg-blue-soft text-blue-dark";
  return "bg-gray-100 text-gray-600";
}

function etiquetaEstado(estado: EstadoPipeline) {
  return ESTADOS.find((item) => item.value === estado) ?? ESTADOS[0];
}

const COLOR_ESTADO: Record<EstadoPipeline, string> = {
  nuevo: "#2563EB",
  contactado: "#0284C7",
  entrevista: "#4F46E5",
  enviado: "#0891B2",
  contratado: "#16A34A",
  descartado: "#64748B",
};

async function leerRespuesta<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Ocurrió un error inesperado.");
  }
  return data;
}

export default function MatchingPanel({
  onVerCandidato,
}: {
  onVerCandidato: (id: string) => void;
}) {
  const [vacantes, setVacantes] = useState<VacanteOpcion[]>([]);
  const [vacanteId, setVacanteId] = useState("");
  const [ranking, setRanking] = useState<RespuestaMatch | null>(null);
  const [cargandoVacantes, setCargandoVacantes] = useState(true);
  const [cargandoRanking, setCargandoRanking] = useState(false);
  const [errorVacantes, setErrorVacantes] = useState("");
  const [errorRanking, setErrorRanking] = useState("");

  useEffect(() => {
    let activo = true;

    async function cargarVacantes() {
      const { data, error } = await supabase
        .from("vacantes")
        .select("id, titulo, categoria, ubicacion")
        .eq("activa", true)
        .order("titulo", { ascending: true });

      if (!activo) return;

      if (error) {
        setErrorVacantes(error.message);
      } else {
        setVacantes((data ?? []) as VacanteOpcion[]);
      }
      setCargandoVacantes(false);
    }

    void cargarVacantes();
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!vacanteId) {
      setRanking(null);
      setErrorRanking("");
      return;
    }

    const controller = new AbortController();

    async function cargarRanking() {
      setCargandoRanking(true);
      setErrorRanking("");
      setRanking(null);

      try {
        const response = await fetchAdmin(
          `/api/admin/crm/match?vacante=${encodeURIComponent(vacanteId)}`,
          { cache: "no-store", signal: controller.signal },
        );
        const data = await leerRespuesta<RespuestaMatch>(response);
        setRanking(data);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        setErrorRanking(
          error instanceof Error
            ? error.message
            : "No se pudo generar el ranking.",
        );
      } finally {
        if (!controller.signal.aborted) setCargandoRanking(false);
      }
    }

    void cargarRanking();
    return () => controller.abort();
  }, [vacanteId]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-black text-navy">
          CRM · Matching por vacante
        </h1>
        <p className="text-[13px] text-muted">
          Encuentra candidatos anteriores que embonan con una vacante activa.
        </p>
      </div>

      <section className="mb-6 rounded-2xl border border-border bg-white p-5">
        <label className="block max-w-xl">
          <span className="mb-2 block text-[11px] font-black uppercase tracking-wide text-navy">
            Elige una vacante
          </span>
          <select
            value={vacanteId}
            onChange={(event) => setVacanteId(event.target.value)}
            disabled={cargandoVacantes || vacantes.length === 0}
            className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-[13px] font-bold text-navy outline-none transition-colors focus:border-blue disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">
              {cargandoVacantes
                ? "Cargando vacantes…"
                : "Selecciona una vacante"}
            </option>
            {vacantes.map((vacante) => (
              <option key={vacante.id} value={vacante.id}>
                {vacante.titulo}
                {vacante.ubicacion ? ` · ${vacante.ubicacion}` : ""}
              </option>
            ))}
          </select>
        </label>

        {errorVacantes && (
          <p className="mt-3 text-[12px] text-red-700">{errorVacantes}</p>
        )}

        {!cargandoVacantes && !errorVacantes && vacantes.length === 0 && (
          <div className="mt-4 rounded-xl border border-border bg-bg px-4 py-4 text-[12px] text-muted">
            No hay vacantes activas disponibles para generar matching.
          </div>
        )}
      </section>

      {errorRanking && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">
          {errorRanking}
        </div>
      )}

      {cargandoRanking ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-navy border-t-transparent" />
        </div>
      ) : ranking ? (
        <div>
          <div className="mb-4 rounded-2xl border border-border bg-blue-soft p-5">
            <p className="text-[10px] font-black uppercase tracking-wide text-blue-dark">
              Vacante seleccionada
            </p>
            <h2 className="mt-1 text-[17px] font-black text-navy">
              {ranking.vacante.titulo}
            </h2>
            <p className="mt-1 text-[11px] text-muted">
              {[ranking.vacante.categoria, ranking.vacante.ubicacion]
                .filter(Boolean)
                .join(" · ") || "Sin categoría ni ubicación"}
            </p>
          </div>

          {ranking.resultados.length === 0 ? (
            <div className="rounded-2xl border border-border bg-white px-6 py-14 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-blue-soft text-blue">
                <IconUI name="target" size={20} />
              </div>
              <p className="text-[14px] font-bold text-navy">
                Ningún candidato anterior embona con esta vacante todavía.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {ranking.resultados.map((resultado, index) => {
                const estado = etiquetaEstado(resultado.estado);
                return (
                  <article
                    key={resultado.candidatoId}
                    className="rounded-2xl border border-border bg-white p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-[12px] font-black text-white">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-[14px] font-black text-navy">
                              {resultado.nombre || "Sin nombre"}
                            </h3>
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${estado.color}`}
                            >
                              <Dot color={COLOR_ESTADO[resultado.estado]} size={5} />
                              {estado.label}
                            </span>
                          </div>
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-muted">
                            <IconUI name="location" size={11} /> {resultado.ubicacion || "Sin ubicación"} ·{" "}
                            {resultado.aplicaciones_count}{" "}
                            {resultado.aplicaciones_count === 1
                              ? "aplicación"
                              : "aplicaciones"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                        <span
                          className={`rounded-xl px-3 py-2 text-[15px] font-black ${colorScore(resultado.score)}`}
                        >
                          {resultado.score}
                          <span className="ml-0.5 text-[9px]">/100</span>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onVerCandidato(resultado.candidatoId)
                          }
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-blue hover:underline"
                        >
                          Ver en candidatos <IconUI name="arrow-right" size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {resultado.razones.map((razon) => (
                        <span
                          key={razon}
                          className="rounded-full border border-blue/20 bg-blue-soft px-3 py-1.5 text-[10px] font-bold text-blue-dark"
                        >
                          {razon}
                        </span>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        !cargandoVacantes &&
        vacantes.length > 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-14 text-center">
            <p className="text-[13px] font-bold text-navy">
              Selecciona una vacante para ver el ranking.
            </p>
          </div>
        )
      )}
    </div>
  );
}
