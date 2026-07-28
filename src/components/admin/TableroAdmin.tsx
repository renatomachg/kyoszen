"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type {
  Espacio,
  EspacioColumna,
  EspacioComentario,
  EspacioTarjeta,
} from "@/lib/proyectos";

type ColumnaConTarjetas = EspacioColumna & { tarjetas: EspacioTarjeta[] };

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#1883FF] focus:ring-2 focus:ring-[#1883FF]/10 disabled:bg-slate-100";

function IconoTablero({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}

function IconoTarjeta({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M6.75 4.5h10.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25H6.75a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 016.75 4.5zM8.25 9h7.5m-7.5 3h5.25" />
    </svg>
  );
}

async function mensajeError(response: Response, respaldo: string) {
  const data: unknown = await response.json().catch(() => null);
  if (data && typeof data === "object" && "error" in data) {
    const error = (data as Record<string, unknown>).error;
    if (typeof error === "string") return error;
  }
  return respaldo;
}

function HiloComentarios({
  espacioId,
  tarjetaId,
}: {
  espacioId: string;
  tarjetaId: string;
}) {
  const [comentarios, setComentarios] = useState<EspacioComentario[]>([]);
  const [contenido, setContenido] = useState("");
  const [cargando, setCargando] = useState(true);
  const [publicando, setPublicando] = useState(false);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const response = await fetch(
        `/api/revisor/proyectos/espacios/${espacioId}/tarjetas/${tarjetaId}/comments`
      );
      if (!response.ok) {
        throw new Error(await mensajeError(response, "No se pudieron cargar los comentarios."));
      }
      const data = (await response.json()) as { comentarios?: EspacioComentario[] };
      setComentarios(Array.isArray(data.comentarios) ? data.comentarios : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron cargar los comentarios.");
    } finally {
      setCargando(false);
    }
  }, [espacioId, tarjetaId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const publicar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!contenido.trim()) return;
    setPublicando(true);
    setError("");
    try {
      const response = await fetch(
        `/api/revisor/proyectos/espacios/${espacioId}/tarjetas/${tarjetaId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contenido: contenido.trim(),
            autor_nombre: "Kyoszen",
            autor_rol: "admin",
          }),
        }
      );
      if (!response.ok) {
        throw new Error(await mensajeError(response, "No se pudo publicar el comentario."));
      }
      setContenido("");
      await cargar();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo publicar el comentario.");
    } finally {
      setPublicando(false);
    }
  };

  return (
    <section className="border-t border-slate-100 pt-5">
      <h3 className="text-sm font-black text-[#042E7B]">
        Comentarios ({comentarios.length})
      </h3>
      {cargando ? (
        <p className="mt-3 text-xs text-slate-400">Cargando comentarios…</p>
      ) : comentarios.length === 0 ? (
        <p className="mt-3 text-xs text-slate-400">Aún no hay comentarios.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {comentarios.map((comentario) => (
            <article key={comentario.id} className="rounded-xl bg-slate-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
                <strong className="text-[#042E7B]">
                  {comentario.autor_nombre ||
                    (comentario.autor_rol === "admin" ? "Kyoszen" : "Cliente")}
                </strong>
                <time className="text-slate-400">
                  {new Date(comentario.created_at).toLocaleString("es-MX", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </time>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                {comentario.contenido}
              </p>
            </article>
          ))}
        </div>
      )}
      <form onSubmit={publicar} className="mt-3 space-y-2">
        <textarea
          value={contenido}
          onChange={(event) => setContenido(event.target.value)}
          rows={3}
          placeholder="Responder al cliente…"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={publicando || !contenido.trim()}
          className="cursor-pointer rounded-xl bg-[#FFCC00] px-4 py-2.5 text-xs font-black text-[#042E7B] disabled:opacity-50"
        >
          {publicando ? "Publicando…" : "Publicar comentario"}
        </button>
      </form>
      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}

function EditorTarjeta({
  espacioId,
  tarjeta,
  columnas,
  onClose,
  onUpdated,
}: {
  espacioId: string;
  tarjeta: EspacioTarjeta;
  columnas: ColumnaConTarjetas[];
  onClose: () => void;
  onUpdated: () => Promise<void>;
}) {
  const [titulo, setTitulo] = useState(tarjeta.titulo);
  const [descripcion, setDescripcion] = useState(tarjeta.descripcion ?? "");
  const [columnaId, setColumnaId] = useState(tarjeta.columna_id);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGuardando(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/proyectos/espacios/${espacioId}/tarjetas/${tarjeta.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titulo: titulo.trim(),
            descripcion: descripcion.trim() || null,
            columna_id: columnaId,
          }),
        }
      );
      if (!response.ok) {
        throw new Error(await mensajeError(response, "No se pudo guardar la tarjeta."));
      }
      await onUpdated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar la tarjeta.");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    if (!confirm(`¿Eliminar “${tarjeta.titulo}”? Esta acción no se puede deshacer.`)) return;
    setGuardando(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/proyectos/espacios/${espacioId}/tarjetas/${tarjeta.id}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        throw new Error(await mensajeError(response, "No se pudo eliminar la tarjeta."));
      }
      onClose();
      await onUpdated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo eliminar la tarjeta.");
      setGuardando(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Editar ${tarjeta.titulo}`}
      onMouseDown={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4"
    >
      <div
        onMouseDown={(event) => event.stopPropagation()}
        className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-black text-[#042E7B]">Editar tarjeta</h2>
            <p className="mt-1 text-xs text-slate-500">
              Actualiza el trabajo, muévelo de columna o conversa con el cliente.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-2xl text-slate-400"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div className="space-y-5 p-6">
          <form onSubmit={guardar} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#042E7B]">Título</span>
              <input
                required
                value={titulo}
                onChange={(event) => setTitulo(event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#042E7B]">
                Descripción
              </span>
              <textarea
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
                rows={5}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#042E7B]">
                Mover a
              </span>
              <select
                value={columnaId}
                onChange={(event) => setColumnaId(event.target.value)}
                className={inputClass}
              >
                {columnas.map((columna) => (
                  <option key={columna.id} value={columna.id}>
                    {columna.nombre}
                  </option>
                ))}
              </select>
            </label>
            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                {error}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => void eliminar()}
                disabled={guardando}
                className="cursor-pointer rounded-xl px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Eliminar tarjeta
              </button>
              <button
                type="submit"
                disabled={guardando || !titulo.trim()}
                className="cursor-pointer rounded-xl bg-[#FFCC00] px-5 py-2.5 text-xs font-black text-[#042E7B] disabled:opacity-50"
              >
                {guardando ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </form>
          <HiloComentarios espacioId={espacioId} tarjetaId={tarjeta.id} />
        </div>
      </div>
    </div>
  );
}

export default function TableroAdmin({
  espacio,
  onClose,
  onUpdated,
}: {
  espacio: Espacio;
  onClose: () => void;
  onUpdated: () => Promise<void>;
}) {
  const [columnas, setColumnas] = useState<ColumnaConTarjetas[]>([]);
  const [nuevaColumna, setNuevaColumna] = useState("");
  const [nuevaTarjeta, setNuevaTarjeta] = useState<Record<string, string>>({});
  const [tarjetaId, setTarjetaId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [accion, setAccion] = useState(false);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/proyectos/espacios/${espacio.id}/columnas`
      );
      if (!response.ok) {
        throw new Error(await mensajeError(response, "No se pudo cargar el tablero."));
      }
      const data = (await response.json()) as { columnas?: ColumnaConTarjetas[] };
      setColumnas(Array.isArray(data.columnas) ? data.columnas : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cargar el tablero.");
    } finally {
      setCargando(false);
    }
  }, [espacio.id]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const crearColumna = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!nuevaColumna.trim()) return;
    setAccion(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/proyectos/espacios/${espacio.id}/columnas`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre: nuevaColumna.trim() }),
        }
      );
      if (!response.ok) {
        throw new Error(await mensajeError(response, "No se pudo crear la columna."));
      }
      setNuevaColumna("");
      await cargar();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo crear la columna.");
    } finally {
      setAccion(false);
    }
  };

  const renombrarColumna = async (columna: ColumnaConTarjetas, nombre: string) => {
    const limpio = nombre.trim();
    if (!limpio || limpio === columna.nombre) return;
    setError("");
    const response = await fetch(
      `/api/admin/proyectos/espacios/${espacio.id}/columnas/${columna.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: limpio }),
      }
    );
    if (!response.ok) {
      setError(await mensajeError(response, "No se pudo renombrar la columna."));
      return;
    }
    await cargar();
  };

  const eliminarColumna = async (columna: ColumnaConTarjetas) => {
    const aviso = columna.tarjetas.length
      ? `¿Eliminar “${columna.nombre}” y sus ${columna.tarjetas.length} tarjetas?`
      : `¿Eliminar la columna “${columna.nombre}”?`;
    if (!confirm(aviso)) return;
    setError("");
    const response = await fetch(
      `/api/admin/proyectos/espacios/${espacio.id}/columnas/${columna.id}`,
      { method: "DELETE" }
    );
    if (!response.ok) {
      setError(await mensajeError(response, "No se pudo eliminar la columna."));
      return;
    }
    await Promise.all([cargar(), onUpdated()]);
  };

  const crearTarjeta = async (
    event: FormEvent<HTMLFormElement>,
    columnaId: string
  ) => {
    event.preventDefault();
    const titulo = nuevaTarjeta[columnaId]?.trim();
    if (!titulo) return;
    setAccion(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/proyectos/espacios/${espacio.id}/tarjetas`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ columna_id: columnaId, titulo }),
        }
      );
      if (!response.ok) {
        throw new Error(await mensajeError(response, "No se pudo crear la tarjeta."));
      }
      setNuevaTarjeta((actual) => ({ ...actual, [columnaId]: "" }));
      await Promise.all([cargar(), onUpdated()]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo crear la tarjeta.");
    } finally {
      setAccion(false);
    }
  };

  const tarjeta = columnas
    .flatMap(({ tarjetas }) => tarjetas)
    .find(({ id }) => id === tarjetaId);

  return (
    <div className="fixed inset-0 z-50 bg-[#F8FAFC]">
      <div className="flex h-full flex-col">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E6EBF5] bg-white px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EAF2FF] text-[#042E7B]"><IconoTablero className="h-7 w-7" /></span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.08em] text-[#6B7A99]">Tablero</p>
              <h2 className="text-xl font-black text-[#042E7B]">{espacio.nombre}</h2>
              <p className="mt-1 text-xs text-slate-500">
                Organiza las tarjetas por etapa y abre una para editarla o comentar.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-[#042E7B]"
          >
            Cerrar tablero
          </button>
        </header>
        <div className="flex-1 overflow-auto p-6">
          {error && (
            <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}
          {cargando ? (
            <div className="flex min-h-52 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1883FF] border-t-transparent" />
            </div>
          ) : (
            <div className="flex min-h-[420px] items-start gap-[18px] overflow-x-auto pb-5">
              {columnas.map((columna) => (
                <section
                  key={columna.id}
                  className="w-[310px] shrink-0 rounded-2xl border border-[#E6EBF5] bg-[#F3F6FB] p-3.5 shadow-[0_1px_2px_rgba(4,46,123,.05)]"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <input
                      defaultValue={columna.nombre}
                      onBlur={(event) =>
                        void renombrarColumna(columna, event.target.value)
                      }
                      className="min-w-0 flex-1 border-0 bg-transparent px-1 text-sm font-black text-[#042E7B] outline-none"
                      aria-label={`Nombre de columna ${columna.nombre}`}
                    />
                    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-500">
                      {columna.tarjetas.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => void eliminarColumna(columna)}
                      className="cursor-pointer px-1 text-lg text-slate-400 hover:text-red-600"
                      aria-label={`Eliminar columna ${columna.nombre}`}
                    >
                      ×
                    </button>
                  </div>
                  <div className="space-y-2">
                    {columna.tarjetas.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTarjetaId(item.id)}
                        className="group block w-full cursor-pointer rounded-xl border border-[#E6EBF5] bg-white p-3.5 text-left shadow-[0_1px_2px_rgba(4,46,123,.05)] transition duration-150 hover:-translate-y-0.5 hover:border-[#BFD5FF] hover:shadow-[0_10px_24px_-16px_rgba(4,46,123,.3)]"
                      >
                        <strong className="block text-sm leading-5 text-[#042E7B]">
                          {item.titulo}
                        </strong>
                        {item.descripcion && (
                          <span className="mt-2 block line-clamp-2 text-xs leading-5 text-slate-500">
                            {item.descripcion}
                          </span>
                        )}
                        <span className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-2.5 text-[10px] font-bold text-[#1883FF]">
                          <IconoTarjeta />Abrir tarjeta
                        </span>
                      </button>
                    ))}
                  </div>
                  <form
                    onSubmit={(event) => void crearTarjeta(event, columna.id)}
                    className="mt-3"
                  >
                    <input
                      value={nuevaTarjeta[columna.id] ?? ""}
                      onChange={(event) =>
                        setNuevaTarjeta((actual) => ({
                          ...actual,
                          [columna.id]: event.target.value,
                        }))
                      }
                      placeholder="Título de la tarjeta"
                      className={inputClass}
                    />
                    <button
                      type="submit"
                      disabled={accion || !nuevaTarjeta[columna.id]?.trim()}
                      className="mt-2 w-full cursor-pointer rounded-xl border border-[#BFD5FF] bg-white px-3 py-2.5 text-xs font-black text-[#1883FF] hover:bg-blue-50 disabled:opacity-50"
                    >
                      + Añadir tarjeta
                    </button>
                  </form>
                </section>
              ))}
              <form
                onSubmit={crearColumna}
                className="w-[290px] shrink-0 rounded-2xl border border-dashed border-[#BFD5FF] bg-[#EAF2FF]/50 p-3.5"
              >
                <input
                  value={nuevaColumna}
                  onChange={(event) => setNuevaColumna(event.target.value)}
                  placeholder="Nombre de la columna"
                  className={inputClass}
                />
                <button
                  type="submit"
                  disabled={accion || !nuevaColumna.trim()}
                  className="mt-2 w-full cursor-pointer rounded-xl bg-[#FFCC00] px-3 py-2.5 text-xs font-black text-[#042E7B] disabled:opacity-50"
                >
                  + Añadir columna
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
      {tarjeta && (
        <EditorTarjeta
          espacioId={espacio.id}
          tarjeta={tarjeta}
          columnas={columnas}
          onClose={() => setTarjetaId(null)}
          onUpdated={cargar}
        />
      )}
    </div>
  );
}
