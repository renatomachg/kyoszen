-- Seed: importar vacantes hardcodeadas a Supabase
-- Correr en Supabase > SQL Editor

INSERT INTO vacantes (id, titulo, empresa, categoria, ubicacion, contrato, jornada, salario, badge, badge_class, descripcion, tags, responsabilidades, requisitos, activa) VALUES
(1, 'Auxiliar Administrativo', 'Grupo Corpora', 'Administrativo', 'CDMX', 'Tiempo completo', 'Matutina', 12000, 'Nuevo', 'bg-green-soft text-[#15803d]', 'Apoyo en gestion documental, atencion a clientes internos y manejo de agenda ejecutiva.',
  ARRAY['Office 365','Atencion al cliente','Organizacion'],
  ARRAY['Gestion y archivo de documentos fisicos y digitales','Atencion a clientes internos y proveedores','Manejo de agenda y coordinacion de reuniones','Elaboracion de reportes y minutas','Control de correspondencia y paqueteria'],
  ARRAY['Preparatoria terminada o carrera tecnica en Administracion','Manejo intermedio de Office 365 (Word, Excel, Outlook)','Experiencia minima de 6 meses en puesto similar','Buena organizacion y atencion al detalle','Disponibilidad de horario matutino'],
  true),

(2, 'Operador de Almacen', 'Logistica Norte', 'Operaciones', 'Estado de Mexico', 'Tiempo completo', 'Mixta', 10000, 'Urgente', 'bg-yellow-soft text-[#b45309]', 'Control de inventarios, recepcion y despacho de mercancia, manejo de montacargas.',
  ARRAY['Inventarios','Montacargas','Logistica'],
  ARRAY['Recepcion, clasificacion y despacho de mercancia','Control y actualizacion de inventarios en sistema','Operacion de montacargas y equipo de carga','Verificacion de condiciones de almacenamiento','Elaboracion de reportes de entradas y salidas'],
  ARRAY['Secundaria terminada (preparatoria deseable)','Licencia de montacargas vigente','Experiencia minima de 1 año en almacen o logistica','Capacidad para cargar hasta 25 kg','Disponibilidad para jornada mixta'],
  true),

(3, 'Ejecutivo de Ventas', 'Sigma Retail', 'Ventas', 'CDMX', 'Tiempo completo', 'Matutina', 18000, 'Disponible', 'bg-blue-soft text-blue', 'Prospeccion, seguimiento y cierre de ventas B2B. Manejo de CRM y cumplimiento de metas.',
  ARRAY['Ventas B2B','CRM','Negociacion'],
  ARRAY['Prospeccion y generacion de nuevos clientes B2B','Seguimiento puntual a oportunidades de venta','Cierre de negociaciones y elaboracion de propuestas','Mantenimiento y actualizacion del CRM','Cumplimiento de metas mensuales de venta'],
  ARRAY['Licenciatura en Administracion, Mercadotecnia o afin','Experiencia minima de 2 años en ventas B2B','Manejo de CRM (HubSpot, Salesforce o similar)','Habilidades de negociacion y comunicacion','Auto propio (deseable)'],
  true),

(4, 'Recepcionista', 'Clinica Vitalis', 'Atencion al cliente', 'CDMX', 'Medio tiempo', 'Vespertina', 8000, 'Disponible', 'bg-blue-soft text-blue', 'Atencion presencial y telefonica, coordinacion de citas y gestion de correspondencia.',
  ARRAY['Atencion al cliente','Multitareas','Comunicacion'],
  ARRAY['Atencion presencial y telefonica a pacientes y visitantes','Coordinacion y agendamiento de citas medicas','Gestion de correspondencia y paqueteria','Mantenimiento del area de recepcion en orden','Apoyo administrativo al equipo medico'],
  ARRAY['Preparatoria terminada','Excelente presentacion y trato al publico','Experiencia minima de 6 meses en recepcion o atencion al cliente','Manejo basico de herramientas de oficina','Disponibilidad en horario vespertino (14:00 a 20:00)'],
  true),

(5, 'Coordinador de RRHH', 'Grupo Corpora', 'RRHH', 'CDMX', 'Tiempo completo', 'Matutina', 22000, 'Nuevo', 'bg-green-soft text-[#15803d]', 'Gestion de nomina, reclutamiento, capacitacion y relaciones laborales en empresa en crecimiento.',
  ARRAY['Nomina','Reclutamiento','Relaciones laborales'],
  ARRAY['Administracion y procesamiento de nomina quincenal','Reclutamiento y seleccion de personal operativo y administrativo','Diseño e implementacion de programas de capacitacion','Gestion de relaciones laborales y clima organizacional','Cumplimiento de obligaciones legales laborales (IMSS, INFONAVIT, SAT)'],
  ARRAY['Licenciatura en Administracion, Psicologia o Relaciones Industriales','Experiencia minima de 3 años en puesto similar','Conocimiento de Ley Federal del Trabajo y normatividad laboral','Manejo de sistemas de nomina (NOI, SUA o similar)','Liderazgo, organizacion y comunicacion efectiva'],
  true),

(6, 'Vendedor de Campo', 'Sigma Retail', 'Ventas', 'Estado de Mexico', 'Tiempo completo', 'Flexible', 15000, 'Urgente', 'bg-yellow-soft text-[#b45309]', 'Visitas a clientes, presentacion de productos y seguimiento posventa en zona Edomex.',
  ARRAY['Ventas externas','Zona Edomex','Prospectos'],
  ARRAY['Visitas programadas a clientes actuales y prospectos','Presentacion y demostracion de productos en punto de venta','Levantamiento de pedidos y seguimiento posventa','Cobertura de ruta asignada en zona Estado de Mexico','Reporte diario de actividades y resultados'],
  ARRAY['Preparatoria terminada (licenciatura deseable)','Experiencia minima de 1 año en ventas de campo o ruta','Licencia de conducir vigente y auto propio','Conocimiento de la zona Estado de Mexico','Disponibilidad para horario flexible y trabajo en campo'],
  true),

(7, 'Auxiliar Contable', 'Finanzas MX', 'Administrativo', 'Hibrido', 'Tiempo completo', 'Matutina', 13000, 'Disponible', 'bg-blue-soft text-blue', 'Registro de operaciones contables, conciliaciones bancarias y elaboracion de reportes financieros.',
  ARRAY['Contabilidad','SAP','Excel avanzado'],
  ARRAY['Registro de polizas contables y operaciones diarias','Conciliaciones bancarias mensuales','Elaboracion de reportes financieros y estados de cuenta','Apoyo en declaraciones fiscales y cierre mensual','Archivo y organizacion de documentacion contable'],
  ARRAY['Licenciatura en Contaduria o Finanzas (pasante o titulado)','Manejo intermedio-avanzado de Excel','Experiencia con SAP, CONTPAQi o sistema contable similar','Experiencia minima de 1 año en area contable','Conocimientos basicos de normatividad fiscal mexicana'],
  true),

(8, 'Agente de Servicio al Cliente', 'Contact Nova', 'Atencion al cliente', 'Remoto', 'Por proyecto', 'Flexible', 9500, 'Disponible', 'bg-blue-soft text-blue', 'Atencion a clientes via chat, correo y telefono. Resolucion de incidencias y seguimiento de casos.',
  ARRAY['Zendesk','Servicio al cliente','Remoto'],
  ARRAY['Atencion a clientes por chat, correo electronico y telefono','Resolucion de incidencias y quejas en primer contacto','Seguimiento y documentacion de casos en Zendesk','Escalamiento de casos complejos al area correspondiente','Cumplimiento de metricas de calidad y tiempo de respuesta'],
  ARRAY['Preparatoria terminada','Experiencia minima de 6 meses en atencion al cliente o call center','Manejo basico de Zendesk o plataforma de tickets (deseable)','Buena redaccion y comunicacion verbal','Equipo de computo propio y conexion a internet estable'],
  true);

-- Resetear el auto-increment para que las nuevas vacantes sigan desde el 9
SELECT setval('vacantes_id_seq', 8);
