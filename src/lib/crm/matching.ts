import type {
  CandidatoMatch,
  ResultadoMatch,
  VacanteMatch,
} from "./tipos";

const STOPWORDS = new Set([
  "de",
  "la",
  "el",
  "en",
  "y",
  "con",
  "para",
  "por",
  "los",
  "las",
  "un",
  "una",
  "unos",
  "unas",
  "del",
  "al",
  "que",
  "se",
  "su",
  "sus",
  "es",
  "son",
  "como",
  "más",
  "mas",
  "o",
  "a",
  "e",
  "lo",
  "le",
  "les",
  "ya",
  "si",
  "sin",
  "sobre",
  "entre",
  "desde",
  "hasta",
]);

const PESO_UBICACION = 40;
const PESO_CATEGORIA = 35;
const PESO_PALABRA = 5;
const MAX_PALABRAS = 5;
const MAXIMO_TEORICO =
  PESO_UBICACION + PESO_CATEGORIA + PESO_PALABRA * MAX_PALABRAS;

export function normalizarTexto(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizar(s: string): string[] {
  return normalizarTexto(s)
    .split(" ")
    .filter((palabra) => palabra.length >= 3 && !STOPWORDS.has(palabra));
}

export function puntuarCandidato(
  vacante: VacanteMatch,
  candidato: CandidatoMatch,
): ResultadoMatch {
  let puntos = 0;
  const razones: string[] = [];

  const ubicacionVacante = normalizarTexto(vacante.ubicacion ?? "");
  const ubicacionCandidato = normalizarTexto(candidato.ubicacion ?? "");

  if (
    ubicacionVacante &&
    ubicacionCandidato &&
    (ubicacionVacante.includes(ubicacionCandidato) ||
      ubicacionCandidato.includes(ubicacionVacante))
  ) {
    puntos += PESO_UBICACION;
    razones.push(`Misma zona: ${vacante.ubicacion}`);
  }

  const categoriaVacante = normalizarTexto(vacante.categoria ?? "");
  const coincideCategoria =
    categoriaVacante !== "" &&
    candidato.categoriasAplicadas.some(
      (categoria) => normalizarTexto(categoria) === categoriaVacante,
    );

  if (coincideCategoria) {
    puntos += PESO_CATEGORIA;
    razones.push(`Ya aplicó a vacantes de ${vacante.categoria}`);
  }

  const textoVacante = [
    vacante.titulo,
    ...vacante.requisitos,
    ...vacante.tags,
  ].join(" ");
  const tokensVacante = new Set(tokenizar(textoVacante));
  const tokensExperiencia = new Set(tokenizar(candidato.experiencia ?? ""));
  const coincidencias = [...tokensVacante]
    .filter((token) => tokensExperiencia.has(token))
    .slice(0, MAX_PALABRAS);

  if (coincidencias.length > 0) {
    puntos += coincidencias.length * PESO_PALABRA;
    razones.push(`Coincide en: ${coincidencias.slice(0, 4).join(", ")}`);
  }

  return {
    candidatoId: candidato.id,
    score: Math.round((puntos / MAXIMO_TEORICO) * 100),
    razones: razones.slice(0, 4),
  };
}

export function rankear(
  vacante: VacanteMatch,
  candidatos: CandidatoMatch[],
): ResultadoMatch[] {
  return candidatos
    .map((candidato) => puntuarCandidato(vacante, candidato))
    .filter((resultado) => resultado.score > 0)
    .sort((a, b) => b.score - a.score);
}
