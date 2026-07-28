"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type {
  Espacio,
  EspacioColumna,
  EspacioComentario,
  EspacioTarjeta,
} from "@/lib/proyectos";

type ColumnaConTarjetas = EspacioColumna & { tarjetas: EspacioTarjeta[] };

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

function DetalleTarjeta({
  espacio,
  tarjeta,
  userName,
  onClose,
}: {
  espacio: Espacio;
  tarjeta: EspacioTarjeta;
  userName: string;
  onClose: () => void;
}) {
  const [comentarios, setComentarios] = useState<EspacioComentario[]>([]);
  const [contenido, setContenido] = useState("");
  const [cargando, setCargando] = useState(true);
  const [publicando, setPublicando] = useState(false);
  const [error, setError] = useState("");

  const cargarComentarios = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const response = await fetch(
        `/api/revisor/proyectos/espacios/${espacio.id}/tarjetas/${tarjeta.id}/comments`
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
  }, [espacio.id, tarjeta.id]);

  useEffect(() => {
    void cargarComentarios();
  }, [cargarComentarios]);

  const publicar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!contenido.trim()) return;
    setPublicando(true);
    setError("");
    try {
      const response = await fetch(
        `/api/revisor/proyectos/espacios/${espacio.id}/tarjetas/${tarjeta.id}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contenido: contenido.trim(),
            autor_nombre: userName || "Cliente",
            autor_rol: "cliente",
          }),
        }
      );
      if (!response.ok) {
        throw new Error(await mensajeError(response, "No se pudo publicar el comentario."));
      }
      setContenido("");
      await cargarComentarios();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo publicar el comentario.");
    } finally {
      setPublicando(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={tarjeta.titulo}
      onMouseDown={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(15, 23, 42, .62)",
        padding: 16,
      }}
    >
      <div
        onMouseDown={(event) => event.stopPropagation()}
        style={{
          width: "min(680px, 100%)",
          maxHeight: "92vh",
          overflowY: "auto",
          borderRadius: 16,
          background: C.white,
          boxShadow: "0 24px 70px rgba(15, 23, 42, .3)",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            borderBottom: `1px solid ${C.border}`,
            padding: "20px 22px",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 5px",
                color: C.blue,
                fontSize: 10,
                fontWeight: 850,
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              Tarjeta del tablero
            </p>
            <h3 style={{ margin: 0, color: C.navy, fontSize: 19, fontWeight: 900 }}>
              {tarjeta.titulo}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              border: 0,
              background: "transparent",
              color: C.faint,
              fontSize: 25,
              lineHeight: 1,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </header>
        <div style={{ padding: 22 }}>
          <section>
            <h4
              style={{
                margin: "0 0 8px",
                color: C.navy,
                fontSize: 12,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: ".7px",
              }}
            >
              Descripción
            </h4>
            <p
              style={{
                margin: 0,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                background: C.surface,
                padding: "14px 15px",
                color: tarjeta.descripcion ? C.body : C.faint,
                fontSize: 13,
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
              }}
            >
              {tarjeta.descripcion || "Esta tarjeta no tiene una descripción adicional."}
            </p>
          </section>
          <section
            style={{
              marginTop: 20,
              borderTop: `1px solid ${C.border}`,
              paddingTop: 18,
            }}
          >
            <h4 style={{ margin: 0, color: C.navy, fontSize: 13, fontWeight: 900 }}>
              Comentarios ({comentarios.length})
            </h4>
            {cargando ? (
              <p style={{ color: C.muted, fontSize: 12 }}>Cargando comentarios…</p>
            ) : comentarios.length === 0 ? (
              <p style={{ color: C.faint, fontSize: 12 }}>
                Aún no hay comentarios en esta tarjeta.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 9,
                  marginTop: 11,
                }}
              >
                {comentarios.map((comentario) => (
                  <article
                    key={comentario.id}
                    style={{
                      border: `1px solid ${C.border}`,
                      borderRadius: 12,
                      background: C.surface,
                      padding: "11px 13px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <strong style={{ color: C.navy, fontSize: 11.5 }}>
                        {comentario.autor_nombre ||
                          (comentario.autor_rol === "admin" ? "Kyoszen" : "Cliente")}
                      </strong>
                      <time style={{ color: C.faint, fontSize: 10 }}>
                        {fechaComentario(comentario.created_at)}
                      </time>
                    </div>
                    <p
                      style={{
                        margin: "6px 0 0",
                        color: C.body,
                        fontSize: 12.5,
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {comentario.contenido}
                    </p>
                  </article>
                ))}
              </div>
            )}
            <form onSubmit={publicar} style={{ marginTop: 13 }}>
              <textarea
                required
                value={contenido}
                onChange={(event) => setContenido(event.target.value)}
                rows={3}
                placeholder="Escribe un comentario…"
                style={{
                  boxSizing: "border-box",
                  width: "100%",
                  resize: "vertical",
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  padding: "10px 11px",
                  color: C.ink,
                  font: "inherit",
                  fontSize: 12.5,
                  outlineColor: C.blue,
                }}
              />
              <button
                type="submit"
                disabled={publicando || !contenido.trim()}
                style={{
                  marginTop: 8,
                  border: 0,
                  borderRadius: 10,
                  background: C.navy,
                  padding: "9px 13px",
                  color: C.white,
                  fontSize: 12,
                  fontWeight: 850,
                  cursor: publicando || !contenido.trim() ? "not-allowed" : "pointer",
                  opacity: publicando || !contenido.trim() ? 0.55 : 1,
                }}
              >
                {publicando ? "Publicando…" : "Publicar comentario"}
              </button>
            </form>
            {error && (
              <p
                role="alert"
                style={{
                  margin: "11px 0 0",
                  borderRadius: 10,
                  background: "#FEF2F2",
                  padding: "9px 11px",
                  color: C.danger,
                  fontSize: 12,
                }}
              >
                {error}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default function TableroCliente({
  espacio,
  userName,
}: {
  espacio: Espacio;
  userName: string;
}) {
  const [columnas, setColumnas] = useState<ColumnaConTarjetas[]>([]);
  const [tarjetaId, setTarjetaId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const response = await fetch(
        `/api/revisor/proyectos/espacios/${espacio.id}/tablero`
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

  const tarjetas = columnas.flatMap((columna) => columna.tarjetas);
  const tarjeta = tarjetas.find(({ id }) => id === tarjetaId);

  if (cargando) {
    return (
      <div style={{ padding: "64px 24px", color: C.muted, textAlign: "center" }}>
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
        <p style={{ margin: 0, fontSize: 13, fontWeight: 650 }}>Cargando tablero…</p>
      </div>
    );
  }

  if (error && columnas.length === 0) {
    return (
      <div
        style={{
          border: "1px solid #FECACA",
          borderRadius: 14,
          background: "#FEF2F2",
          padding: "28px 24px",
          textAlign: "center",
        }}
      >
        <p role="alert" style={{ margin: "0 0 13px", color: C.danger, fontSize: 13 }}>
          {error}
        </p>
        <button
          type="button"
          onClick={() => void cargar()}
          style={{
            border: `1px solid ${C.border}`,
            borderRadius: 11,
            background: C.white,
            padding: "9px 13px",
            color: C.navy,
            fontSize: 12,
            fontWeight: 850,
            cursor: "pointer",
          }}
        >
          Volver a intentar
        </button>
      </div>
    );
  }

  if (columnas.length === 0 || tarjetas.length === 0) {
    return (
      <div
        style={{
          border: `1px dashed ${C.border}`,
          borderRadius: 16,
          background: C.white,
          padding: "58px 24px",
          textAlign: "center",
        }}
      >
        <span aria-hidden="true" style={{ fontSize: 38 }}>
          🧩
        </span>
        <h3
          style={{
            margin: "13px 0 6px",
            color: C.navy,
            fontSize: 16,
            fontWeight: 900,
          }}
        >
          El plan de trabajo aparecerá aquí muy pronto.
        </h3>
      </div>
    );
  }

  return (
    <>
      {error && (
        <p
          role="alert"
          style={{
            margin: "0 0 13px",
            borderRadius: 10,
            background: "#FEF2F2",
            padding: "9px 11px",
            color: C.danger,
            fontSize: 12,
          }}
        >
          {error}
        </p>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 15,
          overflowX: "auto",
          paddingBottom: 14,
        }}
      >
        {columnas.map((columna) => (
          <section
            key={columna.id}
            style={{
              width: 292,
              flex: "0 0 292px",
              border: `1px solid ${C.border}`,
              borderRadius: 15,
              background: C.surface,
              padding: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                marginBottom: 11,
                padding: "2px 2px 0",
              }}
            >
              <h3 style={{ margin: 0, color: C.navy, fontSize: 13.5, fontWeight: 900 }}>
                {columna.nombre}
              </h3>
              <span
                style={{
                  borderRadius: 999,
                  background: C.white,
                  padding: "4px 8px",
                  color: C.muted,
                  fontSize: 9.5,
                  fontWeight: 850,
                }}
              >
                {columna.tarjetas.length}
              </span>
            </div>
            {columna.tarjetas.length === 0 ? (
              <p
                style={{
                  margin: 0,
                  border: `1px dashed ${C.border}`,
                  borderRadius: 11,
                  background: C.white,
                  padding: "18px 10px",
                  color: C.faint,
                  fontSize: 11.5,
                  textAlign: "center",
                }}
              >
                Sin tarjetas
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {columna.tarjetas.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTarjetaId(item.id)}
                    style={{
                      width: "100%",
                      border: `1px solid ${C.border}`,
                      borderRadius: 12,
                      background: C.white,
                      padding: "13px 14px",
                      color: C.ink,
                      textAlign: "left",
                      cursor: "pointer",
                      boxShadow: "0 3px 10px rgba(4, 46, 123, .05)",
                    }}
                  >
                    <strong
                      style={{
                        display: "block",
                        color: C.navy,
                        fontSize: 13,
                        lineHeight: 1.45,
                      }}
                    >
                      {item.titulo}
                    </strong>
                    {item.descripcion && (
                      <span
                        style={{
                          display: "block",
                          marginTop: 8,
                          color: C.blue,
                          fontSize: 10.5,
                          fontWeight: 800,
                        }}
                      >
                        ☰ Incluye descripción
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
      {tarjeta && (
        <DetalleTarjeta
          espacio={espacio}
          tarjeta={tarjeta}
          userName={userName}
          onClose={() => setTarjetaId(null)}
        />
      )}
    </>
  );
}
