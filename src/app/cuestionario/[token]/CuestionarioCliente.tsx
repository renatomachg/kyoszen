"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import {
  CUESTIONARIO,
  esVisible,
  estaRespondida,
  preguntasVisibles,
  progreso,
} from "@/lib/cuestionario";
import type {
  ItemFlujo,
  Pregunta,
  Respuestas,
} from "@/lib/cuestionario/tipos";

type CuestionarioClienteProps = {
  token: string;
  invitadoNombre: string | null;
  respuestasIniciales: Respuestas;
  pasoInicial: number;
  completadoInicial: boolean;
};

const PASO_REVISION = CUESTIONARIO.flujo.length + 1;

function esPregunta(item: ItemFlujo | undefined): item is Pregunta {
  return Boolean(item && item.tipo !== "transicion");
}

function primerPasoVisible(respuestas: Respuestas) {
  const indice = CUESTIONARIO.flujo.findIndex((item) =>
    esVisible(item, respuestas),
  );
  return indice === -1 ? PASO_REVISION : indice + 1;
}

function normalizarPaso(paso: number, respuestas: Respuestas) {
  if (!Number.isInteger(paso) || paso <= 0) return 0;
  if (paso >= PASO_REVISION) return PASO_REVISION;

  const item = CUESTIONARIO.flujo[paso - 1];
  if (item && esVisible(item, respuestas)) return paso;

  for (let indice = paso; indice < CUESTIONARIO.flujo.length; indice += 1) {
    if (esVisible(CUESTIONARIO.flujo[indice], respuestas)) return indice + 1;
  }

  return PASO_REVISION;
}

function siguientePaso(paso: number, respuestas: Respuestas) {
  const indiceActual = paso - 1;
  for (
    let indice = indiceActual + 1;
    indice < CUESTIONARIO.flujo.length;
    indice += 1
  ) {
    if (esVisible(CUESTIONARIO.flujo[indice], respuestas)) return indice + 1;
  }
  return PASO_REVISION;
}

function pasoAnterior(paso: number, respuestas: Respuestas) {
  const inicio =
    paso === PASO_REVISION ? CUESTIONARIO.flujo.length - 1 : paso - 2;

  for (let indice = inicio; indice >= 0; indice -= 1) {
    if (esVisible(CUESTIONARIO.flujo[indice], respuestas)) return indice + 1;
  }
  return 0;
}

function etiquetaRespuesta(pregunta: Pregunta, respuesta: string | string[] | undefined) {
  if (Array.isArray(respuesta)) {
    return respuesta
      .map(
        (valor) =>
          pregunta.opciones?.find((opcion) => opcion.value === valor)?.label ??
          valor,
      )
      .join(" · ");
  }

  if (typeof respuesta === "string" && respuesta.trim()) {
    return (
      pregunta.opciones?.find((opcion) => opcion.value === respuesta)?.label ??
      respuesta
    );
  }

  return "";
}

export default function CuestionarioCliente({
  token,
  invitadoNombre,
  respuestasIniciales,
  pasoInicial,
  completadoInicial,
}: CuestionarioClienteProps) {
  const [respuestas, setRespuestas] =
    useState<Respuestas>(respuestasIniciales);
  const [paso, setPaso] = useState(() =>
    normalizarPaso(pasoInicial, respuestasIniciales),
  );
  const [completado, setCompletado] = useState(completadoInicial);
  const [mostrarCierre, setMostrarCierre] = useState(completadoInicial);
  const [editando, setEditando] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");
  const autoAvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const itemActual =
    paso > 0 && paso < PASO_REVISION
      ? CUESTIONARIO.flujo[paso - 1]
      : undefined;
  const preguntas = useMemo(
    () => preguntasVisibles(respuestas),
    [respuestas],
  );
  const secciones = useMemo(() => {
    const agrupadas = new Map<string, Pregunta[]>();
    preguntas.forEach((pregunta) => {
      const grupo = agrupadas.get(pregunta.seccion) ?? [];
      grupo.push(pregunta);
      agrupadas.set(pregunta.seccion, grupo);
    });
    return Array.from(agrupadas.entries());
  }, [preguntas]);

  useEffect(() => {
    return () => {
      if (autoAvanceRef.current) clearTimeout(autoAvanceRef.current);
    };
  }, []);

  useEffect(() => {
    if (completado) return;

    let cancelado = false;
    let reintento: ReturnType<typeof setTimeout> | undefined;
    const payload = JSON.stringify({
      respuestas,
      paso_actual: paso,
    });

    const guardar = async (puedeReintentar: boolean) => {
      try {
        const response = await fetch(`/api/cuestionario/${encodeURIComponent(token)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: payload,
        });
        if (!response.ok) throw new Error("No se pudo guardar");
      } catch {
        if (!cancelado && puedeReintentar) {
          reintento = setTimeout(() => void guardar(false), 1600);
        }
      }
    };

    const debounce = setTimeout(() => void guardar(true), 600);
    return () => {
      cancelado = true;
      clearTimeout(debounce);
      if (reintento) clearTimeout(reintento);
    };
  }, [completado, paso, respuestas, token]);

  const avanzar = (respuestasActuales = respuestas) => {
    setErrorEnvio("");

    if (paso === 0) {
      setPaso(primerPasoVisible(respuestasActuales));
      return;
    }

    if (editando) {
      setEditando(null);
      setPaso(PASO_REVISION);
      return;
    }

    setPaso(siguientePaso(paso, respuestasActuales));
  };

  const volver = () => {
    setErrorEnvio("");
    if (autoAvanceRef.current) clearTimeout(autoAvanceRef.current);

    if (editando) {
      setEditando(null);
      setPaso(PASO_REVISION);
      return;
    }

    setPaso(pasoAnterior(paso, respuestas));
  };

  const cambiarSingle = (pregunta: Pregunta, valor: string) => {
    const siguientes = { ...respuestas, [pregunta.key]: valor };
    setRespuestas(siguientes);
    if (autoAvanceRef.current) clearTimeout(autoAvanceRef.current);
    autoAvanceRef.current = setTimeout(() => avanzar(siguientes), 260);
  };

  const cambiarMulti = (pregunta: Pregunta, valor: string) => {
    const actual = Array.isArray(respuestas[pregunta.key])
      ? (respuestas[pregunta.key] as string[])
      : [];
    const siguiente = actual.includes(valor)
      ? actual.filter((item) => item !== valor)
      : [...actual, valor];
    setRespuestas({ ...respuestas, [pregunta.key]: siguiente });
  };

  const cambiarTexto = (pregunta: Pregunta, valor: string) => {
    setRespuestas({ ...respuestas, [pregunta.key]: valor });
  };

  const editarPregunta = (pregunta: Pregunta) => {
    const indice = CUESTIONARIO.flujo.findIndex(
      (item) => esPregunta(item) && item.key === pregunta.key,
    );
    if (indice === -1) return;
    setEditando(pregunta.key);
    setPaso(indice + 1);
  };

  const enviarRespuestas = async () => {
    if (completado) {
      setMostrarCierre(true);
      return;
    }

    setEnviando(true);
    setErrorEnvio("");
    try {
      const response = await fetch(
        `/api/cuestionario/${encodeURIComponent(token)}/enviar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ respuestas }),
        },
      );
      if (!response.ok) throw new Error("No se pudo enviar");
      setCompletado(true);
      setMostrarCierre(true);
    } catch {
      setErrorEnvio(
        "No pudimos enviar tus respuestas. Revisa tu conexión e inténtalo de nuevo.",
      );
    } finally {
      setEnviando(false);
    }
  };

  const preguntaActual = esPregunta(itemActual) ? itemActual : undefined;
  const respuestaActual = preguntaActual
    ? respuestas[preguntaActual.key]
    : undefined;
  const puedeContinuar = preguntaActual
    ? estaRespondida(preguntaActual, respuestas)
    : true;

  let textoContador = "Tu cuestionario";
  let porcentaje = 0;
  if (preguntaActual) {
    const avance = progreso(respuestas, preguntaActual.key);
    textoContador = `Pregunta ${avance.pos} de ${avance.total}`;
    porcentaje = avance.total ? (avance.pos / avance.total) * 100 : 0;
  } else if (itemActual?.tipo === "transicion") {
    const preguntasPrevias = CUESTIONARIO.flujo
      .slice(0, paso - 1)
      .filter((item) => esPregunta(item) && esVisible(item, respuestas)).length;
    textoContador = "Cambio de tema";
    porcentaje = preguntas.length
      ? (preguntasPrevias / preguntas.length) * 100
      : 0;
  } else if (paso === PASO_REVISION) {
    textoContador = "Revisión final";
    porcentaje = 100;
  }
  if (mostrarCierre) {
    textoContador = "Completado";
    porcentaje = 100;
  }

  const saludo = invitadoNombre
    ? `Hola ${invitadoNombre} 👋`
    : CUESTIONARIO.intro.saludo;
  const mostrarNavegacion =
    !mostrarCierre && paso > 0;

  return (
    <div className="cq-root">
      <header className="cq-header">
        <div className="cq-header-row">
          <div className="cq-brand" aria-label="Kyoszen">
            <span className="cq-brand-mark" aria-hidden="true">
              K
            </span>
            <span>Kyoszen</span>
          </div>
          <span className="cq-counter" aria-live="polite">
            {textoContador}
          </span>
        </div>
        <div
          className="cq-progress-track"
          role="progressbar"
          aria-label="Avance del cuestionario"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(porcentaje)}
        >
          <span
            className="cq-progress-value"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </header>

      <main className="cq-main">
        {mostrarCierre ? (
          <section className="cq-card cq-centered cq-closing">
            <div className="cq-seal" aria-hidden="true">
              ✓
            </div>
            <p className="cq-eyebrow">Respuestas enviadas</p>
            <h1>{CUESTIONARIO.cierre.titulo}</h1>
            <p className="cq-lead">{CUESTIONARIO.cierre.texto}</p>
            <button
              type="button"
              className="cq-secondary-button"
              onClick={() => {
                setPaso(PASO_REVISION);
                setMostrarCierre(false);
              }}
            >
              Ver de nuevo
            </button>
          </section>
        ) : paso === 0 ? (
          <section className="cq-card cq-intro">
            <p className="cq-greeting">{saludo}</p>
            <h1>{CUESTIONARIO.intro.titulo}</h1>
            <p className="cq-lead">{CUESTIONARIO.intro.texto}</p>
            <div className="cq-chips" aria-label="Información del cuestionario">
              {CUESTIONARIO.intro.chips.map((chip) => (
                <span key={chip}>✓ {chip}</span>
              ))}
            </div>
            <button
              type="button"
              className="cq-primary-button cq-start"
              onClick={() => avanzar()}
            >
              {CUESTIONARIO.intro.cta}
              <span aria-hidden="true"> →</span>
            </button>
          </section>
        ) : paso === PASO_REVISION ? (
          <section className="cq-card cq-review">
            <p className="cq-eyebrow">Antes de enviar</p>
            <h1>Revisa tus respuestas</h1>
            <p className="cq-review-intro">
              Confirma que todo esté como quieres. Puedes editar cualquier
              respuesta antes de enviarla.
            </p>
            <div className="cq-review-sections">
              {secciones.map(([seccion, preguntasSeccion]) => (
                <section key={seccion} className="cq-review-section">
                  <h2>{seccion}</h2>
                  {preguntasSeccion.map((pregunta) => {
                    const respuesta = etiquetaRespuesta(
                      pregunta,
                      respuestas[pregunta.key],
                    );
                    return (
                      <article key={pregunta.key} className="cq-review-item">
                        <div>
                          <h3>{pregunta.pregunta}</h3>
                          <p className={respuesta ? "" : "cq-unanswered"}>
                            {respuesta || "Sin responder"}
                          </p>
                        </div>
                        {!completado && (
                          <button
                            type="button"
                            onClick={() => editarPregunta(pregunta)}
                            aria-label={`Editar: ${pregunta.pregunta}`}
                          >
                            Editar
                          </button>
                        )}
                      </article>
                    );
                  })}
                </section>
              ))}
            </div>
            {errorEnvio && (
              <p className="cq-error" role="alert">
                {errorEnvio}
              </p>
            )}
          </section>
        ) : itemActual?.tipo === "transicion" ? (
          <section className="cq-card cq-centered cq-transition">
            <div className="cq-transition-icon" aria-hidden="true">
              ↗
            </div>
            <p className="cq-eyebrow">Siguiente sección</p>
            <h1>{itemActual.titulo}</h1>
            <p className="cq-lead">{itemActual.texto}</p>
          </section>
        ) : preguntaActual ? (
          <section className="cq-card cq-question" key={preguntaActual.key}>
            <p className="cq-section-label">{preguntaActual.seccion}</p>
            <h1>{preguntaActual.pregunta}</h1>
            {preguntaActual.ayuda && (
              <p className="cq-help">{preguntaActual.ayuda}</p>
            )}

            {preguntaActual.tipo === "multi" && (
              <p className="cq-multi-hint">Puedes elegir varias</p>
            )}

            {(preguntaActual.tipo === "single" ||
              preguntaActual.tipo === "multi") && (
              <div
                className="cq-options"
                role={preguntaActual.tipo === "single" ? "radiogroup" : "group"}
                aria-label={preguntaActual.pregunta}
              >
                {preguntaActual.opciones?.map((opcion) => {
                  const seleccionada =
                    preguntaActual.tipo === "multi"
                      ? Array.isArray(respuestaActual) &&
                        respuestaActual.includes(opcion.value)
                      : respuestaActual === opcion.value;
                  return (
                    <button
                      key={opcion.value}
                      type="button"
                      className={`cq-option${seleccionada ? " is-selected" : ""}`}
                      role={
                        preguntaActual.tipo === "single" ? "radio" : "checkbox"
                      }
                      aria-checked={seleccionada}
                      onClick={() =>
                        preguntaActual.tipo === "single"
                          ? cambiarSingle(preguntaActual, opcion.value)
                          : cambiarMulti(preguntaActual, opcion.value)
                      }
                    >
                      <span className="cq-choice-indicator" aria-hidden="true">
                        {seleccionada && preguntaActual.tipo === "multi"
                          ? "✓"
                          : ""}
                      </span>
                      <span className="cq-option-copy">
                        <strong>{opcion.label}</strong>
                        {opcion.desc && <small>{opcion.desc}</small>}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {preguntaActual.tipo === "text" &&
              (preguntaActual.input === "area" ? (
                <textarea
                  className="cq-text-input cq-textarea"
                  value={
                    typeof respuestaActual === "string" ? respuestaActual : ""
                  }
                  onChange={(event) =>
                    cambiarTexto(preguntaActual, event.target.value)
                  }
                  placeholder={preguntaActual.placeholder}
                  rows={6}
                  autoFocus
                />
              ) : (
                <input
                  className="cq-text-input"
                  type="text"
                  value={
                    typeof respuestaActual === "string" ? respuestaActual : ""
                  }
                  onChange={(event) =>
                    cambiarTexto(preguntaActual, event.target.value)
                  }
                  onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      avanzar();
                    }
                  }}
                  placeholder={preguntaActual.placeholder}
                  autoFocus
                />
              ))}
          </section>
        ) : null}
      </main>

      {mostrarNavegacion && (
        <footer className="cq-nav">
          <div className="cq-nav-actions">
            <button type="button" className="cq-back-button" onClick={volver}>
              <span aria-hidden="true">←</span> Atrás
            </button>
            <button
              type="button"
              className="cq-primary-button"
              disabled={!puedeContinuar || enviando}
              onClick={() => {
                if (paso === PASO_REVISION) {
                  void enviarRespuestas();
                } else {
                  avanzar();
                }
              }}
            >
              {paso === PASO_REVISION
                ? completado
                  ? "Volver al cierre ✓"
                  : enviando
                    ? "Enviando…"
                    : `${CUESTIONARIO.cierre.cta_enviar} ✓`
                : editando
                  ? "Guardar y volver"
                  : "Continuar"}
            </button>
          </div>
          <p className="cq-save-note">
            <span aria-hidden="true">✓</span> Tu avance se guarda solo · puedes
            pausar y seguir después
          </p>
        </footer>
      )}

      <style jsx global>{`
        .cq-root {
          --cq-blue: #1883ff;
          --cq-blue-dark: #0a4ecc;
          --cq-navy: #042e7b;
          --cq-yellow: #ffcc00;
          min-height: 100vh;
          color: var(--cq-navy);
          background:
            radial-gradient(circle at 8% 15%, rgba(24, 131, 255, 0.12), transparent 30rem),
            radial-gradient(circle at 92% 75%, rgba(4, 46, 123, 0.08), transparent 34rem),
            #f8fafc;
        }
        .cq-root *,
        .cq-root *::before,
        .cq-root *::after {
          box-sizing: border-box;
        }
        .cq-header {
          position: fixed;
          z-index: 50;
          inset: 0 0 auto;
          height: 86px;
          padding: 16px clamp(20px, 4vw, 56px) 0;
          border-bottom: 1px solid rgba(203, 213, 225, 0.7);
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(18px);
        }
        .cq-header-row {
          max-width: 1160px;
          height: 48px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }
        .cq-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: var(--cq-navy);
          font-size: 19px;
          font-weight: 900;
          letter-spacing: -0.03em;
        }
        .cq-brand-mark {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          color: #fff;
          background: linear-gradient(135deg, var(--cq-blue), var(--cq-navy));
          box-shadow: 0 8px 18px rgba(4, 46, 123, 0.2);
        }
        .cq-counter {
          color: #64748b;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.02em;
        }
        .cq-progress-track {
          position: absolute;
          inset: auto 0 0;
          height: 4px;
          overflow: hidden;
          background: #e2e8f0;
        }
        .cq-progress-value {
          display: block;
          height: 100%;
          border-radius: 0 999px 999px 0;
          background: linear-gradient(90deg, var(--cq-blue), var(--cq-blue-dark));
          transition: width 360ms ease;
        }
        .cq-main {
          width: 100%;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 118px 20px 152px;
        }
        .cq-card {
          width: 100%;
          max-width: 640px;
          padding: clamp(28px, 5vw, 48px);
          border: 1px solid rgba(226, 232, 240, 0.95);
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.97);
          box-shadow: 0 24px 70px rgba(4, 46, 123, 0.11);
          animation: cq-enter 320ms ease both;
        }
        .cq-card h1 {
          margin: 0;
          color: var(--cq-navy);
          font-size: clamp(28px, 4.3vw, 40px);
          font-weight: 850;
          letter-spacing: -0.045em;
          line-height: 1.12;
        }
        .cq-greeting {
          margin: 0 0 14px;
          color: var(--cq-blue-dark);
          font-size: 17px;
          font-weight: 800;
        }
        .cq-lead {
          margin: 18px 0 0;
          color: #475569;
          font-size: 16px;
          line-height: 1.7;
        }
        .cq-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          margin: 26px 0 30px;
        }
        .cq-chips span {
          padding: 8px 12px;
          border: 1px solid #dbeafe;
          border-radius: 999px;
          color: var(--cq-blue-dark);
          background: #eff6ff;
          font-size: 12px;
          font-weight: 750;
        }
        .cq-primary-button,
        .cq-secondary-button,
        .cq-back-button,
        .cq-review-item button,
        .cq-option {
          font: inherit;
        }
        .cq-primary-button {
          min-width: 170px;
          min-height: 50px;
          padding: 13px 22px;
          border: 0;
          border-radius: 14px;
          color: #fff;
          background: linear-gradient(135deg, var(--cq-blue), var(--cq-blue-dark));
          box-shadow: 0 10px 24px rgba(10, 78, 204, 0.25);
          cursor: pointer;
          font-size: 14px;
          font-weight: 850;
          transition:
            transform 160ms ease,
            box-shadow 160ms ease,
            opacity 160ms ease;
        }
        .cq-primary-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 14px 28px rgba(10, 78, 204, 0.3);
        }
        .cq-primary-button:disabled {
          opacity: 0.42;
          cursor: not-allowed;
          box-shadow: none;
        }
        .cq-start {
          width: 100%;
        }
        .cq-section-label,
        .cq-eyebrow {
          margin: 0 0 12px;
          color: var(--cq-blue-dark);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.13em;
          text-transform: uppercase;
        }
        .cq-question h1 {
          font-size: clamp(25px, 4vw, 34px);
        }
        .cq-help,
        .cq-review-intro {
          margin: 13px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.65;
        }
        .cq-multi-hint {
          display: inline-block;
          margin: 18px 0 0;
          padding: 6px 10px;
          border-radius: 8px;
          color: #475569;
          background: #f1f5f9;
          font-size: 11px;
          font-weight: 750;
        }
        .cq-options {
          display: grid;
          gap: 10px;
          margin-top: 22px;
        }
        .cq-option {
          width: 100%;
          min-height: 66px;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          text-align: left;
          border: 1.5px solid #dbe3ee;
          border-radius: 15px;
          color: var(--cq-navy);
          background: #fff;
          cursor: pointer;
          transition:
            border-color 150ms ease,
            background 150ms ease,
            transform 150ms ease,
            box-shadow 150ms ease;
        }
        .cq-option:hover {
          border-color: #93c5fd;
          transform: translateY(-1px);
          box-shadow: 0 7px 18px rgba(4, 46, 123, 0.07);
        }
        .cq-option.is-selected {
          border-color: var(--cq-blue);
          background: #eff6ff;
          box-shadow: 0 0 0 3px rgba(24, 131, 255, 0.1);
        }
        .cq-choice-indicator {
          width: 22px;
          height: 22px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          border: 2px solid #cbd5e1;
          border-radius: 50%;
          color: #fff;
          font-size: 12px;
          font-weight: 900;
          transition:
            border-color 150ms ease,
            background 150ms ease;
        }
        [role="checkbox"] .cq-choice-indicator {
          border-radius: 6px;
        }
        .cq-option.is-selected .cq-choice-indicator {
          border-color: var(--cq-blue);
          background: var(--cq-blue);
        }
        [role="radio"].is-selected .cq-choice-indicator::after {
          content: "";
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #fff;
        }
        .cq-option-copy {
          display: grid;
          gap: 3px;
        }
        .cq-option-copy strong {
          font-size: 14px;
          line-height: 1.3;
        }
        .cq-option-copy small {
          color: #64748b;
          font-size: 12px;
          line-height: 1.4;
        }
        .cq-text-input {
          width: 100%;
          min-height: 56px;
          margin-top: 26px;
          padding: 15px 17px;
          border: 1.5px solid #cbd5e1;
          border-radius: 14px;
          outline: none;
          color: var(--cq-navy);
          background: #fff;
          font: inherit;
          font-size: 15px;
          line-height: 1.55;
          transition:
            border-color 150ms ease,
            box-shadow 150ms ease;
        }
        .cq-text-input:focus {
          border-color: var(--cq-blue);
          box-shadow: 0 0 0 4px rgba(24, 131, 255, 0.12);
        }
        .cq-text-input::placeholder {
          color: #94a3b8;
        }
        .cq-textarea {
          resize: vertical;
        }
        .cq-centered {
          text-align: center;
        }
        .cq-transition-icon {
          width: 60px;
          height: 60px;
          display: grid;
          place-items: center;
          margin: 0 auto 22px;
          border-radius: 18px;
          color: #fff;
          background: linear-gradient(135deg, var(--cq-blue), var(--cq-navy));
          box-shadow: 0 12px 26px rgba(4, 46, 123, 0.2);
          font-size: 26px;
          font-weight: 900;
        }
        .cq-seal {
          width: 76px;
          height: 76px;
          display: grid;
          place-items: center;
          margin: 0 auto 24px;
          border: 8px solid #dbeafe;
          border-radius: 50%;
          color: #fff;
          background: linear-gradient(135deg, var(--cq-blue), var(--cq-blue-dark));
          box-shadow: 0 14px 30px rgba(24, 131, 255, 0.22);
          font-size: 31px;
          font-weight: 900;
        }
        .cq-closing .cq-lead {
          max-width: 500px;
          margin-inline: auto;
        }
        .cq-secondary-button {
          min-height: 46px;
          margin-top: 28px;
          padding: 11px 20px;
          border: 1.5px solid #bfdbfe;
          border-radius: 13px;
          color: var(--cq-blue-dark);
          background: #fff;
          cursor: pointer;
          font-size: 13px;
          font-weight: 850;
        }
        .cq-review {
          max-width: 720px;
          padding-bottom: 36px;
        }
        .cq-review h1 {
          font-size: clamp(27px, 4vw, 36px);
        }
        .cq-review-sections {
          display: grid;
          gap: 28px;
          margin-top: 30px;
        }
        .cq-review-section h2 {
          margin: 0 0 9px;
          padding-bottom: 9px;
          border-bottom: 2px solid #dbeafe;
          color: var(--cq-blue-dark);
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .cq-review-item {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          padding: 15px 0;
          border-bottom: 1px solid #edf2f7;
        }
        .cq-review-item h3 {
          margin: 0;
          color: #475569;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.45;
        }
        .cq-review-item p {
          margin: 5px 0 0;
          color: var(--cq-navy);
          font-size: 14px;
          font-weight: 750;
          line-height: 1.5;
          white-space: pre-wrap;
        }
        .cq-review-item .cq-unanswered {
          color: #94a3b8;
          font-weight: 550;
        }
        .cq-review-item button {
          flex: 0 0 auto;
          padding: 5px 0;
          border: 0;
          color: var(--cq-blue-dark);
          background: transparent;
          cursor: pointer;
          font-size: 12px;
          font-weight: 850;
        }
        .cq-review-item button:hover {
          text-decoration: underline;
        }
        .cq-error {
          margin: 22px 0 0;
          padding: 12px 14px;
          border: 1px solid #fecaca;
          border-radius: 12px;
          color: #991b1b;
          background: #fef2f2;
          font-size: 13px;
          line-height: 1.5;
        }
        .cq-nav {
          position: fixed;
          z-index: 50;
          inset: auto 0 0;
          min-height: 118px;
          padding: 14px 20px 12px;
          border-top: 1px solid rgba(203, 213, 225, 0.75);
          background: rgba(255, 255, 255, 0.93);
          backdrop-filter: blur(18px);
        }
        .cq-nav-actions {
          max-width: 640px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .cq-back-button {
          min-height: 48px;
          padding: 10px 10px;
          border: 0;
          color: #475569;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          font-weight: 800;
        }
        .cq-back-button:hover {
          color: var(--cq-navy);
        }
        .cq-save-note {
          margin: 9px auto 0;
          color: #94a3b8;
          text-align: center;
          font-size: 11px;
          font-weight: 650;
        }
        .cq-save-note span {
          color: var(--cq-blue);
          font-weight: 900;
        }
        .cq-primary-button:focus-visible,
        .cq-secondary-button:focus-visible,
        .cq-back-button:focus-visible,
        .cq-option:focus-visible,
        .cq-review-item button:focus-visible {
          outline: 3px solid rgba(24, 131, 255, 0.35);
          outline-offset: 3px;
        }
        @keyframes cq-enter {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 640px) {
          .cq-header {
            height: 78px;
            padding: 12px 18px 0;
          }
          .cq-header-row {
            height: 45px;
          }
          .cq-brand {
            font-size: 17px;
          }
          .cq-brand-mark {
            width: 35px;
            height: 35px;
          }
          .cq-counter {
            font-size: 11px;
          }
          .cq-main {
            align-items: flex-start;
            padding: 98px 14px 145px;
          }
          .cq-card {
            padding: 26px 20px;
            border-radius: 21px;
          }
          .cq-card h1 {
            font-size: 28px;
          }
          .cq-question h1 {
            font-size: 25px;
          }
          .cq-option {
            min-height: 62px;
            padding: 12px 13px;
          }
          .cq-nav {
            min-height: 112px;
            padding-inline: 14px;
          }
          .cq-nav-actions {
            gap: 10px;
          }
          .cq-primary-button {
            min-width: 156px;
          }
          .cq-review-item {
            gap: 10px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .cq-root *,
          .cq-root *::before,
          .cq-root *::after {
            scroll-behavior: auto !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}
