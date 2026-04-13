"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";

const JOBS = [
  { id: 1, titulo: "Auxiliar Administrativo", categoria: "Administrativo", ubicacion: "CDMX", contrato: "Tiempo completo", salario: 12000, badge: "Nuevo", badgeClass: "bg-green-soft text-[#15803d]", desc: "Apoyo en gestion documental, atencion a clientes internos y manejo de agenda ejecutiva.", tags: ["Office 365", "Atencion al cliente", "Organizacion"] },
  { id: 2, titulo: "Operador de Almacen", categoria: "Operaciones", ubicacion: "Estado de Mexico", contrato: "Tiempo completo", salario: 10000, badge: "Urgente", badgeClass: "bg-yellow-soft text-[#b45309]", desc: "Control de inventarios, recepcion y despacho de mercancia, manejo de montacargas.", tags: ["Inventarios", "Montacargas", "Logistica"] },
  { id: 3, titulo: "Ejecutivo de Ventas", categoria: "Ventas", ubicacion: "CDMX", contrato: "Tiempo completo", salario: 18000, badge: "Disponible", badgeClass: "bg-blue-soft text-blue", desc: "Prospeccion, seguimiento y cierre de ventas B2B. Manejo de CRM y cumplimiento de metas.", tags: ["Ventas B2B", "CRM", "Negociacion"] },
  { id: 4, titulo: "Recepcionista", categoria: "Atencion al cliente", ubicacion: "CDMX", contrato: "Medio tiempo", salario: 8000, badge: "Disponible", badgeClass: "bg-blue-soft text-blue", desc: "Atencion presencial y telefonica, coordinacion de citas y gestion de correspondencia.", tags: ["Atencion al cliente", "Multitareas", "Comunicacion"] },
  { id: 5, titulo: "Coordinador de RRHH", categoria: "RRHH", ubicacion: "CDMX", contrato: "Tiempo completo", salario: 22000, badge: "Nuevo", badgeClass: "bg-green-soft text-[#15803d]", desc: "Gestion de nomina, reclutamiento, capacitacion y relaciones laborales en empresa en crecimiento.", tags: ["Nomina", "Reclutamiento", "Relaciones laborales"] },
  { id: 6, titulo: "Vendedor de Campo", categoria: "Ventas", ubicacion: "Estado de Mexico", contrato: "Tiempo completo", salario: 15000, badge: "Urgente", badgeClass: "bg-yellow-soft text-[#b45309]", desc: "Visitas a clientes, presentacion de productos y seguimiento posventa en zona Edomex.", tags: ["Ventas externas", "Zona Edomex", "Prospectos"] },
  { id: 7, titulo: "Auxiliar Contable", categoria: "Administrativo", ubicacion: "Hibrido", contrato: "Tiempo completo", salario: 13000, badge: "Disponible", badgeClass: "bg-blue-soft text-blue", desc: "Registro de operaciones contables, conciliaciones bancarias y elaboracion de reportes financieros.", tags: ["Contabilidad", "SAP", "Excel avanzado"] },
  { id: 8, titulo: "Agente de Servicio al Cliente", categoria: "Atencion al cliente", ubicacion: "Remoto", contrato: "Por proyecto", salario: 9500, badge: "Disponible", badgeClass: "bg-blue-soft text-blue", desc: "Atencion a clientes via chat, correo y telefono. Resolucion de incidencias y seguimiento de casos.", tags: ["Zendesk", "Servicio al cliente", "Remoto"] },
];

const categories = ["Todos", "Administrativo", "Ventas", "Operaciones", "Atencion al cliente", "RRHH"];

export default function VacantesPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");

  const filtered = useMemo(() => {
    return JOBS.filter((j) => {
      const matchesSearch = !search || j.titulo.toLowerCase().includes(search.toLowerCase()) || j.desc.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === "Todos" || j.categoria === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  return (
    <>
      {/* Hero */}
      <section className="bg-navy pt-32 pb-16 px-[5%]">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-[600px] mx-auto text-center">
          <span className="inline-block bg-white/10 text-white text-xs font-bold py-1.5 px-4 rounded-full border border-white/20 mb-4">Vacantes</span>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-black leading-[1.1] text-white mb-4">Encuentra tu proximo empleo</h1>
          <p className="text-sm text-white/60 leading-relaxed mb-8">Vacantes verificadas en CDMX y Estado de Mexico. Aplicar es rapido y confidencial.</p>
          <div className="flex gap-2 max-w-[460px] mx-auto bg-white/10 border-[1.5px] border-white/20 rounded-full py-[5px] pr-[5px] pl-5 items-center">
            <input placeholder="Buscar vacante..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-[#bbb] font-[inherit]" />
            <button className="bg-blue-btn text-white rounded-full py-2.5 px-6 text-[13px] font-bold shrink-0">Buscar</button>
          </div>
        </motion.div>
      </section>

      {/* Filters + Results */}
      <section className="py-16 px-[5%] bg-bg">
        <div className="max-w-[1200px] mx-auto">
          {/* Category tabs */}
          <div className="flex gap-2 flex-wrap mb-8">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-full text-[13px] font-semibold border transition-all cursor-pointer ${activeCategory === cat ? "bg-blue text-white border-blue" : "bg-white text-muted border-border hover:border-blue-mid"}`}>
                {cat}
              </button>
            ))}
          </div>

          <p className="text-sm text-muted mb-4"><strong className="text-navy">{filtered.length}</strong> vacantes encontradas</p>

          {/* Jobs grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((job, i) => (
                <motion.div key={job.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.4 }}>
                  <div className="bg-white rounded-xl border-[1.5px] border-border p-5 transition-all duration-200 hover:border-blue-mid hover:shadow-lg hover:-translate-y-0.5 group h-full flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10.5px] font-bold text-muted uppercase tracking-wide">{job.ubicacion}</span>
                      <span className={`rounded-md px-2.5 py-0.5 text-[11px] font-bold ${job.badgeClass}`}>{job.badge}</span>
                    </div>
                    <h3 className="text-base font-extrabold text-navy mb-1.5">{job.titulo}</h3>
                    <p className="text-xs text-muted leading-relaxed mb-3 flex-1">{job.desc}</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {job.tags.map((t) => (
                        <span key={t} className="bg-bg text-navy text-[10px] font-semibold px-2 py-0.5 rounded-md">{t}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
                      <span className="text-sm font-bold text-navy">${job.salario.toLocaleString()} / mes</span>
                      <Link href="/contacto" className="text-[11.5px] font-extrabold text-blue no-underline flex items-center gap-[3px] transition-all group-hover:gap-1.5">Aplicar →</Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-lg font-bold text-navy mb-2">Sin resultados</h3>
              <p className="text-sm text-muted">No encontramos vacantes con esos filtros. Intenta con otras combinaciones.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
