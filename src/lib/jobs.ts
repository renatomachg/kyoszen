export type Job = {
  id: number;
  titulo: string;
  empresa: string;
  categoria: string;
  ubicacion: string;
  contrato: string;
  jornada: string;
  salario: number;
  badge: string;
  badgeClass: string;
  desc: string;
  tags: string[];
};

export const JOBS: Job[] = [
  { id: 1, titulo: "Auxiliar Administrativo", empresa: "Grupo Corpora", categoria: "Administrativo", ubicacion: "CDMX", contrato: "Tiempo completo", jornada: "Matutina", salario: 12000, badge: "Nuevo", badgeClass: "bg-green-soft text-[#15803d]", desc: "Apoyo en gestion documental, atencion a clientes internos y manejo de agenda ejecutiva.", tags: ["Office 365", "Atencion al cliente", "Organizacion"] },
  { id: 2, titulo: "Operador de Almacen", empresa: "Logistica Norte", categoria: "Operaciones", ubicacion: "Estado de Mexico", contrato: "Tiempo completo", jornada: "Mixta", salario: 10000, badge: "Urgente", badgeClass: "bg-yellow-soft text-[#b45309]", desc: "Control de inventarios, recepcion y despacho de mercancia, manejo de montacargas.", tags: ["Inventarios", "Montacargas", "Logistica"] },
  { id: 3, titulo: "Ejecutivo de Ventas", empresa: "Sigma Retail", categoria: "Ventas", ubicacion: "CDMX", contrato: "Tiempo completo", jornada: "Matutina", salario: 18000, badge: "Disponible", badgeClass: "bg-blue-soft text-blue", desc: "Prospeccion, seguimiento y cierre de ventas B2B. Manejo de CRM y cumplimiento de metas.", tags: ["Ventas B2B", "CRM", "Negociacion"] },
  { id: 4, titulo: "Recepcionista", empresa: "Clinica Vitalis", categoria: "Atencion al cliente", ubicacion: "CDMX", contrato: "Medio tiempo", jornada: "Vespertina", salario: 8000, badge: "Disponible", badgeClass: "bg-blue-soft text-blue", desc: "Atencion presencial y telefonica, coordinacion de citas y gestion de correspondencia.", tags: ["Atencion al cliente", "Multitareas", "Comunicacion"] },
  { id: 5, titulo: "Coordinador de RRHH", empresa: "Grupo Corpora", categoria: "RRHH", ubicacion: "CDMX", contrato: "Tiempo completo", jornada: "Matutina", salario: 22000, badge: "Nuevo", badgeClass: "bg-green-soft text-[#15803d]", desc: "Gestion de nomina, reclutamiento, capacitacion y relaciones laborales en empresa en crecimiento.", tags: ["Nomina", "Reclutamiento", "Relaciones laborales"] },
  { id: 6, titulo: "Vendedor de Campo", empresa: "Sigma Retail", categoria: "Ventas", ubicacion: "Estado de Mexico", contrato: "Tiempo completo", jornada: "Flexible", salario: 15000, badge: "Urgente", badgeClass: "bg-yellow-soft text-[#b45309]", desc: "Visitas a clientes, presentacion de productos y seguimiento posventa en zona Edomex.", tags: ["Ventas externas", "Zona Edomex", "Prospectos"] },
  { id: 7, titulo: "Auxiliar Contable", empresa: "Finanzas MX", categoria: "Administrativo", ubicacion: "Hibrido", contrato: "Tiempo completo", jornada: "Matutina", salario: 13000, badge: "Disponible", badgeClass: "bg-blue-soft text-blue", desc: "Registro de operaciones contables, conciliaciones bancarias y elaboracion de reportes financieros.", tags: ["Contabilidad", "SAP", "Excel avanzado"] },
  { id: 8, titulo: "Agente de Servicio al Cliente", empresa: "Contact Nova", categoria: "Atencion al cliente", ubicacion: "Remoto", contrato: "Por proyecto", jornada: "Flexible", salario: 9500, badge: "Disponible", badgeClass: "bg-blue-soft text-blue", desc: "Atencion a clientes via chat, correo y telefono. Resolucion de incidencias y seguimiento de casos.", tags: ["Zendesk", "Servicio al cliente", "Remoto"] },
];

export function getJobById(id: number): Job | undefined {
  return JOBS.find((j) => j.id === id);
}
