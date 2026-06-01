export interface PuestoSalario {
  puesto: string;
  categoria: string;
  min: number;
  mediana: number;
  max: number;
  fuente: string;
}

// Datos de mercado CDMX / Área Metropolitana
// Fuente: IMSS, OCC Mundial, Indeed México, STPS — 2024-2025
export const SALARIOS: PuestoSalario[] = [
  // ── Operativos ──
  { puesto: "Cajero", categoria: "Operativo", min: 8000, mediana: 10500, max: 14000, fuente: "Estimado de mercado · CDMX 2025" },
  { puesto: "Cajero Bancario", categoria: "Operativo", min: 9500, mediana: 13000, max: 17000, fuente: "Estimado de mercado · CDMX 2025" },
  { puesto: "Almacenista", categoria: "Operativo", min: 8500, mediana: 11000, max: 14500, fuente: "Estimado de mercado · CDMX 2025" },
  { puesto: "Auxiliar de Almacén", categoria: "Operativo", min: 7500, mediana: 9500, max: 12500, fuente: "Estimado de mercado · CDMX 2025" },
  { puesto: "Operador de Montacargas", categoria: "Operativo", min: 10000, mediana: 14000, max: 19000, fuente: "Estimado de mercado · CDMX 2025" },
  { puesto: "Chofer de Reparto", categoria: "Operativo", min: 9500, mediana: 13500, max: 18000, fuente: "Estimado de mercado · CDMX 2025" },
  { puesto: "Chofer Foráneo", categoria: "Operativo", min: 12000, mediana: 17000, max: 24000, fuente: "Estimado de mercado · CDMX 2025" },
  { puesto: "Vigilante / Seguridad", categoria: "Operativo", min: 7800, mediana: 10000, max: 13500, fuente: "Estimado de mercado · CDMX 2025" },
  { puesto: "Limpieza / Intendencia", categoria: "Operativo", min: 7000, mediana: 8500, max: 11000, fuente: "Estimado de mercado · CDMX 2025" },
  { puesto: "Operador de Producción", categoria: "Operativo", min: 8500, mediana: 11500, max: 15000, fuente: "Estimado de mercado · CDMX 2025" },
  { puesto: "Auxiliar de Producción", categoria: "Operativo", min: 7500, mediana: 9500, max: 12000, fuente: "Estimado de mercado · CDMX 2025" },

  // ── Administrativos ──
  { puesto: "Auxiliar Administrativo", categoria: "Administrativo", min: 9000, mediana: 12000, max: 16500, fuente: "Estimado de mercado · CDMX 2025" },
  { puesto: "Auxiliar Contable", categoria: "Administrativo", min: 10000, mediana: 14000, max: 20000, fuente: "Estimado de mercado · CDMX 2025" },
  { puesto: "Recepcionista", categoria: "Administrativo", min: 9000, mediana: 12000, max: 15500, fuente: "Estimado de mercado · CDMX 2025" },
  { puesto: "Asistente Ejecutiva", categoria: "Administrativo", min: 12000, mediana: 17000, max: 25000, fuente: "Estimado de mercado · CDMX 2025" },
  { puesto: "Capturista de Datos", categoria: "Administrativo", min: 8500, mediana: 11000, max: 14000, fuente: "Estimado de mercado · CDMX 2025" },
  { puesto: "Coordinador Administrativo", categoria: "Administrativo", min: 15000, mediana: 22000, max: 32000, fuente: "Estimado de mercado · CDMX 2025" },
  { puesto: "Gerente Administrativo", categoria: "Administrativo", min: 22000, mediana: 35000, max: 55000, fuente: "Estimado de mercado · CDMX 2025" },

  // ── Atención al cliente ──
  { puesto: "Atención al Cliente", categoria: "Atención al cliente", min: 9000, mediana: 12500, max: 16000, fuente: "Estimado de mercado · CDMX 2025" },
  { puesto: "Ejecutivo de Call Center", categoria: "Atención al cliente", min: 8500, mediana: 12000, max: 16000, fuente: "Estimado de mercado · CDMX 2025" },
  { puesto: "Asesor de Servicio", categoria: "Atención al cliente", min: 10000, mediana: 14000, max: 19000, fuente: "Estimado de mercado · CDMX 2025" },

  // ── Ventas ──
  { puesto: "Vendedor / Asesor Comercial", categoria: "Ventas", min: 9000, mediana: 16000, max: 28000, fuente: "Estimado de mercado · CDMX 2025" },
  { puesto: "Promotor de Ventas", categoria: "Ventas", min: 8000, mediana: 11500, max: 16000, fuente: "Estimado de mercado · CDMX 2025" },
  { puesto: "Ejecutivo de Ventas", categoria: "Ventas", min: 12000, mediana: 20000, max: 38000, fuente: "Estimado de mercado · CDMX 2025" },
  { puesto: "Gerente de Ventas", categoria: "Ventas", min: 22000, mediana: 38000, max: 65000, fuente: "Estimado de mercado · CDMX 2025" },

  // ── Recursos Humanos ──
  { puesto: "Reclutador", categoria: "Recursos Humanos", min: 12000, mediana: 18000, max: 27000, fuente: "Estimado de mercado · CDMX 2025" },
  { puesto: "Analista de Nómina", categoria: "Recursos Humanos", min: 14000, mediana: 20000, max: 30000, fuente: "Estimado de mercado · CDMX 2025" },
  { puesto: "Coordinador de RRHH", categoria: "Recursos Humanos", min: 18000, mediana: 28000, max: 42000, fuente: "Estimado de mercado · CDMX 2025" },
  { puesto: "Gerente de RRHH", categoria: "Recursos Humanos", min: 30000, mediana: 48000, max: 75000, fuente: "Estimado de mercado · CDMX 2025" },

  // ── Técnicos / Mantenimiento ──
  { puesto: "Técnico de Mantenimiento", categoria: "Técnico", min: 12000, mediana: 18000, max: 26000, fuente: "Estimado de mercado · CDMX 2025" },
  { puesto: "Técnico Electricista", categoria: "Técnico", min: 13000, mediana: 20000, max: 30000, fuente: "Estimado de mercado · CDMX 2025" },
  { puesto: "Técnico en Refrigeración", categoria: "Técnico", min: 14000, mediana: 22000, max: 32000, fuente: "Estimado de mercado · CDMX 2025" },
  { puesto: "Control de Calidad", categoria: "Técnico", min: 10000, mediana: 15500, max: 22000, fuente: "Estimado de mercado · CDMX 2025" },
  { puesto: "Supervisor de Producción", categoria: "Técnico", min: 15000, mediana: 22000, max: 32000, fuente: "Estimado de mercado · CDMX 2025" },
];

export function buscarPuestos(query: string): PuestoSalario[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return SALARIOS.filter(p =>
    p.puesto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(q) ||
    p.categoria.toLowerCase().includes(q)
  ).slice(0, 8);
}

export function getNivel(salarioActual: number, datos: PuestoSalario): "bajo" | "mercado" | "alto" {
  if (salarioActual < datos.min * 0.95) return "bajo";
  if (salarioActual > datos.max * 1.05) return "alto";
  return "mercado";
}
