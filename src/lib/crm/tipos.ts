export type EstadoPipeline =
  | "nuevo"
  | "contactado"
  | "entrevista"
  | "enviado"
  | "contratado"
  | "descartado";

export interface Candidato {
  id: string;
  nombre: string | null;
  correo: string | null;
  whatsapp: string | null;
  ubicacion: string | null;
  experiencia: string | null;
  cv_url: string | null;
  estado: EstadoPipeline;
  origen: "aplicacion" | "contacto" | "manual";
  created_at: string;
  updated_at: string;
}

export interface Nota {
  id: string;
  candidato_id: string;
  texto: string;
  autor: string | null;
  created_at: string;
}

export interface VacanteMatch {
  id: number;
  titulo: string;
  categoria: string | null;
  ubicacion: string | null;
  requisitos: string[];
  tags: string[];
}

export interface CandidatoMatch {
  id: string;
  nombre: string | null;
  experiencia: string | null;
  ubicacion: string | null;
  categoriasAplicadas: string[];
}

export interface ResultadoMatch {
  candidatoId: string;
  score: number;
  razones: string[];
}
