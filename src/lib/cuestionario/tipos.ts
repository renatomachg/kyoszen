export type Opcion = {
  value: string;
  label: string;
  desc?: string;
};

export type Condicion = {
  key: string;
  includesAny?: string[];
  equals?: string[];
};

export type Pregunta = {
  key: string;
  seccion: string;
  tipo: "single" | "multi" | "text";
  input?: "line" | "area";
  opcional?: boolean;
  showIf?: Condicion;
  opciones?: Opcion[];
  pregunta: string;
  ayuda?: string;
  placeholder?: string;
};

export type Transicion = {
  tipo: "transicion";
  titulo: string;
  texto: string;
};

export type ItemFlujo = Pregunta | Transicion;

export type Intro = {
  saludo: string;
  titulo: string;
  texto: string;
  chips: string[];
  cta: string;
};

export type Cierre = {
  titulo: string;
  texto: string;
  cta_enviar: string;
};

export type Cuestionario = {
  version: number;
  titulo: string;
  intro: Intro;
  flujo: ItemFlujo[];
  cierre: Cierre;
};

export type Respuestas = Record<string, string | string[]>;
