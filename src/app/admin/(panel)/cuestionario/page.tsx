"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  contarRespondidas,
  resumenPorSeccion,
} from "@/lib/cuestionario";
import type { Respuestas } from "@/lib/cuestionario/tipos";
import { Dot, IconUI } from "@/components/ui/IconUI";

type Invitacion = {
  token: string;
  invitado_nombre: string | null;
  respuestas: Respuestas;
  paso_actual: number;
  completado: boolean;
  enviado_en: string | null;
  created_at: string;
  updated_at: string;
};

type InvitacionCreada = {
  token: string;
  invitado_nombre: string | null;
};

type Estado = "completado" | "progreso" | "sin-empezar";

function estadoDe(invitacion: Invitacion): Estado {
  if (invitacion.completado) {
    return "completado";
  }
  return Object.keys(invitacion.respuestas ?? {}).length > 0
    ? "progreso"
    : "sin-empezar";
}

function EstadoPill({ invitacion }: { invitacion: Invitacion }) {
  const estado = estadoDe(invitacion);
  const estilos = {
    completado: "bg-emerald-50 text-emerald-700 border-emerald-200",
    progreso: "bg-blue-soft text-blue-dark border-blue/20",
    "sin-empezar": "bg-slate-100 text-slate-500 border-slate-200",
  };
  const etiquetas = {
    completado: "Completado",
    progreso: "En progreso",
    "sin-empezar": "Sin empezar",
  };
  const colores = {
    completado: "#059669",
    progreso: "#D97706",
    "sin-empezar": "#64748B",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${estilos[estado]}`}
    >
      <Dot color={colores[estado]} size={6} />
      {etiquetas[estado]}
    </span>
  );
}

function fechaCorta(fecha: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(fecha));
}

export default function AdminCuestionarios() {
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([]);
  const [seleccionada, setSeleccionada] = useState<Invitacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nombre, setNombre] = useState("");
  const [token, setToken] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [borrando, setBorrando] = useState<string | null>(null);
  const [creada, setCreada] = useState<InvitacionCreada | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/admin/cuestionario", {
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        invitaciones?: Invitacion[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudieron cargar los cuestionarios.");
      }

      setInvitaciones(payload.invitaciones ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los cuestionarios.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const completadas = invitaciones.filter(
    (invitacion) => invitacion.completado,
  ).length;

  const linkDe = (tokenInvitacion: string) =>
    typeof window === "undefined"
      ? `/cuestionario/${tokenInvitacion}`
      : `${window.location.origin}/cuestionario/${tokenInvitacion}`;

  const copiarLink = async (tokenInvitacion: string) => {
    try {
      await navigator.clipboard.writeText(linkDe(tokenInvitacion));
      setCopiado(tokenInvitacion);
      window.setTimeout(() => {
        setCopiado((actual) =>
          actual === tokenInvitacion ? null : actual,
        );
      }, 1800);
    } catch {
      setError("No se pudo copiar el link. Puedes copiarlo desde el recuadro.");
    }
  };

  const crearInvitacion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGuardando(true);
    setError("");
    try {
      const response = await fetch("/api/admin/cuestionario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitado_nombre: nombre,
          ...(token.trim() ? { token: token.trim() } : {}),
        }),
      });
      const payload = (await response.json()) as InvitacionCreada & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo crear la invitación.");
      }

      setCreada(payload);
      setNombre("");
      setToken("");
      setMostrarFormulario(false);
      await cargar();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo crear la invitación.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const borrarInvitacion = async (invitacion: Invitacion) => {
    const confirmar = window.confirm(
      `¿Borrar la invitación de ${invitacion.invitado_nombre || invitacion.token}? Esta acción también elimina sus respuestas.`,
    );
    if (!confirmar) {
      return;
    }

    setBorrando(invitacion.token);
    setError("");
    try {
      const response = await fetch("/api/admin/cuestionario", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: invitacion.token }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo borrar la invitación.");
      }

      if (seleccionada?.token === invitacion.token) {
        setSeleccionada(null);
      }
      if (creada?.token === invitacion.token) {
        setCreada(null);
      }
      await cargar();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo borrar la invitación.",
      );
    } finally {
      setBorrando(null);
    }
  };

  const resumenSeleccionado = useMemo(
    () =>
      seleccionada
        ? resumenPorSeccion(seleccionada.respuestas ?? {})
        : [],
    [seleccionada],
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-black text-navy">Cuestionarios</h1>
          <p className="text-[13px] text-muted">
            {invitaciones.length}{" "}
            {invitaciones.length === 1 ? "invitación" : "invitaciones"} ·{" "}
            {completadas} {completadas === 1 ? "completada" : "completadas"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setMostrarFormulario((visible) => !visible);
            setCreada(null);
          }}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-[12px] font-bold text-white transition-colors hover:bg-blue-dark"
        >
          <IconUI name="plus" size={15} /> Nueva invitación
        </button>
      </div>

      {mostrarFormulario && (
        <form
          onSubmit={crearInvitacion}
          className="mb-5 rounded-2xl border border-border bg-white p-5"
        >
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold text-navy">
                Nombre del invitado
              </span>
              <input
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                required
                autoFocus
                placeholder="Ej. Rosy"
                className="w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-[13px] text-navy outline-none transition-colors placeholder:text-muted focus:border-blue"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold text-navy">
                Token personalizado{" "}
                <span className="font-normal text-muted">(opcional)</span>
              </span>
              <input
                value={token}
                onChange={(event) => setToken(event.target.value.toLowerCase())}
                placeholder="rosy"
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                title="Usa minúsculas, números y guiones."
                className="w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-[13px] text-navy outline-none transition-colors placeholder:text-muted focus:border-blue"
              />
            </label>
            <button
              type="submit"
              disabled={guardando}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-yellow px-5 py-2.5 text-[12px] font-black text-navy transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
            >
              <IconUI name="link" size={15} /> {guardando ? "Creando…" : "Crear link"}
            </button>
          </div>
        </form>
      )}

      {creada && (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-[12px] font-black text-emerald-800">
            Invitación creada para {creada.invitado_nombre}
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={linkDe(creada.token)}
              onFocus={(event) => event.currentTarget.select()}
              className="min-w-0 flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-[12px] text-navy outline-none"
            />
            <button
              type="button"
              onClick={() => void copiarLink(creada.token)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-[11px] font-bold text-white"
            >
              <IconUI name={copiado === creada.token ? "check" : "copy"} size={13} />
              {copiado === creada.token ? "¡Copiado!" : "Copiar link"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-semibold text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-navy border-t-transparent" />
        </div>
      ) : invitaciones.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-soft text-blue">
            <IconUI name="clipboard" size={20} />
          </div>
          <p className="text-[14px] font-bold text-navy">
            Aún no hay invitaciones
          </p>
          <p className="mt-1 text-[12px] text-muted">
            Crea la primera para compartir el cuestionario.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {invitaciones.map((invitacion) => {
            const conteo = contarRespondidas(invitacion.respuestas ?? {});
            return (
              <article
                key={invitacion.token}
                className="rounded-2xl border border-border bg-white p-5"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue text-[13px] font-black text-white">
                      {(invitacion.invitado_nombre || invitacion.token)
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-[14px] font-black text-navy">
                          {invitacion.invitado_nombre || "Sin nombre"}
                        </h2>
                        <EstadoPill invitacion={invitacion} />
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted">
                        /cuestionario/{invitacion.token}
                      </p>
                    </div>
                  </div>

                  <div className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-1 text-[11px] xl:w-[300px]">
                    <span className="text-muted">Progreso</span>
                    <span className="font-bold text-navy">
                      {conteo.respondidas} de {conteo.total} respondidas
                    </span>
                    <span className="text-muted">Actualizado</span>
                    <span className="font-semibold text-navy">
                      {fechaCorta(
                        invitacion.enviado_en ?? invitacion.updated_at,
                      )}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                    <button
                      type="button"
                      onClick={() => void copiarLink(invitacion.token)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[11px] font-bold text-navy transition-colors hover:bg-bg"
                    >
                      <IconUI name={copiado === invitacion.token ? "check" : "copy"} size={13} />
                      {copiado === invitacion.token
                        ? "¡Copiado!"
                        : "Copiar link"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSeleccionada(invitacion)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-navy px-3 py-2 text-[11px] font-bold text-white transition-colors hover:bg-blue-dark"
                    >
                      <IconUI name="eye" size={13} /> Ver respuestas
                    </button>
                    <button
                      type="button"
                      onClick={() => void borrarInvitacion(invitacion)}
                      disabled={borrando === invitacion.token}
                      aria-label={`Borrar invitación de ${invitacion.invitado_nombre || invitacion.token}`}
                      title="Borrar invitación"
                      className="cursor-pointer rounded-lg border border-red-100 p-2 text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <IconUI name="trash" size={15} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {seleccionada && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-navy/45"
          role="dialog"
          aria-modal="true"
          aria-label={`Respuestas de ${seleccionada.invitado_nombre || seleccionada.token}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSeleccionada(null);
            }
          }}
        >
          <div className="h-full w-full max-w-2xl overflow-y-auto bg-bg shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-border bg-white px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black text-navy">
                      {seleccionada.invitado_nombre || "Sin nombre"}
                    </h2>
                    <EstadoPill invitacion={seleccionada} />
                  </div>
                  <p className="mt-1 text-[11px] text-muted">
                    Token: {seleccionada.token}
                    {seleccionada.enviado_en
                      ? ` · Enviado el ${fechaCorta(seleccionada.enviado_en)}`
                      : ` · Actualizado el ${fechaCorta(seleccionada.updated_at)}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSeleccionada(null)}
                  aria-label="Cerrar detalle"
                  className="cursor-pointer rounded-lg border border-border px-3 py-2 text-lg leading-none text-muted transition-colors hover:bg-bg hover:text-navy"
                >
                  <IconUI name="x" size={17} />
                </button>
              </div>
            </div>

            <div className="space-y-5 p-6">
              {resumenSeleccionado.map((seccion, indice) => (
                <section
                  key={seccion.seccion}
                  className="overflow-hidden rounded-2xl border border-border bg-white"
                >
                  <div className="border-b border-border bg-navy px-5 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-yellow">
                      {String(indice + 1).padStart(2, "0")} · {seccion.seccion}
                    </p>
                  </div>
                  <div className="divide-y divide-border">
                    {seccion.items.map(({ pregunta, etiqueta }) => (
                      <div key={pregunta.key} className="px-5 py-4">
                        <p className="text-[11px] font-bold leading-relaxed text-muted">
                          {pregunta.pregunta}
                        </p>
                        <p
                          className={`mt-1.5 whitespace-pre-line text-[13px] leading-relaxed ${
                            etiqueta
                              ? "font-semibold text-navy"
                              : "italic text-slate-400"
                          }`}
                        >
                          {etiqueta || "Sin responder"}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
