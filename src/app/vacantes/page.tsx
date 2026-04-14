"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { JOBS } from "@/lib/jobs";

const categories = ["Todos", "Administrativo", "Ventas", "Operaciones", "Atencion al cliente", "RRHH"];

export default function VacantesPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");

  const filtered = useMemo(() => {
    return JOBS.filter((j) => {
      const matchesSearch = !search || j.titulo.toLowerCase().includes(search.toLowerCase()) || j.descripcion.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === "Todos" || j.categoria === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  return (
    <>
      {/* Hero */}
      <section className="bg-navy pt-32 pb-16 px-5 md:px-10 xl:px-20">
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
      <section className="py-16 px-5 md:px-10 xl:px-20 bg-bg">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2 flex-wrap mb-8">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-full text-[13px] font-semibold border transition-all cursor-pointer ${activeCategory === cat ? "bg-blue text-white border-blue" : "bg-white text-muted border-border hover:border-blue-mid"}`}>
                {cat}
              </button>
            ))}
          </div>

          <p className="text-sm text-muted mb-4"><strong className="text-navy">{filtered.length}</strong> vacantes encontradas</p>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((job, i) => (
                <motion.div key={job.slug} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.4 }}>
                  <Link href={`/vacantes/${job.slug}`} className="block no-underline text-navy">
                    <div className="bg-white rounded-xl border-[1.5px] border-border p-5 transition-all duration-200 hover:border-blue-mid hover:shadow-lg hover:-translate-y-0.5 group h-full flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10.5px] font-bold text-muted uppercase tracking-wide">{job.ubicacion}</span>
                        <span className={`rounded-md px-2.5 py-0.5 text-[11px] font-bold ${job.badgeClass}`}>{job.badge}</span>
                      </div>
                      <h3 className="text-base font-extrabold text-navy mb-1.5">{job.titulo}</h3>
                      <p className="text-xs text-muted leading-relaxed mb-3 flex-1 line-clamp-3">{job.descripcion}</p>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {job.habilidades.slice(0, 3).map((t) => (
                          <span key={t} className="bg-bg text-navy text-[10px] font-semibold px-2 py-0.5 rounded-md">{t}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
                        <span className="text-xs font-semibold text-muted">{job.contrato}</span>
                        <span className="text-[11.5px] font-extrabold text-blue flex items-center gap-[3px] transition-all group-hover:gap-1.5">Ver detalle →</span>
                      </div>
                    </div>
                  </Link>
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
