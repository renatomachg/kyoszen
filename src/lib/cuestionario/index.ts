import data from "../../../docs/cuestionario/preguntas.json";

import type {
  Cuestionario,
  ItemFlujo,
  Pregunta,
  Respuestas,
} from "./tipos";

// El JSON se importa desde docs para mantenerlo como la única fuente de verdad.
export const CUESTIONARIO = data as Cuestionario;

function esPregunta(item: ItemFlujo): item is Pregunta {
  return item.tipo !== "transicion";
}

export function esVisible(
  item: ItemFlujo,
  resp: Respuestas,
): boolean {
  if (!esPregunta(item) || !item.showIf) {
    return true;
  }

  const respuesta = resp[item.showIf.key];

  if (
    item.showIf.includesAny &&
    (!Array.isArray(respuesta) ||
      !item.showIf.includesAny.some((valor) => respuesta.includes(valor)))
  ) {
    return false;
  }

  if (
    item.showIf.equals &&
    (typeof respuesta !== "string" || !item.showIf.equals.includes(respuesta))
  ) {
    return false;
  }

  return true;
}

export function preguntasVisibles(resp: Respuestas): Pregunta[] {
  return CUESTIONARIO.flujo.filter(
    (item): item is Pregunta => esPregunta(item) && esVisible(item, resp),
  );
}

export function estaRespondida(
  pregunta: Pregunta,
  resp: Respuestas,
): boolean {
  if (pregunta.tipo === "text" || pregunta.opcional) {
    return true;
  }

  const respuesta = resp[pregunta.key];

  if (pregunta.tipo === "multi") {
    return Array.isArray(respuesta) && respuesta.length > 0;
  }

  return typeof respuesta === "string" && respuesta.trim().length > 0;
}

export function progreso(
  resp: Respuestas,
  itemActualKey: string,
): { pos: number; total: number } {
  const preguntas = preguntasVisibles(resp);

  return {
    pos: preguntas.findIndex((pregunta) => pregunta.key === itemActualKey) + 1,
    total: preguntas.length,
  };
}

export function etiquetaRespuesta(
  pregunta: Pregunta,
  valor: string | string[] | undefined,
): string {
  if (
    valor === undefined ||
    (typeof valor === "string" && valor.trim().length === 0) ||
    (Array.isArray(valor) && valor.length === 0)
  ) {
    return "";
  }

  if (pregunta.tipo === "text" || !pregunta.opciones) {
    return Array.isArray(valor) ? valor.join(" · ") : valor;
  }

  const etiquetas = (Array.isArray(valor) ? valor : [valor]).map(
    (respuesta) =>
      pregunta.opciones?.find((opcion) => opcion.value === respuesta)?.label ??
      respuesta,
  );

  return etiquetas.join(" · ");
}

export function resumenPorSeccion(
  resp: Respuestas,
): { seccion: string; items: { pregunta: Pregunta; etiqueta: string }[] }[] {
  const secciones = new Map<
    string,
    { pregunta: Pregunta; etiqueta: string }[]
  >();

  for (const pregunta of preguntasVisibles(resp)) {
    const items = secciones.get(pregunta.seccion) ?? [];
    items.push({
      pregunta,
      etiqueta: etiquetaRespuesta(pregunta, resp[pregunta.key]),
    });
    secciones.set(pregunta.seccion, items);
  }

  return Array.from(secciones, ([seccion, items]) => ({ seccion, items }));
}

export function contarRespondidas(
  resp: Respuestas,
): { respondidas: number; total: number } {
  const preguntas = preguntasVisibles(resp);

  const tieneValor = (pregunta: Pregunta, respuestas: Respuestas): boolean => {
    const valor = respuestas[pregunta.key];

    if (pregunta.tipo === "multi") {
      return Array.isArray(valor) && valor.length > 0;
    }

    return typeof valor === "string" && valor.trim().length > 0;
  };

  return {
    respondidas: preguntas.filter((pregunta) => tieneValor(pregunta, resp))
      .length,
    total: preguntas.length,
  };
}
