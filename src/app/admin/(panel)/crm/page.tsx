"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  ESTADOS,
  type Candidato,
  type EstadoPipeline,
  type Nota,
} from "@/lib/crm";
import MatchingPanel from "./MatchingPanel";

interface CandidatoLista extends Candidato {
  aplicaciones_count: number;
}

interface Aplicacion {
  vacante: string | null;
  cv_url: string | null;
  experiencia: string | null;
  ubicacion: string | null;
  created_at: string;
}

interface DetalleCandidato {
  candidato: Candidato;
  aplicaciones: Aplicacion[];
  notas: Nota[];
}

interface FormularioNuevo {
  nombre: string;
  correo: string;
  whatsapp: string;
  ubicacion: string;
}

const FORMULARIO_VACIO: FormularioNuevo = {
  nombre: "",
  correo: "",
  whatsapp: "",
  ubicacion: "",
};

async function leerRespuesta<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Ocurrió un error inesperado.");
  }
  return data;
}

function fechaCorta(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function inicial(nombre: string | null): string {
  return nombre?.trim().charAt(0).toUpperCase() || "?";
}

function etiquetaEstado(estado: EstadoPipeline) {
  return ESTADOS.find((item) => item.value === estado) ?? ESTADOS[0];
}

export default function AdminCRM() {
  const [pestana, setPestana] = useState<"candidatos" | "matching">(
    "candidatos",
  );
  const [candidatos, setCandidatos] = useState<CandidatoLista[]>([]);
  const [filtro, setFiltro] = useState<EstadoPipeline | "todos">("todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<DetalleCandidato | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [error, setError] = useState("");
  const [sincronizando, setSincronizando] = useState(false);
  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [creando, setCreando] = useState(false);
  const [formulario, setFormulario] =
    useState<FormularioNuevo>(FORMULARIO_VACIO);
  const [nota, setNota] = useState("");
  const [guardandoNota, setGuardandoNota] = useState(false);
  const [actualizandoEstado, setActualizandoEstado] = useState(false);
  const [borrando, setBorrando] = useState(false);

  const cargarLista = useCallback(async () => {
    try {
      setError("");
      const response = await fetch("/api/admin/crm/candidatos", {
        cache: "no-store",
      });
      const data = await leerRespuesta<{ candidatos: CandidatoLista[] }>(
        response,
      );
      setCandidatos(data.candidatos);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los candidatos.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarDetalle = useCallback(async (id: string) => {
    setSelectedId(id);
    setLoadingDetalle(true);
    try {
      const response = await fetch(`/api/admin/crm/candidatos/${id}`, {
        cache: "no-store",
      });
      const data = await leerRespuesta<DetalleCandidato>(response);
      setDetalle(data);
    } catch (err) {
      setDetalle(null);
      alert(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el detalle del candidato.",
      );
    } finally {
      setLoadingDetalle(false);
    }
  }, []);

  useEffect(() => {
    void cargarLista();
  }, [cargarLista]);

  const conteos = useMemo(() => {
    const resultado = Object.fromEntries(
      ESTADOS.map((estado) => [estado.value, 0]),
    ) as Record<EstadoPipeline, number>;
    for (const candidato of candidatos) {
      resultado[candidato.estado] += 1;
    }
    return resultado;
  }, [candidatos]);

  const candidatosFiltrados = useMemo(
    () =>
      filtro === "todos"
        ? candidatos
        : candidatos.filter((candidato) => candidato.estado === filtro),
    [candidatos, filtro],
  );

  const sincronizar = async () => {
    setSincronizando(true);
    try {
      const response = await fetch("/api/admin/crm/sync", { method: "POST" });
      const data = await leerRespuesta<{
        creados: number;
        vinculados: number;
      }>(response);
      alert(`${data.creados} nuevos, ${data.vinculados} vinculados`);
      await cargarLista();
      if (selectedId) await cargarDetalle(selectedId);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "No se pudieron sincronizar las aplicaciones.",
      );
    } finally {
      setSincronizando(false);
    }
  };

  const crearCandidato = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreando(true);
    try {
      const response = await fetch("/api/admin/crm/candidatos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formulario),
      });
      const creado = await leerRespuesta<Candidato>(response);
      setFormulario(FORMULARIO_VACIO);
      setMostrarNuevo(false);
      await cargarLista();
      await cargarDetalle(creado.id);
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "No se pudo crear el candidato.",
      );
    } finally {
      setCreando(false);
    }
  };

  const cambiarEstado = async (estado: EstadoPipeline) => {
    if (!detalle || estado === detalle.candidato.estado) return;

    const anterior = detalle.candidato.estado;
    const updatedAt = new Date().toISOString();
    setActualizandoEstado(true);
    setDetalle((prev) =>
      prev
        ? {
            ...prev,
            candidato: { ...prev.candidato, estado, updated_at: updatedAt },
          }
        : prev,
    );
    setCandidatos((prev) =>
      prev.map((candidato) =>
        candidato.id === detalle.candidato.id
          ? { ...candidato, estado, updated_at: updatedAt }
          : candidato,
      ),
    );

    try {
      const response = await fetch(
        `/api/admin/crm/candidatos/${detalle.candidato.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado }),
        },
      );
      await leerRespuesta<{ ok: true }>(response);
    } catch (err) {
      setDetalle((prev) =>
        prev
          ? {
              ...prev,
              candidato: { ...prev.candidato, estado: anterior },
            }
          : prev,
      );
      setCandidatos((prev) =>
        prev.map((candidato) =>
          candidato.id === detalle.candidato.id
            ? { ...candidato, estado: anterior }
            : candidato,
        ),
      );
      alert(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el estado.",
      );
    } finally {
      setActualizandoEstado(false);
    }
  };

  const agregarNota = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!detalle || !nota.trim()) return;

    setGuardandoNota(true);
    try {
      const response = await fetch(
        `/api/admin/crm/candidatos/${detalle.candidato.id}/notas`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texto: nota }),
        },
      );
      const creada = await leerRespuesta<Nota>(response);
      setDetalle((prev) =>
        prev ? { ...prev, notas: [creada, ...prev.notas] } : prev,
      );
      setNota("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo agregar la nota.");
    } finally {
      setGuardandoNota(false);
    }
  };

  const borrarCandidato = async () => {
    if (!detalle) return;
    if (
      !confirm(
        `¿Borrar a ${detalle.candidato.nombre ?? "este candidato"}? Sus notas se eliminarán y sus aplicaciones quedarán sin vincular.`,
      )
    ) {
      return;
    }

    setBorrando(true);
    try {
      const response = await fetch(
        `/api/admin/crm/candidatos/${detalle.candidato.id}`,
        { method: "DELETE" },
      );
      await leerRespuesta<{ ok: true }>(response);
      setSelectedId(null);
      setDetalle(null);
      await cargarLista();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "No se pudo borrar el candidato.",
      );
    } finally {
      setBorrando(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex w-fit rounded-xl border border-border bg-white p-1">
        <button
          type="button"
          onClick={() => setPestana("candidatos")}
          className={`rounded-lg px-4 py-2 text-[12px] font-bold transition-colors ${
            pestana === "candidatos"
              ? "bg-navy text-white"
              : "text-muted hover:bg-bg hover:text-navy"
          }`}
        >
          Candidatos
        </button>
        <button
          type="button"
          onClick={() => setPestana("matching")}
          className={`rounded-lg px-4 py-2 text-[12px] font-bold transition-colors ${
            pestana === "matching"
              ? "bg-navy text-white"
              : "text-muted hover:bg-bg hover:text-navy"
          }`}
        >
          🎯 Matching por vacante
        </button>
      </div>

      {pestana === "candidatos" ? (
        <>
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-2xl font-black text-navy mb-1">
            CRM · Candidatos
          </h1>
          <p className="text-[13px] text-muted">
            {candidatos.length} total
            {ESTADOS.map(
              (estado) => ` · ${conteos[estado.value]} ${estado.label.toLowerCase()}`,
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void sincronizar()}
            disabled={sincronizando}
            className="rounded-xl border border-border bg-white px-4 py-2.5 text-[12px] font-bold text-navy transition-colors hover:bg-blue-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sincronizando
              ? "Sincronizando…"
              : "🔄 Sincronizar desde aplicaciones"}
          </button>
          <button
            type="button"
            onClick={() => setMostrarNuevo((value) => !value)}
            className="rounded-xl bg-navy px-4 py-2.5 text-[12px] font-bold text-white transition-colors hover:bg-blue-dark"
          >
            ＋ Nuevo candidato
          </button>
        </div>
      </div>

      {mostrarNuevo && (
        <form
          onSubmit={crearCandidato}
          className="mb-6 rounded-2xl border border-border bg-white p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[14px] font-black text-navy">
                Nuevo candidato manual
              </p>
              <p className="text-[11px] text-muted">
                El nombre es el único campo obligatorio.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMostrarNuevo(false)}
              className="text-xl leading-none text-muted hover:text-navy"
              aria-label="Cerrar formulario"
            >
              ×
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <CampoNuevo
              label="Nombre *"
              value={formulario.nombre}
              onChange={(value) =>
                setFormulario((prev) => ({ ...prev, nombre: value }))
              }
              required
            />
            <CampoNuevo
              label="Correo"
              value={formulario.correo}
              onChange={(value) =>
                setFormulario((prev) => ({ ...prev, correo: value }))
              }
              type="email"
            />
            <CampoNuevo
              label="WhatsApp"
              value={formulario.whatsapp}
              onChange={(value) =>
                setFormulario((prev) => ({ ...prev, whatsapp: value }))
              }
            />
            <CampoNuevo
              label="Ubicación"
              value={formulario.ubicacion}
              onChange={(value) =>
                setFormulario((prev) => ({ ...prev, ubicacion: value }))
              }
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={creando}
              className="rounded-lg bg-blue px-5 py-2.5 text-[12px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {creando ? "Guardando…" : "Crear candidato"}
            </button>
          </div>
        </form>
      )}

      <div className="mb-5 flex flex-wrap gap-2">
        <Filtro
          activo={filtro === "todos"}
          onClick={() => setFiltro("todos")}
          label="Todos"
          conteo={candidatos.length}
        />
        {ESTADOS.map((estado) => (
          <Filtro
            key={estado.value}
            activo={filtro === estado.value}
            onClick={() => setFiltro(estado.value)}
            label={estado.label}
            conteo={conteos[estado.value]}
          />
        ))}
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-navy border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
          <div className="overflow-hidden rounded-2xl border border-border bg-white">
            {candidatosFiltrados.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <p className="text-[14px] font-bold text-navy">
                  No hay candidatos en este estado
                </p>
                <p className="mt-1 text-[12px] text-muted">
                  Sincroniza aplicaciones o crea un candidato manual.
                </p>
              </div>
            ) : (
              candidatosFiltrados.map((candidato) => {
                const estado = etiquetaEstado(candidato.estado);
                return (
                  <button
                    type="button"
                    key={candidato.id}
                    onClick={() => void cargarDetalle(candidato.id)}
                    className={`flex w-full items-start gap-3 border-b border-border px-5 py-4 text-left transition-colors last:border-0 ${
                      selectedId === candidato.id
                        ? "bg-blue-soft"
                        : "hover:bg-bg"
                    }`}
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-[12px] font-black text-white">
                      {inicial(candidato.nombre)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-[13px] font-black text-navy">
                          {candidato.nombre || "Sin nombre"}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${estado.color}`}
                        >
                          {estado.label}
                        </span>
                      </span>
                      <span className="mt-1 block truncate text-[11px] text-muted">
                        {[candidato.correo, candidato.whatsapp]
                          .filter(Boolean)
                          .join(" · ") || "Sin datos de contacto"}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted">
                        <span>📍 {candidato.ubicacion || "Sin ubicación"}</span>
                        <span>
                          {candidato.aplicaciones_count}{" "}
                          {candidato.aplicaciones_count === 1
                            ? "aplicación"
                            : "aplicaciones"}
                        </span>
                        <span>Actualizado {fechaCorta(candidato.updated_at)}</span>
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <aside className="h-fit rounded-2xl border border-border bg-white xl:sticky xl:top-6">
            {loadingDetalle ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-navy border-t-transparent" />
              </div>
            ) : !detalle ? (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-soft text-lg">
                  👤
                </div>
                <p className="text-[13px] font-bold text-navy">
                  Selecciona un candidato
                </p>
                <p className="mt-1 text-[11px] text-muted">
                  Aquí verás su pipeline, aplicaciones y notas.
                </p>
              </div>
            ) : (
              <Detalle
                detalle={detalle}
                nota={nota}
                onNotaChange={setNota}
                onAgregarNota={agregarNota}
                guardandoNota={guardandoNota}
                actualizandoEstado={actualizandoEstado}
                onCambiarEstado={cambiarEstado}
                borrando={borrando}
                onBorrar={() => void borrarCandidato()}
              />
            )}
          </aside>
        </div>
      )}
        </>
      ) : (
        <MatchingPanel
          onVerCandidato={(id) => {
            setFiltro("todos");
            setPestana("candidatos");
            void cargarDetalle(id);
          }}
        />
      )}
    </div>
  );
}

function CampoNuevo({
  label,
  value,
  onChange,
  required = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-[13px] text-navy outline-none transition-colors focus:border-blue"
      />
    </label>
  );
}

function Filtro({
  activo,
  onClick,
  label,
  conteo,
}: {
  activo: boolean;
  onClick: () => void;
  label: string;
  conteo: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors ${
        activo
          ? "border-navy bg-navy text-white"
          : "border-border bg-white text-muted hover:border-blue hover:text-navy"
      }`}
    >
      {label} <span className="ml-1 opacity-70">{conteo}</span>
    </button>
  );
}

function Detalle({
  detalle,
  nota,
  onNotaChange,
  onAgregarNota,
  guardandoNota,
  actualizandoEstado,
  onCambiarEstado,
  borrando,
  onBorrar,
}: {
  detalle: DetalleCandidato;
  nota: string;
  onNotaChange: (value: string) => void;
  onAgregarNota: (event: FormEvent<HTMLFormElement>) => void;
  guardandoNota: boolean;
  actualizandoEstado: boolean;
  onCambiarEstado: (estado: EstadoPipeline) => void;
  borrando: boolean;
  onBorrar: () => void;
}) {
  const { candidato, aplicaciones, notas } = detalle;

  return (
    <div>
      <div className="border-b border-border p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy text-[14px] font-black text-white">
            {inicial(candidato.nombre)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[16px] font-black text-navy">
              {candidato.nombre || "Sin nombre"}
            </p>
            <p className="text-[11px] text-muted">
              Origen:{" "}
              {candidato.origen === "aplicacion"
                ? "aplicación"
                : candidato.origen}
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <Dato label="Correo" value={candidato.correo} />
          <Dato label="WhatsApp" value={candidato.whatsapp} />
          <Dato label="Ubicación" value={candidato.ubicacion} />
          <Dato label="Experiencia" value={candidato.experiencia} multiline />
          {candidato.cv_url && (
            <a
              href={candidato.cv_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] font-bold text-blue no-underline hover:underline"
            >
              Ver CV del candidato ↗
            </a>
          )}
        </div>
      </div>

      <section className="border-b border-border p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[12px] font-black uppercase tracking-wide text-navy">
            Pipeline
          </h2>
          {actualizandoEstado && (
            <span className="text-[10px] text-muted">Guardando…</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {ESTADOS.map((estado) => {
            const activo = candidato.estado === estado.value;
            return (
              <button
                type="button"
                key={estado.value}
                onClick={() => onCambiarEstado(estado.value)}
                disabled={actualizandoEstado}
                className={`rounded-lg border px-2.5 py-2 text-left text-[10px] font-bold transition-colors disabled:cursor-wait ${
                  activo
                    ? `${estado.color} border-current`
                    : "border-border bg-white text-muted hover:bg-bg hover:text-navy"
                }`}
              >
                {estado.orden}. {estado.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="border-b border-border p-6">
        <h2 className="mb-3 text-[12px] font-black uppercase tracking-wide text-navy">
          Historial de aplicaciones · {aplicaciones.length}
        </h2>
        {aplicaciones.length === 0 ? (
          <p className="text-[11px] text-muted">
            Este candidato no tiene aplicaciones vinculadas.
          </p>
        ) : (
          <div className="space-y-3">
            {aplicaciones.map((aplicacion, index) => (
              <div
                key={`${aplicacion.created_at}-${index}`}
                className="rounded-xl border border-border bg-bg p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[12px] font-bold text-navy">
                    {aplicacion.vacante || "Vacante sin título"}
                  </p>
                  <span className="shrink-0 text-[9px] text-muted">
                    {fechaCorta(aplicacion.created_at)}
                  </span>
                </div>
                {(aplicacion.ubicacion || aplicacion.experiencia) && (
                  <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-muted">
                    {[aplicacion.ubicacion, aplicacion.experiencia]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                {aplicacion.cv_url && (
                  <a
                    href={aplicacion.cv_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-[10px] font-bold text-blue no-underline hover:underline"
                  >
                    Ver CV ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="p-6">
        <h2 className="mb-3 text-[12px] font-black uppercase tracking-wide text-navy">
          Notas · {notas.length}
        </h2>
        <form onSubmit={onAgregarNota} className="mb-5">
          <textarea
            value={nota}
            onChange={(event) => onNotaChange(event.target.value)}
            placeholder="Agrega una nota interna…"
            rows={3}
            className="w-full resize-none rounded-xl border border-border bg-bg px-3 py-2.5 text-[12px] text-navy outline-none transition-colors placeholder:text-muted focus:border-blue"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={guardandoNota || !nota.trim()}
              className="rounded-lg bg-navy px-4 py-2 text-[11px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {guardandoNota ? "Guardando…" : "Agregar nota"}
            </button>
          </div>
        </form>

        {notas.length === 0 ? (
          <p className="text-[11px] text-muted">Todavía no hay notas.</p>
        ) : (
          <div className="space-y-4 border-l-2 border-blue-soft pl-4">
            {notas.map((item) => (
              <div key={item.id} className="relative">
                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-blue" />
                <p className="whitespace-pre-line text-[12px] leading-relaxed text-navy">
                  {item.texto}
                </p>
                <p className="mt-1 text-[9px] text-muted">
                  {item.autor ? `${item.autor} · ` : ""}
                  {fechaCorta(item.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-7 border-t border-border pt-4">
          <button
            type="button"
            onClick={onBorrar}
            disabled={borrando}
            className="text-[11px] font-bold text-red-600 transition-opacity hover:opacity-70 disabled:opacity-40"
          >
            {borrando ? "Borrando…" : "Borrar candidato"}
          </button>
        </div>
      </section>
    </div>
  );
}

function Dato({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string | null;
  multiline?: boolean;
}) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p
        className={`mt-0.5 text-[12px] text-navy ${
          multiline ? "whitespace-pre-line leading-relaxed" : "break-words"
        }`}
      >
        {value || "Sin información"}
      </p>
    </div>
  );
}
