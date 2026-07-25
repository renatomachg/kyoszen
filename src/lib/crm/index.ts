import type { EstadoPipeline } from "./tipos";

export type {
  Candidato,
  CandidatoMatch,
  EstadoPipeline,
  Nota,
  ResultadoMatch,
  VacanteMatch,
} from "./tipos";
export {
  normalizarTexto,
  puntuarCandidato,
  rankear,
  tokenizar,
} from "./matching";

export const ESTADOS: {
  value: EstadoPipeline;
  label: string;
  color: string;
  orden: number;
}[] = [
  {
    value: "nuevo",
    label: "Nuevo",
    color: "bg-blue-100 text-blue-700",
    orden: 1,
  },
  {
    value: "contactado",
    label: "Contactado",
    color: "bg-sky-100 text-sky-700",
    orden: 2,
  },
  {
    value: "entrevista",
    label: "Entrevista",
    color: "bg-indigo-100 text-indigo-700",
    orden: 3,
  },
  {
    value: "enviado",
    label: "Enviado a cliente",
    color: "bg-cyan-100 text-cyan-700",
    orden: 4,
  },
  {
    value: "contratado",
    label: "Contratado",
    color: "bg-green-100 text-green-700",
    orden: 5,
  },
  {
    value: "descartado",
    label: "Descartado",
    color: "bg-gray-100 text-gray-600",
    orden: 6,
  },
];
