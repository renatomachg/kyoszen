"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";
import DropdownPill from "@/components/ui/DropdownPill";
import { COURSES, MODALITY_LABELS, MODALITY_BADGE } from "@/lib/courses";

// Same mapping used on the Home Courses section
const categoryImage: Record<string, string> = {
  calidad: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop&q=70",
  liderazgo: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=70",
  rrhh: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&auto=format&fit=crop&q=70",
  digital: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&auto=format&fit=crop&q=70",
  ventas: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&auto=format&fit=crop&q=70",
  normatividad: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600&auto=format&fit=crop&q=70",
};

const tabs = ["Todos", "RRHH", "Liderazgo", "Calidad", "Digital", "Ventas", "Normatividad"];
const tabMap: Record<string, string> = {
  RRHH: "rrhh",
  Liderazgo: "liderazgo",
  Calidad: "calidad",
  Digital: "digital",
  Ventas: "ventas",
  Normatividad: "normatividad",
};

const modalityFilters = ["Todas", "En vivo", "Online", "Hibrido"];
const modalityMap: Record<string, string> = {
  "En vivo": "en-vivo",
  "Online": "online",
  "Hibrido": "hibrido",
};


export default function CursosPage() {
  const [activeTab, setActiveTab] = useState("Todos");
  const [activeModality, setActiveModality] = useState("Todas");

  const filtered = useMemo(() => {
    return COURSES.filter((c) => {
      const categoryMatch = activeTab === "Todos" || c.categoria === tabMap[activeTab];
      const modalityMatch = activeModality === "Todas" || c.modalidad === modalityMap[activeModality];
      return categoryMatch && modalityMatch;
    });
  }, [activeTab, activeModality]);

  return (
    <>
      {/* Hero */}
      <section className="bg-navy pt-32 pb-16 px-5 md:px-10 xl:px-20">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-[600px] mx-auto text-center">
          <span className="inline-block bg-white/10 text-white text-xs font-bold py-1.5 px-4 rounded-full border border-white/20 mb-4">Capacitacion</span>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-black leading-[1.1] text-white mb-4">Nuestros cursos profesionales</h1>
          <p className="text-sm text-white/60 leading-relaxed">Ofrecemos una amplia variedad de cursos para todos los niveles. Programas con constancias DC-3 en modalidades en vivo, online e hibridas.</p>
        </motion.div>
      </section>

      {/* Courses */}
      <section className="py-16 px-5 md:px-10 xl:px-20 bg-bg">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center mb-8">
            <h2 className="text-[clamp(1.4rem,2.5vw,2rem)] font-extrabold tracking-tight text-blue-dark">Elige entre nuestros mejores cursos</h2>
          </AnimatedSection>

          {/* Breadcrumb-style filter pill */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-1 bg-white rounded-full border border-border shadow-sm px-2 py-1.5">
              <span className="px-3 py-1.5 text-[13px] font-semibold text-muted">Cursos</span>
              <span className="text-border">/</span>
              <DropdownPill
                label="Categoria"
                value={activeTab}
                options={tabs}
                onChange={setActiveTab}
                highlight={activeTab !== "Todos"}
              />
              <span className="text-border">/</span>
              <DropdownPill
                label="Modalidad"
                value={activeModality}
                options={modalityFilters}
                onChange={setActiveModality}
                highlight={activeModality !== "Todas"}
              />
            </div>
          </div>

          <p className="text-sm text-muted mb-4 text-center">
            <strong className="text-navy">{filtered.length}</strong> cursos encontrados
          </p>

          {/* Grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {filtered.map((course, i) => {
                const img = categoryImage[course.categoria] ?? categoryImage.rrhh;
                return (
                  <motion.div key={course.slug} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.4 }}>
                    <Link
                      href={`/cursos/${course.slug}`}
                      className="block bg-white rounded-2xl overflow-hidden no-underline text-navy transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl h-full flex flex-col group shadow-md"
                    >
                      {/* Image area */}
                      <div className="relative h-[180px] overflow-hidden">
                        <img
                          src={img}
                          alt={course.titulo}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${MODALITY_BADGE[course.modalidad]}`}>
                            {MODALITY_LABELS[course.modalidad]}
                          </span>
                        </div>
                        {course.badge && (
                          <span className="absolute top-3 right-3 bg-yellow text-black text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                            {course.badge}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5 flex-1 flex flex-col">
                        <span className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">
                          {course.categoriaLabel}
                        </span>
                        <h3 className="text-[15px] font-extrabold leading-tight text-navy mb-2">
                          {course.titulo}
                        </h3>
                        <p className="text-[12px] text-muted leading-relaxed mb-4 line-clamp-2 flex-1">
                          {course.descripcionCorta}
                        </p>

                        {/* Bottom row */}
                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          <div className="flex items-center gap-3 text-[11px] text-muted">
                            <span className="flex items-center gap-1">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                              {course.horas}h
                            </span>
                            <span className="flex items-center gap-1">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                              {course.modulos}
                            </span>
                          </div>
                          <span className="text-[11.5px] font-extrabold text-blue flex items-center gap-1 transition-all group-hover:gap-1.5">
                            Ver curso →
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-lg font-bold text-navy mb-2">Sin resultados</h3>
              <p className="text-sm text-muted">No hay cursos con esos filtros. Intenta otra combinacion.</p>
            </div>
          )}

          {/* CTA */}
          <AnimatedSection className="mt-16">
            <div className="bg-blue rounded-3xl p-10 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
              <div>
                <h2 className="text-[clamp(1.3rem,2.5vw,1.8rem)] font-black text-white leading-tight">
                  ¿No encuentras el curso que <em>necesitas</em>?
                </h2>
                <p className="text-sm text-white/60 mt-2">Cuentanos que habilidades quieres desarrollar y diseñamos un programa a la medida.</p>
              </div>
              <div className="flex gap-3 flex-wrap shrink-0">
                <Link href="/contacto" className="bg-yellow text-black rounded-full py-3 px-7 text-[13.5px] font-extrabold no-underline hover:bg-[#e6b800] transition-colors">Solicitar programa →</Link>
                <Link href="/contacto" className="bg-transparent text-white border-2 border-white/30 rounded-full py-3 px-7 text-[13px] font-bold no-underline hover:bg-white/10 transition-colors">Hablar con asesor</Link>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
