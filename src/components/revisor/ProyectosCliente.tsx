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
  type Proyecto,
  type ProyectoBloque,
  type ProyectoComentario,
  type ProyectoEscena,
  type ProyectoEtapa,
} from "@/lib/proyectos";

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

export default function ProyectosCliente({ userName }: { userName: string }) {
  const [proyectos, setProyectos] = useState<ProyectoListado[]>([]);
  const [proyectoId, setProyectoId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargarProyectos = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/revisor/proyectos");
      if (!response.ok) throw new Error(await mensajeError(response, "No se pudieron cargar los proyectos."));
      const data: unknown = await response.json();
      setProyectos(Array.isArray(data) ? data as ProyectoListado[] : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron cargar los proyectos.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarProyectos();
  }, [cargarProyectos]);

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", color: C.ink }}>
      <style>{`@keyframes proyectos-spin { to { transform: rotate(360deg); } }`}</style>

      {cargando ? (
        <Spinner />
      ) : error && proyectos.length === 0 ? (
        <div style={{ border: "1px solid #FECACA", borderRadius: 14, background: "#FEF2F2", padding: "28px 24px", textAlign: "center" }}>
          <p role="alert" style={{ margin: "0 0 14px", color: C.danger, fontSize: 13.5, fontWeight: 700 }}>{error}</p>
          <Boton onClick={() => void cargarProyectos()} secundario>Volver a intentar</Boton>
        </div>
      ) : proyectos.length === 0 ? (
        <div style={{ maxWidth: 760, margin: "0 auto", border: `1px solid ${C.border}`, borderRadius: 16, background: C.white, padding: "64px 24px", textAlign: "center" }}>
          <span aria-hidden="true" style={{ fontSize: 38 }}>📁</span>
          <h2 style={{ margin: "16px 0 7px", color: C.navy, fontSize: 17, fontWeight: 900 }}>Aún no hay proyectos para revisar</h2>
          <p style={{ margin: 0, color: C.muted, fontSize: 13 }}>Cuando haya nuevas escenas listas, aparecerán aquí.</p>
        </div>
      ) : (
        <>
          {error && <p role="alert" style={{ margin: "0 0 14px", borderRadius: 10, background: "#FEF2F2", padding: "10px 12px", color: C.danger, fontSize: 12.5 }}>{error}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 16 }}>
            {proyectos.map((proyecto) => (
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
