"use client";

/* eslint-disable @next/next/no-img-element */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ESTADO_BLOQUE_UI,
  ESTADO_ETAPA_UI,
  type Archivo,
  type Espacio,
  type EspacioArchivo,
  type EspacioCarpeta,
  type EspacioComentario,
  type Proyecto,
  type ProyectoBloque,
  type ProyectoComentario,
  type ProyectoEscena,
  type ProyectoEtapa,
} from "@/lib/proyectos";
import TableroCliente from "@/components/revisor/TableroCliente";

type Progreso = {
  total: number;
  aprobado: number;
  cambios: number;
  pendiente: number;
};

type EtapaListado = ProyectoEtapa & { progreso: Progreso };
type ProyectoListado = Proyecto & {
  proyecto_escenas: { count: number }[];
  proyecto_etapas: EtapaListado[];
};
type EspacioListado = Espacio & {
  proyectos_count: number;
  archivos_count: number;
  tarjetas_count: number;
  cuestionario: {
    token: string;
    invitado_nombre: string;
    respondidas: number;
    total: number;
    completado: boolean;
  } | null;
};
type BloqueDetalle = ProyectoBloque & {
  proyecto_comentarios: ProyectoComentario[];
};
type EtapaDetalle = ProyectoEtapa & { proyecto_bloques: BloqueDetalle[] };
type ProyectoDetalle = Proyecto & {
  proyecto_escenas: ProyectoEscena[];
  proyecto_etapas: EtapaDetalle[];
};

const C = {
  navy: "#042E7B",
  blue: "#1883FF",
  ink: "#17233C",
  body: "#475569",
  muted: "#64748B",
  faint: "#94A3B8",
  border: "#E2E8F0",
  surface: "#F8FAFC",
  white: "#FFFFFF",
  danger: "#DC2626",
};

async function mensajeError(response: Response, respaldo: string) {
  const data: unknown = await response.json().catch(() => null);
  if (data && typeof data === "object" && "error" in data) {
    const error = (data as Record<string, unknown>).error;
    if (typeof error === "string") return error;
  }
  return respaldo;
}

function textoContenido(contenido: Record<string, unknown>, campo: "locucion" | "en_pantalla") {
  const valor = contenido[campo];
  return typeof valor === "string" ? valor : "";
}

function progresoDe(etapa: EtapaDetalle): Progreso {
  return etapa.proyecto_bloques.reduce<Progreso>(
    (total, bloque) => ({
      total: total.total + 1,
      aprobado: total.aprobado + (bloque.estado === "aprobado" ? 1 : 0),
      cambios: total.cambios + (bloque.estado === "cambios" ? 1 : 0),
      pendiente: total.pendiente + (bloque.estado === "pendiente" ? 1 : 0),
    }),
    { total: 0, aprobado: 0, cambios: 0, pendiente: 0 }
  );
}

function fechaComentario(fecha: string) {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return "";
  return valor.toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function IconoEspacio({
  tipo,
  size = 24,
}: {
  tipo: Espacio["tipo"];
  size?: number;
}) {
  const atributos = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (tipo === "aprobacion") {
    return (
      <svg {...atributos}>
        <path d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72" />
        <path d="M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
    );
  }

  if (tipo === "archivos") {
    return (
      <svg {...atributos}>
        <path d="M2.25 12.75V12a2.25 2.25 0 012.25-2.25h15A2.25 2.25 0 0121.75 12v.75" />
        <path d="M13.06 6.31l-2.12-2.12a1.5 1.5 0 00-1.06-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
      </svg>
    );
  }

  if (tipo === "tablero") {
    return (
      <svg {...atributos}>
        <path d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    );
  }

  return (
    <svg {...atributos}>
      <path d="M4.5 4.5h6v6h-6zm9 0h6v6h-6zm-9 9h6v6h-6zm9 0h6v6h-6z" />
    </svg>
  );
}

function MosaicoEspacio({
  tipo,
  grande = false,
}: {
  tipo: Espacio["tipo"];
  grande?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "grid",
        width: grande ? 54 : 46,
        height: grande ? 54 : 46,
        flexShrink: 0,
        placeItems: "center",
        borderRadius: grande ? 14 : 12,
        background: "#EAF2FF",
        color: C.navy,
      }}
    >
      <IconoEspacio tipo={tipo} size={grande ? 28 : 24} />
    </span>
  );
}

function Spinner({ texto = "Cargando proyectos…" }: { texto?: string }) {
  return (
    <div style={{ padding: "72px 24px", color: C.muted, textAlign: "center" }}>
      <div
        style={{
          width: 32,
          height: 32,
          margin: "0 auto 14px",
          border: `3px solid ${C.border}`,
          borderTopColor: C.blue,
          borderRadius: "50%",
          animation: "proyectos-spin .8s linear infinite",
        }}
      />
      <p style={{ margin: 0, fontSize: 13, fontWeight: 650 }}>{texto}</p>
    </div>
  );
}

function Boton({
  children,
  onClick,
  disabled,
  secundario = false,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  secundario?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        border: `1px solid ${secundario ? C.border : C.blue}`,
        borderRadius: 12,
        background: secundario ? C.white : C.blue,
        color: secundario ? C.navy : C.white,
        padding: "10px 15px",
        fontSize: 13,
        fontWeight: 800,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {children}
    </button>
  );
}

function ArchivoVista({ archivo }: { archivo: Archivo }) {
  if (archivo.tipo.startsWith("image/")) {
    return (
      <a href={archivo.url} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "none" }}>
        <img
          src={archivo.url}
          alt={archivo.nombre}
          style={{ width: "100%", maxHeight: 380, display: "block", objectFit: "contain", background: C.surface }}
        />
        <span style={{ display: "block", padding: "10px 12px", color: C.navy, fontSize: 12, fontWeight: 750 }}>
          {archivo.nombre}
        </span>
      </a>
    );
  }

  if (archivo.tipo.startsWith("video/")) {
    return (
      <div>
        <video controls preload="metadata" style={{ width: "100%", maxHeight: 420, display: "block", background: C.ink }}>
          <source src={archivo.url} type={archivo.tipo} />
          Tu navegador no puede reproducir este video.
        </video>
        <a href={archivo.url} target="_blank" rel="noreferrer" style={{ display: "block", padding: "10px 12px", color: C.navy, fontSize: 12, fontWeight: 750, textDecoration: "none" }}>
          {archivo.nombre}
        </a>
      </div>
    );
  }

  return (
    <a href={archivo.url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 9, padding: 14, color: C.navy, fontSize: 13, fontWeight: 750, textDecoration: "none" }}>
      <span aria-hidden="true">📎</span>
      <span style={{ overflowWrap: "anywhere" }}>{archivo.nombre}</span>
    </a>
  );
}

function Comentarios({ comentarios }: { comentarios: ProyectoComentario[] }) {
  return (
    <div style={{ marginTop: 18, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
      <h5 style={{ margin: "0 0 10px", color: C.navy, fontSize: 12.5, fontWeight: 850 }}>
        Comentarios ({comentarios.length})
      </h5>
      {comentarios.length === 0 ? (
        <p style={{ margin: 0, color: C.faint, fontSize: 12.5 }}>Aún no hay comentarios en esta escena.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {comentarios.map((comentario) => (
            <article key={comentario.id} style={{ border: `1px solid ${C.border}`, borderRadius: 12, background: C.surface, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <p style={{ margin: 0, color: C.navy, fontSize: 12, fontWeight: 800 }}>
                  {comentario.autor_nombre}
                  <span style={{ marginLeft: 7, color: comentario.autor_rol === "cliente" ? C.blue : C.muted, fontSize: 10, textTransform: "capitalize" }}>
                    {comentario.autor_rol}
                  </span>
                </p>
                <time style={{ color: C.faint, fontSize: 10.5 }}>{fechaComentario(comentario.created_at)}</time>
              </div>
              <p style={{ margin: "7px 0 0", color: C.body, fontSize: 12.5, lineHeight: 1.6, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                {comentario.contenido}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function ContenidoBloque({ bloque, etapa }: { bloque: BloqueDetalle; etapa: EtapaDetalle }) {
  if (etapa.tipo === "guion") {
    const locucion = textoContenido(bloque.contenido, "locucion");
    const enPantalla = textoContenido(bloque.contenido, "en_pantalla");
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, background: C.surface, padding: "16px 18px" }}>
          <p style={{ margin: "0 0 7px", color: C.blue, fontSize: 10.5, fontWeight: 850, letterSpacing: ".8px", textTransform: "uppercase" }}>Locución</p>
          <p style={{ margin: 0, color: C.ink, fontSize: 14, lineHeight: 1.75, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
            {locucion || "Sin locución disponible."}
          </p>
        </div>
        {enPantalla && (
          <div style={{ borderLeft: `3px solid ${C.border}`, padding: "3px 0 3px 13px" }}>
            <p style={{ margin: "0 0 4px", color: C.faint, fontSize: 10, fontWeight: 800, letterSpacing: ".7px", textTransform: "uppercase" }}>En pantalla</p>
            <p style={{ margin: 0, color: C.muted, fontSize: 12.5, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{enPantalla}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {bloque.nota && (
        <div style={{ borderLeft: `4px solid ${C.blue}`, borderRadius: "0 10px 10px 0", background: "#EFF6FF", padding: "13px 15px" }}>
          <p style={{ margin: 0, color: C.body, fontSize: 13, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{bloque.nota}</p>
        </div>
      )}
      {bloque.archivos.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))", gap: 12 }}>
          {bloque.archivos.map((archivo, index) => (
            <div key={`${archivo.url}-${index}`} style={{ overflow: "hidden", border: `1px solid ${C.border}`, borderRadius: 12, background: C.white }}>
              <ArchivoVista archivo={archivo} />
            </div>
          ))}
        </div>
      ) : (
        <p style={{ margin: 0, color: C.muted, fontSize: 12.5 }}>Aún no hay archivos disponibles.</p>
      )}
    </div>
  );
}

function TarjetaBloque({
  bloque,
  etapa,
  escena,
  proyectoId,
  accionId,
  cambioId,
  comentario,
  onComentario,
  onAbrirCambios,
  onCancelarCambios,
  onAprobar,
  onCambios,
}: {
  bloque: BloqueDetalle;
  etapa: EtapaDetalle;
  escena: ProyectoEscena | null;
  proyectoId: string;
  accionId: string | null;
  cambioId: string | null;
  comentario: string;
  onComentario: (valor: string) => void;
  onAbrirCambios: (bloqueId: string) => void;
  onCancelarCambios: () => void;
  onAprobar: (bloque: BloqueDetalle) => Promise<void>;
  onCambios: (event: FormEvent<HTMLFormElement>, bloque: BloqueDetalle) => Promise<void>;
}) {
  const ui = ESTADO_BLOQUE_UI[bloque.estado];
  const revisable = etapa.estado !== "bloqueada" && (bloque.estado === "pendiente" || bloque.estado === "cambios");
  const ocupada = accionId !== null;
  const titulo = escena
    ? `Escena ${escena.numero}${escena.titulo ? ` · ${escena.titulo}` : ""}`
    : "Entregable";
  const textareaId = `cambios-${proyectoId}-${bloque.id}`;

  return (
    <article style={{ border: `1px solid ${C.border}`, borderRadius: 14, background: C.white, padding: "18px", boxShadow: "0 3px 14px rgba(4, 46, 123, .045)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <h4 style={{ margin: 0, color: C.navy, fontSize: 15.5, fontWeight: 900, lineHeight: 1.35 }}>{titulo}</h4>
        <span style={{ display: "inline-flex", padding: "5px 10px", border: `1px solid ${ui.color}55`, borderRadius: 999, background: ui.colorSuave, color: ui.color, fontSize: 10.5, fontWeight: 850 }}>
          {bloque.estado === "aprobado" ? "✅ Aprobado" : ui.label}
        </span>
      </div>

      <ContenidoBloque bloque={bloque} etapa={etapa} />

      {revisable && (
        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            <Boton onClick={() => void onAprobar(bloque)} disabled={ocupada}>
              ✅ {accionId === bloque.id ? "Procesando…" : "Aprobar"}
            </Boton>
            <Boton onClick={() => onAbrirCambios(bloque.id)} disabled={ocupada} secundario>
              Necesito cambios
            </Boton>
          </div>

          {cambioId === bloque.id && (
            <form onSubmit={(event) => void onCambios(event, bloque)} style={{ marginTop: 13, border: `1px solid ${C.border}`, borderRadius: 12, background: C.surface, padding: 14 }}>
              <label htmlFor={textareaId} style={{ display: "block", marginBottom: 7, color: C.navy, fontSize: 12, fontWeight: 800 }}>
                Cuéntanos qué debemos ajustar
              </label>
              <textarea
                id={textareaId}
                required
                rows={4}
                value={comentario}
                onChange={(event) => onComentario(event.target.value)}
                placeholder="Describe los cambios que necesitas…"
                style={{ boxSizing: "border-box", width: "100%", resize: "vertical", border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 12px", color: C.ink, background: C.white, font: "inherit", fontSize: 13, lineHeight: 1.55, outlineColor: C.blue }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, marginTop: 10, flexWrap: "wrap" }}>
                <Boton onClick={onCancelarCambios} disabled={ocupada} secundario>Cancelar</Boton>
                <button
                  type="submit"
                  disabled={ocupada || !comentario.trim()}
                  style={{ border: `1px solid ${C.navy}`, borderRadius: 12, background: C.navy, color: C.white, padding: "10px 15px", fontSize: 13, fontWeight: 800, cursor: ocupada || !comentario.trim() ? "not-allowed" : "pointer", opacity: ocupada || !comentario.trim() ? 0.55 : 1 }}
                >
                  {accionId === bloque.id ? "Enviando…" : "Enviar solicitud"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <Comentarios comentarios={bloque.proyecto_comentarios} />
    </article>
  );
}

function DetalleProyecto({
  proyectoId,
  userName,
  onClose,
  onUpdated,
}: {
  proyectoId: string;
  userName: string;
  onClose: () => void;
  onUpdated: () => Promise<void>;
}) {
  const [proyecto, setProyecto] = useState<ProyectoDetalle | null>(null);
  const [etapaId, setEtapaId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [accionId, setAccionId] = useState<string | null>(null);
  const [aprobandoTodas, setAprobandoTodas] = useState(false);
  const [cambioId, setCambioId] = useState<string | null>(null);
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState("");

  const cargarDetalle = useCallback(async () => {
    setCargando(true);
    try {
      const response = await fetch(`/api/revisor/proyectos/${proyectoId}`);
      if (!response.ok) throw new Error(await mensajeError(response, "No se pudo cargar el proyecto."));
      const data = (await response.json()) as ProyectoDetalle;
      setProyecto(data);
      setEtapaId((actual) => {
        const etapaActual = data.proyecto_etapas.find(({ id }) => id === actual);
        if (etapaActual && etapaActual.estado !== "aprobado" && etapaActual.estado !== "bloqueada") return actual;
        const porRevisar = data.proyecto_etapas.find(
          (etapa) => etapa.estado !== "bloqueada" && etapa.proyecto_bloques.some(({ estado }) => estado === "pendiente" || estado === "cambios")
        );
        return porRevisar?.id
          ?? data.proyecto_etapas.find(({ estado }) => estado !== "bloqueada")?.id
          ?? data.proyecto_etapas[0]?.id
          ?? null;
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cargar el proyecto.");
    } finally {
      setCargando(false);
    }
  }, [proyectoId]);

  useEffect(() => {
    void cargarDetalle();
  }, [cargarDetalle]);

  useEffect(() => {
    const cerrarConEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", cerrarConEscape);
    return () => window.removeEventListener("keydown", cerrarConEscape);
  }, [onClose]);

  const etapa = proyecto?.proyecto_etapas.find(({ id }) => id === etapaId) ?? null;
  const escenasPorId = useMemo(
    () => new Map((proyecto?.proyecto_escenas ?? []).map((escena) => [escena.id, escena])),
    [proyecto]
  );
  const bloques = useMemo(() => {
    if (!etapa) return [];
    return [...etapa.proyecto_bloques].sort((a, b) => {
      if (a.escena_id === null) return -1;
      if (b.escena_id === null) return 1;
      return (escenasPorId.get(a.escena_id)?.orden ?? Number.MAX_SAFE_INTEGER)
        - (escenasPorId.get(b.escena_id)?.orden ?? Number.MAX_SAFE_INTEGER);
    });
  }, [escenasPorId, etapa]);
  const progreso = etapa ? progresoDe(etapa) : null;

  const recargarTodo = async () => {
    await Promise.all([cargarDetalle(), onUpdated()]);
  };

  const patchEstado = async (bloqueId: string, estado: "aprobado" | "cambios") => {
    const response = await fetch(`/api/revisor/proyectos/${proyectoId}/bloques/${bloqueId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado, revisor_nombre: userName }),
    });
    if (!response.ok) throw new Error(await mensajeError(response, "No se pudo actualizar la escena."));
  };

  const aprobarBloque = async (bloque: BloqueDetalle) => {
    setAccionId(bloque.id);
    setError("");
    try {
      await patchEstado(bloque.id, "aprobado");
      setCambioId(null);
      setComentario("");
      await recargarTodo();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo aprobar la escena.");
    } finally {
      setAccionId(null);
    }
  };

  const solicitarCambios = async (event: FormEvent<HTMLFormElement>, bloque: BloqueDetalle) => {
    event.preventDefault();
    const contenido = comentario.trim();
    if (!contenido) return;
    setAccionId(bloque.id);
    setError("");
    try {
      const response = await fetch(`/api/revisor/proyectos/${proyectoId}/bloques/${bloque.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autor_nombre: userName, autor_rol: "cliente", contenido }),
      });
      if (!response.ok) throw new Error(await mensajeError(response, "No se pudo guardar el comentario."));
      await patchEstado(bloque.id, "cambios");
      setCambioId(null);
      setComentario("");
      await recargarTodo();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron solicitar los cambios.");
    } finally {
      setAccionId(null);
    }
  };

  const aprobarPendientes = async () => {
    if (!etapa) return;
    const pendientes = bloques.filter(({ estado }) => estado === "pendiente");
    if (pendientes.length === 0) return;
    setAprobandoTodas(true);
    setError("");
    try {
      for (const bloque of pendientes) {
        setAccionId(bloque.id);
        await patchEstado(bloque.id, "aprobado");
      }
      setCambioId(null);
      setComentario("");
      await recargarTodo();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron aprobar todas las escenas.");
      await recargarTodo();
    } finally {
      setAccionId(null);
      setAprobandoTodas(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Detalle del proyecto"
      onMouseDown={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(4, 24, 63, .62)" }}
    >
      <div
        onMouseDown={(event) => event.stopPropagation()}
        style={{ width: "100%", maxWidth: 1040, maxHeight: "92vh", overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: 16, background: C.white, boxShadow: "0 24px 70px rgba(4, 46, 123, .22)" }}
      >
        <header style={{ position: "sticky", top: 0, zIndex: 3, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, borderBottom: `1px solid ${C.border}`, background: C.white, padding: "20px 24px" }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: "0 0 5px", color: C.blue, fontSize: 10.5, fontWeight: 850, letterSpacing: "1.3px", textTransform: "uppercase" }}>Centro de Proyectos</p>
            <h2 style={{ margin: 0, color: C.navy, fontSize: 21, fontWeight: 900, lineHeight: 1.2 }}>{proyecto?.titulo ?? "Proyecto"}</h2>
            <p style={{ margin: "6px 0 0", color: C.muted, fontSize: 12.5 }}>
              {[proyecto?.folio, proyecto?.area].filter(Boolean).join(" · ") || "Detalle de revisión"}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ border: 0, background: "transparent", color: C.muted, padding: "0 3px", fontSize: 28, lineHeight: 1, cursor: "pointer" }}>×</button>
        </header>

        {cargando && !proyecto ? (
          <Spinner texto="Cargando detalle…" />
        ) : (
          <div style={{ padding: "22px 24px 28px" }}>
            {error && (
              <p role="alert" style={{ margin: "0 0 16px", border: "1px solid #FECACA", borderRadius: 12, background: "#FEF2F2", padding: "11px 13px", color: C.danger, fontSize: 12.5, fontWeight: 700 }}>
                {error}
              </p>
            )}

            {proyecto && proyecto.proyecto_etapas.length > 0 ? (
              <>
                <div role="tablist" aria-label="Etapas del proyecto" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "2px 2px 11px" }}>
                  {proyecto.proyecto_etapas.map((item) => {
                    const ui = ESTADO_ETAPA_UI[item.estado];
                    const itemProgreso = progresoDe(item);
                    const seleccionada = item.id === etapaId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="tab"
                        aria-selected={seleccionada}
                        disabled={item.estado === "bloqueada"}
                        title={item.estado === "bloqueada" ? "Disponible cuando apruebes la etapa anterior" : undefined}
                        onClick={() => {
                          setEtapaId(item.id);
                          setCambioId(null);
                          setComentario("");
                          setError("");
                        }}
                        style={{ flexShrink: 0, minWidth: 132, border: `1px solid ${seleccionada ? ui.color : `${ui.color}55`}`, borderRadius: 12, background: ui.colorSuave, color: ui.color, padding: "9px 12px", textAlign: "left", cursor: item.estado === "bloqueada" ? "not-allowed" : "pointer", opacity: item.estado === "bloqueada" ? 0.65 : 1, boxShadow: seleccionada ? `0 0 0 3px ${ui.color}18` : "none" }}
                      >
                        <span style={{ display: "block", fontSize: 12, fontWeight: 850 }}>{item.estado === "bloqueada" ? "🔒 " : ""}{item.nombre}</span>
                        <span style={{ display: "block", marginTop: 3, fontSize: 10.5, fontWeight: 700 }}>
                          {itemProgreso.aprobado}/{itemProgreso.total} aprobadas
                        </span>
                      </button>
                    );
                  })}
                </div>
                {proyecto.proyecto_etapas.some(({ estado }) => estado === "bloqueada") && (
                  <p style={{ margin: "0 2px 12px", color: C.muted, fontSize: 11.5, fontWeight: 650 }}>
                    🔒 Disponible cuando apruebes la etapa anterior
                  </p>
                )}

                {etapa && etapa.estado === "bloqueada" ? (
                  <div style={{ marginTop: 12, border: `1px solid ${C.border}`, borderRadius: 14, background: C.surface, padding: "42px 20px", textAlign: "center" }}>
                    <span aria-hidden="true" style={{ fontSize: 28 }}>🔒</span>
                    <p style={{ margin: "11px 0 0", color: C.body, fontSize: 13.5, fontWeight: 750 }}>Disponible cuando apruebes la etapa anterior</p>
                  </div>
                ) : etapa ? (
                  <section style={{ marginTop: 12 }}>
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 14, marginBottom: 15, flexWrap: "wrap" }}>
                      <div>
                        <p style={{ margin: "0 0 4px", color: C.faint, fontSize: 10.5, fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase" }}>Etapa {etapa.orden}</p>
                        <h3 style={{ margin: 0, color: C.navy, fontSize: 18, fontWeight: 900 }}>{etapa.nombre}</h3>
                        {progreso && (
                          <p style={{ margin: "6px 0 0", color: C.body, fontSize: 12.5, fontWeight: 700 }}>{progreso.aprobado} de {progreso.total} aprobadas</p>
                        )}
                      </div>
                      {progreso && progreso.pendiente > 0 && (
                        <Boton onClick={() => void aprobarPendientes()} disabled={aprobandoTodas || accionId !== null}>
                          ✅ {aprobandoTodas ? "Aprobando…" : "Aprobar todas las pendientes"}
                        </Boton>
                      )}
                    </div>

                    {progreso && (
                      <div aria-label={`${progreso.aprobado} de ${progreso.total} aprobadas`} style={{ height: 8, marginBottom: 18, overflow: "hidden", borderRadius: 999, background: C.border }}>
                        <div style={{ width: `${progreso.total > 0 ? (progreso.aprobado / progreso.total) * 100 : 0}%`, height: "100%", borderRadius: 999, background: ESTADO_BLOQUE_UI.aprobado.color, transition: "width .25s ease" }} />
                      </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                      {bloques.map((bloque) => (
                        <TarjetaBloque
                          key={bloque.id}
                          bloque={bloque}
                          etapa={etapa}
                          escena={bloque.escena_id ? escenasPorId.get(bloque.escena_id) ?? null : null}
                          proyectoId={proyectoId}
                          accionId={accionId}
                          cambioId={cambioId}
                          comentario={cambioId === bloque.id ? comentario : ""}
                          onComentario={setComentario}
                          onAbrirCambios={(bloqueId) => {
                            setCambioId(bloqueId);
                            setComentario("");
                          }}
                          onCancelarCambios={() => {
                            setCambioId(null);
                            setComentario("");
                          }}
                          onAprobar={aprobarBloque}
                          onCambios={solicitarCambios}
                        />
                      ))}
                      {bloques.length === 0 && (
                        <p style={{ margin: 0, border: `1px dashed ${C.border}`, borderRadius: 14, padding: "38px 18px", color: C.muted, fontSize: 13, textAlign: "center" }}>Esta etapa todavía no tiene escenas disponibles.</p>
                      )}
                    </div>
                  </section>
                ) : null}
              </>
            ) : proyecto ? (
              <p style={{ margin: 0, padding: "42px 0", color: C.muted, textAlign: "center" }}>Este proyecto todavía no tiene etapas disponibles.</p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function estadoArchivoUI(estado: EspacioArchivo["estado"]) {
  return ESTADO_BLOQUE_UI[estado];
}

function esPdfArchivo(archivo: Pick<EspacioArchivo, "tipo" | "nombre">) {
  return archivo.tipo === "application/pdf" || archivo.nombre.toLowerCase().endsWith(".pdf");
}

function extensionArchivo(nombre: string) {
  const extension = nombre.split(".").pop();
  return extension && extension !== nombre ? extension.toUpperCase() : "ARCHIVO";
}

function urlMiniaturaPdf(url: string) {
  return `${url.split("#")[0]}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`;
}

function DetalleArchivo({
  espacio,
  archivo,
  userName,
  onClose,
  onUpdated,
}: {
  espacio: Espacio;
  archivo: EspacioArchivo;
  userName: string;
  onClose: () => void;
  onUpdated: () => Promise<void>;
}) {
  const [comentarios, setComentarios] = useState<EspacioComentario[]>([]);
  const [comentario, setComentario] = useState("");
  const [pidiendoCambios, setPidiendoCambios] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [accion, setAccion] = useState<"aprobar" | "cambios" | "comentar" | null>(null);
  const [error, setError] = useState("");
  const ui = estadoArchivoUI(archivo.estado);

  const cargarComentarios = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const response = await fetch(`/api/revisor/proyectos/espacios/${espacio.id}/archivos/${archivo.id}/comments`);
      if (!response.ok) throw new Error(await mensajeError(response, "No se pudieron cargar los comentarios."));
      const data = await response.json() as { comentarios?: EspacioComentario[] };
      setComentarios(Array.isArray(data.comentarios) ? data.comentarios : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron cargar los comentarios.");
    } finally {
      setCargando(false);
    }
  }, [archivo.id, espacio.id]);

  useEffect(() => { void cargarComentarios(); }, [cargarComentarios]);

  useEffect(() => {
    const cerrarConEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", cerrarConEscape);
    return () => window.removeEventListener("keydown", cerrarConEscape);
  }, [onClose]);

  const actualizarEstado = async (estado: "aprobado" | "cambios") => {
    const response = await fetch(`/api/revisor/proyectos/espacios/${espacio.id}/archivos/${archivo.id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado, autor_nombre: userName }),
    });
    if (!response.ok) throw new Error(await mensajeError(response, "No se pudo actualizar el estado."));
  };

  const aprobar = async () => {
    setAccion("aprobar");
    setError("");
    try {
      await actualizarEstado("aprobado");
      await onUpdated();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo aprobar el archivo.");
    } finally {
      setAccion(null);
    }
  };

  const guardarComentario = async (contenido: string) => {
    const response = await fetch(`/api/revisor/proyectos/espacios/${espacio.id}/archivos/${archivo.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contenido, autor_nombre: userName, autor_rol: "cliente" }),
    });
    if (!response.ok) throw new Error(await mensajeError(response, "No se pudo guardar el comentario."));
  };

  const solicitarCambios = async () => {
    if (!comentario.trim()) return;
    setAccion("cambios");
    setError("");
    try {
      await guardarComentario(comentario.trim());
      await actualizarEstado("cambios");
      setComentario("");
      setPidiendoCambios(false);
      await onUpdated();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron solicitar los cambios.");
    } finally {
      setAccion(null);
    }
  };

  const comentar = async () => {
    if (!comentario.trim()) return;
    setAccion("comentar");
    setError("");
    try {
      await guardarComentario(comentario.trim());
      setComentario("");
      await cargarComentarios();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar el comentario.");
    } finally {
      setAccion(null);
    }
  };

  const esImagen = archivo.tipo?.startsWith("image/");
  const esPdf = esPdfArchivo(archivo);

  return (
    <div role="dialog" aria-modal="true" aria-label={`Revisar ${archivo.nombre}`} onMouseDown={onClose} style={{ position: "fixed", inset: 0, zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15, 23, 42, .62)", padding: 16 }}>
      <div onMouseDown={(event) => event.stopPropagation()} style={{ width: "min(1120px, 100%)", maxHeight: "94vh", overflowY: "auto", borderRadius: 18, background: C.white, boxShadow: "0 24px 80px rgba(2, 16, 43, .32)" }}>
        <header style={{ position: "sticky", top: 0, zIndex: 2, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, borderBottom: `1px solid ${C.border}`, background: C.white, padding: "18px 22px" }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: "0 0 5px", color: C.blue, fontSize: 10, fontWeight: 850, letterSpacing: "1px", textTransform: "uppercase" }}>{espacio.nombre}</p>
            <h3 style={{ margin: 0, color: C.navy, fontSize: 18, fontWeight: 900, overflowWrap: "anywhere" }}>{archivo.nombre}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ border: 0, background: "transparent", color: C.muted, padding: 0, fontSize: 28, lineHeight: 1, cursor: "pointer" }}>×</button>
        </header>
        <div style={{ padding: 22 }}>
          <div>
            <div className="h-[60vh] sm:h-[72vh]" style={{ display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: `1px solid ${C.border}`, borderRadius: 14, background: "#172033" }}>
              {esImagen ? (
                <img src={archivo.url} alt={archivo.nombre} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              ) : esPdf ? (
                <iframe src={archivo.url} title={archivo.nombre} className="h-full w-full border-0 bg-white" />
              ) : (
                <div style={{ padding: "52px 24px", color: C.white, textAlign: "center" }}>
                  <span aria-hidden="true" style={{ display: "block", fontSize: 58 }}>📎</span>
                  <p style={{ margin: "14px 0 0", fontSize: 14, fontWeight: 750 }}>Este tipo de archivo no se puede previsualizar.</p>
                  <p style={{ margin: "6px 0 0", color: "#CBD5E1", fontSize: 11.5 }}>{extensionArchivo(archivo.nombre)}</p>
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <a href={archivo.url} target="_blank" rel="noopener noreferrer" style={{ borderRadius: 11, background: C.blue, padding: "10px 15px", color: C.white, fontSize: 12.5, fontWeight: 850, textAlign: "center", textDecoration: "none" }}>Abrir en pestaña nueva ↗</a>
              <a href={archivo.url} download style={{ border: `1px solid ${C.border}`, borderRadius: 11, background: C.white, padding: "10px 15px", color: C.navy, fontSize: 12.5, fontWeight: 850, textAlign: "center", textDecoration: "none" }}>Descargar ↓</a>
            </div>
            {archivo.nota && (
              <div style={{ marginTop: 16, borderLeft: `3px solid ${C.blue}`, borderRadius: "0 10px 10px 0", background: "#EFF6FF", padding: "12px 14px" }}>
                <p style={{ margin: "0 0 4px", color: C.blue, fontSize: 10, fontWeight: 850, letterSpacing: ".8px", textTransform: "uppercase" }}>Nota de Kyoszen</p>
                <p style={{ margin: 0, color: C.body, fontSize: 12.5, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{archivo.nota}</p>
              </div>
            )}
          </div>
          <div style={{ marginTop: 20 }}>
            <span style={{ display: "inline-block", borderRadius: 999, background: ui.colorSuave, padding: "6px 10px", color: ui.color, fontSize: 10.5, fontWeight: 850 }}>{ui.label}</span>
            <div style={{ display: "flex", gap: 9, marginTop: 15, flexWrap: "wrap" }}>
              <Boton onClick={() => void aprobar()} disabled={accion !== null}>✅ {accion === "aprobar" ? "Aprobando…" : "Aprobar"}</Boton>
              <Boton onClick={() => { setPidiendoCambios(true); setComentario(""); }} disabled={accion !== null} secundario>Necesito cambios</Boton>
            </div>
            {pidiendoCambios && (
              <div style={{ marginTop: 13, border: "1px solid #FECACA", borderRadius: 12, background: "#FEF2F2", padding: 12 }}>
                <label style={{ display: "block", marginBottom: 7, color: C.danger, fontSize: 11.5, fontWeight: 800 }}>¿Qué necesitas que ajustemos?</label>
                <textarea value={comentario} onChange={(event) => setComentario(event.target.value)} rows={4} autoFocus placeholder="Describe los cambios con el mayor detalle posible…" style={{ width: "100%", resize: "vertical", border: "1px solid #FCA5A5", borderRadius: 10, background: C.white, padding: "10px 11px", color: C.ink, font: "inherit", fontSize: 12.5, outline: "none" }} />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 9 }}>
                  <button type="button" onClick={() => { setPidiendoCambios(false); setComentario(""); }} style={{ border: 0, background: "transparent", color: C.muted, padding: "8px 10px", fontSize: 12, fontWeight: 750, cursor: "pointer" }}>Cancelar</button>
                  <button type="button" onClick={() => void solicitarCambios()} disabled={!comentario.trim() || accion !== null} style={{ border: 0, borderRadius: 10, background: C.danger, padding: "8px 11px", color: C.white, fontSize: 12, fontWeight: 850, cursor: !comentario.trim() || accion !== null ? "not-allowed" : "pointer", opacity: !comentario.trim() || accion !== null ? .55 : 1 }}>{accion === "cambios" ? "Enviando…" : "Enviar solicitud"}</button>
                </div>
              </div>
            )}
            {error && <p role="alert" style={{ margin: "13px 0 0", borderRadius: 10, background: "#FEF2F2", padding: "9px 11px", color: C.danger, fontSize: 12, fontWeight: 700 }}>{error}</p>}
            <div style={{ marginTop: 22, borderTop: `1px solid ${C.border}`, paddingTop: 17 }}>
              <h4 style={{ margin: 0, color: C.navy, fontSize: 13, fontWeight: 900 }}>Comentarios ({comentarios.length})</h4>
              {cargando ? <p style={{ color: C.muted, fontSize: 12 }}>Cargando comentarios…</p> : comentarios.length === 0 ? (
                <p style={{ color: C.faint, fontSize: 12 }}>Aún no hay comentarios en este archivo.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 11 }}>
                  {comentarios.map((item) => (
                    <article key={item.id} style={{ border: `1px solid ${C.border}`, borderRadius: 11, background: C.surface, padding: "10px 12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <strong style={{ color: C.navy, fontSize: 11.5 }}>{item.autor_nombre || (item.autor_rol === "admin" ? "Kyoszen" : "Cliente")}</strong>
                        <time style={{ color: C.faint, fontSize: 9.5 }}>{fechaComentario(item.created_at)}</time>
                      </div>
                      <p style={{ margin: "5px 0 0", color: C.body, fontSize: 12, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{item.contenido}</p>
                    </article>
                  ))}
                </div>
              )}
              {!pidiendoCambios && (
                <div style={{ marginTop: 12 }}>
                  <textarea value={comentario} onChange={(event) => setComentario(event.target.value)} rows={3} placeholder="Escribe un comentario…" style={{ width: "100%", resize: "vertical", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 11px", color: C.ink, font: "inherit", fontSize: 12.5, outline: "none" }} />
                  <button type="button" onClick={() => void comentar()} disabled={!comentario.trim() || accion !== null} style={{ marginTop: 8, border: 0, borderRadius: 10, background: C.navy, padding: "9px 12px", color: C.white, fontSize: 12, fontWeight: 850, cursor: !comentario.trim() || accion !== null ? "not-allowed" : "pointer", opacity: !comentario.trim() || accion !== null ? .55 : 1 }}>{accion === "comentar" ? "Publicando…" : "Publicar comentario"}</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArchivosCliente({ espacio, userName, onConteosUpdated }: {
  espacio: Espacio;
  userName: string;
  onConteosUpdated: () => Promise<void>;
}) {
  const [archivos, setArchivos] = useState<EspacioArchivo[]>([]);
  const [carpetas, setCarpetas] = useState<EspacioCarpeta[]>([]);
  const [carpetaId, setCarpetaId] = useState<string | null>(null);
  const [archivoId, setArchivoId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const response = await fetch(`/api/revisor/proyectos/espacios/${espacio.id}/archivos`);
      if (!response.ok) throw new Error(await mensajeError(response, "No se pudieron cargar los archivos."));
      const data = await response.json() as {
        archivos?: EspacioArchivo[];
        carpetas?: EspacioCarpeta[];
      };
      setArchivos(Array.isArray(data.archivos) ? data.archivos : []);
      setCarpetas(Array.isArray(data.carpetas) ? data.carpetas : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron cargar los archivos.");
    } finally {
      setCargando(false);
    }
  }, [espacio.id]);

  useEffect(() => {
    setCarpetaId(null);
    setArchivoId(null);
    void cargar();
  }, [cargar]);

  const carpetasActuales = useMemo(
    () => carpetas.filter(({ parent_id }) => parent_id === carpetaId),
    [carpetaId, carpetas]
  );
  const archivosActuales = useMemo(
    () => archivos.filter(({ carpeta_id }) => carpeta_id === carpetaId),
    [archivos, carpetaId]
  );
  const breadcrumb = useMemo(() => {
    const porId = new Map(carpetas.map((carpeta) => [carpeta.id, carpeta]));
    const ruta: EspacioCarpeta[] = [];
    const visitadas = new Set<string>();
    let actual = carpetaId;
    while (actual && !visitadas.has(actual)) {
      visitadas.add(actual);
      const carpeta = porId.get(actual);
      if (!carpeta) break;
      ruta.unshift(carpeta);
      actual = carpeta.parent_id;
    }
    return ruta;
  }, [carpetaId, carpetas]);

  const archivo = archivos.find(({ id }) => id === archivoId) ?? null;
  const actualizar = async () => {
    await Promise.all([cargar(), onConteosUpdated()]);
  };

  if (cargando) return <Spinner texto="Cargando archivos…" />;
  if (error && archivos.length === 0) {
    return <div style={{ border: "1px solid #FECACA", borderRadius: 14, background: "#FEF2F2", padding: "28px 24px", textAlign: "center" }}><p role="alert" style={{ margin: "0 0 13px", color: C.danger, fontSize: 13 }}>{error}</p><Boton onClick={() => void cargar()} secundario>Volver a intentar</Boton></div>;
  }

  return (
    <>
      {error && <p role="alert" style={{ margin: "0 0 13px", borderRadius: 10, background: "#FEF2F2", padding: "9px 11px", color: C.danger, fontSize: 12 }}>{error}</p>}
      <nav aria-label="Ruta de carpetas" style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 15, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setCarpetaId(null)}
          style={{ border: 0, borderRadius: 8, background: carpetaId === null ? "#EAF4FF" : "transparent", padding: "6px 8px", color: carpetaId === null ? C.navy : C.blue, fontSize: 12, fontWeight: 850, cursor: "pointer" }}
        >
          Raíz
        </button>
        {breadcrumb.map((carpeta) => (
          <span key={carpeta.id} style={{ display: "flex", minWidth: 0, alignItems: "center", gap: 5 }}>
            <span aria-hidden="true" style={{ color: C.faint }}>›</span>
            <button
              type="button"
              onClick={() => setCarpetaId(carpeta.id)}
              style={{ maxWidth: 190, overflow: "hidden", border: 0, borderRadius: 8, background: carpeta.id === carpetaId ? "#EAF4FF" : "transparent", padding: "6px 8px", color: carpeta.id === carpetaId ? C.navy : C.blue, fontSize: 12, fontWeight: 850, textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer" }}
            >
              {carpeta.nombre}
            </button>
          </span>
        ))}
      </nav>
      {carpetasActuales.length === 0 && archivosActuales.length === 0 ? (
        <div style={{ border: `1px dashed ${C.border}`, borderRadius: 16, background: C.white, padding: "54px 24px", textAlign: "center" }}>
          <span aria-hidden="true" style={{ fontSize: 36 }}>📂</span>
          <h3 style={{ margin: "13px 0 6px", color: C.navy, fontSize: 16, fontWeight: 900 }}>Esta carpeta está vacía.</h3>
          <p style={{ margin: 0, color: C.muted, fontSize: 13 }}>Cuando haya entregables listos, aparecerán aquí.</p>
        </div>
      ) : (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 230px), 1fr))", alignItems: "start", gap: 15 }}>
        {carpetasActuales.map((carpeta) => (
          <button
            key={carpeta.id}
            type="button"
            onClick={() => setCarpetaId(carpeta.id)}
            style={{ display: "flex", minHeight: 132, alignItems: "center", gap: 14, border: "1px solid #BFDBFE", borderRadius: 14, background: "#F8FBFF", padding: 18, color: C.ink, textAlign: "left", cursor: "pointer", boxShadow: "0 4px 18px rgba(4, 46, 123, .05)" }}
          >
            <span aria-hidden="true" style={{ fontSize: 46 }}>📁</span>
            <span style={{ minWidth: 0 }}>
              <strong style={{ display: "block", overflow: "hidden", color: C.navy, fontSize: 14, fontWeight: 900, textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{carpeta.nombre}</strong>
              <span style={{ display: "block", marginTop: 5, color: C.blue, fontSize: 10, fontWeight: 850, letterSpacing: ".5px", textTransform: "uppercase" }}>Abrir carpeta</span>
            </span>
          </button>
        ))}
        {archivosActuales.map((item) => {
          const ui = estadoArchivoUI(item.estado);
          const esImagen = item.tipo?.startsWith("image/");
          const esPdf = esPdfArchivo(item);
          return (
            <button key={item.id} type="button" onClick={() => setArchivoId(item.id)} style={{ overflow: "hidden", border: `1px solid ${C.border}`, borderRadius: 14, background: C.white, padding: 0, color: C.ink, textAlign: "left", cursor: "pointer", boxShadow: "0 4px 18px rgba(4, 46, 123, .06)" }}>
              <div style={{ display: "flex", width: "100%", aspectRatio: "1 / 1.294", alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: 12, background: "#F1F5F9" }}>
                {esImagen ? (
                  <img src={item.url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center" }} />
                ) : esPdf ? (
                  <iframe src={urlMiniaturaPdf(item.url)} title={`Vista previa de ${item.nombre}`} loading="lazy" tabIndex={-1} style={{ width: "100%", height: "100%", border: 0, background: "#F1F5F9", pointerEvents: "none" }} />
                ) : (
                  <span aria-hidden="true" style={{ textAlign: "center" }}>
                    <span style={{ display: "block", fontSize: 50 }}>📎</span>
                    <span style={{ display: "block", marginTop: 7, color: C.muted, fontSize: 10, fontWeight: 850 }}>{extensionArchivo(item.nombre)}</span>
                  </span>
                )}
              </div>
              <div style={{ padding: 14 }}>
                <span style={{ display: "inline-block", borderRadius: 999, background: ui.colorSuave, padding: "5px 8px", color: ui.color, fontSize: 9.5, fontWeight: 850 }}>{ui.label}</span>
                <h3 style={{ margin: "10px 0 0", color: C.navy, fontSize: 13.5, fontWeight: 900, lineHeight: 1.35, overflowWrap: "anywhere" }}>{item.nombre}</h3>
                {item.nota && <p style={{ margin: "7px 0 0", color: C.muted, fontSize: 11.5, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.nota}</p>}
              </div>
            </button>
          );
        })}
      </div>
      )}
      {archivo && <DetalleArchivo espacio={espacio} archivo={archivo} userName={userName} onClose={() => setArchivoId(null)} onUpdated={actualizar} />}
    </>
  );
}

function TarjetaCuestionario({
  cuestionario,
}: {
  cuestionario: NonNullable<EspacioListado["cuestionario"]>;
}) {
  const estado = cuestionario.completado
    ? {
        texto: "Completado ✓",
        color: "#15803D",
        fondo: "#DCFCE7",
        boton: "Ver respuestas",
      }
    : cuestionario.respondidas > 0
      ? {
          texto: `En progreso · ${cuestionario.respondidas} de ${cuestionario.total}`,
          color: C.blue,
          fondo: "#EAF4FF",
          boton: "Continuar",
        }
      : {
          texto: "Aún no lo has contestado",
          color: C.muted,
          fondo: C.surface,
          boton: "Contestar ahora",
        };

  return (
    <section
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 18,
        marginBottom: 22,
        border: `1px solid ${C.blue}33`,
        borderRadius: 16,
        background: C.white,
        padding: 18,
        boxShadow: "0 8px 24px rgba(4, 46, 123, .08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
        <span
          aria-hidden="true"
          style={{
            display: "grid",
            width: 46,
            height: 46,
            flexShrink: 0,
            placeItems: "center",
            borderRadius: 13,
            background: "#EAF4FF",
            fontSize: 23,
          }}
        >
          📋
        </span>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: 0, color: C.navy, fontSize: 15, fontWeight: 900 }}>
            Cuestionario de onboarding
          </h3>
          <span
            style={{
              display: "inline-block",
              marginTop: 7,
              borderRadius: 999,
              background: estado.fondo,
              padding: "5px 9px",
              color: estado.color,
              fontSize: 11,
              fontWeight: 850,
            }}
          >
            {estado.texto}
          </span>
        </div>
      </div>
      <a
        href={`/cuestionario/${encodeURIComponent(cuestionario.token)}`}
        target="_blank"
        rel="noreferrer"
        style={{
          flexShrink: 0,
          borderRadius: 11,
          background: C.blue,
          padding: "10px 14px",
          color: C.white,
          fontSize: 12,
          fontWeight: 850,
          textDecoration: "none",
        }}
      >
        {estado.boton}
      </a>
    </section>
  );
}

export default function ProyectosCliente({ userName }: { userName: string }) {
  const [proyectos, setProyectos] = useState<ProyectoListado[]>([]);
  const [espacios, setEspacios] = useState<EspacioListado[]>([]);
  const [espacioId, setEspacioId] = useState<string | null>(null);
  const [proyectoId, setProyectoId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargarProyectos = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const [proyectosResponse, espaciosResponse] = await Promise.all([
        fetch("/api/revisor/proyectos"),
        fetch("/api/revisor/proyectos/espacios"),
      ]);
      if (!proyectosResponse.ok) {
        throw new Error(await mensajeError(proyectosResponse, "No se pudieron cargar los proyectos."));
      }
      if (!espaciosResponse.ok) {
        throw new Error(await mensajeError(espaciosResponse, "No se pudieron cargar los espacios."));
      }
      const [proyectosData, espaciosData] = await Promise.all([
        proyectosResponse.json() as Promise<unknown>,
        espaciosResponse.json() as Promise<{ espacios?: EspacioListado[] }>,
      ]);
      setProyectos(Array.isArray(proyectosData) ? proyectosData as ProyectoListado[] : []);
      setEspacios(Array.isArray(espaciosData.espacios) ? espaciosData.espacios : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cargar el Centro de Proyectos.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarProyectos();
  }, [cargarProyectos]);

  const espacio = espacios.find(({ id }) => id === espacioId) ?? null;
  const proyectosDelEspacio = espacio
    ? proyectos.filter(({ espacio_id }) => espacio_id === espacio.id)
    : [];
  const etiquetaTipo = (tipo: Espacio["tipo"]) => ({
    aprobacion: "Aprobación",
    archivos: "Archivos",
    tablero: "Tablero",
  })[tipo];
  const resumenEspacio = (item: EspacioListado) => {
    if (item.tipo === "aprobacion") {
      return `${item.proyectos_count} ${item.proyectos_count === 1 ? "proyecto" : "proyectos"}`;
    }
    if (item.tipo === "archivos") {
      return `${item.archivos_count} ${item.archivos_count === 1 ? "archivo" : "archivos"}`;
    }
    return `${item.tarjetas_count} ${item.tarjetas_count === 1 ? "tarjeta" : "tarjetas"}`;
  };

  const tarjetasProyectos = (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 16 }}>
      {proyectosDelEspacio.map((proyecto) => (
        <button
          key={proyecto.id}
          type="button"
          onClick={() => setProyectoId(proyecto.id)}
          style={{ width: "100%", minHeight: 190, border: `1px solid ${C.border}`, borderRadius: 14, background: C.white, padding: 20, color: C.ink, textAlign: "left", cursor: "pointer", boxShadow: "0 4px 18px rgba(4, 46, 123, .06)" }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: "0 0 7px", color: C.blue, fontSize: 10, fontWeight: 850, letterSpacing: "1.1px", textTransform: "uppercase" }}>{proyecto.folio || "Proyecto"}</p>
              <h2 style={{ margin: 0, color: C.navy, fontSize: 16, fontWeight: 900, lineHeight: 1.3 }}>{proyecto.titulo}</h2>
              <p style={{ margin: "7px 0 0", color: C.muted, fontSize: 12.5 }}>{proyecto.area || "Sin área asignada"}</p>
            </div>
            <span aria-hidden="true" style={{ color: C.blue, fontSize: 20, lineHeight: 1 }}>→</span>
          </div>
          <div style={{ display: "flex", gap: 7, marginTop: 18, overflowX: "auto", paddingBottom: 2 }}>
            {proyecto.proyecto_etapas.map((etapa) => {
              const ui = ESTADO_ETAPA_UI[etapa.estado];
              return (
                <span key={etapa.id} style={{ flexShrink: 0, border: `1px solid ${ui.color}44`, borderRadius: 999, background: ui.colorSuave, padding: "6px 9px", color: ui.color, fontSize: 10.5, fontWeight: 800 }}>
                  {etapa.estado === "bloqueada" ? "🔒 " : ""}{etapa.nombre} · {etapa.progreso.aprobado}/{etapa.progreso.total}
                </span>
              );
            })}
          </div>
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", color: C.ink }}>
      <style>{`
        @keyframes proyectos-spin { to { transform: rotate(360deg); } }
        .espacio-card {
          transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
        }
        .espacio-card:hover {
          transform: translateY(-2px);
          border-color: #BFD5FF !important;
          box-shadow: 0 14px 30px -16px rgba(4, 46, 123, .22) !important;
        }
        .espacio-card:focus-visible {
          outline: 3px solid rgba(24, 131, 255, .22);
          outline-offset: 3px;
        }
        .espacio-card-arrow {
          transition: color 160ms ease, background-color 160ms ease, border-color 160ms ease;
        }
        .espacio-card:hover .espacio-card-arrow {
          border-color: #1883FF !important;
          background: #1883FF !important;
          color: #FFFFFF !important;
        }
      `}</style>

      {cargando ? (
        <Spinner texto="Cargando espacios…" />
      ) : error && espacios.length === 0 ? (
        <div style={{ border: "1px solid #FECACA", borderRadius: 14, background: "#FEF2F2", padding: "28px 24px", textAlign: "center" }}>
          <p role="alert" style={{ margin: "0 0 14px", color: C.danger, fontSize: 13.5, fontWeight: 700 }}>{error}</p>
          <Boton onClick={() => void cargarProyectos()} secundario>Volver a intentar</Boton>
        </div>
      ) : espacios.length === 0 ? (
        <div style={{ maxWidth: 760, margin: "0 auto", border: `1px solid ${C.border}`, borderRadius: 16, background: C.white, padding: "64px 24px", textAlign: "center" }}>
          <span aria-hidden="true" style={{ fontSize: 38 }}>📁</span>
          <h2 style={{ margin: "16px 0 7px", color: C.navy, fontSize: 17, fontWeight: 900 }}>Aún no hay espacios disponibles</h2>
          <p style={{ margin: 0, color: C.muted, fontSize: 13 }}>Cuando haya entregables listos, aparecerán aquí.</p>
        </div>
      ) : espacio ? (
        <>
          <button
            type="button"
            onClick={() => setEspacioId(null)}
            style={{ marginBottom: 18, border: 0, background: "transparent", padding: 0, color: C.blue, fontSize: 13, fontWeight: 850, cursor: "pointer" }}
          >
            ← Espacios
          </button>
          <header style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
              <MosaicoEspacio tipo={espacio.tipo} grande />
              <div>
                <p style={{ margin: "0 0 4px", color: "#6B7A99", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>{etiquetaTipo(espacio.tipo)}</p>
                <h2 style={{ margin: 0, color: C.navy, fontSize: 22, fontWeight: 900, letterSpacing: "-.01em" }}>{espacio.nombre}</h2>
              </div>
            </div>
            {espacio.descripcion && <p style={{ margin: "12px 0 0", color: C.muted, fontSize: 13.5, lineHeight: 1.6 }}>{espacio.descripcion}</p>}
          </header>
          {error && <p role="alert" style={{ margin: "0 0 14px", borderRadius: 10, background: "#FEF2F2", padding: "10px 12px", color: C.danger, fontSize: 12.5 }}>{error}</p>}
          {espacio.cuestionario && (
            <TarjetaCuestionario cuestionario={espacio.cuestionario} />
          )}
          {espacio.tipo === "aprobacion" ? (
            proyectosDelEspacio.length > 0 ? tarjetasProyectos : (
              <div style={{ border: `1px dashed ${C.border}`, borderRadius: 16, background: C.white, padding: "52px 24px", textAlign: "center" }}>
                <span aria-hidden="true" style={{ fontSize: 34 }}>🎬</span>
                <h3 style={{ margin: "13px 0 6px", color: C.navy, fontSize: 16, fontWeight: 900 }}>Aún no hay proyectos para revisar</h3>
                <p style={{ margin: 0, color: C.muted, fontSize: 13 }}>Cuando haya nuevas escenas listas, aparecerán aquí.</p>
              </div>
            )
          ) : espacio.tipo === "archivos" ? (
            <ArchivosCliente espacio={espacio} userName={userName} onConteosUpdated={cargarProyectos} />
          ) : (
            <TableroCliente espacio={espacio} userName={userName} />
          )}
        </>
      ) : (
        <>
          {error && <p role="alert" style={{ margin: "0 0 14px", borderRadius: 10, background: "#FEF2F2", padding: "10px 12px", color: C.danger, fontSize: 12.5 }}>{error}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
            {espacios.map((item) => (
              <button
                key={item.id}
                className="espacio-card"
                type="button"
                onClick={() => setEspacioId(item.id)}
                style={{ width: "100%", minHeight: 210, border: "1px solid #E6EBF5", borderRadius: 16, background: C.white, padding: 22, color: C.ink, textAlign: "left", cursor: "pointer", boxShadow: "0 1px 2px rgba(4, 46, 123, .05)" }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <MosaicoEspacio tipo={item.tipo} />
                  <span
                    className="espacio-card-arrow"
                    aria-hidden="true"
                    style={{ display: "grid", width: 32, height: 32, flexShrink: 0, placeItems: "center", border: "1px solid #E6EBF5", borderRadius: "50%", color: C.muted, fontSize: 17, lineHeight: 1 }}
                  >
                    →
                  </span>
                </div>
                <p style={{ margin: "18px 0 6px", color: "#6B7A99", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>{etiquetaTipo(item.tipo)}</p>
                <h2 style={{ margin: 0, color: C.navy, fontSize: 19, fontWeight: 800, lineHeight: 1.3, letterSpacing: "-.01em" }}>{item.nombre}</h2>
                <p style={{ margin: "12px 0 0", color: C.muted, fontSize: 13 }}>{resumenEspacio(item)}</p>
              </button>
            ))}
          </div>
        </>
      )}

      {proyectoId && (
        <DetalleProyecto
          proyectoId={proyectoId}
          userName={userName}
          onClose={() => setProyectoId(null)}
          onUpdated={cargarProyectos}
        />
      )}
    </div>
  );
}
