"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { COURSES, MODALITY_LABELS, MODALITY_BADGE } from "@/lib/courses";

const tabs = ["Todos", "RRHH", "Liderazgo", "Calidad", "Digital", "Ventas"];
const tabMap: Record<string, string> = {
  RRHH: "rrhh",
  Liderazgo: "liderazgo",
  Calidad: "calidad",
  Digital: "digital",
  Ventas: "ventas",
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
            <p className="text-[11px] font-bold text-blue uppercase tracking-[2px] mb-2 flex items-center gap-1.5 justify-center before:content-[''] before:w-3.5 before:h-0.5 before:bg-yellow before:rounded-sm">Capacitacion profesional</p>
            <h2 className="text-[clamp(1.4rem,2.5vw,2rem)] font-extrabold tracking-tight text-blue-dark">Elige entre nuestros mejores cursos</h2>
          </AnimatedSection>

          {/* Category tabs */}
          <div className="flex gap-2 flex-wrap justify-center mb-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-[13px] font-semibold border transition-all cursor-pointer ${
                  activeTab === tab ? "bg-blue text-white border-blue" : "bg-white text-muted border-border hover:border-blue-mid"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Modality filter */}
          <div className="flex gap-2 flex-wrap justify-center mb-8">
            <span className="text-xs text-muted self-center font-semibold mr-1">Modalidad:</span>
            {modalityFilters.map((m) => (
              <button
                key={m}
                onClick={() => setActiveModality(m)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all cursor-pointer ${
                  activeModality === m ? "bg-navy text-white" : "bg-white text-muted border border-border hover:border-blue-mid"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <p className="text-sm text-muted mb-4 text-center">
            <strong className="text-navy">{filtered.length}</strong> cursos encontrados
          </p>

          {/* Grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((course, i) => (
                <motion.div key={course.slug} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.4 }}>
                  <Link href={`/cursos/${course.slug}`} className="block bg-white rounded-xl border border-border overflow-hidden no-underline text-navy transition-all duration-200 hover:shadow-lg hover:-translate-y-1 group h-full">
                    <div
                      className="relative h-[180px] flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${course.color}, #ffffff)` }}
                    >
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black"
                        style={{ background: course.color, color: course.iconColor }}
                      >
                        {course.initials}
                      </div>
                      <span className={`absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${MODALITY_BADGE[course.modalidad]}`}>
                        {MODALITY_LABELS[course.modalidad]}
                      </span>
                      {course.badge && (
                        <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow text-black">
                          {course.badge}
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{course.categoriaLabel}</span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span className="text-[11px] text-muted">{course.horas}h · {course.modulos} modulos</span>
                      </div>
                      <h4 className="text-sm font-extrabold leading-tight mb-2">{course.titulo}</h4>
                      <p className="text-xs text-muted leading-relaxed">{course.descripcionCorta}</p>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                        <span className="text-xs text-muted">Nivel {course.nivel}</span>
                        <span className="text-xs font-bold text-blue">Ver detalle →</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
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
